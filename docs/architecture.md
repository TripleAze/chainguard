# ChainGuard — Architecture & Design Decisions

## Problem Statement

A container image moves through several hand-offs before it runs in production: source code → CI build → registry → CD deploy → runtime. At each step, something could go wrong — a vulnerable dependency, a tampered image, a build from an unreviewed source, or a deployment bypassing the security pipeline entirely.

ChainGuard's goal: make every image that reaches production carry **verifiable, signed evidence** of what it contains and how it was built, enforced automatically at every layer.

---

## Phase 1 — CI Pipeline

### Why Keyless Signing (Cosign + Sigstore + OIDC)

The alternative is a static key pair stored as a GitHub Actions secret. The problem: a long-lived private key is a persistent attack surface. If it leaks, every image ever signed is suspect, and rotation requires re-signing everything and updating every verifier.

Keyless signing uses identity instead of secrets:

1. GitHub Actions requests a short-lived OIDC token asserting: "I am workflow `ci.yml`, repo `TripleAze/chainguard`, ref `refs/heads/main`."
2. Cosign presents that token to Sigstore's **Fulcio** CA, which issues a short-lived (10-minute) signing certificate bound to that identity.
3. Cosign signs the image digest and discards the ephemeral key immediately after.
4. The certificate and signature are recorded in **Rekor**, a public append-only transparency log.
5. Verification requires no shared secret — just the expected OIDC issuer and identity.

Trade-off: signing identity is tied to GitHub's OIDC issuer. Moving CI providers requires updating verification policy. For a single-provider setup this is more secure than key management.

### Why Sign and Attest the Digest, Not the Tag

Tags are mutable — they can be repointed to a different image at any time. The digest (`sha256:...`) is a content hash and is immutable by definition.

Every operation in the pipeline — signing, SBOM generation, vuln scanning, attestation — references `image@digest`. This guarantees the SBOM, signature, and provenance all describe the same exact artifact, with no gap for tag-based substitution attacks.

### Why SBOM Generation Runs Post-Build Against the Pushed Image

Syft runs against the pushed image digest, not the build context. This means the SBOM reflects what's actually in the shipped artifact — including base image layers, transitive OS packages, and anything introduced by the build process — not just what's declared in `package.json` or the Dockerfile.

### The CVE Gate Design

A naive gate ("fail on any CVE") is unworkable — base images always carry some unfixed CVEs, and a gate that never passes gets disabled. ChainGuard's gate logic:

```
For each CVE found in the SBOM:
  if severity < critical:
      report via SARIF, do not block
  if severity == critical:
      if a fix is available:
          BLOCK — always actionable
      if no fix available:
          if documented in .grype.yaml with reason + expiry:
              allow, visible in scan report
          else:
              BLOCK
```

Every ignore entry in `.grype.yaml` requires a specific CVE ID (no wildcards), a written justification and mitigation, and an expiry date forcing re-evaluation. The file is version-controlled and requires a PR to change.

SARIF is uploaded **before** the gate step runs, so the GitHub Security tab is always populated with findings regardless of whether the build passed or failed.

### The Multi-Stage Build Trap

A multi-stage Dockerfile discards every stage except what's copied into the final stage. Applying `apk upgrade --no-cache` only in the build stage has zero effect on the shipped image — the final `FROM nginx:alpine` stage starts fresh with its own unpatched packages.

ChainGuard applies `apk upgrade --no-cache` independently in each stage. This was discovered empirically during Phase 1 — the build stage was patched, the production nginx stage was not, and Grype continued reporting the same criticals. The fix: treat every `FROM` as a separate container requiring its own hardening.

### Three Attestation Types, Three Purposes

| Attestation | Predicate type | Purpose |
|---|---|---|
| SBOM | `https://spdx.dev/Document` | Full package inventory for auditing and CVE correlation |
| Vuln scan | `cosign.sigstore.dev/attestation/vuln/v1` | Signed evidence that a scan was performed and its results |
| Provenance | `https://slsa.dev/provenance/v1` | Proof of where, when, and how the image was built |

Note: `cosign-vuln` was removed as a Grype output format in v0.80+. The vuln predicate is now built by running Grype with `--output json` and transforming the result into the predicate schema via `jq`. The `--type vuln` flag in `cosign attest` sets the correct `predicateType` in the in-toto envelope regardless of how the predicate file was constructed.

### OCI Referrers vs Cosign Tag Convention

Cosign originally stored attestations as OCI tags (`sha256-<digest>.att`). The OCI 1.1 spec introduced a standard **referrers API** for associating artifacts with a subject. `actions/attest-build-provenance` uses the newer referrers API, which is why the SLSA provenance appears as `🔗 via OCI referrer` in `cosign tree` output rather than as a `.att` tag.

Kyverno 1.11+ supports querying both conventions. Policies that check `type: https://slsa.dev/provenance/v1` will find the provenance regardless of how it's stored, as long as Kyverno is on a supported version.

---

## Phase 2 — Admission Control

### Why Kyverno Over OPA/Gatekeeper

Both are valid choices. Kyverno was chosen because:
- Native `verifyImages` block with built-in Cosign/Sigstore integration — no custom Rego required
- `ClusterPolicy` is Kubernetes-native YAML with no separate policy language to learn
- Autogen feature automatically extends Pod-level policies to Deployments, StatefulSets, etc.

### The `mutateDigest` / `Audit` Constraint

Kyverno enforces a constraint: `mutateDigest: true` is only valid when `validationFailureAction: Enforce`. In Audit mode, Kyverno cannot mutate the pod spec (it's read-only), so digest mutation must be disabled.

The correct pattern for a staged rollout:
- **Audit mode**: `mutateDigest: false`, `verifyDigest: true` — violations logged, pods admitted
- **Enforce mode**: `mutateDigest: true`, `verifyDigest: true` — digest resolved and pinned at admission, pods blocked if verification fails

### Policy Corruption From Patch Operations

During Phase 2, `kubectl patch` attempts left the `require-signature` policy in a broken state where the `attestors` block (for signature verification) was incorrectly nested inside an `attestations` block (for attestation verification). This caused all four policies to fail silently — "unverified image" rather than a specific attestation error.

The lesson: when policies drift from patches, delete and recreate rather than patch further. `kubectl apply -k` on clean YAML files is the correct recovery path.

### Why ArgoCD Over Push-Based CD

ArgoCD's pull-based GitOps model means:
- The cluster never needs inbound network access from CI
- Every deployment is reconciled against Git state — manual `kubectl apply` changes are reverted
- The deployment manifest (with a pinned digest) is the source of truth — what's in Git is what runs
- CI's job ends at committing the new digest; ArgoCD handles the rest independently

The digest committed by Job 6 (`update-manifest`) is the same digest that was signed, scanned, and attested in Jobs 4-5. ArgoCD deploys that exact digest. Kyverno then verifies that exact digest at admission. The chain is unbroken.

---

## Lessons Learned (Interview Talking Points)

- **Multi-stage builds require per-stage hardening** — patching an intermediate stage has no effect on the final shipped image
- **Tags are mutable, digests are not** — all security operations must reference digests
- **Grype's output formats change across versions** — `cosign-vuln` was removed in v0.80; always pin tool versions or handle format changes gracefully
- **Kyverno policy structure matters** — `attestors` at the `verifyImages` level = signature check; `attestors` inside `attestations` = attestation check. They are different fields with different semantics
- **`mutateDigest` is only valid in Enforce mode** — Audit mode is read-only, digest mutation is a mutation webhook operation
- **OCI referrers vs tag convention** — newer tools use the referrers API; older Kyverno versions may not support it
- **Delete and recreate over patch** — `kubectl patch` on complex nested fields is error-prone; always maintain authoritative YAML files and apply them clean
- **SARIF must be uploaded before the gate** — if the gate step fails the job, subsequent steps don't run; `if: always()` or step ordering is required to guarantee evidence is preserved

---

## Phase 3 — chaincheck CLI

### Why a CLI Tool

After Phase 1 and Phase 2, verifying an image's trust posture required running 4-5 separate commands — `cosign verify`, `cosign download attestation`, `cosign tree`, `gh attestation verify` — and mentally assembling the results. `chaincheck` collapses this into one command with a structured output and a meaningful exit code, making it usable both for human inspection and CI automation.

### SDK vs Subprocess

The initial implementation used `cosign` as a subprocess (shell out, parse stdout). This was replaced with the Cosign Go SDK (`github.com/sigstore/cosign/v2`) for three reasons: no dependency on the cosign binary being installed, faster execution (no subprocess overhead), and structured access to certificate fields without text parsing.

The key SDK pattern: `cosign.VerifyImageAttestations` returns all verified attestations in a slice. The caller is responsible for filtering by `predicateType` after verification — the SDK does not filter for you. This is a common source of confusion.

### Predicate Type Discovery

The attestations attached to ChainGuard images use these predicate types:

| Attestation | PredicateType | Stored via |
|---|---|---|
| SBOM | `https://spdx.dev/Document` | Cosign `.att` tag |
| Vuln scan | `cosign.sigstore.dev/attestation/vuln/v1` | Cosign `.att` tag |
| SLSA provenance | `https://slsa.dev/provenance/v0.2` | Cosign `.att` tag |
| Native provenance | `https://slsa.dev/provenance/v1` | OCI referrers API |

The SLSA generator produces `v0.2` provenance (not `v1`). `actions/attest-build-provenance` produces `v1` via the OCI referrers API. `chaincheck` handles both by checking for either predicate type in the provenance verifier.

The vuln attestation predicate is custom-built in CI via `jq` transformation of Grype's JSON output, since Grype dropped the `cosign-vuln` output format in v0.80. The resulting predicate follows the cosign vuln schema with `invocation`, `scanner`, and `metadata` fields.

### Identity Enforcement Design

`chaincheck` operates in two modes depending on whether `--cert-identity` is provided:

**Discovery mode** (no `--cert-identity`): verifies a valid Sigstore signature exists and is logged in Rekor. Displays the signing identity extracted from the certificate SAN. Passes for any validly-signed image regardless of who signed it.

**Enforcement mode** (`--cert-identity` provided): additionally checks that the certificate SAN matches the expected identity regexp. Fails if the signer doesn't match. Used in CI to verify that your specific pipeline signed the image.

This design makes `chaincheck` reusable across organisations — teams use discovery mode to inspect unfamiliar images and enforcement mode to verify their own.

### Distribution

`chaincheck` is distributed via three mechanisms:

**`go install`** — for Go users, automatically places the binary in `$GOPATH/bin`. Zero configuration.

**Install script** — `curl | sh` pattern, identical to how Grype and Cosign are distributed. Detects OS/arch, downloads the right binary from GitHub Releases, installs to `/usr/local/bin`, handles sudo elevation gracefully. Colours only render when connected to a real terminal (`[ -t 1 ]` check) — CI logs get plain text.

**GoReleaser** — automates cross-platform builds (linux/darwin/windows, amd64/arm64) on `git tag chaincheck/vX.Y.Z`. Produces GitHub Release with checksums. The release workflow is separate from the CI pipeline to avoid accidental releases on every push.

The `chaincheck uninstall` subcommand uses `os.Executable()` to find its own install location and removes itself, handling sudo elevation the same way the install script does.

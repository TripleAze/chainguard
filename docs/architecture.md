# ChainGuard — Architecture & Design Decisions

## Problem Statement

A container image moves through several hand-offs before it runs in production: source code → CI build → registry → CD deploy → runtime. At each hand-off, the image could be tampered with, built from an unreviewed source, or carry a vulnerable dependency — and downstream, nobody can tell.

ChainGuard's Phase 1 goal: make every image that leaves CI carry verifiable, signed evidence of what it contains and how it was built, so that evidence can later be checked before the image is allowed to run (Phase 2).

## Why Keyless Signing (Cosign + Sigstore + OIDC)

The alternative is a static Cosign key pair: a private key stored as a GitHub Actions secret, used to sign every image.

The problem with that: the private key is a long-lived secret. If it leaks, every image ever signed with it is suspect, and rotation requires re-signing everything and updating every verifier. It's also one more secret to manage, audit, and eventually find expired or forgotten.

Keyless signing instead uses identity, not secrets:

- The GitHub Actions runner requests a short-lived OIDC token from GitHub. This token cryptographically asserts "I am workflow `ci.yml`, in repo `TripleAze/chainguard`, on ref `refs/heads/main`, triggered by event `push`."
- Cosign presents that token to Sigstore's Fulcio certificate authority, which issues a short-lived (10-minute) signing certificate bound to that identity.
- Cosign signs the image digest with the corresponding ephemeral private key, which is discarded immediately after.
- The certificate and signature are recorded in Rekor, a public, append-only transparency log — anyone can audit when something was signed, even if they don't trust the signer.
- To verify, a verifier checks: "was this signed by a certificate issued to `TripleAze/chainguard`'s `ci.yml` workflow, by Fulcio, and logged in Rekor?" — no shared secret required on either side.

Trade-off acknowledged: this ties signing identity to GitHub's OIDC issuer. If you move CI providers, verification policy needs to be updated (`--certificate-oidc-issuer`). For a single-provider setup this is an acceptable and arguably more secure trade-off than key management.

## Why Sign and Attest the Digest, Not the Tag

Tags (`main`, `latest`, `v1.2.3`) are mutable — a tag can be repointed to a different image at any time. The digest (`sha256:...`) is a content hash; it can never change without becoming a different digest.

Every signing and attestation operation in the pipeline operates on `${{ needs.build.outputs.digest }}`, the exact digest produced by the build job's push. This guarantees:

- The SBOM was generated from this exact image, not a same-tag-different-content image pushed later
- The signature covers this exact image
- The provenance describes this exact image's build

A verifier checking `image:main` first resolves it to a digest, then verifies signatures/attestations against that digest — closing the gap that tag mutability would otherwise leave open.

## Why SBOM Generation Happens Post-Build, From the Pushed Image

Syft runs against `image-ref@digest` — the pushed image — rather than against the build context or Dockerfile. This means the SBOM reflects what's actually in the shipped artifact, including base image layers, transitive OS packages, and anything introduced by the build process itself — not just what's declared in `package.json` or the `Dockerfile`.

## The CVE Gate: Design Reasoning

A naive gate ("fail on any CVE") is unworkable, base images always carry some unfixed CVEs, and a gate that can never pass gets disabled or ignored, which defeats the purpose.

ChainGuard's gate logic:

For each CVE found in the SBOM:
- if severity < critical:
    → report via SARIF, do not block
- if severity == critical:
    - if a fix is available:
        → BLOCK. This is always actionable.
    - if no fix is available:
        - if documented in `.grype.yaml` with reason + expiry:
            → allow, but visible in scan report
        - else:
            → BLOCK

This makes the gate always passable through legitimate action, either fix the package, or make a documented, time-bound risk acceptance decision. It avoids both failure modes: a gate that blocks everything (gets bypassed) and a gate that blocks nothing (provides no value).

The `.grype.yaml` ignore list is itself part of the audit trail, it's version-controlled, requires a PR to change, and each entry has an expiry date forcing periodic re-review.

## Multi-Stage Build and the "Last FROM Wins" Principle

A multi-stage Dockerfile discards every stage except what's copied into the final stage. Security hardening applied to an intermediate stage (e.g., `apk upgrade` in a build stage) has zero effect on the shipped image if the final stage starts from a separate `FROM`.

ChainGuard applies `apk upgrade --no-cache` independently in each stage, treating every `FROM` as its own container requiring its own hardening. I discovered this empirically during Phase 1, the build stage was patched, the production `nginx:alpine` stage was not, and the scan continued to report the same criticals until the production stage was patched directly.

## SLSA Provenance: What Level, and Why It Matters

The pipeline uses `slsa-framework/slsa-github-generator`'s container workflow, which produces SLSA v1.0 provenance meeting SLSA Build Level 2 requirements:

- The build runs on a hosted, ephemeral build platform (GitHub-hosted runners), not a developer machine
- Provenance is generated by a process isolated from the main build job (a separate reusable workflow, not a step the build job could tamper with)
- Provenance is signed and includes the source repository, commit SHA, workflow path, and trigger event

The provenance payload (`predicateType: https://slsa.dev/provenance/v1`) is attached to the image as a Cosign attestation and registered with GitHub's native Attestations API, so it's verifiable via either `cosign verify-attestation` or `gh attestation verify`.

What Level 2 proves: "this artifact was built by an automated, isolated process from this exact source commit", ruling out builds from unreviewed local machines or builds where the provenance-generation step could be manipulated by the build step itself.

What it does not yet prove (Level 3+): hermetic builds (no network access during build) and fully isolated build environments per-build. That's a possible future enhancement but out of scope for Phase 1.

## Permissions Model

```yaml
permissions:
  contents: read         # checkout only
  packages: write        # push image + attestations to GHCR
  id-token: write        # request OIDC tokens for keyless signing
  attestations: write    # register attestations with GitHub's API
  security-events: write # upload SARIF to Code Scanning
```

No long-lived secrets are used anywhere in the pipeline. `GITHUB_TOKEN` (automatically scoped and rotated per-run) handles GHCR authentication; OIDC handles signing identity.

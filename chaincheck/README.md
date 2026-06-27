# chaincheck

A CLI tool for inspecting the supply chain security posture of any container image in one command. Part of the https://github.com/TripleAze/chainguard project.

```
chaincheck inspect ghcr.io/yourorg/yourapp:latest
```

```
🔍 ChainGuard Inspection Report
───────────────────────────────────────────────────────
Image:   ghcr.io/yourorg/yourapp
Digest:  sha256:cdfc1d3eb137...

✅ Signature     Valid
                   Signed by: https://github.com/yourorg/yourapp/.github/workflows/ci.yml@refs/heads/main

✅ SBOM          Present — SPDX 2.3
                   68 packages cataloged

✅ Vuln Scan     Signed attestation present
                   Scanner: Grype v0.114.0 (DB: 2026-06-20)
                   0 critical  53 high  59 medium  13 low

✅ Provenance    SLSA Level 2
                   Repo:    github.com/yourorg/yourapp
                   Commit:  cd2e35d
                   Branch:  refs/heads/main
                   Builder: github.com/slsa-framework/slsa-github-generator

───────────────────────────────────────────────────────
Overall: PASS ✅
```

## What It Checks

| Check | What it verifies |
|---|---|
| **Signature** | Image was signed via Cosign keyless signing and the certificate is logged in Rekor |
| **SBOM** | A signed SPDX Software Bill of Materials attestation is attached to the image |
| **Vuln Scan** | A signed Grype vulnerability scan attestation is attached, with a severity breakdown |
| **Provenance** | A signed SLSA provenance attestation is present, recording the source commit, branch, and builder |

All checks run independently — a failed signature check does not prevent SBOM or provenance checks from running.

## Installation

### Method 1 · Install script (recommended, no Go required)

```bash
curl -sSfL https://raw.githubusercontent.com/TripleAze/chainguard/main/chaincheck/install.sh | sh
```

Custom install directory:

```bash
curl -sSfL https://raw.githubusercontent.com/TripleAze/chainguard/main/chaincheck/install.sh \
  | sh -s -- -b ~/.local/bin
```

### Method 2 · Go install

```bash
go install github.com/TripleAze/chainguard/chaincheck/cmd/chaincheck@latest
```

### Method 3 · From source

```bash
git clone https://github.com/TripleAze/chainguard
cd chainguard/chaincheck && make install
```

## Uninstall

```bash
chaincheck uninstall
```

Or via make:

```bash
make uninstall
```

## Versioning

Check installed version:
```bash
chaincheck --version
```

Releases are cut by tagging:
```bash
git tag chaincheck/v1.x.x
```

## How It Works

- Uses Cosign Go SDK (not subprocess) — no cosign binary required
- `cosign.VerifyImageAttestations` returns ALL attestations
- `chaincheck` filters by `predicateType` after verification
- Handles both OCI referrers API and Cosign tag convention for provenance (v0.2 and v1 predicate types)
- Supports both tag and digest references — tags auto-resolved to digest before verification

## Known Predicate Types

| Check       | Predicate Type                                                | Storage                     |
|-------------|---------------------------------------------------------------|-----------------------------|
| Signature   | Verified against `.sig` tag                                   | `.sig` tag                  |
| SBOM        | `https://spdx.dev/Document`                                   | `.att` tag                 |
| Vuln Scan   | `cosign.sigstore.dev/attestation/vuln/v1`                     | `.att` tag                 |
| Provenance  | `https://slsa.dev/provenance/v0.2` or `https://slsa.dev/provenance/v1` | OCI referrers API or `.att` tag |

## Usage

### Basic inspection

```bash
# By tag (resolves to digest automatically)
chaincheck inspect ghcr.io/yourorg/yourapp:latest

# By digest (preferred — immutable reference)
chaincheck inspect ghcr.io/yourorg/yourapp@sha256:<digest>
```

### Enforce a specific signing identity

By default, `chaincheck` verifies that a valid Sigstore signature exists and displays who signed the image. To additionally enforce that the image was signed by a specific CI workflow:

```bash
chaincheck inspect ghcr.io/yourorg/yourapp:latest \
  --cert-identity "https://github.com/yourorg/yourapp/.github/workflows/ci.yml@refs/heads/main"
```

### JSON output for scripting and CI

```bash
chaincheck inspect ghcr.io/yourorg/yourapp:latest --output json | jq .
```

```json
{
  "image": "ghcr.io/yourorg/yourapp",
  "digest": "sha256:cdfc1d3eb137...",
  "signature": {
    "passed": true,
    "message": "Valid",
    "detail": "Signed by: https://github.com/yourorg/yourapp/.github/workflows/ci.yml@refs/heads/main"
  },
  "sbom": {
    "passed": true,
    "message": "Present",
    "package_count": 68,
    "format": "spdx-json",
    "spdx_version": "SPDX-2.3"
  },
  "vuln_scan": {
    "passed": true,
    "message": "Valid",
    "scanner": "https://github.com/anchore/grype",
    "scanner_version": "0.114.0",
    "summary": { "critical": 0, "high": 53, "medium": 59, "low": 13 }
  },
  "provenance": {
    "passed": true,
    "message": "Valid",
    "source_repo": "github.com/yourorg/yourapp",
    "source_commit": "cd2e35d",
    "source_ref": "refs/heads/main",
    "slsa_level": 2
  },
  "overall": "PASS",
  "passed": true
}
```

### All flags

```
Flags:
  --cert-identity string      Expected signing identity regexp
                               If omitted, any valid Sigstore signature passes
  --cert-oidc-issuer string   Expected OIDC issuer
                               (default: https://token.actions.githubusercontent.com)
  --fail-on string            Minimum severity to fail on: 'any' or 'critical'
                               (default: any)
  -o, --output string         Output format: 'text' or 'json' (default: text)
      --skip-tlog             Skip Rekor transparency log verification
  -v, --version               Print version and exit
  -h, --help                  Help for chaincheck
```

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | All checks passed |
| `1` | One or more checks failed |

This makes `chaincheck` composable in CI pipelines:

```bash
chaincheck inspect myimage:latest --output json | jq . && echo "Trust verified"
```

## Using in CI

### GitHub Actions

```yaml
- name: Install chaincheck
  run: |
    curl -sSfL https://raw.githubusercontent.com/TripleAze/chainguard/main/chaincheck/install.sh \
      | sh -s -- -b /usr/local/bin

- name: Verify image trust posture
  run: |
    chaincheck inspect ${{ env.IMAGE_REF }}@${{ env.DIGEST }} \
      --cert-identity "https://github.com/${{ github.repository }}/.github/workflows/ci.yml@refs/heads/main" \
      --output json | tee chaincheck-report.json

    # Fail the job if overall is not PASS
    jq -e '.passed == true' chaincheck-report.json
```

## What chaincheck Does Not Do

- Does not pull or run the image
- Does not modify the image or registry
- Does not enforce policy (use Kyverno for cluster-level enforcement)
- Does not replace a full vulnerability scanner — it reads the signed attestation produced by one

## Requirements

- Network access to the OCI registry and `rekor.sigstore.dev`
- No other tools required — chaincheck uses the Cosign SDK directly

## Building from source

```bash
git clone https://github.com/TripleAze/chainguard
cd chainguard/chaincheck
make build          # ./chaincheck
make test           # run tests
make demo           # inspect the ChainGuard demo image
make release-dry-run  # test GoReleaser config locally
```

## Releasing

Releases are automated via GoReleaser. To cut a new release:

```bash
git tag chaincheck/v1.1.0
git push origin chaincheck/v1.1.0
```

GoReleaser builds:
- `linux/amd64`, `linux/arm64`
- `darwin/amd64`, `darwin/arm64`
- `windows/amd64`, `windows/arm64`

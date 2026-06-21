# chaincheck

A command-line tool that inspects the supply chain security posture of container images in one command.

## What it does

chaincheck queries an OCI registry for Cosign signatures, SBOM attestations, vulnerability scan attestations, and SLSA provenance, then produces a human-readable trust report with a pass/fail exit code.

## Installation

### Latest Release
[![GitHub Release](https://img.shields.io/github/v/release/TripleAze/chainguard?include_prereleases&style=flat-square)](https://github.com/TripleAze/chainguard/releases/latest)

### Option 1: Install Script (Recommended)
Works like cosign/grype/syft:
```bash
curl -sSfL https://raw.githubusercontent.com/TripleAze/chainguard/main/install.sh | bash -s
```

Or install to a custom directory:
```bash
curl -sSfL https://raw.githubusercontent.com/TripleAze/chainguard/main/install.sh | bash -s -- ~/.local/bin
```

### Option 2: Go Install
For Go developers:
```bash
go install github.com/TripleAze/chainguard@latest
```

### Option 3: Download Binary
Download pre-built binaries from the [Releases](https://github.com/TripleAze/chainguard/releases) page.

### Build Locally
```bash
git clone https://github.com/TripleAze/chainguard.git
cd chainguard
make build
# Install to /usr/local/bin
sudo make install
```

## Usage

```
chaincheck inspect <image> [flags]
```

### Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--version, -v` | `false` | Print version information |
| `--output, -o` | `text` | Output format: `text` or `json` |
| `--skip-tlog` | `false` | Skip Rekor transparency log verification |
| `--cert-identity` | `""` | Expected certificate identity regexp (only enforced if set) |
| `--cert-oidc-issuer` | `"https://token.actions.githubusercontent.com"` | Expected OIDC issuer |
| `--fail-on` | `"any"` | Minimum check level to fail on: `"any"` or `"critical"` |

### Examples

Inspect by digest (preferred):
```bash
chaincheck inspect ghcr.io/tripleaze/chainguard@sha256:a1c2fd91bd8650ba6dc10889ad61e8170cd3e47470ccf615bc72a7a2dc38164e
```

Inspect by tag (resolves to digest first):
```bash
chaincheck inspect ghcr.io/tripleaze/chainguard:main
```

JSON output for scripting:
```bash
chaincheck inspect ghcr.io/tripleaze/chainguard:main --output json
```

Custom identity:
```bash
chaincheck inspect ghcr.io/myorg/myapp:v1.2.3 \
  --cert-identity "https://github.com/myorg/myapp/.github/workflows/ci.yml@refs/heads/main"
```

## Demo

Run the demo against the chaincheck sample image:
```bash
make demo
```

## What is checked?

- **Cosign Signature**: Validates that the image was signed by the expected identity
- **SBOM**: Validates the presence of a signed SPDX SBOM attestation
- **Vulnerability Scan**: Validates the presence of a signed vulnerability scan attestation with no critical CVEs
- **SLSA Provenance**: Validates the presence of SLSA Level 2 provenance

## License

MIT

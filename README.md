# Chainguard

A supply chain security enforcement toolkit for container-based workflows.

This repository demonstrates a secure CI/CD pipeline for building, scanning, signing, and attesting Docker images using modern software supply chain security best practices.

> 📚 **Deep Dive**: For a detailed explanation of the design decisions behind keyless signing, CVE gating logic, and SLSA provenance levels, please read my [Architecture & Design Decisions](ARCHITECTURE.md) document.

## Overview

The CI pipeline is defined in `.github/workflows/ci.yml` and performs the following jobs:

1. **Build & Push**: Builds a multi-stage Docker image and pushes it to the GitHub Container Registry (GHCR).
2. **Generate SBOM**: Uses [Syft](https://github.com/anchore/syft) to generate a Software Bill of Materials (SBOM) in SPDX JSON format.
3. **Scan SBOM**: Uses [Grype](https://github.com/anchore/grype) to scan the SBOM for vulnerabilities, acting as a security gate. Results are uploaded to GitHub Security tab (SARIF format).
4. **Sign & Attest**: 
   - Uses [Cosign](https://github.com/sigstore/cosign) with keyless signing to sign the image digest.
   - Generates and attaches a GitHub-native SLSA provenance attestation using `actions/attest-build-provenance`.

## How to Verify

### Verifying the SLSA Provenance

The pipeline generates a GitHub-native SLSA provenance attestation. You can verify it using the official GitHub CLI (`gh`):

```bash
gh attestation verify oci://ghcr.io/tripleaze/chainguard@sha256:<YOUR_IMAGE_DIGEST> -o tripleaze
```

*This verifies that the image was built by this specific repository and workflow, ensuring it hasn't been tampered with after the build.*

### Verifying the Image Signature

You can verify the Cosign keyless signature using the following command:

```bash
cosign verify \
  --certificate-identity-regexp="https://github.com/TripleAze/chainguard" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \
  ghcr.io/tripleaze/chainguard@sha256:<YOUR_IMAGE_DIGEST>
```

## Security Gate

The repository includes a `.grype.yml` configuration file which enforces our vulnerability threshold. If any `critical` vulnerabilities are discovered during the CI build, the pipeline will fail, preventing insecure code from proceeding.

## Application Code

The application being built is a React application (`razz-bug-calenderapp`), built with Vite and served by a lightweight NGINX container.

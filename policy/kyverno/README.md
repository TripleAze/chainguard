# Kyverno Supply Chain Security Policies

## Overview

These policies run as admission webhooks on the EKS cluster.

- All four are in **Enforce mode** · violations block pod creation
- Scoped to `ghcr.io/tripleaze/chainguard*` images only, third‑party images are unaffected
- Excludes `dashboard-backend` and `dashboard-frontend` pods (to avoid chicken‑and‑egg issues)
- Requires Kyverno v1.11+ for OCI referrers API support


## Installation

```bash
helm repo add kyverno https://kyverno.github.io/kyverno/
helm install kyverno kyverno/kyverno \
  --namespace kyverno --create-namespace

kubectl apply -k policy/kyverno/
```


## Policies

### 00-require-signature.yaml
- **Name**: require-signature
- **What it checks**: image has a valid Cosign keyless signature
- **Signing identity**: `https://github.com/TripleAze/chainguard/.github/workflows/ci.yml@refs/heads/main`
- **OIDC issuer**: `https://token.actions.githubusercontent.com`
- **Rekor**: `https://rekor.sigstore.dev`
- **Blocks**: any image without a valid Sigstore signature

### 01-require-provenance.yaml
- **Name**: require-provenance
- **What it checks**: SLSA provenance attestation is present and signed
- **Predicate type**: `https://slsa.dev/provenance/v0.2`
- **Signing identity**: `https://github.com/slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@refs/tags/v2.0.0`
- **Blocks**: images without verifiable build provenance

### 02-require-sbom-attestation.yaml
- **Name**: require-sbom-attestation
- **What it checks**: signed SPDX SBOM attestation is attached
- **Predicate type**: `https://spdx.dev/Document`
- **Signing identity**: same as signature policy
- **Blocks**: images without a signed software bill of materials

### 03-block-critical-cves.yaml
- **Name**: block-critical-cves
- **What it checks**: signed vuln attestation exists with 0 critical CVEs
- **Predicate type**: `https://cosign.sigstore.dev/attestation/vuln/v1`
- **Condition**: `predicate.scanner.result[].vulnerability.severity` must not contain "Critical"
- **Blocks**: images where the signed vuln scan found unfixed criticals


## Audit vs Enforce Mode

To switch a policy to Audit (log violations without blocking):

```bash
kubectl patch clusterpolicy require-signature \
  --type=merge \
  -p '{"spec":{"validationFailureAction":"Audit","rules":[{"name":"verify-chainguard-signature","verifyImages":[{"mutateDigest":false}]}]}}'
```

**Important**:
- `mutateDigest` must be `false` in Audit mode
- `mutateDigest` must be `true` in Enforce mode
- Kyverno enforces this constraint


## Verifying Policies are Working

```bash
# Check policy status
kubectl get clusterpolicies

# View violations for a pod
kubectl describe pod <name> -n chainguard-app | grep PolicyViolation

# View PolicyReport
kubectl get policyreport -n chainguard-app -o yaml
```
#!/bin/bash

echo "Using original test payloads"
echo ""

# Use a default test key if none is set (for testing)
INGEST_KEY="${DASHBOARD_INGEST_KEY:-test-ingest-key-12345}"

echo "Sending PASS payload..."
curl -X POST http://localhost:8080/api/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INGEST_KEY" \
  -d @/home/abu/Documents/chainguard/test-ingest-payload.json
echo -e "\n"

echo "Sending FAIL payload..."
curl -X POST http://localhost:8080/api/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INGEST_KEY" \
  -d @/home/abu/Documents/chainguard/test-ingest-payload-fail.json
echo -e "\n"

# Create another PASS payload with different digest
cat > /tmp/payload-pass-2.json << EOF
{
  "git_commit": "2f3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d",
  "git_ref": "refs/heads/feature/new-feature",
  "workflow_run": "https://github.com/TripleAze/chainguard/actions/runs/27774397193",
  "built_at": "2026-06-26T09:15:00Z",
  "image": "ghcr.io/tripleaze/chainguard/app:latest",
  "digest": "sha256:1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff",
  "report": {
    "image": "ghcr.io/tripleaze/chainguard/app:latest",
    "digest": "sha256:1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff",
    "overall": "PASS",
    "passed": true,
    "signature": {
      "passed": true,
      "message": "Signature verified",
      "detail": "Valid cosign signature"
    },
    "sbom": {
      "passed": true,
      "message": "SBOM verified",
      "package_count": 45,
      "format": "spdx-json",
      "spdx_version": "2.3"
    },
    "vuln_scan": {
      "passed": true,
      "message": "No critical vulnerabilities found",
      "scanner": "grype",
      "scanner_version": "0.81.0",
      "db_built_at": "2026-06-25T00:00:00Z",
      "summary": {
        "critical": 0,
        "high": 3,
        "medium": 8,
        "low": 18
      }
    },
    "provenance": {
      "passed": true,
      "message": "Provenance verified",
      "source_repo": "https://github.com/TripleAze/chainguard",
      "source_commit": "2f3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d",
      "source_ref": "refs/heads/feature/new-feature",
      "builder_id": "https://github.com/slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@refs/tags/v2.0.0",
      "slsa_level": 3
    }
  }
}
EOF

echo "Sending another PASS payload..."
curl -X POST http://localhost:8080/api/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INGEST_KEY" \
  -d @/tmp/payload-pass-2.json
echo -e "\n"

echo "Done sending test payloads!"

# Create another PASS payload with different digest
cat > /tmp/payload-pass-2.json << EOF
{
  "git_commit": "35a004cfd6a26061d33b7f275e314db70931b543",
  "git_ref": "refs/heads/feature/new-feature",
  "workflow_run": "https://github.com/TripleAze/chainguard/actions/runs/27744397193",
  "built_at": "2026-06-26T09:15:00Z",
  "image": "ghcr.io/tripleaze/chainguard/app:latest",
  "digest": "sha256:1111222233334444555566667777888899992200aaaabbbbccccddddeeeeffff",
  "report": {
    "image": "ghcr.io/tripleaze/chainguard/app:latest",
    "digest": "sha256:1111222233334444555566667777888899990022aaaabbbbccccddddeeeeffff",
    "overall": "PASS",
    "passed": true,
    "signature": {
      "passed": true,
      "message": "Signature verified",
      "detail": "Valid cosign signature"
    },
    "sbom": {
      "passed": true,
      "message": "SBOM verified",
      "package_count": 45,
      "format": "spdx-json",
      "spdx_version": "2.3"
    },
    "vuln_scan": {
      "passed": true,
      "message": "No critical vulnerabilities found",
      "scanner": "grype",
      "scanner_version": "0.81.0",
      "db_built_at": "2026-06-25T00:00:00Z",
      "summary": {
        "critical": 0,
        "high": 3,
        "medium": 8,
        "low": 18
      }
    },
    "provenance": {
      "passed": true,
      "message": "Provenance verified",
      "source_repo": "https://github.com/TripleAze/chainguard",
      "source_commit": "35a004cfd6a26061d33b7f275e314db70931b543",
      "source_ref": "refs/heads/feature/new-feature",
      "builder_id": "https://github.com/slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@refs/tags/v2.0.0",
      "slsa_level": 3
    }
  }
}
EOF

echo "Sending another PASS payload..."
curl -X POST http://localhost:8080/api/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INGEST_KEY" \
  -d @/tmp/payload-pass-2.json
echo -e "\n"

echo "Done sending test payloads!"
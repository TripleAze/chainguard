#!/bin/bash

INGEST_KEY="${DASHBOARD_INGEST_KEY:-test-ingest-key-12345}"

# Test payload 4: FAIL - signature failed
cat > /tmp/payload-fail-sig.json << EOF
{
  "git_commit": "3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f",
  "git_ref": "refs/heads/feature/bug-fix",
  "workflow_run": "https://github.com/TripleAze/chainguard/actions/runs/27774397194",
  "built_at": "2026-06-27T08:30:00Z",
  "image": "ghcr.io/tripleaze/chainguard/app:latest",
  "digest": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "report": {
    "image": "ghcr.io/tripleaze/chainguard/app:latest",
    "digest": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "overall": "FAIL",
    "passed": false,
    "signature": {
      "passed": false,
      "message": "Signature verification failed",
      "detail": "Invalid cosign signature - no matching public key found"
    },
    "sbom": {
      "passed": true,
      "message": "SBOM verified",
      "package_count": 50,
      "format": "spdx-json",
      "spdx_version": "2.3"
    },
    "vuln_scan": {
      "passed": true,
      "message": "No critical vulnerabilities found",
      "scanner": "grype",
      "scanner_version": "0.81.0",
      "db_built_at": "2026-06-26T00:00:00Z",
      "summary": {
        "critical": 0,
        "high": 2,
        "medium": 5,
        "low": 12
      }
    },
    "provenance": {
      "passed": true,
      "message": "Provenance verified",
      "source_repo": "https://github.com/TripleAze/chainguard",
      "source_commit": "3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f",
      "source_ref": "refs/heads/feature/bug-fix",
      "builder_id": "https://github.com/slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@refs/tags/v2.0.0",
      "slsa_level": 3
    }
  }
}
EOF

# Test payload 5: PASS - hotfix branch
cat > /tmp/payload-pass-hotfix.json << EOF
{
  "git_commit": "4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a",
  "git_ref": "refs/heads/hotfix/v1.0.1",
  "workflow_run": "https://github.com/TripleAze/chainguard/actions/runs/27774397195",
  "built_at": "2026-06-27T10:15:00Z",
  "image": "ghcr.io/tripleaze/chainguard/app:v1.0.1",
  "digest": "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "report": {
    "image": "ghcr.io/tripleaze/chainguard/app:v1.0.1",
    "digest": "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "overall": "PASS",
    "passed": true,
    "signature": {
      "passed": true,
      "message": "Signature verified",
      "detail": "Valid cosign signature from release key"
    },
    "sbom": {
      "passed": true,
      "message": "SBOM verified",
      "package_count": 48,
      "format": "spdx-json",
      "spdx_version": "2.3"
    },
    "vuln_scan": {
      "passed": true,
      "message": "No critical or high vulnerabilities found",
      "scanner": "grype",
      "scanner_version": "0.81.0",
      "db_built_at": "2026-06-27T00:00:00Z",
      "summary": {
        "critical": 0,
        "high": 0,
        "medium": 3,
        "low": 8
      }
    },
    "provenance": {
      "passed": true,
      "message": "Provenance verified",
      "source_repo": "https://github.com/TripleAze/chainguard",
      "source_commit": "4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a",
      "source_ref": "refs/heads/hotfix/v1.0.1",
      "builder_id": "https://github.com/slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@refs/tags/v2.0.0",
      "slsa_level": 3
    }
  }
}
EOF

# Test payload 6: FAIL - SBOM failed
cat > /tmp/payload-fail-sbom.json << EOF
{
  "git_commit": "5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b",
  "git_ref": "refs/heads/experiment/quick-test",
  "workflow_run": "https://github.com/TripleAze/chainguard/actions/runs/27774397196",
  "built_at": "2026-06-27T11:45:00Z",
  "image": "ghcr.io/tripleaze/chainguard/app:dev",
  "digest": "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
  "report": {
    "image": "ghcr.io/tripleaze/chainguard/app:dev",
    "digest": "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    "overall": "FAIL",
    "passed": false,
    "signature": {
      "passed": true,
      "message": "Signature verified",
      "detail": "Valid cosign signature"
    },
    "sbom": {
      "passed": false,
      "message": "SBOM verification failed",
      "package_count": 0,
      "format": "",
      "spdx_version": ""
    },
    "vuln_scan": {
      "passed": true,
      "message": "No critical vulnerabilities found",
      "scanner": "grype",
      "scanner_version": "0.81.0",
      "db_built_at": "2026-06-27T00:00:00Z",
      "summary": {
        "critical": 0,
        "high": 4,
        "medium": 10,
        "low": 20
      }
    },
    "provenance": {
      "passed": true,
      "message": "Provenance verified",
      "source_repo": "https://github.com/TripleAze/chainguard",
      "source_commit": "5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b",
      "source_ref": "refs/heads/experiment/quick-test",
      "builder_id": "https://github.com/slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@refs/tags/v2.0.0",
      "slsa_level": 3
    }
  }
}
EOF

# Test payload 7: FAIL - provenance failed
cat > /tmp/payload-fail-prov.json << EOF
{
  "git_commit": "6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c",
  "git_ref": "refs/heads/experiment/no-provenance",
  "workflow_run": "https://github.com/TripleAze/chainguard/actions/runs/27774397197",
  "built_at": "2026-06-27T13:00:00Z",
  "image": "ghcr.io/tripleaze/chainguard/app:dev-experiment",
  "digest": "sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
  "report": {
    "image": "ghcr.io/tripleaze/chainguard/app:dev-experiment",
    "digest": "sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
    "overall": "FAIL",
    "passed": false,
    "signature": {
      "passed": true,
      "message": "Signature verified",
      "detail": "Valid cosign signature"
    },
    "sbom": {
      "passed": true,
      "message": "SBOM verified",
      "package_count": 40,
      "format": "spdx-json",
      "spdx_version": "2.3"
    },
    "vuln_scan": {
      "passed": true,
      "message": "No critical vulnerabilities found",
      "scanner": "grype",
      "scanner_version": "0.81.0",
      "db_built_at": "2026-06-27T00:00:00Z",
      "summary": {
        "critical": 0,
        "high": 2,
        "medium": 5,
        "low": 10
      }
    },
    "provenance": {
      "passed": false,
      "message": "Provenance verification failed",
      "source_repo": "",
      "source_commit": "",
      "source_ref": "",
      "builder_id": "",
      "slsa_level": 0
    }
  }
}
EOF

# Test payload 8: PASS - release candidate
cat > /tmp/payload-pass-rc.json << EOF
{
  "git_commit": "7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
  "git_ref": "refs/tags/v1.1.0-rc1",
  "workflow_run": "https://github.com/TripleAze/chainguard/actions/runs/27774397198",
  "built_at": "2026-06-27T14:30:00Z",
  "image": "ghcr.io/tripleaze/chainguard/app:v1.1.0-rc1",
  "digest": "sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  "report": {
    "image": "ghcr.io/tripleaze/chainguard/app:v1.1.0-rc1",
    "digest": "sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "overall": "PASS",
    "passed": true,
    "signature": {
      "passed": true,
      "message": "Signature verified",
      "detail": "Valid cosign signature from release key"
    },
    "sbom": {
      "passed": true,
      "message": "SBOM verified",
      "package_count": 52,
      "format": "spdx-json",
      "spdx_version": "2.3"
    },
    "vuln_scan": {
      "passed": true,
      "message": "No critical vulnerabilities found",
      "scanner": "grype",
      "scanner_version": "0.81.0",
      "db_built_at": "2026-06-27T00:00:00Z",
      "summary": {
        "critical": 0,
        "high": 1,
        "medium": 6,
        "low": 14
      }
    },
    "provenance": {
      "passed": true,
      "message": "Provenance verified",
      "source_repo": "https://github.com/TripleAze/chainguard",
      "source_commit": "7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
      "source_ref": "refs/tags/v1.1.0-rc1",
      "builder_id": "https://github.com/slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@refs/tags/v2.0.0",
      "slsa_level": 3
    }
  }
}
EOF

echo "Sending more test payloads..."
echo ""

echo "Sending FAIL - signature failed payload..."
curl -X POST http://localhost:8080/api/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INGEST_KEY" \
  -d @/tmp/payload-fail-sig.json
echo -e "\n"

echo "Sending PASS - hotfix branch payload..."
curl -X POST http://localhost:8080/api/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INGEST_KEY" \
  -d @/tmp/payload-pass-hotfix.json
echo -e "\n"

echo "Sending FAIL - SBOM failed payload..."
curl -X POST http://localhost:8080/api/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INGEST_KEY" \
  -d @/tmp/payload-fail-sbom.json
echo -e "\n"

echo "Sending FAIL - provenance failed payload..."
curl -X POST http://localhost:8080/api/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INGEST_KEY" \
  -d @/tmp/payload-fail-prov.json
echo -e "\n"

echo "Sending PASS - release candidate payload..."
curl -X POST http://localhost:8080/api/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INGEST_KEY" \
  -d @/tmp/payload-pass-rc.json
echo -e "\n"

echo "All 5 new test payloads sent!"

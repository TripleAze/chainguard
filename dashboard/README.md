# ChainGuard Compliance Dashboard

## OVERVIEW

The ChainGuard Compliance Dashboard is a team-facing web application that ingests `chaincheck` reports from CI and displays supply chain security posture over time.

### What the Dashboard Shows
- **Release Timeline**: Recent releases with per-check status
- **CVE Trends**: 30-day vulnerability trend chart
- **Per-Release Drill-Down**: Detailed results for signature, SBOM, vulnerability scan, and provenance
- **PDF Export**: Generate compliance-ready reports (single release or portfolio summary)

### Who It's For
- **Engineering Teams**: Monitor security posture in real time
- **Auditors**: Evidence of supply chain controls and compliance

![Dashboard Screenshot](Screenshots/Dashboard.png)

![Sign-in Page](Screenshots/Signin.png)

---

## ARCHITECTURE

### Components
- **Go Backend API**: Serves on port 8080
- **PostgreSQL Database**: Single `releases` table with JSONB support
- **Next.js Frontend**: Serves on port 3000
- **ALB Ingress**: Routes `/api/*` to backend, `/*` to frontend

### Request Flow
```
User → ALB → ┌──────────────┐
             │  Frontend  │ → /
             └───────┬────┘
              ┌───────────┐
              │  Backend  │ → /api/*
              └─────┬─────┘
                    │
              ┌─────▼─────┐
              │ PostgreSQL│
              └───────────┘
```

---

## DATABASE SCHEMA

### `releases` Table
| Column           | Type         | Purpose                                                                 |
|------------------|--------------|-------------------------------------------------------------------------|
| `id`             | UUID         | Primary key (auto-generated)                                              |
| `image_ref`      | TEXT         | Full image reference (e.g., `ghcr.io/owner/image:tag`)                     |
| `digest`         | TEXT         | Immutable image digest (unique constraint)                                 |
| `git_commit`     | TEXT         | Git commit SHA                                                         |
| `git_ref`        | TEXT         | Git ref (e.g., `refs/heads/main`)                                      |
| `workflow_run`   | TEXT         | GitHub Actions workflow run URL                                           |
| `built_at`       | TIMESTAMPTZ  | Build timestamp                                                         |
| `ingested_at`    | TIMESTAMPTZ  | When the report was ingested (auto-generated)                            |
| `passed`         | BOOLEAN      | Overall pass/fail status                                                |
| `overall`        | TEXT         | Overall result string ("PASS"/"FAIL")                                    |
| `sig_passed`     | BOOLEAN      | Signature check passed?                                                      |
| `sig_detail`     | TEXT         | Signature check details                                                 |
| `sbom_passed`   | BOOLEAN      | SBOM check passed?                                                      |
| `sbom_packages` | INT          | Number of packages in SBOM                                               |
| `sbom_format`    | TEXT         | SBOM format                                                             |
| `sbom_version`   | TEXT         | SBOM version                                                           |
| `vuln_passed`   | BOOLEAN      | Vulnerability scan passed?                                               |
| `vuln_critical` | INT          | Critical vulnerability count                                               |
| `vuln_high`     | INT          | High vulnerability count                                              |
| `vuln_medium`   | INT          | Medium vulnerability count                                            |
| `vuln_low`      | INT          | Low vulnerability count                                               |
| `vuln_scanner`  | TEXT         | Vulnerability scanner used                                          |
| `vuln_db_date`  | TEXT         | Vulnerability database date                                            |
| `prov_passed`    | BOOLEAN      | Provenance check passed?                                                 |
| `prov_commit`    | TEXT         | Provenance source commit SHA                                           |
| `prov_ref`       | TEXT         | Provenance source ref                                                 |
| `prov_builder`   | TEXT         | Provenance builder ID                                               |
| `slsa_level`     | INT          | SLSA level                                                          |
| `raw_report`     | JSONB        | Full raw `chaincheck` JSON report                                        |

### `release_summary` View
Precomputed summary statistics for dashboard summary cards:
- `total_releases`, `passed_releases`, `failed_releases`, `pass_rate`, `last_deploy_at`, `total_critical`, `total_high`

### `cve_trend` View
Daily CVE counts for trend charts:
- `day`, `total_releases`, `critical`, `high`, `medium`, `low`

### Idempotent Ingest
The `INSERT` uses `ON CONFLICT (digest) DO NOTHING` to ensure idempotent ingestion.

---

## BACKEND API REFERENCE

### `POST /api/ingest`
Ingest a new `chaincheck` report from CI.

- **Auth**: Bearer token from `DASHBOARD_INGEST_KEY`
- **Headers**:
  - `X-GitHub-SHA`: Git commit SHA
  - `X-GitHub-Ref`: Git ref
  - `X-GitHub-Run-URL`: GitHub Actions run URL
  - `X-Built-At`: Build timestamp (RFC 3339)
- **Body**: Raw `chaincheck` JSON report
- **Response**: `{"status":"ingested","digest":"..."}` (201 Created)

### `GET /api/releases`
Get paginated list of releases.

- **Query Params**: `page` (default 1), `limit` (default 20, max 100)
- **Response**:
  ```json
  {
    "releases": [...],
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
  ```

### `GET /api/releases/{digest}`
Get full details for a single release.

- **Path Param**: `digest` — full `sha256:...` or just 64‑char hex
- **Response**: Full release object with `raw_report`

### `GET /api/stats`
Get summary statistics for dashboard home cards.

- **Response**:
  ```json
  {
    "total_releases": 100,
    "passed_releases": 95,
    "failed_releases": 5,
    "pass_rate": 95.0,
    "last_deploy_at": "2026-06-27T12:34:56Z",
    "total_critical": 0,
    "total_high": 123
  }
  ```

### `GET /api/stats/cve-trend`
Get 30‑day CVE trend data.

- **Query Params**: `days` (default 30, max 365)
- **Response**:
  ```json
  {
    "days": 30,
    "points": [
      {"day":"2026-06-27T00:00:00Z", "critical": 0, "high": 5, ...}
    ]
  }
  ```

### `GET /health`
Health check endpoint.

- **Response**: `{"status":"ok","version":"dev"}`

---

## FRONTEND PAGES

### `/` (Home)
- **Summary Cards**: Total Releases, Pass Rate, Critical CVEs, SLSA Level
- **CVE Trend Line Chart**: Last 30 days
- **Recent Releases Table**: Per‑release status dots for each check
- **Export PDF Button**: Portfolio summary report

### `/releases/[digest]` (Drill‑Down)
- **Image Metadata**: Ref, commit, branch, built date, SLSA level
- **Security Checks**: Signature, SBOM, Vulnerability Scan, Provenance (each with PASS/FAIL badge and detail text)
- **Export PDF Report Button**: Single release report
- **View in GitHub Actions Link**

---

## PDF EXPORT

Two report types, generated **client‑side** using `@react-pdf/renderer`:

### Single Release Report
1. Cover page with logo, metadata, overall PASS/FAIL
2. Executive Summary table (all four checks)
3. Detailed Findings (all fields per check)

### Portfolio Summary Report
1. Cover page with logo and stats summary
2. Recent Releases table

---

## ENVIRONMENT VARIABLES

### Backend
| Variable               | Purpose                                                                 |
|------------------------|-------------------------------------------------------------------------|
| `DATABASE_URL`         | PostgreSQL connection string (e.g., `postgres://user:pass@host:5432/db`       |
| `DASHBOARD_INGEST_KEY`| API key for ingest endpoint authentication                             |
| `PORT`                 | HTTP port (default: `8080`)                                           |
| `GITHUB_CLIENT_ID`     | GitHub OAuth client ID (optional, for user auth)                          |
| `GITHUB_CLIENT_SECRET`| GitHub OAuth client secret (optional)                                  |
| `GITHUB_CALLBACK_URL` | GitHub OAuth callback URL (optional)                                        |
| `SESSION_KEY`          | Secret for encrypting session cookies (optional)                        |
| `GITHUB_ALLOWED_USERS`| Comma‑separated list of allowed GitHub logins (optional)             |
| `FRONTEND_URL`         | URL of the frontend (optional, default `http://localhost:3000`)             |

### Frontend
| Variable               | Purpose                                                                 |
|------------------------|-------------------------------------------------------------------------|
| `NEXT_PUBLIC_API_URL`  | Backend API URL (e.g., `http://localhost:8080`)                        |

---

## LOCAL DEVELOPMENT

### 1. Start PostgreSQL
```bash
docker run -e POSTGRES_DB=chainguard \
           -e POSTGRES_PASSWORD=secret \
           -p 5432:5432 postgres:16-alpine
```

### 2. Apply Schema
```bash
psql postgres://postgres:secret@localhost:5432/chainguard \
  -f backend/db/migrations/001_init.sql
```

### 3. Start Backend
```bash
cd dashboard/backend
DATABASE_URL=postgres://postgres:secret@localhost:5432/chainguard \
DASHBOARD_INGEST_KEY=my-ingest-key \
go run main.go
```

### 4. Start Frontend
```bash
cd dashboard/frontend
NEXT_PUBLIC_API_URL=http://localhost:8080 npm run dev
```

---

## DEPLOYMENT

All Kubernetes manifests are in `deploy/`. The dashboard is managed by ArgoCD using the same GitOps pattern as the main application.

### Deploy Manifests
```bash
kubectl apply -f deploy/
```

### Create Kubernetes Secrets
```bash
kubectl create secret generic dashboard-secrets \
  --from-literal=DASHBOARD_INGEST_KEY=<your-ingest-key> \
  --from-literal=DATABASE_URL=<your-postgres-url> \
  --from-literal=POSTGRES_USER=<your-postgres-user> \
  --from-literal=POSTGRES_PASSWORD=<your-postgres-password> \
  -n chainguard-app
```

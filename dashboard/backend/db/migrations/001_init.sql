-- 001_init.sql
-- ChainGuard compliance dashboard schema
-- Run with: psql $DATABASE_URL -f 001_init.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS releases (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    image_ref     TEXT        NOT NULL,
    digest        TEXT        NOT NULL UNIQUE,
    git_commit    TEXT        NOT NULL,
    git_ref       TEXT        NOT NULL,
    workflow_run  TEXT        NOT NULL,
    built_at      TIMESTAMPTZ NOT NULL,
    ingested_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Overall result
    passed        BOOLEAN     NOT NULL,
    overall       TEXT        NOT NULL,

    -- Signature check
    sig_passed    BOOLEAN     NOT NULL DEFAULT false,
    sig_detail    TEXT,

    -- SBOM check
    sbom_passed   BOOLEAN     NOT NULL DEFAULT false,
    sbom_packages INT         DEFAULT 0,
    sbom_format   TEXT,
    sbom_version  TEXT,

    -- Vulnerability scan check
    vuln_passed   BOOLEAN     NOT NULL DEFAULT false,
    vuln_critical INT         NOT NULL DEFAULT 0,
    vuln_high     INT         NOT NULL DEFAULT 0,
    vuln_medium   INT         NOT NULL DEFAULT 0,
    vuln_low      INT         NOT NULL DEFAULT 0,
    vuln_scanner  TEXT,
    vuln_db_date  TEXT,

    -- Provenance check
    prov_passed   BOOLEAN     NOT NULL DEFAULT false,
    prov_commit   TEXT,
    prov_ref      TEXT,
    prov_builder  TEXT,
    slsa_level    INT         DEFAULT 0,

    -- Full raw chaincheck JSON for drill-down
    raw_report    JSONB       NOT NULL
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_releases_built_at  ON releases (built_at DESC);
CREATE INDEX IF NOT EXISTS idx_releases_digest    ON releases (digest);
CREATE INDEX IF NOT EXISTS idx_releases_passed    ON releases (passed);
CREATE INDEX IF NOT EXISTS idx_releases_image_ref ON releases (image_ref);

-- View: CVE trend — one row per release with counts, ordered by time
-- Used by the trend chart endpoint
CREATE OR REPLACE VIEW cve_trend AS
SELECT
    DATE_TRUNC('day', built_at) AS day,
    COUNT(*)                    AS total_releases,
    SUM(vuln_critical)          AS critical,
    SUM(vuln_high)              AS high,
    SUM(vuln_medium)            AS medium,
    SUM(vuln_low)               AS low
FROM releases
GROUP BY DATE_TRUNC('day', built_at)
ORDER BY day DESC;

-- View: summary stats — used by the dashboard summary cards
CREATE OR REPLACE VIEW release_summary AS
SELECT
    COUNT(*)                                    AS total_releases,
    COUNT(*) FILTER (WHERE passed = true)       AS passed_releases,
    COUNT(*) FILTER (WHERE passed = false)      AS failed_releases,
    ROUND(
        COUNT(*) FILTER (WHERE passed = true)::NUMERIC
        / NULLIF(COUNT(*), 0) * 100, 1
    )                                           AS pass_rate,
    MAX(built_at)                               AS last_deploy_at,
    SUM(vuln_critical)                          AS total_critical,
    SUM(vuln_high)                              AS total_high
FROM releases;

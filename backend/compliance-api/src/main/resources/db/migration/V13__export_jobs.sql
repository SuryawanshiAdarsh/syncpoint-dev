CREATE TABLE export_jobs (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status          VARCHAR(32)  NOT NULL,
    storage_key     VARCHAR(512),
    size_bytes      BIGINT,
    triggered_by    UUID         REFERENCES users(id) ON DELETE SET NULL,
    error_message   TEXT,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT export_jobs_status_check
        CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX idx_export_jobs_org ON export_jobs (organization_id);

CREATE TABLE collection_runs (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id  UUID         NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    status          VARCHAR(32)  NOT NULL,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    error_message   TEXT,
    triggered_by    UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT collection_runs_status_check
        CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED'))
);

CREATE INDEX idx_collection_runs_org         ON collection_runs (organization_id);
CREATE INDEX idx_collection_runs_integration ON collection_runs (integration_id);
CREATE INDEX idx_collection_runs_created_at  ON collection_runs (created_at DESC);

CREATE TABLE collection_items (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    run_id          UUID         NOT NULL REFERENCES collection_runs(id) ON DELETE CASCADE,
    evidence_type   VARCHAR(64)  NOT NULL,
    status          VARCHAR(32)  NOT NULL,
    message         TEXT,
    evidence_id     UUID         REFERENCES evidence(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT collection_items_status_check
        CHECK (status IN ('SUCCESS', 'SKIPPED', 'FAILED'))
);

CREATE INDEX idx_collection_items_run ON collection_items (run_id);

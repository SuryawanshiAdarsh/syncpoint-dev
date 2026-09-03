CREATE TABLE control_status_snapshots (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    control_id      UUID         NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
    status          VARCHAR(20)  NOT NULL,
    snapshot_date   DATE         NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT control_status_snapshots_status_check
        CHECK (status IN ('COVERED', 'PARTIAL', 'MISSING', 'NEEDS_REVIEW')),
    CONSTRAINT control_status_snapshots_unique
        UNIQUE (organization_id, control_id, snapshot_date)
);

-- Coverage-trend endpoint reads "all rows for this org on/after date X" ordered by date.
CREATE INDEX idx_control_status_snapshots_org_date ON control_status_snapshots (organization_id, snapshot_date);

CREATE TABLE control_exceptions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    control_id      UUID        NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
    description     TEXT        NOT NULL,
    detected_date   DATE        NOT NULL,
    remediated_date DATE,
    status          VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    created_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT control_exceptions_status_check CHECK (status IN ('OPEN','REMEDIATED'))
);

CREATE INDEX idx_control_exceptions_organization_id ON control_exceptions (organization_id);
CREATE INDEX idx_control_exceptions_control_id ON control_exceptions (control_id);

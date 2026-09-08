CREATE TABLE control_owners (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    control_id      UUID        NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT control_owners_unique UNIQUE (organization_id, control_id)
);

CREATE INDEX idx_control_owners_org ON control_owners (organization_id);

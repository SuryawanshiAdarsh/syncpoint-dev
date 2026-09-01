CREATE TABLE organization_members (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(32) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT organization_members_role_check
        CHECK (role IN ('OWNER', 'ADMIN', 'REVIEWER', 'VIEWER')),
    CONSTRAINT organization_members_unique
        UNIQUE (organization_id, user_id)
);

CREATE INDEX idx_organization_members_org  ON organization_members (organization_id);
CREATE INDEX idx_organization_members_user ON organization_members (user_id);

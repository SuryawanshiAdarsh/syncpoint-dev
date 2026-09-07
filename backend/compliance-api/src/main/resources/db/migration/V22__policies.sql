CREATE TABLE policies (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title             VARCHAR(255) NOT NULL,
    category          VARCHAR(64) NOT NULL,
    description       TEXT,
    status            VARCHAR(16) NOT NULL DEFAULT 'PUBLISHED',
    owner_user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    next_review_date  DATE,
    evidence_id       UUID REFERENCES evidence(id) ON DELETE SET NULL,
    current_version   INT NOT NULL DEFAULT 1,
    created_by        UUID NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT policies_status_check CHECK (status IN ('PUBLISHED', 'ARCHIVED'))
);

CREATE INDEX idx_policies_organization ON policies (organization_id);
CREATE INDEX idx_policies_evidence ON policies (evidence_id);

CREATE TABLE policy_acknowledgments (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    policy_id         UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    policy_version    INT NOT NULL,
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    acknowledged_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT policy_ack_unique UNIQUE (policy_id, policy_version, user_id)
);

CREATE INDEX idx_policy_ack_policy ON policy_acknowledgments (policy_id, policy_version);
CREATE INDEX idx_policy_ack_organization ON policy_acknowledgments (organization_id);

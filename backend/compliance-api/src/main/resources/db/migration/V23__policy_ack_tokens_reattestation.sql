ALTER TABLE policies
    ADD COLUMN attestation_cycle     INT         NOT NULL DEFAULT 1,
    ADD COLUMN cycle_started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN last_reminder_sent_at TIMESTAMPTZ;

ALTER TABLE policy_acknowledgments
    ADD COLUMN attestation_cycle INT NOT NULL DEFAULT 1;

ALTER TABLE policy_acknowledgments DROP CONSTRAINT policy_ack_unique;
ALTER TABLE policy_acknowledgments
    ADD CONSTRAINT policy_ack_unique UNIQUE (policy_id, policy_version, attestation_cycle, user_id);

CREATE INDEX idx_policies_cycle_started ON policies (status, cycle_started_at);

-- Login-free (magic-link) policy acknowledgment portal tokens. Multi-use until expiry (unlike
-- auth_tokens, which are single-use) since one visit may cover several pending policies.
CREATE TABLE policy_ack_tokens (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash        VARCHAR(64) NOT NULL UNIQUE,
    expires_at        TIMESTAMPTZ NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policy_ack_tokens_user ON policy_ack_tokens (organization_id, user_id);

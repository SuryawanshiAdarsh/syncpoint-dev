CREATE TABLE audit_events (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_user_id   UUID         REFERENCES users(id) ON DELETE SET NULL,
    event_type      VARCHAR(64)  NOT NULL,
    entity_type     VARCHAR(64),
    entity_id       UUID,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_events_org        ON audit_events (organization_id);
CREATE INDEX idx_audit_events_type       ON audit_events (event_type);
CREATE INDEX idx_audit_events_created_at ON audit_events (created_at DESC);

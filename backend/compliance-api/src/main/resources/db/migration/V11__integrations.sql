CREATE TABLE integrations (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider              VARCHAR(32)  NOT NULL,
    status                VARCHAR(32)  NOT NULL,
    display_name          VARCHAR(255),
    configuration         JSONB        NOT NULL DEFAULT '{}'::jsonb,
    credential_reference  UUID         REFERENCES secret_records(id) ON DELETE SET NULL,
    last_tested_at        TIMESTAMPTZ,
    last_test_message     TEXT,
    last_collection_at    TIMESTAMPTZ,
    schedule              VARCHAR(16)  NOT NULL DEFAULT 'MANUAL',
    created_by            UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT integrations_status_check
        CHECK (status IN ('PENDING', 'CONNECTED', 'ERROR', 'DISCONNECTED')),
    CONSTRAINT integrations_schedule_check
        CHECK (schedule IN ('MANUAL', 'DAILY', 'WEEKLY'))
);

CREATE INDEX idx_integrations_org      ON integrations (organization_id);
CREATE INDEX idx_integrations_provider ON integrations (provider);

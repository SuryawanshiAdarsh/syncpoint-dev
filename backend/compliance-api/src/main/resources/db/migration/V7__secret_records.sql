-- Envelope-encrypted secret store (spec V2 §9, §48, §55, §56).
--
-- Each record holds a data-encryption-key (DEK) encrypted by a master key
-- kept in application memory (env: SECRET_STORE_MASTER_KEY, base64 32 bytes).
-- The ciphertext, DEK-wrap, and IV are all stored per-record.
CREATE TABLE secret_records (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        REFERENCES organizations(id) ON DELETE CASCADE,
    label           VARCHAR(128) NOT NULL,
    ciphertext      BYTEA        NOT NULL,
    iv              BYTEA        NOT NULL,
    wrapped_dek     BYTEA        NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_secret_records_org ON secret_records (organization_id);

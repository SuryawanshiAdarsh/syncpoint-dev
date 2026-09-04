ALTER TABLE users
    ADD COLUMN email_verified_at TIMESTAMPTZ;

-- One table backs three flows that all share the same "emailed link with a
-- one-time token" mechanism: self-serve password reset, new-member invites
-- (member has no usable password until they accept), and email verification.
CREATE TABLE auth_tokens (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64)  NOT NULL UNIQUE,
    purpose    VARCHAR(20)  NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT auth_tokens_purpose_check CHECK (purpose IN ('RESET', 'INVITE', 'VERIFY'))
);

CREATE INDEX idx_auth_tokens_user ON auth_tokens (user_id);

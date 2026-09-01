CREATE TABLE controls (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id UUID         NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
    code         VARCHAR(32)  NOT NULL,
    title        VARCHAR(255) NOT NULL,
    description  TEXT         NOT NULL,
    category     VARCHAR(64)  NOT NULL,
    active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT controls_unique_code UNIQUE (framework_id, code)
);

CREATE INDEX idx_controls_framework ON controls (framework_id);
CREATE INDEX idx_controls_category  ON controls (category);

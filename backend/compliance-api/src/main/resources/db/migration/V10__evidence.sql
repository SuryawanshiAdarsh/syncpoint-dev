CREATE TABLE evidence (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    source_type     VARCHAR(32)  NOT NULL,
    source_system   VARCHAR(64)  NOT NULL,
    status          VARCHAR(32)  NOT NULL,
    collected_at    TIMESTAMPTZ  NOT NULL,
    expires_at      TIMESTAMPTZ,
    created_by      UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT evidence_status_check
        CHECK (status IN ('COLLECTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED'))
);

CREATE INDEX idx_evidence_org         ON evidence (organization_id);
CREATE INDEX idx_evidence_source_type ON evidence (source_type);
CREATE INDEX idx_evidence_status      ON evidence (status);
CREATE INDEX idx_evidence_collected   ON evidence (collected_at DESC);

CREATE TABLE evidence_versions (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id       UUID         NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    organization_id   UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    version           INT          NOT NULL,
    storage_key       VARCHAR(512) NOT NULL,
    content_hash      VARCHAR(128) NOT NULL,
    size_bytes        BIGINT       NOT NULL,
    mime_type         VARCHAR(128),
    collector_version VARCHAR(64),
    collected_at      TIMESTAMPTZ  NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT evidence_versions_unique UNIQUE (evidence_id, version)
);

CREATE INDEX idx_evidence_versions_evidence ON evidence_versions (evidence_id);
CREATE INDEX idx_evidence_versions_org      ON evidence_versions (organization_id);

CREATE TABLE evidence_control_mappings (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    evidence_id     UUID          NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    control_id      UUID          NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
    mapping_type    VARCHAR(32)   NOT NULL,
    classification  VARCHAR(32),
    confidence      NUMERIC(4, 3),
    reason          TEXT,
    created_by      UUID          REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT mappings_type_check
        CHECK (mapping_type IN ('AI_SUGGESTED', 'HUMAN_CONFIRMED', 'HUMAN_REJECTED')),
    CONSTRAINT mappings_class_check
        CHECK (classification IS NULL
               OR classification IN ('COVERED', 'PARTIAL', 'INSUFFICIENT'))
);

CREATE INDEX idx_mappings_org      ON evidence_control_mappings (organization_id);
CREATE INDEX idx_mappings_evidence ON evidence_control_mappings (evidence_id);
CREATE INDEX idx_mappings_control  ON evidence_control_mappings (control_id);

CREATE TABLE evidence_reviews (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    evidence_id     UUID         NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    reviewer_id     UUID         REFERENCES users(id) ON DELETE SET NULL,
    decision        VARCHAR(32)  NOT NULL,
    comments        TEXT,
    reviewed_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT reviews_decision_check
        CHECK (decision IN ('APPROVED', 'REJECTED'))
);

CREATE INDEX idx_reviews_org      ON evidence_reviews (organization_id);
CREATE INDEX idx_reviews_evidence ON evidence_reviews (evidence_id);

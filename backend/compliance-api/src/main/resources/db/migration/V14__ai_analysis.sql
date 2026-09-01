CREATE TABLE ai_analysis (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    evidence_id     UUID          NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    control_id      UUID          NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
    provider        VARCHAR(64)   NOT NULL,
    model           VARCHAR(128)  NOT NULL,
    prompt_version  VARCHAR(64)   NOT NULL,
    classification  VARCHAR(32),
    confidence      NUMERIC(4, 3),
    reason          TEXT,
    result          JSONB         NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT ai_analysis_class_check
        CHECK (classification IS NULL OR classification IN ('COVERED', 'PARTIAL', 'INSUFFICIENT'))
);

CREATE INDEX idx_ai_analysis_org      ON ai_analysis (organization_id);
CREATE INDEX idx_ai_analysis_evidence ON ai_analysis (evidence_id);
CREATE INDEX idx_ai_analysis_control  ON ai_analysis (control_id);

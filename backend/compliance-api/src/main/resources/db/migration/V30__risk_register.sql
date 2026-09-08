CREATE TABLE risks (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title             VARCHAR(256) NOT NULL,
    description       TEXT,
    category          VARCHAR(32) NOT NULL,
    likelihood        VARCHAR(16) NOT NULL,
    impact            VARCHAR(16) NOT NULL,
    status            VARCHAR(16) NOT NULL DEFAULT 'IDENTIFIED',
    owner_user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
    next_review_date  DATE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT risks_category_check CHECK (category IN ('FRAUD','OPERATIONAL','TECHNOLOGY','COMPLIANCE','THIRD_PARTY','FINANCIAL')),
    CONSTRAINT risks_likelihood_check CHECK (likelihood IN ('LOW','MEDIUM','HIGH')),
    CONSTRAINT risks_impact_check CHECK (impact IN ('LOW','MEDIUM','HIGH')),
    CONSTRAINT risks_status_check CHECK (status IN ('IDENTIFIED','MITIGATING','MITIGATED','ACCEPTED'))
);

CREATE INDEX idx_risks_organization_id ON risks (organization_id);

CREATE TABLE risk_control_links (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    risk_id         UUID        NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
    control_id      UUID        NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT risk_control_links_unique UNIQUE (risk_id, control_id)
);

CREATE INDEX idx_risk_control_links_risk_id ON risk_control_links (risk_id);
CREATE INDEX idx_risk_control_links_control_id ON risk_control_links (control_id);
CREATE INDEX idx_risk_control_links_organization_id ON risk_control_links (organization_id);

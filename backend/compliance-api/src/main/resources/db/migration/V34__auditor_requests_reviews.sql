-- Auditor collaboration workflow (see dev-guide backlog #18/#44): CPA firm requests additional
-- evidence on a control, or marks a control as reviewed/tested during their engagement.
CREATE TABLE auditor_requests (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    control_id      UUID        NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
    type            VARCHAR(24) NOT NULL,
    message         TEXT        NOT NULL,
    status          VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    created_by      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_by     UUID        REFERENCES users(id) ON DELETE SET NULL,
    resolved_at     TIMESTAMPTZ,
    resolution_note TEXT,
    CONSTRAINT auditor_requests_type_check CHECK (type IN ('EVIDENCE_REQUEST', 'REVIEW_NOTE')),
    CONSTRAINT auditor_requests_status_check CHECK (status IN ('OPEN', 'RESOLVED'))
);

CREATE INDEX idx_auditor_requests_organization_id ON auditor_requests (organization_id);
CREATE INDEX idx_auditor_requests_control_id ON auditor_requests (control_id);

-- Separate from a "request": the auditor's own record of having tested/sampled a control --
-- nothing for the org to resolve, just a Type II artifact of auditor activity.
CREATE TABLE auditor_control_reviews (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    control_id      UUID        NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
    reviewed_by     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note            TEXT
);

CREATE INDEX idx_auditor_control_reviews_organization_id ON auditor_control_reviews (organization_id);
CREATE INDEX idx_auditor_control_reviews_control_id ON auditor_control_reviews (control_id);

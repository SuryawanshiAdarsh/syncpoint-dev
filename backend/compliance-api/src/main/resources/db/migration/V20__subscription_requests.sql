-- Subscription change/renewal requests: an org proposes a plan + seat count, a platform admin
-- approves (applies it + extends the period) or rejects (with a reason) it. Replaces the earlier
-- instant self-service "renew" button -- no subscription mutation happens except through this
-- reviewed workflow.

CREATE TABLE subscription_requests (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    requested_by          UUID         NOT NULL REFERENCES users(id),
    requested_plan        VARCHAR(20)  NOT NULL,
    requested_seat_limit  INTEGER      NOT NULL,
    note                  VARCHAR(500),
    status                VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    reviewed_by           UUID         REFERENCES users(id),
    reviewed_at           TIMESTAMPTZ,
    review_note           VARCHAR(500),
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT subscription_requests_plan_check
        CHECK (requested_plan IN ('TRIAL', 'STARTER', 'PRO', 'ENTERPRISE')),
    CONSTRAINT subscription_requests_status_check
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT subscription_requests_seat_limit_check
        CHECK (requested_seat_limit >= 1)
);

-- One pending request per org at a time -- a partial unique index enforces this at the DB level
-- too, not just in application code (defense in depth against races/bugs).
CREATE UNIQUE INDEX subscription_requests_one_pending_per_org
    ON subscription_requests (organization_id)
    WHERE status = 'PENDING';

CREATE INDEX subscription_requests_status_idx ON subscription_requests (status, created_at);

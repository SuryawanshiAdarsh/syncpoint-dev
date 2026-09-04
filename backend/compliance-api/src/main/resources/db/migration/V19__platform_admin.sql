-- Platform-admin (Syncpoint-the-company) visibility into its own tenants: who they are, what
-- plan they're on, and whether their subscription is current. Separate from the tenant-facing
-- RBAC (Role enum) entirely -- a user can be a platform admin AND an OWNER/ADMIN/REVIEWER/VIEWER
-- of their own org at the same time.

ALTER TABLE users
    ADD COLUMN platform_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE subscriptions (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id      UUID         NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    plan                 VARCHAR(20)  NOT NULL DEFAULT 'TRIAL',
    status               VARCHAR(20)  NOT NULL DEFAULT 'TRIALING',
    seat_limit           INTEGER,
    trial_ends_at        TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end   TIMESTAMPTZ,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT subscriptions_plan_check CHECK (plan IN ('TRIAL', 'STARTER', 'PRO', 'ENTERPRISE')),
    CONSTRAINT subscriptions_status_check CHECK (status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'SUSPENDED'))
);

-- Every existing org needs a subscription row so the admin console never has a gap; new orgs get
-- one created at registration time going forward (see AuthService.register()).
INSERT INTO subscriptions (organization_id, plan, status, trial_ends_at)
SELECT id, 'TRIAL', 'TRIALING', NOW() + INTERVAL '14 days' FROM organizations;

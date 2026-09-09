-- Auditor/CPA firm profile fields on the organization.
ALTER TABLE organizations
    ADD COLUMN auditor_firm_name    VARCHAR(255),
    ADD COLUMN auditor_contact_name VARCHAR(255),
    ADD COLUMN auditor_contact_email VARCHAR(255);

-- AUDITOR: a real, JWT-authenticated login restricted to /api/v1/auditor/** (see SecurityConfig).
ALTER TABLE organization_members DROP CONSTRAINT organization_members_role_check;
ALTER TABLE organization_members
    ADD CONSTRAINT organization_members_role_check
        CHECK (role IN ('OWNER', 'ADMIN', 'REVIEWER', 'VIEWER', 'ACKNOWLEDGER', 'AUDITOR'));

-- Auditor engagements are time-boxed; NULL means no expiry (regular employees).
ALTER TABLE organization_members ADD COLUMN access_expires_at TIMESTAMPTZ;

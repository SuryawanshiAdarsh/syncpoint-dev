ALTER TABLE organization_members DROP CONSTRAINT organization_members_role_check;
ALTER TABLE organization_members
    ADD CONSTRAINT organization_members_role_check
        CHECK (role IN ('OWNER', 'ADMIN', 'REVIEWER', 'VIEWER', 'ACKNOWLEDGER'));

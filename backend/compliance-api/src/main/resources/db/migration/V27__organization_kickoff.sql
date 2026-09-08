-- Existing orgs keep seeing every control they see today (Availability + Confidentiality already
-- in their catalog) by backfilling full scope BEFORE the default narrows for brand-new orgs, same
-- backfill-then-narrow pattern as V16's onboarding_completed column.
ALTER TABLE organizations
    ADD COLUMN tsc_scope_extra          VARCHAR(128) NOT NULL DEFAULT 'AVAILABILITY,CONFIDENTIALITY',
    ADD COLUMN report_type              VARCHAR(16)  NOT NULL DEFAULT 'TYPE_I',
    ADD COLUMN observation_period_start DATE,
    ADD COLUMN observation_period_end   DATE,
    ADD COLUMN target_report_date       DATE,
    ADD COLUMN services_provided        TEXT,
    ADD COLUMN system_boundaries        TEXT,
    ADD COLUMN components_description   TEXT,
    ADD COLUMN subservice_organizations TEXT,
    ADD CONSTRAINT organizations_report_type_check CHECK (report_type IN ('TYPE_I', 'TYPE_II'));

ALTER TABLE organizations ALTER COLUMN tsc_scope_extra SET DEFAULT '';

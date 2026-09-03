-- Backfill: any organization that already existed has obviously already "used" the product,
-- so it must not be retroactively forced through the first-time setup wizard. Only
-- organizations created after this migration should start as onboarding_completed = FALSE.
ALTER TABLE organizations
    ADD COLUMN onboarding_completed    BOOLEAN     NOT NULL DEFAULT TRUE,
    ADD COLUMN onboarding_completed_at TIMESTAMPTZ;

UPDATE organizations SET onboarding_completed_at = updated_at WHERE onboarding_completed_at IS NULL;

ALTER TABLE organizations
    ALTER COLUMN onboarding_completed SET DEFAULT FALSE;

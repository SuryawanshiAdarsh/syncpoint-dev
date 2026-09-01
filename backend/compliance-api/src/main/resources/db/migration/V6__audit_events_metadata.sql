-- Adds a metadata JSONB column to audit_events (spec §8 original schema).
ALTER TABLE audit_events
    ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

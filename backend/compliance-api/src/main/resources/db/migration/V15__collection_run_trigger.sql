ALTER TABLE collection_runs
    ADD COLUMN trigger VARCHAR(16) NOT NULL DEFAULT 'MANUAL';

ALTER TABLE collection_runs
    ADD CONSTRAINT collection_runs_trigger_check
        CHECK (trigger IN ('MANUAL', 'SCHEDULED'));

ALTER TABLE collection_runs
    ALTER COLUMN trigger DROP DEFAULT;

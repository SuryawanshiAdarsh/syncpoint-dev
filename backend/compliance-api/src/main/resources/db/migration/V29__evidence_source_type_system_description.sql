-- Widen for the new System Description module, which mirrors its document into Evidence
-- (same "mirror on publish" pattern Policies use) so it plugs into existing mapping/export flows.
ALTER TABLE evidence DROP CONSTRAINT evidence_source_type_check;
ALTER TABLE evidence
    ADD CONSTRAINT evidence_source_type_check
    CHECK (source_type IN ('MANUAL_UPLOAD', 'GITHUB', 'AWS', 'JIRA', 'GOOGLE_WORKSPACE', 'POLICY', 'SYSTEM_DESCRIPTION'));

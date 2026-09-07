-- Closes a gap found during an enum/constraint audit: EvidenceSourceType was the one
-- backend enum with no DB-level guarantee. Safe to add now — every existing row is written
-- exclusively through EvidenceService/CollectionRunner using the enum, never a raw string.
ALTER TABLE evidence
    ADD CONSTRAINT evidence_source_type_check
    CHECK (source_type IN ('MANUAL_UPLOAD', 'GITHUB', 'AWS', 'JIRA', 'GOOGLE_WORKSPACE', 'POLICY'));

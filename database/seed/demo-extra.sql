-- =============================================================================
-- Syncpoint Compliance — Demo Extra Seed
--
-- Layers on top of demo.sql to make the dashboard look like an active tenant:
--   * 6 additional evidence artifacts
--   * mappings covering CC6.2, CC6.6, CC7.1, CC7.2, CC8.1, A1.2
--   * a fake GitHub integration + one completed collection run
--   * a couple of AI analyses so the AI panel is populated
--
-- Assumes demo.sql has already been loaded (Demo Corp org exists).
-- Idempotent: DELETEs at the top wipe extras from any previous run.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. Wipe any previous extras (safe re-run).
-- -----------------------------------------------------------------------------

DELETE FROM ai_analysis WHERE id BETWEEN
    '00000000-0000-4000-a000-000000000700' AND '00000000-0000-4000-a000-0000000007ff';
DELETE FROM collection_items WHERE run_id BETWEEN
    '00000000-0000-4000-a000-000000000600' AND '00000000-0000-4000-a000-0000000006ff';
DELETE FROM collection_runs WHERE id BETWEEN
    '00000000-0000-4000-a000-000000000600' AND '00000000-0000-4000-a000-0000000006ff';
DELETE FROM integrations WHERE id BETWEEN
    '00000000-0000-4000-a000-000000000500' AND '00000000-0000-4000-a000-0000000005ff';
DELETE FROM evidence_control_mappings WHERE id BETWEEN
    '00000000-0000-4000-a000-000000000310' AND '00000000-0000-4000-a000-0000000003ff';
DELETE FROM evidence_versions WHERE id BETWEEN
    '00000000-0000-4000-a000-000000000210' AND '00000000-0000-4000-a000-0000000002ff';
DELETE FROM evidence WHERE id BETWEEN
    '00000000-0000-4000-a000-000000000110' AND '00000000-0000-4000-a000-0000000001ff';

-- -----------------------------------------------------------------------------
-- 1. Six additional evidence artifacts across common SOC 2 sources.
-- -----------------------------------------------------------------------------

INSERT INTO evidence (id, organization_id, name, description, source_type,
                      source_system, status, collected_at, expires_at, created_by)
VALUES
    -- CC6.6 Multi-Factor Authentication → COVERED
    ('00000000-0000-4000-a000-000000000110',
     '00000000-0000-4000-a000-000000000001',
     'Okta MFA Enforcement Policy',
     'Screenshot + config export showing MFA required for all users on production tenants.',
     'MANUAL_UPLOAD', 'manual-upload', 'APPROVED',
     NOW() - INTERVAL '5 days', NOW() + INTERVAL '360 days',
     '00000000-0000-4000-a000-000000000010'),

    -- CC7.1 System Monitoring → PARTIAL
    ('00000000-0000-4000-a000-000000000111',
     '00000000-0000-4000-a000-000000000001',
     'CloudTrail Configuration Snapshot',
     'AWS CloudTrail trail definitions: multi-region enabled, S3 destination configured.',
     'AWS', 'aws-collector', 'COLLECTED',
     NOW() - INTERVAL '4 days', NOW() + INTERVAL '361 days',
     '00000000-0000-4000-a000-000000000010'),

    -- CC7.2 Incident Response → COVERED
    ('00000000-0000-4000-a000-000000000112',
     '00000000-0000-4000-a000-000000000001',
     'Incident Response Playbook v3.2',
     'Runbook describing detection → triage → containment → post-mortem process.',
     'MANUAL_UPLOAD', 'manual-upload', 'APPROVED',
     NOW() - INTERVAL '10 days', NOW() + INTERVAL '355 days',
     '00000000-0000-4000-a000-000000000010'),

    -- CC8.1 Change Management → COVERED (via GitHub collection)
    ('00000000-0000-4000-a000-000000000113',
     '00000000-0000-4000-a000-000000000001',
     'GitHub Branch Protection — main',
     'Branch-protection settings on default branch: reviews required, status checks required.',
     'GITHUB', 'github/1', 'COLLECTED',
     NOW() - INTERVAL '1 hour', NOW() + INTERVAL '30 days',
     '00000000-0000-4000-a000-000000000010'),

    -- A1.2 Backup and Recovery → PARTIAL (schedule present, restore missing)
    ('00000000-0000-4000-a000-000000000114',
     '00000000-0000-4000-a000-000000000001',
     'RDS Backup Schedule',
     'Automated daily snapshots at 03:00 UTC with 35-day retention. Restore test scheduled Q3.',
     'AWS', 'aws-collector', 'COLLECTED',
     NOW() - INTERVAL '6 days', NOW() + INTERVAL '359 days',
     '00000000-0000-4000-a000-000000000010'),

    -- CC6.2 Access Provisioning → NEEDS_REVIEW (AI suggested)
    ('00000000-0000-4000-a000-000000000115',
     '00000000-0000-4000-a000-000000000001',
     'Employee Onboarding Checklist',
     'HR-managed checklist covering account provisioning, laptop, VPN, and role assignment.',
     'MANUAL_UPLOAD', 'manual-upload', 'COLLECTED',
     NOW() - INTERVAL '7 days', NOW() + INTERVAL '358 days',
     '00000000-0000-4000-a000-000000000010');

-- Evidence versions for the six extras.
INSERT INTO evidence_versions (id, evidence_id, organization_id, version,
                               storage_key, content_hash, size_bytes, mime_type,
                               collector_version, collected_at)
VALUES
    ('00000000-0000-4000-a000-000000000210',
     '00000000-0000-4000-a000-000000000110',
     '00000000-0000-4000-a000-000000000001', 1,
     'organizations/00000000-0000-4000-a000-000000000001/evidence/00000000-0000-4000-a000-000000000110/00000000-0000-4000-a000-000000000210',
     'demo-extra-hash-110-mfa-enforcement-policy',
     3072, 'application/pdf', 'manual/1',
     NOW() - INTERVAL '5 days'),
    ('00000000-0000-4000-a000-000000000211',
     '00000000-0000-4000-a000-000000000111',
     '00000000-0000-4000-a000-000000000001', 1,
     'organizations/00000000-0000-4000-a000-000000000001/evidence/00000000-0000-4000-a000-000000000111/00000000-0000-4000-a000-000000000211',
     'demo-extra-hash-111-cloudtrail-config',
     4096, 'application/json', 'aws-collector/1',
     NOW() - INTERVAL '4 days'),
    ('00000000-0000-4000-a000-000000000212',
     '00000000-0000-4000-a000-000000000112',
     '00000000-0000-4000-a000-000000000001', 1,
     'organizations/00000000-0000-4000-a000-000000000001/evidence/00000000-0000-4000-a000-000000000112/00000000-0000-4000-a000-000000000212',
     'demo-extra-hash-112-ir-playbook',
     8192, 'application/pdf', 'manual/1',
     NOW() - INTERVAL '10 days'),
    ('00000000-0000-4000-a000-000000000213',
     '00000000-0000-4000-a000-000000000113',
     '00000000-0000-4000-a000-000000000001', 1,
     'organizations/00000000-0000-4000-a000-000000000001/evidence/00000000-0000-4000-a000-000000000113/00000000-0000-4000-a000-000000000213',
     'demo-extra-hash-113-github-branch-protection',
     2048, 'application/json', 'github/1',
     NOW() - INTERVAL '1 hour'),
    ('00000000-0000-4000-a000-000000000214',
     '00000000-0000-4000-a000-000000000114',
     '00000000-0000-4000-a000-000000000001', 1,
     'organizations/00000000-0000-4000-a000-000000000001/evidence/00000000-0000-4000-a000-000000000114/00000000-0000-4000-a000-000000000214',
     'demo-extra-hash-114-rds-backup-schedule',
     1536, 'application/json', 'aws-collector/1',
     NOW() - INTERVAL '6 days'),
    ('00000000-0000-4000-a000-000000000215',
     '00000000-0000-4000-a000-000000000115',
     '00000000-0000-4000-a000-000000000001', 1,
     'organizations/00000000-0000-4000-a000-000000000001/evidence/00000000-0000-4000-a000-000000000115/00000000-0000-4000-a000-000000000215',
     'demo-extra-hash-115-onboarding-checklist',
     2560, 'application/pdf', 'manual/1',
     NOW() - INTERVAL '7 days');

-- -----------------------------------------------------------------------------
-- 2. Mappings for the six extras.
-- -----------------------------------------------------------------------------

INSERT INTO evidence_control_mappings (id, organization_id, evidence_id,
                                       control_id, mapping_type, classification,
                                       confidence, reason, created_by)
SELECT '00000000-0000-4000-a000-000000000310'::uuid,
       '00000000-0000-4000-a000-000000000001'::uuid,
       '00000000-0000-4000-a000-000000000110'::uuid,
       (SELECT id FROM controls WHERE code = 'CC6.6'),
       'HUMAN_CONFIRMED', 'COVERED', 1.000,
       'Reviewer confirmed: MFA policy screenshot and Okta config export show enforcement.',
       '00000000-0000-4000-a000-000000000011'::uuid;

INSERT INTO evidence_control_mappings (id, organization_id, evidence_id,
                                       control_id, mapping_type, classification,
                                       confidence, reason, created_by)
SELECT '00000000-0000-4000-a000-000000000311'::uuid,
       '00000000-0000-4000-a000-000000000001'::uuid,
       '00000000-0000-4000-a000-000000000111'::uuid,
       (SELECT id FROM controls WHERE code = 'CC7.1'),
       'AI_SUGGESTED', 'PARTIAL', 0.680,
       'CloudTrail config present but log integrity monitoring/alerts not evidenced.',
       NULL;

INSERT INTO evidence_control_mappings (id, organization_id, evidence_id,
                                       control_id, mapping_type, classification,
                                       confidence, reason, created_by)
SELECT '00000000-0000-4000-a000-000000000312'::uuid,
       '00000000-0000-4000-a000-000000000001'::uuid,
       '00000000-0000-4000-a000-000000000112'::uuid,
       (SELECT id FROM controls WHERE code = 'CC7.2'),
       'HUMAN_CONFIRMED', 'COVERED', 1.000,
       'Reviewer confirmed: IR playbook covers detection through post-mortem.',
       '00000000-0000-4000-a000-000000000011'::uuid;

INSERT INTO evidence_control_mappings (id, organization_id, evidence_id,
                                       control_id, mapping_type, classification,
                                       confidence, reason, created_by)
SELECT '00000000-0000-4000-a000-000000000313'::uuid,
       '00000000-0000-4000-a000-000000000001'::uuid,
       '00000000-0000-4000-a000-000000000113'::uuid,
       (SELECT id FROM controls WHERE code = 'CC8.1'),
       'HUMAN_CONFIRMED', 'COVERED', 0.950,
       'Branch protection on default branch requires PR reviews and passing checks.',
       '00000000-0000-4000-a000-000000000011'::uuid;

INSERT INTO evidence_control_mappings (id, organization_id, evidence_id,
                                       control_id, mapping_type, classification,
                                       confidence, reason, created_by)
SELECT '00000000-0000-4000-a000-000000000314'::uuid,
       '00000000-0000-4000-a000-000000000001'::uuid,
       '00000000-0000-4000-a000-000000000114'::uuid,
       (SELECT id FROM controls WHERE code = 'A1.2'),
       'AI_SUGGESTED', 'PARTIAL', 0.740,
       'Backup schedule is documented; restore test results not yet supplied.',
       NULL;

INSERT INTO evidence_control_mappings (id, organization_id, evidence_id,
                                       control_id, mapping_type, classification,
                                       confidence, reason, created_by)
SELECT '00000000-0000-4000-a000-000000000315'::uuid,
       '00000000-0000-4000-a000-000000000001'::uuid,
       '00000000-0000-4000-a000-000000000115'::uuid,
       (SELECT id FROM controls WHERE code = 'CC6.2'),
       'AI_SUGGESTED', 'PARTIAL', 0.700,
       'Provisioning checklist present; de-provisioning evidence would strengthen this.',
       NULL;

-- -----------------------------------------------------------------------------
-- 3. Fake GitHub integration + one completed collection run.
--    credential_reference is NULL — the app tolerates this for demo purposes.
-- -----------------------------------------------------------------------------

INSERT INTO integrations (id, organization_id, provider, status, display_name,
                          configuration, credential_reference,
                          last_tested_at, last_test_message, last_collection_at,
                          schedule, created_by)
VALUES ('00000000-0000-4000-a000-000000000500',
        '00000000-0000-4000-a000-000000000001',
        'GITHUB', 'CONNECTED', 'GitHub (demo)',
        '{"mode":"PAT","note":"seeded demo integration - not a real GitHub token"}'::jsonb,
        NULL,
        NOW() - INTERVAL '30 minutes',
        'Connected as demo-corp-acme',
        NOW() - INTERVAL '1 hour',
        'MANUAL',
        '00000000-0000-4000-a000-000000000010');

INSERT INTO collection_runs (id, organization_id, integration_id, status,
                             started_at, completed_at, triggered_by)
VALUES ('00000000-0000-4000-a000-000000000600',
        '00000000-0000-4000-a000-000000000001',
        '00000000-0000-4000-a000-000000000500',
        'COMPLETED',
        NOW() - INTERVAL '1 hour 5 minutes',
        NOW() - INTERVAL '1 hour',
        '00000000-0000-4000-a000-000000000010');

INSERT INTO collection_items (organization_id, run_id, evidence_type, status,
                              message, evidence_id)
VALUES
    ('00000000-0000-4000-a000-000000000001',
     '00000000-0000-4000-a000-000000000600',
     'GITHUB_ACCOUNT', 'SUCCESS', NULL, NULL),
    ('00000000-0000-4000-a000-000000000001',
     '00000000-0000-4000-a000-000000000600',
     'GITHUB_REPOSITORY_INVENTORY', 'SUCCESS', NULL, NULL),
    ('00000000-0000-4000-a000-000000000001',
     '00000000-0000-4000-a000-000000000600',
     'GITHUB_BRANCH_PROTECTION', 'SUCCESS', NULL,
     '00000000-0000-4000-a000-000000000113');

-- -----------------------------------------------------------------------------
-- 4. AI analyses so the AI panel shows recent activity.
-- -----------------------------------------------------------------------------

INSERT INTO ai_analysis (id, organization_id, evidence_id, control_id,
                         provider, model, prompt_version, classification,
                         confidence, reason, result)
SELECT '00000000-0000-4000-a000-000000000700'::uuid,
       '00000000-0000-4000-a000-000000000001'::uuid,
       '00000000-0000-4000-a000-000000000111'::uuid,
       (SELECT id FROM controls WHERE code = 'CC7.1'),
       'stub', 'stub-1', 'evidence-mapping/v1',
       'PARTIAL', 0.680,
       'CloudTrail config present but log integrity monitoring/alerts not evidenced.',
       '{"supported":["Trail active in multi-region"],"missing":["Log integrity","Real-time alerts"]}'::jsonb;

INSERT INTO ai_analysis (id, organization_id, evidence_id, control_id,
                         provider, model, prompt_version, classification,
                         confidence, reason, result)
SELECT '00000000-0000-4000-a000-000000000701'::uuid,
       '00000000-0000-4000-a000-000000000001'::uuid,
       '00000000-0000-4000-a000-000000000114'::uuid,
       (SELECT id FROM controls WHERE code = 'A1.2'),
       'stub', 'stub-1', 'evidence-mapping/v1',
       'PARTIAL', 0.740,
       'Backup schedule is documented; restore test results not yet supplied.',
       '{"supported":["Daily automated snapshots"],"missing":["Documented restore test"]}'::jsonb;

-- -----------------------------------------------------------------------------
-- 5. Audit trail for the extras.
-- -----------------------------------------------------------------------------

INSERT INTO audit_events (organization_id, actor_user_id, event_type,
                          entity_type, entity_id, metadata) VALUES
    ('00000000-0000-4000-a000-000000000001',
     '00000000-0000-4000-a000-000000000010',
     'INTEGRATION_CREATED', 'integration',
     '00000000-0000-4000-a000-000000000500',
     '{"seed":true,"provider":"GITHUB","mode":"PAT"}'),
    ('00000000-0000-4000-a000-000000000001',
     '00000000-0000-4000-a000-000000000010',
     'INTEGRATION_CONNECTED', 'integration',
     '00000000-0000-4000-a000-000000000500', '{"seed":true}'),
    ('00000000-0000-4000-a000-000000000001',
     '00000000-0000-4000-a000-000000000010',
     'COLLECTION_STARTED', 'collection_run',
     '00000000-0000-4000-a000-000000000600', '{"seed":true}'),
    ('00000000-0000-4000-a000-000000000001',
     '00000000-0000-4000-a000-000000000010',
     'COLLECTION_COMPLETED', 'collection_run',
     '00000000-0000-4000-a000-000000000600',
     '{"seed":true,"itemsOk":3,"itemsFailed":0}'),
    ('00000000-0000-4000-a000-000000000001',
     '00000000-0000-4000-a000-000000000010',
     'AI_ANALYSIS_CREATED', 'evidence',
     '00000000-0000-4000-a000-000000000111', '{"seed":true}'),
    ('00000000-0000-4000-a000-000000000001',
     '00000000-0000-4000-a000-000000000010',
     'AI_ANALYSIS_CREATED', 'evidence',
     '00000000-0000-4000-a000-000000000114', '{"seed":true}');

COMMIT;

-- =============================================================================
-- After running demo.sql AND demo-extra.sql, the dashboard should show:
--   COVERED       4  (CC6.3, CC6.6, CC7.2, CC8.1)
--   PARTIAL       3  (CC7.1, A1.2, CC6.2)
--   NEEDS_REVIEW  1  (CC6.1 — still the AI-suggested one from demo.sql)
--   MISSING       7  (the rest)
--   coverage    ~37%
-- =============================================================================

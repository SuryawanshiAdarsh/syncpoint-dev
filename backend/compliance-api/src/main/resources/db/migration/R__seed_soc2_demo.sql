-- Repeatable seed for the SOC 2 demo framework (PROJECT_SPEC §11, PROJECT_SPEC2 §26).
--
-- The wording below is a DEMO summary paraphrased in plain English so this repo
-- does not reproduce authoritative/licensed compliance material. Real customer
-- deployments must obtain and load appropriately licensed framework content.

INSERT INTO frameworks (code, name, version, active)
VALUES ('SOC2', 'SOC 2 Trust Services Criteria (DEMO)', '2022', TRUE)
ON CONFLICT (code) DO UPDATE
    SET name = EXCLUDED.name,
        version = EXCLUDED.version,
        active = EXCLUDED.active;

WITH fw AS (SELECT id FROM frameworks WHERE code = 'SOC2')
INSERT INTO controls (framework_id, code, title, description, category, active)
SELECT fw.id, c.code, c.title, c.description, c.category, TRUE
FROM fw,
     (VALUES
         ('CC6.1', 'Logical Access Controls',
          'Restrict logical access to information assets so that only authorized users can access production systems and data.',
          'Access Control'),
         ('CC6.2', 'Access Provisioning and De-provisioning',
          'Establish a process for granting, modifying, and revoking user access based on documented approval.',
          'Access Control'),
         ('CC6.3', 'Periodic Access Review',
          'Perform periodic review of user access rights to production systems and remove access no longer required.',
          'Access Control'),
         ('CC6.6', 'Multi-Factor Authentication',
          'Require multi-factor authentication for privileged and remote access to production systems.',
          'Authentication'),
         ('CC6.7', 'Encryption in Transit and at Rest',
          'Protect data using encryption in transit and at rest across production systems and backups.',
          'Data Protection'),
         ('CC7.1', 'System Monitoring',
          'Monitor system activity, security events, and anomalies to detect and respond to potential incidents.',
          'Security Monitoring'),
         ('CC7.2', 'Incident Response',
          'Maintain and follow an incident response process that includes detection, escalation, containment, and post-incident review.',
          'Incident Management'),
         ('CC8.1', 'Change Management',
          'Manage changes to production systems through a documented process with peer review and approval.',
          'Change Management'),
         ('CC8.2', 'Segregation of Environments',
          'Keep production separate from development and testing environments; restrict production access accordingly.',
          'Change Management'),
         ('CC9.1', 'Risk Management',
          'Identify, assess, and treat risks that could impact the achievement of the entity''s objectives.',
          'Risk Management'),
         ('CC9.2', 'Vendor Risk Management',
          'Assess and monitor risks arising from vendors that support production systems or process customer data.',
          'Vendor Management'),
         ('A1.1', 'Availability Monitoring',
          'Monitor system availability and capacity to meet the entity''s availability commitments.',
          'Availability'),
         ('A1.2', 'Backup and Recovery',
          'Maintain backups and periodically test recovery procedures for production systems.',
          'Availability'),
         ('C1.1', 'Confidentiality Classification',
          'Classify data by confidentiality and apply protections consistent with that classification.',
          'Data Protection'),
         ('P1.1', 'Privacy Notice',
          'Provide notice to individuals about how their personal information is collected, used, and shared.',
          'Data Protection')
     ) AS c(code, title, description, category)
ON CONFLICT (framework_id, code) DO UPDATE
    SET title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        active = EXCLUDED.active;

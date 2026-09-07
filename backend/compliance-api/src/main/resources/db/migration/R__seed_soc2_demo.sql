-- Repeatable seed for the SOC 2 demo framework (PROJECT_SPEC §11, PROJECT_SPEC2 §26).
--
-- The wording below is a DEMO summary paraphrased in plain English so this repo
-- does not reproduce authoritative/licensed compliance material. Real customer
-- deployments must obtain and load appropriately licensed framework content.
--
-- Coverage: the full 33-criterion Common Criteria (Security, CC1-CC9 -- mandatory
-- for every SOC 2 report) plus the two most commonly bundled optional categories,
-- Availability (A1.1-A1.3) and Confidentiality (C1.1-C1.2) -- 38 controls total,
-- correctly numbered and categorized against the real AICPA 2017/2022 Trust
-- Services Criteria structure. Processing Integrity (PI1) and Privacy (P1-P8,
-- 18 criteria) are deliberately out of scope for this seed -- see
-- dev-guide/SOC2-READINESS-BACKLOG.md item #1.
--
-- Two prior demo-only entries have been removed as part of this pass:
--   - CC8.2 ("Segregation of Environments") was a fabricated code -- the real
--     AICPA Change Management category has only one criterion, CC8.1.
--   - P1.1 ("Privacy Notice") was a single fragment of the 18-criterion Privacy
--     category and misleading on its own; Privacy is deferred in full, not
--     partially seeded.

INSERT INTO frameworks (code, name, version, active)
VALUES ('SOC2', 'SOC 2 Trust Services Criteria', '2022', TRUE)
ON CONFLICT (code) DO UPDATE
    SET name = EXCLUDED.name,
        version = EXCLUDED.version,
        active = EXCLUDED.active;

WITH fw AS (SELECT id FROM frameworks WHERE code = 'SOC2')
INSERT INTO controls (framework_id, code, title, description, category, active)
SELECT fw.id, c.code, c.title, c.description, c.category, TRUE
FROM fw,
     (VALUES
         -- CC1 -- Control Environment
         ('CC1.1', 'Integrity and Ethical Values',
          'Demonstrate a commitment to integrity and ethical values through a documented code of conduct that is communicated to personnel and enforced through consistent action.',
          'Control Environment'),
         ('CC1.2', 'Board Independence and Oversight',
          'Maintain a board of directors, or equivalent oversight body, that is independent from management and exercises oversight of the design and performance of internal controls.',
          'Control Environment'),
         ('CC1.3', 'Organizational Structure and Reporting Lines',
          'Establish organizational structures, reporting lines, and clear authorities and responsibilities in pursuit of the entity''s objectives.',
          'Control Environment'),
         ('CC1.4', 'Commitment to Competence',
          'Demonstrate a commitment to attract, develop, and retain competent individuals aligned with objectives, including onboarding and role-based training.',
          'Control Environment'),
         ('CC1.5', 'Accountability for Internal Control',
          'Hold individuals accountable for their internal control responsibilities through performance evaluation and corrective action where necessary.',
          'Control Environment'),

         -- CC2 -- Communication and Information
         ('CC2.1', 'Quality of Internal Information',
          'Obtain or generate, and use, relevant and quality information to support the functioning of internal control.',
          'Communication and Information'),
         ('CC2.2', 'Internal Communication',
          'Internally communicate information, including objectives and responsibilities for internal control, necessary to support the functioning of internal control.',
          'Communication and Information'),
         ('CC2.3', 'External Communication',
          'Communicate with external parties, including customers and regulators, regarding matters affecting the functioning of internal control.',
          'Communication and Information'),

         -- CC3 -- Risk Assessment
         ('CC3.1', 'Objectives Clarity',
          'Specify objectives with sufficient clarity to enable identification and assessment of risks relating to those objectives.',
          'Risk Assessment'),
         ('CC3.2', 'Risk Identification and Analysis',
          'Identify risks to the achievement of objectives across the entity and analyze risks as a basis for determining how they should be managed.',
          'Risk Assessment'),
         ('CC3.3', 'Fraud Risk Consideration',
          'Consider the potential for fraud, including incentive, opportunity, and rationalization, when assessing risks to the achievement of objectives.',
          'Risk Assessment'),
         ('CC3.4', 'Change Impact Assessment',
          'Identify and assess changes in the business, systems, or environment that could significantly impact the system of internal control.',
          'Risk Assessment'),

         -- CC4 -- Monitoring Activities
         ('CC4.1', 'Ongoing and Separate Evaluations',
          'Select, develop, and perform ongoing and/or separate evaluations to ascertain whether the components of internal control are present and functioning.',
          'Monitoring Activities'),
         ('CC4.2', 'Communication of Deficiencies',
          'Evaluate and communicate internal control deficiencies in a timely manner to the parties responsible for taking corrective action.',
          'Monitoring Activities'),

         -- CC5 -- Control Activities
         ('CC5.1', 'Selection of Control Activities',
          'Select and develop control activities that contribute to mitigating risks to the achievement of objectives to an acceptable level.',
          'Control Activities'),
         ('CC5.2', 'Technology General Controls',
          'Select and develop general control activities over technology to support the achievement of objectives.',
          'Control Activities'),
         ('CC5.3', 'Policies and Procedures',
          'Deploy control activities through documented policies that establish what is expected and procedures that put policies into action.',
          'Control Activities'),

         -- CC6 -- Logical and Physical Access Controls
         ('CC6.1', 'Logical Access Security',
          'Implement logical access security software, infrastructure, and architectures over protected information assets to protect them from security events.',
          'Logical and Physical Access Controls'),
         ('CC6.2', 'New Access Registration',
          'Prior to issuing system credentials and granting access, register and authorize new internal and external users whose access is administered by the entity.',
          'Logical and Physical Access Controls'),
         ('CC6.3', 'Access Role Modification and Review',
          'Authorize, modify, or remove access to data, software, functions, and other protected information assets based on roles and responsibilities, and periodically review such access.',
          'Logical and Physical Access Controls'),
         ('CC6.4', 'Physical Access Restriction',
          'Restrict physical access to facilities and protected information assets to authorized personnel.',
          'Logical and Physical Access Controls'),
         ('CC6.5', 'Decommissioning of Assets',
          'Discontinue logical and physical protections over information assets only after the ability to read or recover the data has been diminished, when assets are decommissioned.',
          'Logical and Physical Access Controls'),
         ('CC6.6', 'External Threat Protection',
          'Implement logical access security measures, including multi-factor authentication and encryption, to protect against threats from sources outside system boundaries.',
          'Logical and Physical Access Controls'),
         ('CC6.7', 'Restricted Data Transmission',
          'Restrict the transmission, movement, and removal of information to authorized internal and external users and processes.',
          'Logical and Physical Access Controls'),
         ('CC6.8', 'Malicious Software Prevention',
          'Implement controls to prevent, or detect and act upon, the introduction of unauthorized or malicious software.',
          'Logical and Physical Access Controls'),

         -- CC7 -- System Operations
         ('CC7.1', 'Detection and Monitoring',
          'Use detection and monitoring procedures to identify changes to configurations and anomalies indicative of malicious acts, natural disasters, or errors.',
          'System Operations'),
         ('CC7.2', 'System Anomaly Monitoring',
          'Monitor system components and the operation of controls to detect anomalies indicative of malicious acts, natural disasters, or errors.',
          'System Operations'),
         ('CC7.3', 'Security Event Evaluation',
          'Evaluate security events to determine whether they could or did result in a failure to meet objectives, and take action to prevent or address such failures.',
          'System Operations'),
         ('CC7.4', 'Incident Response Execution',
          'Respond to identified security incidents by executing a defined incident response program to understand, contain, remediate, and communicate incidents.',
          'System Operations'),
         ('CC7.5', 'Incident Recovery',
          'Identify, develop, and implement activities to recover from identified security incidents.',
          'System Operations'),

         -- CC8 -- Change Management
         ('CC8.1', 'Change Management',
          'Authorize, design, develop or acquire, configure, document, test, approve, and implement changes to infrastructure, data, software, and procedures through a documented process with peer review.',
          'Change Management'),

         -- CC9 -- Risk Mitigation
         ('CC9.1', 'Business Disruption Risk Mitigation',
          'Identify, select, and develop risk mitigation activities for risks arising from potential business disruptions.',
          'Risk Mitigation'),
         ('CC9.2', 'Vendor and Business Partner Risk Management',
          'Assess and manage risks associated with vendors and business partners that support operations and objectives.',
          'Risk Mitigation'),

         -- A1 -- Availability (optional, commonly bundled with Security)
         ('A1.1', 'Capacity Monitoring',
          'Maintain, monitor, and evaluate current processing capacity and use of system components to manage capacity demand and enable additional capacity as needed.',
          'Availability'),
         ('A1.2', 'Environmental Protections and Recovery Infrastructure',
          'Authorize, design, implement, operate, maintain, and monitor environmental protections, backup, and recovery infrastructure to meet availability commitments.',
          'Availability'),
         ('A1.3', 'Recovery Plan Testing',
          'Test recovery plan procedures for system recovery to support availability commitments.',
          'Availability'),

         -- C1 -- Confidentiality (optional, commonly bundled with Security)
         ('C1.1', 'Confidential Information Identification',
          'Identify and maintain confidential information to meet confidentiality commitments and requirements.',
          'Confidentiality'),
         ('C1.2', 'Confidential Information Disposal',
          'Dispose of confidential information to meet confidentiality commitments and requirements.',
          'Confidentiality')
     ) AS c(code, title, description, category)
ON CONFLICT (framework_id, code) DO UPDATE
    SET title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        active = EXCLUDED.active;

-- Remove the two fabricated/incomplete demo-only entries from prior seed
-- passes so a reseed on an existing database converges to the corrected
-- catalog above. Safe no-op if they were never inserted.
WITH fw AS (SELECT id FROM frameworks WHERE code = 'SOC2')
DELETE FROM controls
USING fw
WHERE controls.framework_id = fw.id
  AND controls.code IN ('CC8.2', 'P1.1');


CREATE TABLE policy_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(64) NOT NULL UNIQUE,
    sort_order  INT NOT NULL DEFAULT 0
);

-- Standard policy categories aligned with the AICPA Trust Services Criteria
-- (Security, Availability, Processing Integrity, Confidentiality, Privacy)
-- plus the operational policy domains auditors commonly expect evidence for.
INSERT INTO policy_categories (name, sort_order) VALUES
    ('Information Security', 10),
    ('Access Control', 20),
    ('Acceptable Use', 30),
    ('Asset Management', 40),
    ('Business Continuity & Disaster Recovery', 50),
    ('Change Management', 60),
    ('Confidentiality', 70),
    ('Cryptography & Key Management', 80),
    ('Data Retention & Disposal', 90),
    ('Human Resources & Personnel Security', 100),
    ('Incident Response', 110),
    ('Network Security', 120),
    ('Password Policy', 130),
    ('Physical & Environmental Security', 140),
    ('Privacy', 150),
    ('Processing Integrity', 160),
    ('Risk Assessment', 170),
    ('Vendor & Third-Party Risk Management', 180),
    ('Vulnerability Management', 190),
    ('Availability', 200);

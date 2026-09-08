-- Type II auditors specifically look for a CUEC section distinct from the subservice-org
-- narrative, and for a "significant changes during the period" disclosure.
ALTER TABLE organizations ADD COLUMN complementary_user_entity_controls TEXT;
ALTER TABLE organizations ADD COLUMN significant_changes_during_period TEXT;

-- An org can revoke its own PENDING request (to immediately submit a different one instead of
-- waiting for admin review) -- widen the status check constraint to allow CANCELED.

ALTER TABLE subscription_requests
    DROP CONSTRAINT subscription_requests_status_check;

ALTER TABLE subscription_requests
    ADD CONSTRAINT subscription_requests_status_check
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELED'));

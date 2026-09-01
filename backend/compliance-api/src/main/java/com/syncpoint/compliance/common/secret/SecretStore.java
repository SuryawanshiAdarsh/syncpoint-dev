package com.syncpoint.compliance.common.secret;

import java.util.UUID;

/** Storage for provider credentials (OAuth tokens, PATs, API keys). */
public interface SecretStore {

    /** Persist a secret bound to an org and return an opaque reference id. */
    UUID write(UUID organizationId, String label, byte[] plaintext);

    /** Fetch and decrypt a secret by reference id. */
    byte[] read(UUID reference);

    /** Delete a secret by reference id. */
    void delete(UUID reference);
}

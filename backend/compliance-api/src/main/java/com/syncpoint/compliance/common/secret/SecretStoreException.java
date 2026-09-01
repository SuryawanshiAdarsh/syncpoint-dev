package com.syncpoint.compliance.common.secret;

public class SecretStoreException extends RuntimeException {
    public SecretStoreException(String message) { super(message); }
    public SecretStoreException(String message, Throwable cause) { super(message, cause); }
}

package com.syncpoint.compliance.storage;

public class ObjectStorageException extends RuntimeException {
    public ObjectStorageException(String message, Throwable cause) { super(message, cause); }
    public ObjectStorageException(String message) { super(message); }
}

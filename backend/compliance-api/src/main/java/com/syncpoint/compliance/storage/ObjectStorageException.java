package com.syncpoint.compliance.storage;

import com.syncpoint.compliance.common.exception.ApiException;
import org.springframework.http.HttpStatus;

public class ObjectStorageException extends ApiException {
    public ObjectStorageException(String message, Throwable cause) {
        super(HttpStatus.BAD_GATEWAY, "STORAGE_ERROR", message, cause);
    }
    public ObjectStorageException(String message) {
        super(HttpStatus.BAD_GATEWAY, "STORAGE_ERROR", message);
    }
}

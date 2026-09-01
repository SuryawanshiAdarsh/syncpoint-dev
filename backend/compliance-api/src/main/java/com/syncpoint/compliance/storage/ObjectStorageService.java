package com.syncpoint.compliance.storage;

import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

/** Thin wrapper over MinIO S3 API scoped to the evidence bucket. */
@Service
public class ObjectStorageService {

    private static final Logger log = LoggerFactory.getLogger(ObjectStorageService.class);

    private final MinioClient client;
    private final String bucket;

    public ObjectStorageService(@Value("${syncpoint.storage.endpoint}") String endpoint,
                                @Value("${syncpoint.storage.access-key}") String accessKey,
                                @Value("${syncpoint.storage.secret-key}") String secretKey,
                                @Value("${syncpoint.storage.bucket}") String bucket) {
        this.client = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
        this.bucket = bucket;
    }

    @PostConstruct
    void ensureBucket() {
        try {
            boolean exists = client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                log.info("created object storage bucket: {}", bucket);
            }
        } catch (Exception e) {
            log.warn("object storage bucket check failed (continuing, will retry on first upload): {}", e.getMessage());
        }
    }

    /** Generate a tenant-scoped storage key (spec V2 §58). */
    public String buildKey(UUID organizationId, UUID evidenceId, UUID versionId) {
        return "organizations/" + organizationId + "/evidence/" + evidenceId + "/" + versionId;
    }

    public void put(String key, byte[] content, String contentType) {
        try (InputStream in = new ByteArrayInputStream(content)) {
            client.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(key)
                    .stream(in, content.length, -1)
                    .contentType(contentType == null ? "application/octet-stream" : contentType)
                    .build());
        } catch (Exception e) {
            throw new ObjectStorageException("object put failed: " + key, e);
        }
    }

    public byte[] get(String key) {
        try (InputStream in = client.getObject(GetObjectArgs.builder()
                .bucket(bucket).object(key).build())) {
            return in.readAllBytes();
        } catch (IOException e) {
            throw new ObjectStorageException("object read failed: " + key, e);
        } catch (Exception e) {
            throw new ObjectStorageException("object get failed: " + key, e);
        }
    }

    public void delete(String key) {
        try {
            client.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(key).build());
        } catch (Exception e) {
            throw new ObjectStorageException("object delete failed: " + key, e);
        }
    }
}

package com.syncpoint.compliance.common.secret;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SecretRecordRepository extends JpaRepository<SecretRecord, UUID> {
}

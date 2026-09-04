package com.syncpoint.compliance.auth.repository;

import com.syncpoint.compliance.auth.entity.AuthToken;
import com.syncpoint.compliance.auth.entity.TokenPurpose;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AuthTokenRepository extends JpaRepository<AuthToken, UUID> {
    Optional<AuthToken> findByTokenHash(String tokenHash);
    List<AuthToken> findByUserIdAndPurpose(UUID userId, TokenPurpose purpose);
}

package com.syncpoint.compliance.collection.repository;

import com.syncpoint.compliance.collection.entity.CollectionItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CollectionItemRepository extends JpaRepository<CollectionItem, UUID> {
    List<CollectionItem> findByRunIdOrderByCreatedAt(UUID runId);
}

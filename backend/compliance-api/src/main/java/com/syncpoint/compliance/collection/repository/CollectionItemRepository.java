package com.syncpoint.compliance.collection.repository;

import com.syncpoint.compliance.collection.entity.CollectionItem;
import com.syncpoint.compliance.collection.entity.CollectionItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface CollectionItemRepository extends JpaRepository<CollectionItem, UUID> {
    List<CollectionItem> findByRunIdOrderByCreatedAt(UUID runId);

    /** One item-status tally row per (run, status) — batched so a run *list* never does N+1 queries. */
    interface StatusTally {
        UUID getRunId();
        CollectionItemStatus getStatus();
        long getTotal();
    }

    @Query("SELECT ci.runId AS runId, ci.status AS status, COUNT(ci) AS total "
            + "FROM CollectionItem ci WHERE ci.runId IN :runIds GROUP BY ci.runId, ci.status")
    List<StatusTally> tallyByRunIds(@Param("runIds") Collection<UUID> runIds);
}

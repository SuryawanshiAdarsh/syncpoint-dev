package com.syncpoint.compliance.compliance.repository;

import com.syncpoint.compliance.compliance.dto.ControlStatus;
import com.syncpoint.compliance.compliance.entity.ControlStatusSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ControlStatusSnapshotRepository extends JpaRepository<ControlStatusSnapshot, UUID> {

    boolean existsByOrganizationIdAndSnapshotDate(UUID organizationId, LocalDate snapshotDate);

    /** One (day, status) tally row — batched so the trend endpoint never does N+1 queries. */
    interface DailyStatusTally {
        LocalDate getSnapshotDate();
        ControlStatus getStatus();
        long getTotal();
    }

    @Query("SELECT s.snapshotDate AS snapshotDate, s.status AS status, COUNT(s) AS total "
            + "FROM ControlStatusSnapshot s "
            + "WHERE s.organizationId = :orgId AND s.snapshotDate >= :since "
            + "GROUP BY s.snapshotDate, s.status ORDER BY s.snapshotDate")
    List<DailyStatusTally> tallyByOrganizationIdSince(@Param("orgId") UUID orgId, @Param("since") LocalDate since);
}

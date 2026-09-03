package com.syncpoint.compliance.collection.controller;

import com.syncpoint.compliance.collection.dto.CollectionItemResponse;
import com.syncpoint.compliance.collection.dto.CollectionRunResponse;
import com.syncpoint.compliance.collection.entity.CollectionItem;
import com.syncpoint.compliance.collection.entity.CollectionItemStatus;
import com.syncpoint.compliance.collection.entity.CollectionRun;
import com.syncpoint.compliance.collection.repository.CollectionItemRepository;
import com.syncpoint.compliance.collection.repository.CollectionRunRepository;
import com.syncpoint.compliance.common.exception.NotFoundException;
import com.syncpoint.compliance.common.tenant.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/collections")
public class CollectionController {

    private final CollectionRunRepository runs;
    private final CollectionItemRepository items;

    public CollectionController(CollectionRunRepository runs, CollectionItemRepository items) {
        this.runs = runs;
        this.items = items;
    }

    @GetMapping
    public ResponseEntity<List<CollectionRunResponse>> list(
            @RequestParam(value = "integrationId", required = false) UUID integrationId) {
        UUID orgId = TenantContext.require().organizationId();
        List<CollectionRun> list = integrationId == null
                ? runs.findByOrganizationIdOrderByCreatedAtDesc(orgId)
                : runs.findByOrganizationIdAndIntegrationIdOrderByCreatedAtDesc(orgId, integrationId);

        Map<UUID, long[]> tallyByRun = tally(list.stream().map(CollectionRun::getId).toList());
        return ResponseEntity.ok(list.stream().map(r -> toRun(r, tallyByRun)).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable UUID id) {
        UUID orgId = TenantContext.require().organizationId();
        CollectionRun run = runs.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new NotFoundException("Collection run not found"));
        List<CollectionItemResponse> itemDtos = items.findByRunIdOrderByCreatedAt(run.getId()).stream()
                .map(this::toItem).toList();
        Map<UUID, long[]> tallyByRun = tally(List.of(run.getId()));
        return ResponseEntity.ok(Map.of("run", toRun(run, tallyByRun), "items", itemDtos));
    }

    /** One batched query for however many runs are being rendered — never N+1 per row. */
    private Map<UUID, long[]> tally(List<UUID> runIds) {
        if (runIds.isEmpty()) return Map.of();
        Map<UUID, long[]> byRun = new java.util.HashMap<>();
        for (CollectionItemRepository.StatusTally t : items.tallyByRunIds(runIds)) {
            long[] counts = byRun.computeIfAbsent(t.getRunId(), k -> new long[2]); // [ok, failed]
            if (t.getStatus() == CollectionItemStatus.SUCCESS) counts[0] += t.getTotal();
            else if (t.getStatus() == CollectionItemStatus.FAILED) counts[1] += t.getTotal();
        }
        return byRun;
    }

    private CollectionRunResponse toRun(CollectionRun r, Map<UUID, long[]> tallyByRun) {
        long[] counts = tallyByRun.getOrDefault(r.getId(), new long[2]);
        long ok = counts[0];
        long failed = counts[1];
        Long durationMs = (r.getStartedAt() != null && r.getCompletedAt() != null)
                ? Duration.between(r.getStartedAt(), r.getCompletedAt()).toMillis()
                : null;
        return new CollectionRunResponse(r.getId(), r.getIntegrationId(), r.getStatus(), r.getTrigger(),
                r.getStartedAt(), r.getCompletedAt(), r.getErrorMessage(), r.getCreatedAt(),
                ok, failed, ok + failed, durationMs);
    }

    private CollectionItemResponse toItem(CollectionItem i) {
        return new CollectionItemResponse(i.getId(), i.getEvidenceType(), i.getStatus(),
                i.getMessage(), i.getEvidenceId(), i.getCreatedAt());
    }
}

package com.syncpoint.compliance.collection.controller;

import com.syncpoint.compliance.collection.dto.CollectionItemResponse;
import com.syncpoint.compliance.collection.dto.CollectionRunResponse;
import com.syncpoint.compliance.collection.entity.CollectionItem;
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
        return ResponseEntity.ok(list.stream().map(this::toRun).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable UUID id) {
        UUID orgId = TenantContext.require().organizationId();
        CollectionRun run = runs.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new NotFoundException("Collection run not found"));
        List<CollectionItemResponse> itemDtos = items.findByRunIdOrderByCreatedAt(run.getId()).stream()
                .map(this::toItem).toList();
        return ResponseEntity.ok(Map.of("run", toRun(run), "items", itemDtos));
    }

    private CollectionRunResponse toRun(CollectionRun r) {
        return new CollectionRunResponse(r.getId(), r.getIntegrationId(), r.getStatus(),
                r.getStartedAt(), r.getCompletedAt(), r.getErrorMessage(), r.getCreatedAt());
    }

    private CollectionItemResponse toItem(CollectionItem i) {
        return new CollectionItemResponse(i.getId(), i.getEvidenceType(), i.getStatus(),
                i.getMessage(), i.getEvidenceId(), i.getCreatedAt());
    }
}

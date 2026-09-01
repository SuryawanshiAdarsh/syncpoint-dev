package com.syncpoint.compliance.integrations.connector;

import com.syncpoint.compliance.common.exception.ApiException;
import com.syncpoint.compliance.integrations.entity.IntegrationProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class CollectorRegistry {

    private final Map<IntegrationProvider, EvidenceCollector> byProvider = new EnumMap<>(IntegrationProvider.class);

    public CollectorRegistry(List<EvidenceCollector> collectors) {
        for (EvidenceCollector c : collectors) {
            byProvider.put(c.getProvider(), c);
        }
    }

    public EvidenceCollector require(IntegrationProvider provider) {
        return Optional.ofNullable(byProvider.get(provider))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_IMPLEMENTED, "PROVIDER_UNAVAILABLE",
                        "Connector not implemented for provider: " + provider));
    }

    public boolean has(IntegrationProvider provider) {
        return byProvider.containsKey(provider);
    }
}

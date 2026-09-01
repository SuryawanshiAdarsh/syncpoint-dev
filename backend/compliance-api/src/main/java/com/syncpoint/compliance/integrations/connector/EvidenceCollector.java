package com.syncpoint.compliance.integrations.connector;

import com.syncpoint.compliance.integrations.entity.IntegrationProvider;

import java.util.List;

/**
 * Generic collector abstraction (PROJECT_SPEC §13, PROJECT_SPEC2 §15).
 * The evidence service depends on this — not on any provider-specific API.
 */
public interface EvidenceCollector {

    IntegrationProvider getProvider();

    /** Verify credentials/configuration; must never throw for expected errors. */
    TestResult test(TestContext context);

    /** Collect evidence items. Long-running work belongs here. */
    List<CollectedItem> collect(CollectionContext context);
}

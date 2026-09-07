package com.syncpoint.compliance.policy.service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Canonical policy-title -> SOC 2 control suggestions, mirroring the industry-standard mapping
 * published by compliance platforms (e.g. Drata's "Policies to Framework Summary") for the ~12
 * standard policy types. Matched by keyword against the policy TITLE, not category (category is
 * free text an admin can type anything into, so it can't reliably identify the policy's type).
 */
public final class PolicyControlSuggestions {

    /** CC5.3 "Policies and Procedures" applies to any published policy, regardless of type. */
    private static final String UNIVERSAL_CODE = "CC5.3";

    private static final Map<String, List<String>> BY_TITLE_KEYWORD = Map.ofEntries(
            Map.entry("information security", List.of("CC1.1", "CC2.2")),
            Map.entry("access control", List.of("CC6.1", "CC6.2", "CC6.3", "CC6.4")),
            Map.entry("incident response", List.of("CC7.3", "CC7.4", "CC7.5")),
            Map.entry("change management", List.of("CC3.4", "CC8.1")),
            Map.entry("vendor", List.of("CC9.2")),
            Map.entry("third-party", List.of("CC9.2")),
            Map.entry("third party", List.of("CC9.2")),
            Map.entry("data retention", List.of("CC6.5", "C1.2")),
            Map.entry("disposal", List.of("CC6.5", "C1.2")),
            Map.entry("business continuity", List.of("A1.2", "A1.3")),
            Map.entry("disaster recovery", List.of("A1.2", "A1.3")),
            Map.entry("acceptable use", List.of("CC6.1", "CC6.6", "CC6.8")),
            Map.entry("risk assessment", List.of("CC3.1", "CC3.2", "CC3.3", "CC3.4")),
            Map.entry("onboarding", List.of("CC1.4", "CC6.2", "CC6.3")),
            Map.entry("offboarding", List.of("CC1.4", "CC6.2", "CC6.3")),
            Map.entry("hr security", List.of("CC1.4", "CC6.2", "CC6.3")),
            Map.entry("asset management", List.of("CC6.4", "CC6.5")),
            Map.entry("password", List.of("CC6.1", "CC6.7")),
            Map.entry("cryptography", List.of("CC6.1", "CC6.7"))
    );

    private PolicyControlSuggestions() {
    }

    public static Set<String> suggestedCodesFor(String title) {
        Set<String> codes = new LinkedHashSet<>();
        codes.add(UNIVERSAL_CODE);
        if (title != null) {
            String lower = title.toLowerCase(Locale.ROOT);
            for (Map.Entry<String, List<String>> entry : BY_TITLE_KEYWORD.entrySet()) {
                if (lower.contains(entry.getKey())) {
                    codes.addAll(entry.getValue());
                }
            }
        }
        return codes;
    }
}

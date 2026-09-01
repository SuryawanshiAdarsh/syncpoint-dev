package com.syncpoint.compliance.integrations.connector;

public record TestResult(
        boolean ok,
        String message
) {
    public static TestResult ok(String message) { return new TestResult(true, message); }
    public static TestResult fail(String message) { return new TestResult(false, message); }
}

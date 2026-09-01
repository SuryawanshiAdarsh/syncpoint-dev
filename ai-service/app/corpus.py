"""Small SOC 2 knowledge corpus for the RAG demo.

These paraphrased summaries are intentionally short and generic so this repo
does not reproduce authoritative/licensed compliance material. Real production
deployments must source appropriately licensed framework content.
"""
from __future__ import annotations

from typing import List, Dict


DEMO_DOCUMENTS: List[Dict] = [
    {
        "name": "soc2-overview",
        "section": "overview",
        "framework": "SOC2",
        "framework_version": "2022",
        "source": "syncpoint/demo-corpus",
        "body": (
            "SOC 2 evaluates a service organization's controls relevant to the "
            "trust services criteria: security, availability, processing "
            "integrity, confidentiality, and privacy. It is not a certification "
            "of compliance; it is an audit conducted by a licensed CPA firm. "
            "Evidence typically includes system descriptions, control policies, "
            "operational artifacts, and third-party attestations. Reviewers "
            "expect current evidence, documented change management, and "
            "periodic access reviews. This product helps collect and organize "
            "that evidence — it does not determine the outcome of any audit."
        ),
    },
    {
        "name": "access-control-guidance",
        "section": "CC6.1 CC6.2 CC6.3",
        "framework": "SOC2",
        "framework_version": "2022",
        "control_code": "CC6.1",
        "source": "syncpoint/demo-corpus",
        "body": (
            "Logical access controls restrict who can reach production systems "
            "and data. Common evidence includes IAM user lists, role assignments, "
            "provisioning approvals, and periodic access reviews. A periodic "
            "review typically runs quarterly and produces a signed report "
            "confirming that access is appropriate. Automated exports from an "
            "identity provider can act as raw evidence, but reviewers expect "
            "documented approval of any exceptions and prompt removal of access "
            "for terminated personnel. Evidence of periodic review usually "
            "includes: (a) list of users in scope, (b) reviewer signatures or "
            "approvals, (c) actions taken (revoke, adjust) with dates."
        ),
    },
    {
        "name": "mfa-guidance",
        "section": "CC6.6",
        "framework": "SOC2",
        "framework_version": "2022",
        "control_code": "CC6.6",
        "source": "syncpoint/demo-corpus",
        "body": (
            "Multi-factor authentication should be enforced for privileged and "
            "remote access to production. Evidence commonly includes IdP MFA "
            "configuration screenshots or exports, the list of users enrolled, "
            "the enforcement policy applied to admin groups, and exception logs. "
            "Time-based OTP or hardware keys are preferred over SMS. Auditors "
            "look for both configuration evidence and demonstrated enforcement, "
            "e.g. sample login events showing MFA challenge."
        ),
    },
    {
        "name": "change-management-guidance",
        "section": "CC8.1 CC8.2",
        "framework": "SOC2",
        "framework_version": "2022",
        "control_code": "CC8.1",
        "source": "syncpoint/demo-corpus",
        "body": (
            "Change management controls verify that changes to production are "
            "reviewed and approved. Common evidence includes pull request "
            "history with mandatory code reviewers, branch protection settings "
            "requiring approvals and passing checks, ticketing links tying "
            "changes to tracked work, and deployment logs. Environments should "
            "be segregated: developers should not deploy directly to production "
            "without documented approval. Evidence should demonstrate that peer "
            "review occurred, that automated checks passed, and that emergency "
            "changes followed a documented exception process."
        ),
    },
    {
        "name": "monitoring-and-incident-guidance",
        "section": "CC7.1 CC7.2",
        "framework": "SOC2",
        "framework_version": "2022",
        "control_code": "CC7.1",
        "source": "syncpoint/demo-corpus",
        "body": (
            "Security monitoring provides visibility into system activity so "
            "anomalies can be detected. Evidence includes log-collection scope, "
            "alerting rules, on-call rotation, and sample alerts with "
            "resolution notes. Incident response evidence typically includes a "
            "documented plan with severity classifications, communication "
            "protocols, and post-incident review documents. A single incident "
            "log entry is not sufficient — reviewers expect the full lifecycle: "
            "detection, containment, remediation, and root-cause review."
        ),
    },
    {
        "name": "availability-guidance",
        "section": "A1.1 A1.2",
        "framework": "SOC2",
        "framework_version": "2022",
        "control_code": "A1.1",
        "source": "syncpoint/demo-corpus",
        "body": (
            "Availability controls demonstrate that the service meets its "
            "availability commitments. Evidence includes SLO/SLA definitions, "
            "monitoring dashboards, incident history, backup schedules, and "
            "restore test results. A backup schedule alone is insufficient — "
            "auditors expect proof that restores actually work, typically a "
            "documented restore test performed at least annually with "
            "verification of data integrity."
        ),
    },
    {
        "name": "data-protection-guidance",
        "section": "CC6.7 C1.1",
        "framework": "SOC2",
        "framework_version": "2022",
        "control_code": "CC6.7",
        "source": "syncpoint/demo-corpus",
        "body": (
            "Data protection controls verify that data is encrypted in transit "
            "and at rest and that confidentiality classifications are applied. "
            "Evidence includes TLS configuration for all customer-facing "
            "endpoints, database encryption settings (KMS keys, at-rest "
            "encryption), object storage encryption, and a documented data "
            "classification policy. Auditors expect evidence tying the "
            "classification policy to actual system behavior — for example, "
            "S3 bucket policies that enforce the labelling scheme."
        ),
    },
    {
        "name": "vendor-and-risk-guidance",
        "section": "CC9.1 CC9.2",
        "framework": "SOC2",
        "framework_version": "2022",
        "control_code": "CC9.2",
        "source": "syncpoint/demo-corpus",
        "body": (
            "Vendor risk management demonstrates that critical vendors have "
            "been assessed and are periodically reviewed. Evidence includes a "
            "vendor inventory with classification (critical vs. non-critical), "
            "signed data-processing agreements or DPAs, third-party SOC 2 "
            "reports or equivalent attestations, and evidence of periodic "
            "review (e.g. annual). Risk management evidence includes a "
            "documented risk register with treatments, owners, and target dates."
        ),
    },
]

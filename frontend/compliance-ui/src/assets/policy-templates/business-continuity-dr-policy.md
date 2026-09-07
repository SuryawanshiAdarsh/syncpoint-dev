# Business Continuity & Disaster Recovery Policy

> **Starting template.** Customize this document to reflect your organization's actual
> practices before adopting it as policy. This is not legal advice.

## Purpose
Establishes how the organization prepares for, responds to, and recovers from events that
disrupt normal business operations or availability of critical systems.

## Scope
Applies to all systems and processes required to deliver the organization's core product/
service.

## Policy

1. **Business impact analysis.** Critical systems and processes are identified along with
   target Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO).
2. **Backups.** Critical data is backed up on a defined schedule, encrypted, and stored
   separately from production systems (e.g. a different region/provider).
3. **Backup testing.** Backup restoration is tested at least annually to confirm data can
   actually be recovered within the target RPO/RTO.
4. **Redundancy.** Critical infrastructure uses redundant components (e.g. multi-AZ
   deployment) proportionate to the availability requirements of the service.
5. **DR plan.** A documented disaster recovery plan describes roles, responsibilities, and
   steps to restore service after a major outage.
6. **Plan testing.** The DR plan is tested (e.g. via tabletop or simulated failover) at least
   annually, with findings tracked to remediation.
7. **Communication plan.** A plan exists for communicating with customers and stakeholders
   during an extended outage.

## Enforcement
Failure to maintain tested backups or a current DR plan for critical systems is a policy
violation.

## Ownership
Owner: _[assign an accountable owner, e.g. Head of Engineering/Infrastructure]_
Review cadence: _[e.g. annually]_

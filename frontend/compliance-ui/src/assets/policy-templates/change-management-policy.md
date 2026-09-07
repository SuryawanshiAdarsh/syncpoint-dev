# Change Management Policy

> **Starting template.** Customize this document to reflect your organization's actual
> practices before adopting it as policy. This is not legal advice.

## Purpose
Defines how changes to production systems, infrastructure, and applications are proposed,
reviewed, tested, approved, and deployed to minimize risk of unintended impact.

## Scope
Applies to all changes to production code, infrastructure configuration, and systems that
process company or customer data.

## Policy

1. **Change proposal.** All production changes are tracked (e.g. via pull request or change
   ticket) describing what is changing and why.
2. **Peer review.** Code and configuration changes require review and approval by at least
   one person other than the author before merge/deployment.
3. **Testing.** Changes are tested in a non-production environment before being promoted to
   production, proportionate to the risk of the change.
4. **Automated pipeline.** Where possible, changes are deployed through an automated,
   auditable CI/CD pipeline rather than manual production access.
5. **Emergency changes.** Emergency/hotfix changes may bypass standard review timelines but
   must still be peer-reviewed (retroactively if necessary) and documented.
6. **Rollback plan.** Higher-risk changes have a documented rollback or mitigation plan before
   deployment.
7. **Segregation of duties.** Where feasible, the person deploying a change is not the sole
   approver of that change.

## Enforcement
Unauthorized or unreviewed changes to production systems may result in disciplinary action.

## Ownership
Owner: _[assign an accountable owner, e.g. Head of Engineering]_
Review cadence: _[e.g. annually]_

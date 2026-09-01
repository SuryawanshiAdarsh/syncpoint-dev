# AI Compliance Evidence Collector — PROJECT_SPEC2

## Purpose

This is the **V2 authoritative specification** for the existing codebase.

The original `PROJECT_SPEC.md` has already been implemented by an AI coding agent. **Do not rebuild the application from scratch.** Inspect the existing code and extend/fix it to satisfy this specification.

The MVP is a multi-tenant B2B SaaS for **automated SOC 2 evidence collection, evidence mapping, AI-assisted gap analysis, human review, and audit-package export**.

The product must never claim that a customer is SOC 2 compliant or certified.

---

# 1. Product Goal

A customer should be able to:

1. Sign up.
2. Create an organization.
3. Select SOC 2.
4. Connect company systems.
5. Test integrations.
6. Automatically collect evidence.
7. Upload manual evidence.
8. Store evidence securely.
9. Map evidence to controls.
10. Analyze evidence with AI/RAG.
11. Review AI recommendations.
12. Monitor evidence freshness.
13. Identify evidence gaps.
14. Export an audit-ready evidence package.

Core positioning:

> Automated SOC 2 evidence collection and evidence intelligence.

Do not position it as an autonomous compliance/certification system.

---

# 2. Critical V2 Addition: Real Client Integration

The product must support this complete customer journey:

```text
Customer
   |
   v
Sign Up
   |
   v
Create Organization
   |
   v
Onboarding Wizard
   |
   +-------------------------------+
   |               |               |
   v               v               v
 GitHub           AWS             Jira
 OAuth/App       IAM Role         OAuth
   |               |               |
   +---------------+---------------+
                   |
                   v
          Integration Connection
                   |
                   v
            Test Connection
                   |
                   v
        Run Evidence Collection
                   |
                   v
             Evidence Store
                   |
                   v
              AI / RAG
                   |
                   v
          Human Review
                   |
                   v
          Evidence Dashboard
                   |
                   v
          Audit Package Export
```

This is a core MVP flow.

---

# 3. Existing-Codebase Rules

Before changing anything, the coding agent MUST:

- Read `PROJECT_SPEC.md`.
- Read `PROJECT_SPEC2.md`.
- Inspect the complete repository.
- Reuse existing working implementations.
- Avoid duplicate classes/entities/services/endpoints.
- Avoid unnecessary rewrites.
- Preserve the current architecture unless it prevents compliance with this specification.
- Identify gaps before implementing them.

Do not blindly recreate modules that already exist.

---

# 4. Technology Stack

## Frontend

- Angular
- TypeScript
- Angular Material
- RxJS
- Reactive Forms
- HTTP interceptors
- Route guards
- NgRx only where genuinely useful

## Backend

- Java 21
- Spring Boot 3.x
- Spring Security
- JWT
- Spring Data JPA
- Hibernate
- PostgreSQL
- Flyway
- Bean Validation
- Maven
- OpenAPI/Swagger

## AI

- Python 3.12+
- FastAPI
- Pydantic
- httpx
- Qdrant client
- Provider-independent LLM abstraction
- Provider-independent embedding abstraction

## Infrastructure

- Docker
- Docker Compose
- PostgreSQL
- Redis
- Qdrant
- MinIO

Production can later use:

```text
PostgreSQL -> AWS RDS
MinIO      -> AWS S3
Redis      -> ElastiCache
Qdrant     -> Managed Qdrant
```

---

# 5. Repository Structure

Target structure:

```text
ai-compliance-evidence/
|
├── README.md
├── PROJECT_SPEC.md
├── PROJECT_SPEC2.md
├── .gitignore
├── .env.example
├── docker-compose.yml
├── Makefile
|
├── docs/
│   ├── architecture/
│   │   ├── system-architecture.md
│   │   ├── customer-onboarding.md
│   │   ├── integration-architecture.md
│   │   ├── evidence-data-flow.md
│   │   └── security.md
│   ├── api/
│   │   └── api-overview.md
│   └── compliance/
│       ├── soc2-controls.md
│       └── evidence-model.md
|
├── frontend/
│   └── compliance-ui/
|
├── backend/
│   └── compliance-api/
|
├── ai-service/
|
├── database/
│   ├── migrations/
│   └── seed/
|
└── infrastructure/
```

If the existing structure is equivalent and clean, do not restructure it only for cosmetic reasons.

---

# 6. System Architecture

```text
                         CUSTOMER
                            |
                            v
                       Angular UI
                            |
                            v
                    Spring Boot API
                            |
       +--------------------+--------------------+
       |                    |                    |
       v                    v                    v
 Authentication       Evidence Service      Integration Service
 Tenant/RBAC                |                    |
                            |          +---------+---------+
                            |          |         |         |
                            |        GitHub     AWS      Jira
                            |          |         |         |
                            +----------+---------+---------+
                                       |
                                       v
                                Evidence Storage
                              +--------+--------+
                              |                 |
                              v                 v
                         PostgreSQL           MinIO/S3
                              |
                              v
                         Python AI Service
                              |
                    +---------+---------+
                    |                   |
                    v                   v
                   RAG                 LLM
                    |
                    v
                  Qdrant

                    +-------------------------+
                    | Redis / Background Jobs |
                    +-------------------------+
```

---

# 7. Customer Signup

Customer enters:

```text
Name
Email
Password
Company Name
```

After successful registration:

```text
User
  |
  v
Organization
  |
  v
OWNER membership
```

The first user becomes `OWNER`.

---

# 8. Onboarding Wizard

Required flow:

### Screen 1

```text
Welcome to Compliance Evidence

Let's configure your organization.
```

### Screen 2

```text
Select Framework

[ SOC 2 ]
```

Only SOC 2 is required for MVP.

### Screen 3

```text
Connect your systems

GitHub       [Connect]
AWS          [Connect]
Jira         [Connect]
Google       [Connect]
```

Priority:

```text
GitHub -> AWS -> Jira -> Google
```

### Screen 4

```text
Run your first evidence collection

[ Collect Evidence ]
```

### Screen 5

Show initial coverage:

```text
Covered
Partial
Missing
Needs Review
```

---

# 9. Integration Model

Each integration is a first-class resource.

Conceptual fields:

```text
id
organization_id
provider
status
configuration
credential_reference
last_tested_at
last_collection_at
created_at
updated_at
```

Statuses:

```text
PENDING
CONNECTED
ERROR
DISCONNECTED
```

Never store raw provider credentials in plain text.

---

# 10. Integration Lifecycle

```text
CREATE
  |
  v
AUTHORIZE
  |
  v
STORE SECURE CREDENTIAL REFERENCE
  |
  v
TEST CONNECTION
  |
  v
CONNECTED
  |
  v
COLLECT
  |
  v
STORE EVIDENCE
  |
  v
REFRESH
  |
  v
DISCONNECT / REVOKE
```

Errors must be user-friendly.

Never expose raw provider errors containing credentials.

---

# 11. GitHub Integration

Use GitHub App installation or OAuth as appropriate.

Do not request a GitHub password.

Flow:

```text
Customer
   |
   v
Connect GitHub
   |
   v
GitHub authorization
   |
   v
Callback
   |
   v
Spring Boot
   |
   v
Secure credential reference
   |
   v
GitHubEvidenceCollector
   |
   v
Evidence
```

Initial evidence:

```text
Organization members
Repository list
Repository visibility
Repository access/collaborators
Branch protection where available
Relevant security settings where permitted
```

---

# 12. AWS Integration

Use an AWS cross-account IAM Role.

Never require AWS root credentials.

Conceptual flow:

```text
Your SaaS
   |
   v
AWS STS AssumeRole
   |
   v
Customer AWS Account
   |
   v
Read-only compliance permissions
   |
   v
Evidence Collector
```

Initial evidence:

```text
IAM users
IAM roles
MFA-related status where available
Privileged/admin permissions
Access key metadata
CloudTrail status/configuration where available
```

Use least-privilege permissions.

---

# 13. Jira Integration

Use OAuth where appropriate.

Initial evidence:

```text
Projects
Change-related issues
Issue status
Approvals where available
Selected project configuration
```

Customer must be able to select which Jira project supplies change-management evidence.

---

# 14. Google Workspace Integration

Use OAuth.

Initial evidence:

```text
Users
Groups
Admin status where permitted
2-step verification status where permitted
```

Lower priority than GitHub/AWS.

---

# 15. Generic Connector Interface

Core service must depend on an abstraction similar to:

```java
public interface EvidenceCollector {

    String getProvider();

    String getEvidenceType();

    CollectionResult collect(CollectionContext context);
}
```

Implementations:

```text
GitHubEvidenceCollector
AwsEvidenceCollector
JiraEvidenceCollector
GoogleWorkspaceEvidenceCollector
```

The evidence service must not contain provider-specific API calls.

---

# 16. Connection Testing

Endpoint:

```text
POST /api/v1/integrations/{id}/test
```

Example:

```json
{
  "status": "CONNECTED",
  "provider": "GITHUB",
  "message": "Connection successful",
  "testedAt": "2026-08-31T10:00:00Z"
}
```

Never return secrets.

---

# 17. Disconnect

On disconnect:

1. Stop future collection.
2. Revoke provider access where supported.
3. Disable/remove credential reference.
4. Record audit event.
5. Preserve historical evidence unless retention/deletion rules require otherwise.

---

# 18. Scheduled Evidence Collection

Support:

```text
Manual
Daily
Weekly
```

Architecture:

```text
Scheduler
   |
   v
Collection Job
   |
   v
Integration
   |
   v
Collector
   |
   v
Normalize
   |
   v
Persist Evidence
   |
   v
AI Analysis
   |
   v
Update Coverage
```

Long-running work must not block normal HTTP requests.

---

# 19. Collection Runs

Tables/resources:

```text
collection_runs
collection_items
```

Collection run:

```text
id
organization_id
integration_id
status
started_at
completed_at
error_message
```

Statuses:

```text
QUEUED
RUNNING
COMPLETED
PARTIAL
FAILED
```

---

# 20. Retry Behavior

Retry transient errors:

```text
temporary network errors
provider temporary failures
safe rate-limit responses
```

Do not repeatedly retry:

```text
invalid credentials
permission denied
invalid configuration
```

Use bounded retries and exponential backoff where appropriate.

---

# 21. Evidence Model

Evidence represents a factual artifact collected from a provider or uploaded manually.

Example:

```json
{
  "id": "EV-10291",
  "source": "AWS",
  "type": "IAM_USER_LIST",
  "collectedAt": "2026-08-31T10:00:00Z",
  "contentHash": "sha256...",
  "status": "COLLECTED"
}
```

Evidence metadata belongs in PostgreSQL.

Files belong in MinIO/S3.

---

# 22. Evidence Immutability

Collected evidence should be treated as immutable.

New collection:

```text
Evidence V1
     |
     v
Evidence V2
```

Do not silently overwrite historical evidence.

Track:

```text
content_hash
collected_at
source
collector_version
```

---

# 23. Evidence Freshness

Track:

```text
collected_at
expires_at
```

Display:

```text
CURRENT
EXPIRING
EXPIRED
```

---

# 24. Manual Evidence Upload

Allowed initial formats:

```text
PDF
CSV
JSON
TXT
DOCX
XLSX
```

Requirements:

- File size limit
- MIME validation
- Extension validation
- Generated storage key
- Malware scanning abstraction
- Tenant authorization
- No executable files
- No user-controlled filesystem paths

---

# 25. Evidence Storage

Local:

```text
MinIO
```

Production:

```text
AWS S3
```

Store:

```text
Evidence files
Raw provider payloads where appropriate
Generated audit packages
```

Never store evidence files in Git.

---

# 26. SOC 2 Controls

MVP should include a representative development/demo subset.

Categories can cover:

```text
Access Control
Logical Access
Authentication
Change Management
Security Monitoring
Incident Management
Risk Management
Vendor Management
Availability
Data Protection
```

Do not reproduce authoritative/licensed compliance material without appropriate rights.

Production framework content must come from appropriate authoritative/licensed sources.

---

# 27. Control Status

Use:

```text
COVERED
PARTIAL
MISSING
NEEDS_REVIEW
```

These represent product evidence-readiness states, not legal compliance determinations.

---

# 28. Evidence-Control Mapping

Mapping entity:

```text
evidence_id
control_id
organization_id
mapping_type
confidence
reason
created_by
created_at
```

Types:

```text
AI_SUGGESTED
HUMAN_CONFIRMED
HUMAN_REJECTED
```

AI suggestions must remain editable.

---

# 29. AI Service

FastAPI endpoints:

```text
GET  /health
POST /extract
POST /classify
POST /map-evidence
POST /analyze-gap
POST /rag/query
```

Modules:

```text
llm/
rag/
ingestion/
services/
api/
models/
core/
```

---

# 30. LLM Abstraction

Use a provider interface similar to:

```python
class LLMProvider:
    async def generate_structured(self, prompt, schema):
        ...
```

Provider selection must come from configuration.

Do not make business logic dependent on one provider.

---

# 31. Embedding Abstraction

Use an interface similar to:

```python
class EmbeddingProvider:
    async def embed(self, texts):
        ...
```

The application should not be tightly coupled to one embedding vendor.

---

# 32. RAG Pipeline

```text
Compliance Documents
       |
       v
Parser
       |
       v
Chunker
       |
       v
Embeddings
       |
       v
Qdrant
```

Query:

```text
Question / Control
       |
       v
Embedding
       |
       v
Vector Search
       |
       v
Top-K Chunks
       |
       v
Context Builder
       |
       v
LLM
       |
       v
Structured Result
```

---

# 33. RAG Metadata

Each chunk should include:

```text
framework
framework_version
control_code
document_name
section
page
source
```

This allows traceability and filtering.

---

# 34. Initial Chunking

Starting values:

```text
500–800 tokens
50–100 token overlap
```

These are experiments, not permanent values.

Do not optimize advanced retrieval before the basic pipeline works.

---

# 35. AI Evidence Mapping

Input:

```text
Control
+
Evidence
+
Retrieved compliance context
```

Output:

```json
{
  "classification": "PARTIAL",
  "confidence": 0.86,
  "reason": "Evidence demonstrates current access assignments but does not demonstrate periodic access review.",
  "supported_requirements": [
    "Current user access"
  ],
  "missing_requirements": [
    "Periodic access review"
  ],
  "recommended_action": "Provide the latest approved access review record."
}
```

Allowed classifications:

```text
COVERED
PARTIAL
INSUFFICIENT
```

Never output:

```text
COMPLIANT
CERTIFIED
NON_COMPLIANT
```

---

# 36. AI vs Deterministic Logic

Deterministic code/API data:

```text
User exists
MFA enabled
Repository public/private
Admin permission
IAM role
Timestamp
Evidence hash
Collection status
```

AI:

```text
Document interpretation
Evidence classification
Control mapping suggestion
Gap explanation
Natural-language summary
Query understanding
```

Never ask the LLM to determine a factual value that the source API directly provides.

---

# 37. AI Guardrails

The AI system must:

1. Never invent evidence.
2. Never fabricate citations.
3. Never claim certification.
4. State when evidence is insufficient.
5. Use supplied/retrieved context.
6. Return validated structured output.
7. Store model/provider information.
8. Store prompt version.
9. Require human review for final mapping.
10. Avoid sending unnecessary sensitive data to external LLMs.

---

# 38. Prompt Versioning

Store:

```text
provider
model
prompt_version
created_at
```

Example:

```text
evidence-mapping-v1
```

Any production prompt change creates a new version.

---

# 39. Human Review

Reviewer sees:

```text
Control: CC6.1

AI Classification: PARTIAL
AI Confidence: 86%

Reason:
...

Supported:
✓ Current access assignments

Missing:
✕ Periodic access review

[ Confirm ]
[ Reject ]
[ Add Comment ]
```

Human result:

```text
HUMAN_CONFIRMED
```

or:

```text
HUMAN_REJECTED
```

---

# 40. Knowledge / Evidence Gap Detection

Example:

```text
Control:
CC6.3

Status:
Partial

Missing:
Quarterly access review evidence
```

Show:

```text
Evidence Gap

No evidence demonstrating quarterly access review was found.

Recommended:
Upload the latest approved access review.
```

This is a recommendation, not a compliance judgment.

---

# 41. Dashboard

Main dashboard:

```text
SOC 2 Evidence Readiness

Overall Evidence Coverage
78%

Covered       42
Partial       11
Missing       19
Needs Review   6
```

Additional sections:

```text
Recent Evidence
Integration Health
Expiring Evidence
Recent Gaps
Collection Runs
```

---

# 42. Required Frontend Screens

```text
/login
/register
/onboarding
/dashboard
/controls
/controls/:id
/evidence
/evidence/:id
/integrations
/integrations/:provider
/reviews
/audit-package
/settings
/settings/members
```

---

# 43. Integration UI

Example:

```text
Integrations

GitHub
Status: Connected
Last collection: 2 hours ago

[Test Connection]
[Collect Now]
[Disconnect]
```

AWS:

```text
AWS
Status: Not Connected

[Connect AWS]
```

Show setup instructions for the cross-account IAM role.

---

# 44. Evidence UI

Display:

```text
Name
Source
Control
Status
Collected
Freshness
Review
```

Filters:

```text
Source
Control
Status
Date
Freshness
```

---

# 45. Collection UI

Show background status:

```text
Collection Run #1024

GitHub
  Organization members      ✓
  Repository access         ✓
  Branch protection         ✓

AWS
  IAM users                 ✓
  MFA                       ✓
  Privileged permissions    ⚠
```

---

# 46. Integration Error UX

Do not expose technical exceptions.

Bad:

```text
NullPointerException
```

Good:

```text
GitHub connection failed.

The authorization is missing required permissions.

Reconnect GitHub and grant the requested organization permissions.
```

Detailed information belongs in internal logs.

---

# 47. Database Model

Core tables:

```text
organizations
users
organization_members
frameworks
control_categories
controls
integrations
integration_credentials
evidence
evidence_versions
evidence_control_mappings
evidence_reviews
collection_runs
collection_items
ai_analysis
ai_recommendations
audit_events
export_jobs
```

Every tenant-owned table must contain or securely inherit:

```text
organization_id
```

Use UUID primary keys.

---

# 48. Suggested Integration Fields

```text
id UUID
organization_id UUID
provider VARCHAR
status VARCHAR
configuration JSONB
credential_reference VARCHAR
last_tested_at TIMESTAMP
last_collection_at TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP
```

Do not put raw secrets in `configuration`.

---

# 49. AI Analysis Fields

```text
id UUID
organization_id UUID
evidence_id UUID
control_id UUID
provider VARCHAR
model VARCHAR
prompt_version VARCHAR
classification VARCHAR
confidence DECIMAL
reason TEXT
result JSONB
created_at TIMESTAMP
```

---

# 50. Multi-Tenancy

Required flow:

```text
JWT
 |
 v
Authenticated User
 |
 v
Organization Membership
 |
 v
Tenant Context
 |
 v
Service
 |
 v
Repository
 |
 v
organization_id filtering
```

Never trust a client-supplied organization ID.

A user in Organization A must never access Organization B.

Test cross-tenant access explicitly.

---

# 51. Roles

```text
OWNER
ADMIN
REVIEWER
VIEWER
```

OWNER:
- Full organization access
- Manage users
- Manage integrations
- Manage evidence
- Review
- Export

ADMIN:
- Integrations
- Evidence
- Review
- Export

REVIEWER:
- Controls
- Evidence
- Mapping
- Review

VIEWER:
- Read-only

---

# 52. API

Base path:

```text
/api/v1
```

Authentication:

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
GET  /auth/me
```

Organizations:

```text
GET   /organizations/current
PATCH /organizations/current
GET   /organizations/current/members
POST  /organizations/current/members
PATCH /organizations/current/members/{id}
```

Frameworks:

```text
GET /frameworks
GET /frameworks/{id}
GET /frameworks/{id}/controls
```

Controls:

```text
GET /controls
GET /controls/{id}
GET /controls/{id}/evidence
```

Evidence:

```text
GET    /evidence
POST   /evidence/upload
GET    /evidence/{id}
DELETE /evidence/{id}
POST   /evidence/{id}/review
POST   /evidence/{id}/analyze
POST   /evidence/{id}/map
```

Integrations:

```text
GET    /integrations
POST   /integrations/github
POST   /integrations/aws
POST   /integrations/jira
POST   /integrations/google
GET    /integrations/{id}
POST   /integrations/{id}/test
POST   /integrations/{id}/collect
DELETE /integrations/{id}
```

Collections:

```text
GET /collections
GET /collections/{id}
```

Dashboard:

```text
GET /dashboard/summary
GET /dashboard/gaps
GET /dashboard/recent-evidence
```

Exports:

```text
POST /exports/audit-package
GET  /exports/{id}
```

---

# 53. API Rules

Use:

- DTOs, not entities, in API responses.
- Validation annotations.
- Pagination.
- UUIDs.
- ISO-8601 timestamps.
- Global exception handling.
- OpenAPI.
- Consistent error responses.

Example:

```json
{
  "timestamp": "2026-08-31T10:00:00Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Invalid request",
  "path": "/api/v1/evidence"
}
```

---

# 54. Background Jobs

Use Redis-backed jobs or equivalent existing infrastructure.

Long-running operations:

```text
Evidence collection
AI analysis
RAG ingestion
Audit package generation
```

must run asynchronously.

---

# 55. Audit Logging

Log:

```text
LOGIN
LOGOUT
USER_CREATED
USER_ROLE_CHANGED
INTEGRATION_CREATED
INTEGRATION_TESTED
INTEGRATION_DISCONNECTED
COLLECTION_STARTED
COLLECTION_COMPLETED
COLLECTION_FAILED
EVIDENCE_CREATED
EVIDENCE_REVIEWED
EVIDENCE_MAPPED
AI_ANALYSIS_CREATED
EXPORT_CREATED
```

Never log:

```text
passwords
JWTs
OAuth tokens
AWS secrets
API keys
raw sensitive evidence
```

---

# 56. Security Requirements

Minimum:

- Password hashing with BCrypt/Argon2.
- JWT expiration.
- Authorization on protected endpoints.
- Tenant isolation.
- Least-privilege integrations.
- Secure credential storage.
- No secrets in logs.
- Input validation.
- File validation.
- File size limits.
- Malware scanning abstraction.
- HTTPS in production.
- Encryption at rest in production.
- Encryption in transit.
- Restricted CORS.
- Rate limiting where appropriate.

---

# 57. AI Security

Protect against:

```text
Prompt injection
Indirect prompt injection
RAG poisoning
Sensitive data leakage
Tool abuse
Excessive agency
Malicious documents
```

Rules:

- Treat retrieved documents as untrusted content.
- Retrieved content must never override system instructions.
- Separate instructions from retrieved context.
- Do not give LLM unrestricted tools.
- Validate all structured outputs.
- Never execute arbitrary model output.
- Keep integration permissions scoped.
- Require human approval for consequential mappings.

---

# 58. Object Storage Security

Use generated keys.

Do not use user-controlled filesystem paths.

Preferred pattern:

```text
organizations/{organizationId}/evidence/{evidenceId}/{versionId}
```

Apply access checks before generating download URLs.

---

# 59. Docker Compose

Local services:

```text
frontend
backend
ai-service
postgres
redis
qdrant
minio
```

Ports:

```text
Angular      4200
Spring Boot  8080
FastAPI      8000
Postgres     5432
Redis        6379
Qdrant       6333
MinIO API    9000
MinIO UI     9001
```

All configuration through environment variables.

---

# 60. Environment

`.env.example`:

```text
POSTGRES_DB=compliance
POSTGRES_USER=compliance
POSTGRES_PASSWORD=change-me

JWT_SECRET=change-me

REDIS_URL=redis://redis:6379
QDRANT_URL=http://qdrant:6333

S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minio
S3_SECRET_KEY=change-me
S3_BUCKET=evidence

AI_SERVICE_URL=http://ai-service:8000

LLM_PROVIDER=openai
LLM_API_KEY=
LLM_MODEL=
EMBEDDING_MODEL=
```

Never commit `.env`.

---

# 61. Testing

## Backend

Test:

```text
Authentication
Authorization
Tenant isolation
Evidence CRUD
Mapping
Review
Connector abstraction
Collection jobs
Export
```

Use Testcontainers where practical.

## Connectors

Mock provider APIs.

Never use live customer credentials in CI.

## AI

Test:

```text
Structured output
Invalid model output
Missing evidence
Unsupported claims
Prompt injection
Retrieval relevance
Control mapping
```

## Frontend

Test:

```text
Login
Route guards
Onboarding
Integration status
Evidence upload
Dashboard
Review workflow
```

---

# 62. Seed Data

Development environment:

```text
1 demo organization
1 owner
1 reviewer
10–15 representative SOC 2 demo controls
sample evidence
sample mappings
sample collection runs
```

Clearly label demo content.

Never use real customer data.

---

# 63. Audit Package

Customer clicks:

```text
Export Audit Package
```

Create an asynchronous export job.

Output:

```text
soc2-evidence-package/
|
├── index.csv
├── controls/
│   ├── CC6.1/
│   │   ├── evidence.json
│   │   └── evidence-files/
│   └── ...
├── audit-log.json
└── README.txt
```

Include:

```text
Evidence ID
Control
Source
Collection timestamp
Review status
Mapping
Evidence hash
```

Do not include secrets.

---

# 64. End-to-End Customer Acceptance Test

The application must eventually support:

```text
1. Register
2. Create organization
3. Select SOC 2
4. Connect GitHub
5. Authorize GitHub
6. Test connection
7. Collect evidence
8. View collection run
9. Evidence appears
10. AI analysis runs
11. Control mapping appears
12. Human review
13. Dashboard updates
14. Export audit package
```

This is the primary MVP demo.

---

# 65. Development Priority for Existing Code

Do not automatically follow the old implementation order. Use this priority when fixing gaps.

## P0 — Runability

```text
Docker Compose
Database
Migrations
Backend
Frontend
AI service
Environment configuration
```

## P1 — Security foundation

```text
Authentication
JWT
Tenant isolation
RBAC
Credential handling
```

## P2 — Core evidence workflow

```text
Controls
Evidence upload
Storage
Mapping
Review
Audit log
```

## P3 — Client onboarding

```text
Organization
Framework selection
Onboarding UI
Integration UI
Connection testing
```

## P4 — GitHub

```text
OAuth/App
Collector
Collection run
Evidence creation
```

## P5 — AI

```text
LLM abstraction
Structured output
Evidence analysis
Gap analysis
```

## P6 — RAG

```text
Parsing
Chunking
Embeddings
Qdrant
Retrieval
Context construction
```

## P7 — AWS

```text
Cross-account IAM Role
Collector
Evidence
```

## P8 — Jira

```text
OAuth
Collector
Evidence
```

## P9 — Dashboard and Export

```text
Coverage
Gaps
Freshness
Audit package
```

## P10 — Hardening

```text
Security testing
Tenant tests
AI evaluation
Failure handling
Observability
Performance
```

---

# 66. Definition of Done

A feature is complete only when:

- Code compiles.
- Tests pass.
- Database migration exists if schema changed.
- Authorization exists.
- Tenant isolation is verified.
- Errors are handled.
- Loading states exist.
- API is documented.
- No secrets are committed.
- No sensitive data is logged.
- Docker environment works.
- Relevant documentation is updated.

---

# 67. Copilot / Opus Rules

When modifying this existing codebase:

1. Read both specification files.
2. Inspect before creating files.
3. Reuse existing code.
4. Do not duplicate modules.
5. Do not change architecture unnecessarily.
6. Do not add unnecessary dependencies.
7. Implement one logical change at a time.
8. Every database schema change requires Flyway migration.
9. Every protected endpoint requires authorization.
10. Every tenant-owned query must enforce tenant ownership.
11. External integrations use connector abstractions.
12. LLM responses use structured schemas.
13. AI is advisory, never final compliance authority.
14. Never commit secrets.
15. Never log credentials.
16. Add tests for security-sensitive changes.
17. Run tests/builds after changes.
18. Do not implement future features unless requested.
19. Do not rewrite stable code for style alone.
20. Explain architectural changes before making them.

---

# 68. Required Existing-Code Audit

Before further coding, produce this matrix:

| Area | Status | Existing Files | Missing | Priority |
|---|---|---|---|---|
| Docker | | | | |
| Backend | | | | |
| Frontend | | | | |
| PostgreSQL | | | | |
| Auth | | | | |
| Multi-tenancy | | | | |
| RBAC | | | | |
| Controls | | | | |
| Evidence | | | | |
| GitHub | | | | |
| AWS | | | | |
| Jira | | | | |
| Google | | | | |
| AI | | | | |
| RAG | | | | |
| Qdrant | | | | |
| Onboarding | | | | |
| Integration lifecycle | | | | |
| Scheduler | | | | |
| Audit log | | | | |
| Export | | | | |
| Security | | | | |
| Tests | | | | |

During this audit, do not modify files.

---

# 69. First Instruction to Opus/Copilot

Use this prompt after adding this file:

> Read `PROJECT_SPEC.md` and `PROJECT_SPEC2.md` completely.
>
> The original specification has already been implemented in this repository.
>
> Do NOT rebuild the project.
>
> Do NOT add product features.
>
> Inspect the complete repository and compare the current implementation against PROJECT_SPEC2.md.
>
> Produce a gap-analysis matrix with:
> - Area
> - Current implementation
> - Relevant files
> - COMPLETE / PARTIAL / MISSING
> - Security concerns
> - Required changes
> - Priority P0/P1/P2/P3
>
> Pay special attention to:
> 1. Customer signup/onboarding
> 2. Organization/tenant creation
> 3. Integration lifecycle
> 4. GitHub OAuth/App
> 5. AWS cross-account IAM Role
> 6. Jira OAuth
> 7. Connection testing
> 8. Background evidence collection
> 9. Collection runs
> 10. Secure credential handling
> 11. Evidence freshness
> 12. AI evidence mapping
> 13. RAG
> 14. Human review
> 15. Audit package export
> 16. Multi-tenant security
>
> Do not modify files.
>
> At the end provide:
> A. Critical blockers
> B. Security risks
> C. Architecture problems
> D. Missing functionality
> E. Missing tests
> F. Recommended implementation order
>
> Wait for approval before changing code.

---

# 70. Implementation Prompt After Audit

After reviewing and approving the audit:

> Implement only the approved P0/P1 gaps.
>
> Do not implement P2/P3 items.
>
> Before coding, list the exact files that will change.
>
> Preserve existing architecture wherever it already satisfies PROJECT_SPEC2.md.
>
> Add/update tests for security-sensitive changes.
>
> Run backend, frontend, and AI tests/builds after implementation.
>
> At the end report:
> - Files changed
> - Migrations added
> - APIs added/changed
> - Tests added
> - Commands executed
> - Remaining blockers
>
> Do not add unrelated features.

---

# 71. First Local Milestone

The first technical milestone:

```text
docker compose up --build
        |
        +--> PostgreSQL ✓
        +--> Redis ✓
        +--> Qdrant ✓
        +--> MinIO ✓
        +--> Spring Boot ✓
        +--> Angular ✓
        +--> FastAPI ✓
```

Then:

```text
Register
   |
Create Organization
   |
Login
   |
Dashboard
```

Only after this is stable should advanced RAG work be prioritized.

---

# 72. First Real Product Demo

A compelling MVP demonstration:

```text
Acme SaaS
   |
   v
Sign up
   |
   v
Select SOC 2
   |
   v
Connect GitHub
   |
   v
Connect AWS
   |
   v
Run collection
   |
   v
Evidence discovered
   |
   v
AI maps evidence
   |
   v
Control coverage
   |
   v
Human reviews
   |
   v
Evidence gaps
   |
   v
Audit package
```

Target:

> A new customer should reach their first useful evidence result in roughly 15 minutes or less.

---

# 73. Product Boundary

The MVP is complete when a real small/mid-sized SaaS company can:

```text
Sign up
  ↓
Connect systems
  ↓
Collect evidence
  ↓
Understand evidence coverage
  ↓
Identify gaps
  ↓
Review AI suggestions
  ↓
Export evidence
```

Do not build a full GRC suite until customers demonstrate demand.

---

# 74. Future Roadmap — Do Not Implement Yet

Potential future capabilities:

```text
ISO 27001
DPDP
GDPR
Okta
Azure
GCP
GitLab
Slack
Microsoft Teams
SharePoint
Confluence
Continuous monitoring
Policy management
Risk management
Vendor risk
Auditor portal
SSO/SAML
SCIM
Billing
Enterprise deployment
```

These are intentionally outside the MVP.

---

# 75. Final Architecture Principle

Use:

```text
Deterministic Integrations
        +
Secure Evidence Storage
        +
Compliance Control Model
        +
RAG
        +
LLM Interpretation
        +
Human Review
        +
Audit Trail
```

**Code determines facts.**

**AI interprets evidence.**

**Humans make final judgments.**

This separation is fundamental to the product.

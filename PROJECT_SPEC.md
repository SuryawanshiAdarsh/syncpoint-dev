# AI Compliance Evidence Collector --- MVP Project Specification

## 1. Product Goal

Build a multi-tenant B2B SaaS MVP that helps companies automatically
collect, organize, map, review, and export compliance evidence for SOC 2
controls.

The product is an **evidence automation system**, not a legal/compliance
certification engine.

Core promise:

> Connect company systems, collect evidence automatically, map evidence
> to SOC 2 controls, identify evidence gaps, and generate an audit-ready
> evidence package.

The MVP must distinguish: - Evidence collected by deterministic
integrations - AI-generated interpretation or recommendations - Human
review/approval - Actual auditor/certification decisions

The system must NEVER claim that a customer is "SOC 2 compliant."

------------------------------------------------------------------------

# 2. MVP Scope

## In scope

### Authentication and tenancy

-   User registration/login
-   Organization/tenant
-   Role-based access control
-   Roles: OWNER, ADMIN, REVIEWER, VIEWER

### Compliance

-   SOC 2 control library
-   Control categories
-   Control status
-   Control/evidence relationships

### Evidence

-   Manual evidence upload
-   Automated evidence collection
-   Evidence metadata
-   Evidence version/history
-   Evidence freshness
-   Evidence review
-   Evidence-to-control mapping
-   Evidence gap identification

### Integrations

Build these incrementally: 1. GitHub 2. AWS 3. Jira 4. Google Workspace

For the first working milestone, GitHub can be implemented first and the
others behind the same connector abstraction.

### AI

-   Compliance document extraction
-   Evidence classification
-   Evidence-to-control mapping
-   Gap explanation
-   Retrieval-augmented generation over compliance knowledge
-   Confidence score
-   Human review required for AI conclusions

### Dashboard

-   Overall evidence coverage
-   Covered/partial/missing/review statuses
-   Controls list
-   Evidence list
-   Integration status
-   Evidence freshness
-   AI recommendations

### Audit package

-   Evidence index
-   Evidence files
-   Control mappings
-   Collection timestamps
-   Review history
-   Export as ZIP

------------------------------------------------------------------------

# 3. Explicitly Out of Scope for MVP

Do NOT build: - Full GRC suite - Risk management - Vendor risk
management - Employee training - Policy lifecycle management - Incident
management - 20+ compliance frameworks - 20+ integrations - Autonomous
compliance decisions - Autonomous auditor communication - Complex agent
swarms - Generic AI chatbot - Billing/subscriptions unless required for
deployment - Enterprise SSO/SAML in the first milestone

------------------------------------------------------------------------

# 4. Recommended Technology Stack

## Frontend

-   Angular
-   TypeScript
-   Angular Material
-   RxJS
-   NgRx only where application state genuinely requires it
-   Reactive forms
-   HTTP interceptors
-   Route guards

## Backend

-   Java 21 LTS
-   Spring Boot 3.x
-   Spring Web
-   Spring Security
-   JWT authentication
-   Spring Data JPA
-   Hibernate
-   PostgreSQL
-   Flyway
-   Bean Validation
-   OpenAPI/Swagger
-   Maven

## AI Service

-   Python 3.12+
-   FastAPI
-   Pydantic
-   OpenAI-compatible LLM client abstraction
-   Embedding client abstraction
-   Qdrant client
-   PyPDF/document extraction libraries
-   httpx

The AI service must be provider-independent. Do not hard-code the
application to one LLM provider.

## Infrastructure

-   Docker
-   Docker Compose
-   PostgreSQL
-   Redis
-   Qdrant
-   MinIO for local S3-compatible object storage

Production can later move to: - AWS RDS - AWS S3 - ElastiCache - Managed
Qdrant/vector infrastructure

------------------------------------------------------------------------

# 5. Monorepo Structure

Create this structure in the project root:

``` text
ai-compliance-evidence/
│
├── README.md
├── PROJECT_SPEC.md
├── .gitignore
├── .env.example
├── docker-compose.yml
├── Makefile
│
├── docs/
│   ├── architecture/
│   │   ├── system-architecture.md
│   │   ├── data-flow.md
│   │   └── security.md
│   ├── api/
│   │   └── api-overview.md
│   └── compliance/
│       ├── soc2-controls.md
│       └── evidence-model.md
│
├── frontend/
│   └── compliance-ui/
│
├── backend/
│   └── compliance-api/
│       ├── pom.xml
│       └── src/
│
├── ai-service/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── services/
│   │   ├── rag/
│   │   ├── llm/
│   │   └── ingestion/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── database/
│   ├── migrations/
│   └── seed/
│
├── infrastructure/
│   ├── docker/
│   └── scripts/
│
└── storage/
    └── .gitkeep
```

------------------------------------------------------------------------

# 6. Backend Package Structure

Use feature-oriented packaging:

``` text
backend/compliance-api/src/main/java/com/example/compliance/
│
├── ComplianceApplication.java
│
├── config/
│   ├── SecurityConfig.java
│   ├── OpenApiConfig.java
│   └── WebConfig.java
│
├── auth/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── organization/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── compliance/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── evidence/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── integrations/
│   ├── controller/
│   ├── dto/
│   ├── service/
│   ├── github/
│   ├── aws/
│   ├── jira/
│   └── google/
│
├── ai/
│   ├── controller/
│   ├── dto/
│   └── client/
│
├── audit/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── export/
│   ├── controller/
│   └── service/
│
└── common/
    ├── exception/
    ├── security/
    ├── tenant/
    └── util/
```

------------------------------------------------------------------------

# 7. Frontend Structure

``` text
frontend/compliance-ui/src/app/
│
├── core/
│   ├── auth/
│   ├── guards/
│   ├── interceptors/
│   ├── services/
│   └── models/
│
├── shared/
│   ├── components/
│   ├── pipes/
│   └── directives/
│
├── features/
│   ├── dashboard/
│   ├── controls/
│   ├── evidence/
│   ├── integrations/
│   ├── audit-package/
│   ├── organization/
│   └── settings/
│
├── layout/
│   ├── sidebar/
│   ├── header/
│   └── shell/
│
└── app.routes.ts
```

------------------------------------------------------------------------

# 8. Database Model

Use PostgreSQL.

Every tenant-owned table must contain `organization_id`.

Core tables:

``` text
organizations
users
organization_members
roles

frameworks
controls
control_categories

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

## organizations

``` text
id UUID PK
name VARCHAR
slug VARCHAR UNIQUE
created_at TIMESTAMP
updated_at TIMESTAMP
```

## users

``` text
id UUID PK
email VARCHAR UNIQUE
password_hash VARCHAR
name VARCHAR
created_at TIMESTAMP
updated_at TIMESTAMP
```

## organization_members

``` text
id UUID PK
organization_id UUID FK
user_id UUID FK
role VARCHAR
created_at TIMESTAMP
```

## frameworks

``` text
id UUID PK
code VARCHAR
name VARCHAR
version VARCHAR
active BOOLEAN
```

Example:

``` text
SOC2
SOC 2 Trust Services Criteria
2022
```

## controls

``` text
id UUID PK
framework_id UUID FK
code VARCHAR
title VARCHAR
description TEXT
category VARCHAR
active BOOLEAN
```

## evidence

``` text
id UUID PK
organization_id UUID FK
name VARCHAR
description TEXT
source_type VARCHAR
source_system VARCHAR
status VARCHAR
collected_at TIMESTAMP
expires_at TIMESTAMP NULL
storage_key VARCHAR NULL
content_hash VARCHAR NULL
created_by UUID NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

Statuses:

``` text
COLLECTED
UNDER_REVIEW
APPROVED
REJECTED
EXPIRED
```

## evidence_control_mappings

``` text
id UUID PK
organization_id UUID FK
evidence_id UUID FK
control_id UUID FK
mapping_type VARCHAR
confidence DECIMAL
reason TEXT
created_by VARCHAR
created_at TIMESTAMP
```

mapping_type:

``` text
AI_SUGGESTED
HUMAN_CONFIRMED
HUMAN_REJECTED
```

## evidence_reviews

``` text
id UUID PK
evidence_id UUID FK
reviewer_id UUID FK
decision VARCHAR
comments TEXT
reviewed_at TIMESTAMP
```

## collection_runs

``` text
id UUID PK
organization_id UUID FK
integration_id UUID FK
status VARCHAR
started_at TIMESTAMP
completed_at TIMESTAMP
error_message TEXT NULL
```

## audit_events

``` text
id UUID PK
organization_id UUID FK
actor_user_id UUID NULL
event_type VARCHAR
entity_type VARCHAR
entity_id UUID
metadata JSONB
created_at TIMESTAMP
```

------------------------------------------------------------------------

# 9. Multi-Tenancy

Every request must resolve the organization/tenant from the
authenticated user.

Never trust a client-supplied organization ID without validating
membership.

Implement:

``` text
JWT
 ↓
Authenticated User
 ↓
Organization Membership
 ↓
Tenant Context
 ↓
Service Layer
 ↓
Database query filtered by organization_id
```

A user from Organization A must NEVER be able to access Organization B
data.

This is a critical acceptance criterion.

------------------------------------------------------------------------

# 10. Roles

## OWNER

-   Full organization access
-   Manage integrations
-   Manage users
-   Review evidence
-   Export audit package

## ADMIN

-   Manage integrations
-   Manage evidence
-   Review evidence
-   Export

## REVIEWER

-   View controls
-   Review evidence
-   Add mappings/comments

## VIEWER

-   Read-only access

------------------------------------------------------------------------

# 11. SOC 2 Control Seed Data

Do not attempt to recreate the entire legal/compliance corpus from
memory.

The initial seed should use a small, clearly identified subset for
development/demo purposes.

Create 10--15 representative controls covering:

``` text
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

Mark seed data as:

``` text
DEMO / DEVELOPMENT DATA
```

For a production product, obtain and use appropriate authoritative
framework/licensed material.

------------------------------------------------------------------------

# 12. Evidence Lifecycle

``` text
SOURCE
  ↓
COLLECTION
  ↓
NORMALIZATION
  ↓
STORAGE
  ↓
CONTROL MAPPING
  ↓
AI ANALYSIS
  ↓
HUMAN REVIEW
  ↓
APPROVED / REJECTED
  ↓
EXPORT
```

Evidence should be immutable after collection.

If the evidence changes, create a new evidence version.

------------------------------------------------------------------------

# 13. Connector Architecture

Never write connector-specific logic directly into the evidence service.

Create an interface:

``` java
public interface EvidenceCollector {

    String getSourceType();

    CollectionResult collect(CollectionContext context);
}
```

Implement:

``` text
GitHubEvidenceCollector
AwsEvidenceCollector
JiraEvidenceCollector
GoogleEvidenceCollector
```

The evidence service only knows:

``` text
EvidenceCollector
```

not the implementation.

------------------------------------------------------------------------

# 14. GitHub MVP Connector

First integration.

Collect a small deterministic evidence set:

``` text
Organization members
Repository list
Repository visibility
Repository branch protection
Repository collaborators
Repository security settings where API access permits
```

Store the raw API response as evidence metadata/object storage where
appropriate.

Normalize useful fields into structured JSON.

Do not use an LLM to determine facts that GitHub directly provides.

------------------------------------------------------------------------

# 15. AWS MVP Connector

Second integration.

Initial evidence:

``` text
IAM users
IAM roles
MFA status where available
Admin/privileged policies
Access key metadata
CloudTrail configuration/status where available
```

Use AWS SDK.

Use least-privilege credentials.

Never store long-lived cloud secrets in plaintext.

------------------------------------------------------------------------

# 16. Jira Connector

Initial evidence:

``` text
Projects
Issue types
Selected change-management tickets
Issue status
Approval information where available
```

The MVP should allow configuration of which project is considered the
compliance/change-management source.

------------------------------------------------------------------------

# 17. Google Workspace Connector

Initial evidence:

``` text
Users
Groups
Admin status where permitted
2-step verification status where permitted by API permissions
```

This integration can be implemented after GitHub/AWS.

------------------------------------------------------------------------

# 18. Object Storage

Use S3-compatible storage.

Local development:

``` text
MinIO
```

Production:

``` text
AWS S3
```

Store:

``` text
original evidence files
raw connector payloads where appropriate
generated audit packages
```

Never store sensitive evidence directly in Git.

------------------------------------------------------------------------

# 19. AI Service Architecture

``` text
FastAPI
   │
   ├── /health
   ├── /extract
   ├── /classify
   ├── /map-evidence
   ├── /analyze-gap
   └── /rag/query
```

AI service modules:

``` text
llm/
    provider.py
    openai_provider.py

rag/
    embeddings.py
    vector_store.py
    retriever.py
    prompt_builder.py

ingestion/
    document_parser.py
    chunker.py
    metadata.py

services/
    evidence_classifier.py
    control_mapper.py
    gap_analyzer.py
```

------------------------------------------------------------------------

# 20. RAG Pipeline

Use RAG for compliance knowledge and interpretation.

Pipeline:

``` text
Compliance documents
       ↓
Parse
       ↓
Clean
       ↓
Chunk
       ↓
Embedding
       ↓
Qdrant
```

Query:

``` text
Control/evidence question
       ↓
Embedding
       ↓
Vector search
       ↓
Top-K chunks
       ↓
Prompt construction
       ↓
LLM
       ↓
Structured result
```

Metadata must include:

``` text
framework
framework_version
control_code
document
section
page
source
```

------------------------------------------------------------------------

# 21. RAG Chunking

Initial implementation:

``` text
chunk size: approximately 500–800 tokens
overlap: approximately 50–100 tokens
```

These are starting values, not permanent constants.

Store metadata with every chunk.

Later experiments can compare: - recursive chunking - semantic
chunking - parent-child retrieval - hybrid search - reranking

Do not over-engineer this in MVP.

------------------------------------------------------------------------

# 22. AI Evidence Mapping

Input:

``` json
{
  "control": {
    "code": "CC6.1",
    "description": "..."
  },
  "evidence": {
    "type": "AWS_IAM_USERS",
    "content": {}
  }
}
```

Output must be structured:

``` json
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

The LLM must NOT output "SOC 2 compliant."

------------------------------------------------------------------------

# 23. AI Confidence

Use a bounded confidence score:

``` text
0.0 - 1.0
```

But treat it as an AI signal, not a probability of legal/compliance
correctness.

UI should say:

``` text
AI confidence: 86%
```

not:

``` text
Compliance certainty: 86%
```

------------------------------------------------------------------------

# 24. Prompt Design

Keep prompts versioned.

Example:

``` text
SYSTEM:
You are a compliance evidence analysis assistant.

Your task is to compare evidence against a control description.

Rules:
1. Do not invent evidence.
2. Use only supplied evidence and retrieved context.
3. Clearly distinguish supported and missing requirements.
4. If evidence is insufficient, say so.
5. Never claim that an organization is compliant.
6. Return the requested JSON schema.
```

Store prompt version in AI analysis records.

------------------------------------------------------------------------

# 25. AI Guardrails

The AI layer must:

-   Never fabricate evidence
-   Never fabricate citations
-   Never claim certification
-   Return structured output
-   Include source references when available
-   Indicate insufficient evidence
-   Require human review for final mapping
-   Log model/provider/model version
-   Log prompt version
-   Avoid sending unnecessary sensitive evidence to external models

------------------------------------------------------------------------

# 26. API Design

Base path:

``` text
/api/v1
```

## Authentication

``` text
POST /auth/register
POST /auth/login
POST /auth/refresh
GET  /auth/me
```

## Organizations

``` text
GET  /organizations/current
PATCH /organizations/current
GET  /organizations/current/members
POST /organizations/current/members
PATCH /organizations/current/members/{id}
```

## Frameworks

``` text
GET /frameworks
GET /frameworks/{id}
GET /frameworks/{id}/controls
```

## Controls

``` text
GET /controls
GET /controls/{id}
GET /controls/{id}/evidence
```

## Evidence

``` text
GET  /evidence
POST /evidence/upload
GET  /evidence/{id}
DELETE /evidence/{id}
POST /evidence/{id}/review
POST /evidence/{id}/analyze
POST /evidence/{id}/map
```

## Integrations

``` text
GET  /integrations
POST /integrations/github
POST /integrations/aws
POST /integrations/jira
POST /integrations/google
POST /integrations/{id}/test
POST /integrations/{id}/collect
DELETE /integrations/{id}
```

## Dashboard

``` text
GET /dashboard/summary
GET /dashboard/gaps
GET /dashboard/recent-evidence
```

## Export

``` text
POST /exports/audit-package
GET  /exports/{id}
```

------------------------------------------------------------------------

# 27. API Rules

Use: - DTOs, not entities, in controller responses - Validation
annotations - Consistent error responses - Pagination for lists - UUID
identifiers - ISO-8601 timestamps - OpenAPI documentation - Global
exception handling

Error format:

``` json
{
  "timestamp": "2026-08-31T10:00:00Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Invalid request",
  "path": "/api/v1/evidence"
}
```

------------------------------------------------------------------------

# 28. Docker Compose

Local stack:

``` text
frontend
backend
ai-service
postgres
redis
qdrant
minio
```

Example ports:

``` text
Angular: 4200
Spring Boot: 8080
FastAPI: 8000
PostgreSQL: 5432
Redis: 6379
Qdrant: 6333
MinIO API: 9000
MinIO Console: 9001
```

All service configuration must come from environment variables.

------------------------------------------------------------------------

# 29. Environment Variables

Create `.env.example`.

``` text
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

------------------------------------------------------------------------

# 30. Security Requirements

Minimum MVP security:

-   Password hashing with BCrypt/Argon2
-   JWT expiry
-   Role-based authorization
-   Tenant isolation
-   Input validation
-   File type validation
-   File size limits
-   Malware scanning hook/interface
-   Secrets never logged
-   Audit logging
-   HTTPS in production
-   Least-privilege connector credentials
-   Encryption at rest in production
-   Encryption in transit
-   No sensitive evidence in application logs

------------------------------------------------------------------------

# 31. File Upload Security

Allowed initially:

``` text
PDF
CSV
JSON
TXT
DOCX
XLSX
```

Implement: - Maximum file size - MIME validation - Extension
validation - Generated storage keys - No executable files - No
user-controlled filesystem paths - Virus/malware scanning abstraction

------------------------------------------------------------------------

# 32. Dashboard UX

Main page:

``` text
SOC 2 Evidence Readiness

Coverage
78%

Covered       42
Partial       11
Missing       19
Needs Review   6
```

Sections:

``` text
Controls
Evidence
Integrations
Gaps
Audit Package
Settings
```

Control details:

``` text
CC6.1 — Logical Access

Status: PARTIAL

Evidence
-------------------------
AWS IAM Report       ✓
GitHub Access        ✓
Access Review        ✕

AI Analysis
-------------------------
Current access is evidenced.
Periodic review evidence is missing.

Recommendation
-------------------------
Upload the latest approved access review.
```

------------------------------------------------------------------------

# 33. Audit Package Generation

When user requests export:

``` text
POST /exports/audit-package
```

Create an async job:

``` text
export_jobs
```

Package:

``` text
soc2-evidence-package/
├── index.csv
├── controls/
│   ├── CC6.1/
│   │   ├── evidence.json
│   │   └── evidence-files/
│   └── ...
├── audit-log.json
└── README.txt
```

Use a generated ZIP.

Include: - collection timestamp - evidence ID - source - control
mapping - review status - evidence hash - AI analysis metadata where
appropriate

------------------------------------------------------------------------

# 34. Audit Logging

Log security/compliance-sensitive events:

``` text
LOGIN
LOGOUT
USER_CREATED
USER_ROLE_CHANGED
INTEGRATION_CREATED
INTEGRATION_DELETED
COLLECTION_STARTED
COLLECTION_COMPLETED
EVIDENCE_CREATED
EVIDENCE_REVIEWED
EVIDENCE_MAPPED
AI_ANALYSIS_CREATED
EXPORT_CREATED
```

Audit events should be append-only from the application perspective.

------------------------------------------------------------------------

# 35. Testing

## Backend

Use: - JUnit 5 - Mockito - Spring Boot Test - Testcontainers

Test: - authentication - authorization - tenant isolation - evidence
CRUD - control mapping - connector behavior - export generation

## AI

Test: - schema validity - hallucination resistance - missing evidence
behavior - mapping classification - prompt injection resistance -
retrieval relevance

## Frontend

Use Angular testing tools.

Test: - route guards - services - key components - dashboard state -
forms

------------------------------------------------------------------------

# 36. Seed Data

On first startup, create:

``` text
1 demo organization
1 demo admin
1 demo reviewer
10–15 SOC 2 demo controls
sample evidence
sample evidence mappings
```

Do not use real customer data.

------------------------------------------------------------------------

# 37. Development Phases

## Phase 0 --- Repository bootstrap

Create: - root directory - Git repository - README - PROJECT_SPEC -
.gitignore - .env.example - Docker Compose

Acceptance: All local infrastructure starts.

------------------------------------------------------------------------

## Phase 1 --- Backend foundation

Build: - Spring Boot - PostgreSQL - Flyway - authentication - JWT -
organizations - users - roles

Acceptance: User can register/login and access only their organization.

------------------------------------------------------------------------

## Phase 2 --- Compliance module

Build: - frameworks - controls - control categories - seed SOC 2 demo
controls

Acceptance: UI/API can list controls and display status.

------------------------------------------------------------------------

## Phase 3 --- Evidence module

Build: - upload - storage - metadata - evidence lifecycle - evidence
review - evidence-control mapping

Acceptance: User can upload evidence and manually map it to a control.

------------------------------------------------------------------------

## Phase 4 --- GitHub integration

Build: - OAuth/token integration as appropriate - connector
abstraction - GitHub collector - collection runs - normalized evidence

Acceptance: Clicking "Collect GitHub Evidence" creates evidence records.

------------------------------------------------------------------------

## Phase 5 --- AI service

Build: - FastAPI - LLM abstraction - structured outputs - evidence
classification - control mapping - gap analysis

Acceptance: Evidence can be analyzed and produce a structured AI
recommendation.

------------------------------------------------------------------------

## Phase 6 --- RAG

Build: - document ingestion - chunking - embeddings - Qdrant -
retrieval - prompt construction - source metadata

Acceptance: AI answers evidence/control questions using retrieved
compliance knowledge.

------------------------------------------------------------------------

## Phase 7 --- Dashboard

Build: - readiness score - control statuses - evidence - gaps -
integrations - review screens

Acceptance: A user can understand compliance evidence coverage from one
screen.

------------------------------------------------------------------------

## Phase 8 --- Export

Build: - export job - ZIP generation - evidence index - audit history

Acceptance: User can download a complete audit evidence package.

------------------------------------------------------------------------

## Phase 9 --- AWS integration

Build the initial AWS evidence collectors.

Acceptance: AWS evidence can be collected and mapped using the same
generic evidence engine.

------------------------------------------------------------------------

# 38. Definition of Done

A feature is done only when:

-   Backend code compiles
-   Unit tests pass
-   API validation exists
-   Authorization exists
-   Tenant isolation is verified
-   Database migration exists
-   Frontend handles loading/error states
-   API documented in OpenAPI
-   No secrets are committed
-   Logs do not expose sensitive data
-   README is updated
-   Feature works through Docker Compose

------------------------------------------------------------------------

# 39. Copilot Development Rules

Use these rules while generating code.

1.  Follow PROJECT_SPEC.md as the source of truth.
2.  Do not introduce new frameworks without explicit need.
3.  Prefer simple maintainable code.
4.  Do not over-engineer.
5.  Implement one feature at a time.
6.  Do not modify unrelated modules.
7.  Every database change requires a Flyway migration.
8.  Never expose JPA entities directly from controllers.
9.  Every tenant-owned query must enforce organization_id.
10. Never put secrets in source code.
11. Write tests for security-sensitive logic.
12. Use interfaces for external integrations.
13. External APIs must be isolated behind connector classes.
14. LLM responses must use structured schemas.
15. AI must never make final compliance decisions.
16. AI-generated mappings must remain reviewable.
17. Do not use an LLM for deterministic facts available from APIs.
18. Log model name/version and prompt version for AI analyses.
19. Prefer asynchronous jobs for long-running collection/export
    operations.
20. Keep MVP scope narrow.

------------------------------------------------------------------------

# 40. Copilot Execution Protocol

When asked to implement a feature:

### Step 1

Read: - PROJECT_SPEC.md - relevant existing files

### Step 2

Identify: - affected modules - database changes - API changes - frontend
changes - tests

### Step 3

Present a short implementation plan.

### Step 4

Implement only the requested feature.

### Step 5

Run tests/build.

### Step 6

Fix compilation/test errors.

### Step 7

Summarize: - files changed - database changes - APIs added - tests
added - commands to verify

Never silently rewrite architecture.

------------------------------------------------------------------------

# 41. First Copilot Task

After opening the repository in VS Code, give Copilot this instruction:

> Read PROJECT_SPEC.md completely. Do not write application code yet.
>
> First inspect the repository.
>
> Create a concise implementation plan for Phase 0 and Phase 1.
>
> Phase 0 must create the monorepo structure, Docker Compose
> infrastructure, environment template, README, and development scripts.
>
> Phase 1 must establish the Spring Boot backend, PostgreSQL, Flyway,
> authentication, JWT, organization/tenant model, users, roles, and
> security foundation.
>
> Do not implement Phase 2 or later.
>
> Before making changes, list the files you intend to create or modify.

Then implement Phase 0 first.

------------------------------------------------------------------------

# 42. First Milestone

The first meaningful milestone is:

``` text
git clone
      ↓
docker compose up
      ↓
PostgreSQL ✓
Redis ✓
Qdrant ✓
MinIO ✓
      ↓
Spring Boot ✓
      ↓
Angular ✓
      ↓
Python AI service ✓
```

Then:

``` text
Register
   ↓
Create organization
   ↓
Login
   ↓
Dashboard
```

Only after this works should you start building evidence collection.

------------------------------------------------------------------------

# 43. Product Evolution

The MVP should eventually evolve toward:

``` text
Evidence Collector
        ↓
Evidence Intelligence
        ↓
Compliance Readiness
        ↓
Continuous Compliance
        ↓
Compliance Automation
```

Potential future features: - ISO 27001 - DPDP - GDPR - Slack/Teams -
Okta - Azure - GCP - GitLab - Jira automation - scheduled evidence
collection - control monitoring - policy/evidence gap detection -
auditor collaboration - continuous compliance alerts

Do not implement these until customer validation shows demand.

------------------------------------------------------------------------

# 44. Core Product Principle

The product's value is NOT:

> "We use AI."

The value is:

> "We reduce the manual work required to collect and prepare trustworthy
> compliance evidence."

AI should improve: - interpretation - classification - mapping - gap
analysis - document understanding

Deterministic software should handle: - authentication - authorization -
integrations - data collection - timestamps - hashes - evidence
storage - audit logs

This separation is fundamental to the architecture.

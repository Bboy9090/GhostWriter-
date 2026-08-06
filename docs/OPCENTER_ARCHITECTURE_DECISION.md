# GhostWriter Op-Center Architecture Decision

**Status:** Proposed  
**Decision type:** Product boundary, security architecture, deployment strategy  
**Target branch:** `architecture/ghostwriter-opcenter-boundary`  
**Primary repository:** `Bboy9090/GhostWriter-`

## 1. Executive Decision

The current repository is the **Ghost Writer creative writing and publishing studio** for Bobby's World / Blue Phoenix OS. It is a React 19, TypeScript, Vite, Tailwind, local-first application.

The proposed **GhostWriter Op-Center** is a different product class: a Django/PostgreSQL/Redis/Celery/Nginx operations platform for authorized security assessment planning, evidence management, activity logging, and report generation.

These products must not be silently merged under one runtime or allowed to overwrite one another.

### Decision

1. Preserve the existing Ghost Writer studio as the current product.
2. Build GhostWriter Op-Center as a separately bounded application, preferably in a dedicated repository such as `GhostWriter-OpCenter`.
3. Reuse only intentionally shared packages, branding tokens, export schemas, and authentication components.
4. Do not replace the current React/Vite application with a Django stack in-place.
5. Do not claim production readiness until the release gates in this document pass with recorded evidence.

This avoids a namespace collision becoming a data-loss event, which is the sort of lesson organizations usually purchase through an outage.

## 2. Current Repository Audit

| Capability | Current state | Classification |
|---|---|---|
| React writing interface | Present | Implemented |
| TypeScript/Vite build | Present | Implemented |
| Tailwind/Radix component layer | Present | Implemented |
| Browser local-first storage | Present | Implemented |
| Markdown and text export | Present | Implemented |
| PDF/DOCX publishing | Roadmap only | Planned |
| Django web application | Not present | Absent |
| PostgreSQL operational data model | Not present in the current product architecture | Absent |
| Redis session/task broker | Not present in the current product architecture | Absent |
| Celery worker and scheduler | Not present | Absent |
| Nginx reverse proxy | Not present as the active production architecture | Absent |
| Two-pane operations log | Not present | Absent |
| Asciinema `.cast` replay pipeline | Not present | Absent |
| Local passive-voice quality engine | Not proven by focused tests | Unverified |
| C2 ingestion adapters | Not present | Absent |
| SSO/MFA enforcement | Not present | Absent |
| Immutable audit ledger | Not present | Absent |

### Repository history warning

The repository has previously changed product direction. Historical backend, OCR, vault, and capture work must not be treated as active architecture merely because old files, scripts, dependencies, or commit history remain. Every claimed subsystem requires a current code path, caller integration, focused tests, and a named validation receipt.

## 3. Corrected Target Architecture

The proposed Op-Center should use a production architecture with explicit trust boundaries.

```text
Internet / Private Network
          |
          v
  Managed Load Balancer or Nginx
          |
          v
      Django Web/API
       |          |
       v          v
 PostgreSQL     Redis
                  |
                  v
          Celery Worker Pool
                  |
                  v
     Sandboxed Report Renderer

Separate services:
- Celery Beat scheduler
- Object storage for evidence and generated reports
- Centralized logs and metrics
- Backup target
- Optional, disabled-by-default integration adapters
```

### Required services

- `web`: Django UI, REST, and GraphQL endpoints.
- `postgres`: authoritative relational datastore.
- `redis`: cache and task broker with authentication and persistence policy.
- `celery_worker`: bounded asynchronous jobs.
- `celery_beat`: scheduled jobs. This service was described in the blueprint but omitted from the sample Compose file.
- `nginx` or managed ingress: TLS termination and proxy controls.
- `report_renderer`: isolated conversion service for DOCX/PDF/XLSX/PPTX generation.
- `object_store`: evidence, screenshots, `.cast` recordings, and generated deliverables.

## 4. Deployment Corrections

The original Compose outline is useful as a development sketch, but it is not production-ready without the following corrections.

### 4.1 Secrets

- Never commit `.env` files containing secrets.
- Add `.env`, `.env.*`, private keys, certificates, database dumps, generated reports, and evidence archives to `.gitignore`.
- Use Docker secrets, a managed secret store, or platform-native encrypted variables.
- Rotate `SECRET_KEY`, database credentials, API tokens, and signing keys independently.
- Use separate credentials for development, staging, and production.
- Add automated secret scanning in CI.

### 4.2 Container immutability

- Do not bind-mount source code into production containers.
- Build versioned images and deploy immutable tags or digests.
- Run every service as a non-root user.
- Set `read_only: true` where practical.
- Drop Linux capabilities and enable `no-new-privileges`.
- Mount only the directories that require writes.
- Generate a software bill of materials and scan images before promotion.

### 4.3 Service readiness

`depends_on` controls startup order. It does not prove PostgreSQL or Redis is ready.

Required controls:

- Add health checks to PostgreSQL, Redis, Django, Celery, and Nginx.
- Gate migrations and startup on successful dependency health.
- Use bounded retries with clear failure states.
- Add graceful shutdown and worker drain behavior.
- Separate migration jobs from long-running web processes.

### 4.4 Django proxy and cookie security

Production settings must include:

- `DEBUG=False`
- exact `ALLOWED_HOSTS`
- exact `CSRF_TRUSTED_ORIGINS`
- `SECURE_SSL_REDIRECT=True`
- `SESSION_COOKIE_SECURE=True`
- `CSRF_COOKIE_SECURE=True`
- `SESSION_COOKIE_HTTPONLY=True`
- an intentional `SESSION_COOKIE_SAMESITE` policy
- `SECURE_PROXY_SSL_HEADER` when behind a trusted proxy
- HSTS after HTTPS is verified
- secure referrer and content-type headers
- a restrictive Content Security Policy

Forwarded headers must be accepted only from the trusted ingress layer.

### 4.5 Nginx and TLS

- The sample listens on port 443 without showing a TLS server block or certificate configuration.
- Redirect HTTP to HTTPS.
- Use modern TLS settings and automated certificate renewal.
- Add request timeouts, upload limits, rate limits, and upstream failure handling.
- Do not serve private evidence through a public `/media/` alias.
- Evidence downloads must pass application authorization checks or use short-lived signed URLs.

### 4.6 PostgreSQL

- Do not expose PostgreSQL publicly.
- Use encrypted connections when crossing hosts.
- Add connection pooling.
- Set backup retention, encryption, and restore testing.
- Record schema migration state during releases.
- Use least-privilege database roles for runtime, migration, backup, and reporting tasks.

### 4.7 Redis and Celery

- Require Redis authentication when supported by the deployment model.
- Set task time limits, retry limits, acknowledgement behavior, and dead-letter handling.
- Route report generation and integration ingestion into separate queues.
- Prevent one large report from starving operational ingestion.
- Make tasks idempotent where possible.
- Set worker concurrency from measured load rather than folklore.

### 4.8 Report generation isolation

Report templates and converters process untrusted or semi-trusted content. They must not run with unrestricted access to the application container.

- Run conversion in a separate, non-root container.
- Disable macros and active content.
- Restrict filesystem and network access.
- Enforce file size, page count, execution time, and memory limits.
- Validate Jinja variables and template ownership.
- Scan generated files before release.
- Preserve a manifest connecting each report to its project, findings, evidence versions, template version, and generator version.

## 5. Product Architecture

### 5.1 Core domains

- Identity and access
- Clients and contacts
- Projects and scopes
- Findings library
- Project findings
- Infrastructure assets
- Activity timeline
- Evidence objects
- Terminal session recordings
- Report templates
- Report jobs and deliverables
- Integration adapters
- Audit events

### 5.2 Two-pane activity log

The activity log should be a master-detail interface, not merely a decorative split panel.

Required behavior:

- left pane: timestamped, filterable activity entries
- right pane: full detail, linked target, operator, tags, evidence, and replay controls
- keyboard navigation
- deep links to a selected log entry
- optimistic UI only when the server supplies a conflict-safe revision token
- live updates through WebSocket or server-sent events
- immutable original timestamp plus editable annotation history
- project-scoped authorization on every query and subscription

### 5.3 Terminal replay

- Store `.cast` files in object storage.
- Store metadata and integrity hashes in PostgreSQL.
- Validate file type and size before acceptance.
- Sanitize playback rendering.
- Support pause, seek where format permits, playback speed, and transcript extraction.
- Keep raw recordings access-controlled and auditable.
- Treat recordings as sensitive evidence, not public media.

### 5.4 Local writing quality analysis

Passive-voice analysis should remain local-first where possible.

- Run deterministic rules in the browser or a local worker.
- Do not send report text to external AI services without explicit policy and consent.
- Label suggestions as guidance, not fact.
- Include focused tests for false positives, quoted material, technical language, and accessibility.
- Allow project-level disabling for regulated engagements.

### 5.5 Command palette

The command palette may search only objects the current user is authorized to view.

- server-enforced project and client filters
- keyboard shortcut support
- fuzzy local matching over authorized result sets
- no leakage through result counts, autocomplete, timing, or error messages
- auditable destructive actions

## 6. Integration Boundary

Optional integration adapters for Mythic, Cobalt Strike, or other authorized assessment systems must be disabled by default.

Each adapter requires:

- explicit administrator enablement
- per-project authorization
- scoped service credentials
- source allowlists
- signature or token validation
- replay protection
- rate limits
- payload size limits
- schema validation
- tamper-evident ingestion receipts
- automatic secret redaction rules
- a kill switch
- complete audit logs

The application must support legitimate, authorized security work without becoming an ungoverned collection point for credentials and operational artifacts.

## 7. Repository Strategy

### Preferred strategy: dedicated repository

Create `Bboy9090/GhostWriter-OpCenter` with:

```text
GhostWriter-OpCenter/
├── apps/
│   ├── web/
│   ├── accounts/
│   ├── clients/
│   ├── projects/
│   ├── findings/
│   ├── activity/
│   ├── evidence/
│   ├── reporting/
│   └── integrations/
├── config/
├── deploy/
│   ├── compose/
│   ├── nginx/
│   └── kubernetes/        # only when operationally justified
├── templates/
├── tests/
├── docs/
├── manage.py
├── pyproject.toml
├── Dockerfile
├── compose.yaml
└── .env.example
```

### Acceptable fallback: monorepo boundary

Only use the current repository if the intended product is explicitly redefined as a suite.

```text
apps/
├── studio/       # current React/Vite creative writing product
└── opcenter/     # Django operations product
packages/
├── design-tokens/
├── export-schema/
└── shared-types/
```

The two applications must have separate build, test, deployment, storage, secrets, and release pipelines.

## 8. Phased Execution Plan

### Phase 0: decision and containment

- Approve dedicated-repository or monorepo strategy.
- Reserve product names and package names.
- Create architecture decision records.
- Add secret and evidence exclusions.
- Define data classification and retention policy.

**Exit gate:** product boundary approved; no runtime code changed.

### Phase 1: secure foundation

- Scaffold Django project.
- Add PostgreSQL and Redis.
- Add Celery worker and beat.
- Add health checks and migration job.
- Add SSO/MFA-capable authentication foundation.
- Add role and project membership authorization.
- Add CI for lint, types, tests, migrations, dependency audit, and image scan.

**Exit gate:** authenticated health endpoint, migration receipt, focused authorization tests, clean security checks.

### Phase 2: client, project, and findings core

- Implement client and contact models.
- Implement projects, scopes, dates, and membership.
- Implement findings library and project findings.
- Implement CVSS fields with explicit version support.
- Add import validation and audit history.

**Exit gate:** complete client-to-project-to-finding workflow with integration tests.

### Phase 3: infrastructure and activity timeline

- Implement infrastructure assets.
- Implement activity entries, tags, attachments, and revisions.
- Implement two-pane UI.
- Add real-time updates.

**Exit gate:** multi-user conflict tests and project-isolation tests pass.

### Phase 4: evidence and replay

- Add object storage.
- Add evidence metadata, integrity hashes, retention, and authorization.
- Add `.cast` recording upload and playback.
- Add evidence preview controls.

**Exit gate:** unauthorized access tests, malware scanning path, and tamper detection pass.

### Phase 5: reporting

- Add versioned templates.
- Add isolated renderer.
- Add DOCX and PDF first.
- Add XLSX, PPTX, and JSON only after the common manifest is stable.
- Add asynchronous job progress and failure receipts.

**Exit gate:** deterministic sample reports, golden-file tests, resource limits, and audit manifest pass.

### Phase 6: optional integrations

- Build one adapter at a time behind feature flags.
- Start with a generic signed webhook ingestion contract.
- Add vendor-specific adapters only after the generic pipeline is proven.
- Add redaction, deduplication, and replay protection.

**Exit gate:** named emulator or lab validation, security review, and kill-switch test pass.

### Phase 7: release candidate

- Complete threat model.
- Complete backup and restore exercise.
- Complete disaster recovery exercise.
- Complete load and soak tests.
- Complete dependency and container scans.
- Complete accessibility review.
- Complete operational runbooks.

**Exit gate:** all declared release gates pass; release remains unpublished until explicitly promoted.

## 9. Validation Classification

Use these labels literally:

- **Implemented:** a code path exists and has focused tests.
- **Integrated:** caller and dependency paths are connected.
- **Emulator-validated:** reproduced under a named emulator or lab configuration.
- **Hardware-validated:** reproduced on identified physical hardware.
- **Release candidate:** declared release gates pass; release is not yet published.

Do not promote a feature merely because a UI element renders or a container starts.

## 10. Required CI Gates

Every pull request affecting Op-Center must run:

- Python formatting and linting
- static type checks
- Django system checks
- migration drift checks
- unit tests
- integration tests with PostgreSQL and Redis
- authorization isolation tests
- frontend lint, type checks, and tests
- dependency vulnerability scan
- secret scan
- container build
- container vulnerability scan
- SBOM generation
- configuration validation
- report renderer sandbox tests when reporting changes

Protected branches must require successful checks and at least one review.

## 11. Backup and Recovery Standard

A database dump command is not a backup program.

Required controls:

- scheduled encrypted backups
- off-host retention
- object-storage backup or versioning
- documented recovery point and recovery time targets
- regular automated restore tests
- quarterly full recovery exercise
- backup integrity hashes
- key recovery procedure
- evidence retention and legal hold support
- explicit handling of deleted projects and expired evidence

## 12. Immediate Next GitHub Actions

1. Review and approve this architecture decision.
2. Decide dedicated repository versus monorepo suite.
3. Create the Op-Center implementation tracker.
4. Create Phase 1 issues with measurable acceptance criteria.
5. Create the secure scaffold in a draft pull request.
6. Keep the existing Ghost Writer studio release lane independent.

## 13. Non-Goals for This Branch

This branch does not:

- replace the current React application
- introduce Django runtime code
- deploy containers
- add real credentials
- enable C2 integrations
- claim production readiness

It establishes the boundary and the gates required before implementation begins.

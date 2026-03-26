# Skill: sync-docs

## Purpose

Ensure that documentation in `docs/` stays accurate and aligned with the actual implementation. Detect and resolve drift between what the docs say and what the code does. This skill is run after any feature change, API change, or structural change to the codebase.

---

## When to Use

- After implementing a backend feature that adds, changes, or removes API behavior
- After implementing a frontend feature that changes how the API is consumed
- After any change to domain rules, models, serializers, or business logic
- After any change to the component structure, folder layout, or state management approach
- When asked to audit or verify documentation accuracy

---

## Required Inputs

- The list of changed files (file paths)
- A description of what changed and why

---

## Execution Steps

Execute every step in order. Do not skip steps.

### Step 1 — Read all changed files

Read every file in the changed file list. Do not work from memory.

Record for each file:
- What layer it belongs to (model, serializer, service, selector, view, permission, component, hook, service function)
- What behavior it defines or implements
- Whether it adds, modifies, or removes any of the following:
  - API endpoint (URL, method, request shape, response shape, status codes)
  - Domain entity (field, constraint, relationship)
  - Business rule (voting, ranking, status, permissions)
  - Component structure or folder layout
  - State management pattern
  - Test coverage

### Step 2 — Identify affected documents

Based on the recorded changes, determine which documents in `docs/` may need to be updated.

**API changes** affect:
- `docs/engineering/backend/api-conventions.md` — if endpoint behavior, envelope, status codes, or field names changed
- `docs/architecture/backend-architecture.md` — if a new app, layer, or component was introduced

**Model or data changes** affect:
- `docs/engineering/backend/data-modeling.md` — if a field, constraint, relationship, or entity changed

**Domain rule changes** affect:
- `docs/domain/voting-rules.md` — if voting behavior, ranking, or idempotency changed
- `docs/domain/feature-voting.md` — if feature lifecycle, status transitions, or role behavior changed

**Security changes** affect:
- `docs/engineering/backend/security.md` — if authentication, authorization, or protected field rules changed

**Frontend structure changes** affect:
- `docs/architecture/frontend-architecture.md` — if the folder layout, component hierarchy, or data flow changed
- `docs/engineering/frontend/react-standards.md` — if naming, hook patterns, or component rules changed
- `docs/engineering/frontend/api-consumption.md` — if how API calls are made changed
- `docs/engineering/frontend/state-management.md` — if state placement or patterns changed
- `docs/engineering/frontend/ui-ux-guidelines.md` — if loading/error/empty state handling changed

**Architectural decisions** affect:
- `docs/decisions/ADR-001-monorepo-structure.md` or `docs/decisions/ADR-002-voting-model.md` — if the change challenges or supersedes a recorded decision

### Step 3 — Read each affected document

Read every document identified in Step 2. Read the full document — do not skim.

For each document, record:
- What the document currently says about the changed behavior
- The exact section or paragraph that is relevant

### Step 4 — Compare implementation against documentation

For each affected document section identified in Step 3, compare it against the changed code.

Ask for each:

1. Does the document accurately describe what the implementation does now?
2. Does the implementation comply with what the document requires?
3. Are there fields, endpoints, rules, or behaviors in the implementation that the document does not mention?
4. Are there fields, endpoints, rules, or behaviors in the document that no longer exist in the implementation?

Record every discrepancy. A discrepancy is any case where the document and implementation do not match.

### Step 5 — Classify each discrepancy

For each discrepancy found in Step 4, classify it:

| Type | Description |
|---|---|
| `DOC_OUTDATED` | The implementation changed and the doc still describes the old behavior |
| `DOC_MISSING` | The implementation introduced new behavior that the doc does not cover |
| `DOC_EXCESS` | The doc describes behavior that no longer exists in the implementation |
| `IMPL_DRIFT` | The implementation does not match what the doc requires — the doc is correct, the code is wrong |

`IMPL_DRIFT` is a code defect, not a documentation issue. Surface it immediately and do not update the doc to match incorrect code.

### Step 6 — Update documentation

For every `DOC_OUTDATED`, `DOC_MISSING`, and `DOC_EXCESS` discrepancy, update the relevant document.

Requirements for updates:
- Write updates in the same style and format as the surrounding content
- Do not rewrite entire documents — update only the sections that are inaccurate
- Do not remove content that is still accurate
- Do not add content that is speculative or not reflected in the current implementation
- For API changes: update field names, types, example shapes, and status codes to match the actual implementation
- For domain rule changes: update the exact rule statement to match actual enforced behavior
- For structural changes: update folder paths, component names, and layer descriptions to match actual code

### Step 7 — Check for ADR impact

If the change:
- Contradicts a decision in `docs/decisions/`
- Supersedes a decision in `docs/decisions/`
- Introduces a new structural or architectural pattern not covered by any existing ADR

Then surface this explicitly. Do not silently update an ADR — flag it for human review and decision.

If a new ADR is required, describe what the decision is and why it was made. Do not write the ADR without confirmation.

### Step 8 — Verify consistency across documents

After updates are made, verify that no two documents now contradict each other.

Specifically check:
- That `docs/engineering/backend/api-conventions.md` and `docs/engineering/backend/data-modeling.md` agree on field names and types
- That `docs/domain/voting-rules.md` and `docs/domain/feature-voting.md` agree on voting behavior
- That `docs/architecture/backend-architecture.md` and `docs/engineering/backend/data-modeling.md` agree on entity ownership
- That `docs/architecture/frontend-architecture.md` and `docs/engineering/frontend/react-standards.md` agree on folder structure

If a contradiction is found after updates, resolve it before finishing.

---

## Expected Output

Produce a structured sync report with the following sections:

### Changed Files Reviewed

List every file read, with a one-line summary of what changed.

### Documents Affected

List every document in `docs/` that required review, with:
- Whether it was updated (`UPDATED`) or required no change (`NO CHANGE`)
- A one-line summary of what was updated (if applicable)

### Discrepancies Found

List every discrepancy with:
- **Type**: `DOC_OUTDATED`, `DOC_MISSING`, `DOC_EXCESS`, or `IMPL_DRIFT`
- **Document**: which doc was affected
- **Section**: which section within the doc
- **Description**: what the mismatch was
- **Resolution**: what was done (doc updated, impl flagged, ADR flagged)

### ADR Impact

List any decisions in `docs/decisions/` that were touched or should be reconsidered. Include a recommendation.

### Summary

- Total documents reviewed
- Total documents updated
- Total `IMPL_DRIFT` issues found (these require code fixes, not doc fixes)
- Overall verdict: `DOCS IN SYNC`, `DOCS UPDATED`, or `ACTION REQUIRED` (if `IMPL_DRIFT` or ADR issues exist)

---

## Failure Conditions

Stop and surface the issue if any of the following occur:

- An `IMPL_DRIFT` is found — do not update the doc to match wrong code; flag the code defect
- A changed file cannot be read — report the file access issue and stop
- A required document in `docs/` does not exist — report the missing doc and stop; do not create new docs without confirmation
- Two documents contradict each other after updates — resolve the contradiction before finishing

---

## References

- `docs/architecture/system-overview.md`
- `docs/architecture/backend-architecture.md`
- `docs/architecture/frontend-architecture.md`
- `docs/domain/feature-voting.md`
- `docs/domain/voting-rules.md`
- `docs/engineering/backend/data-modeling.md`
- `docs/engineering/backend/api-conventions.md`
- `docs/engineering/backend/security.md`
- `docs/engineering/frontend/react-standards.md`
- `docs/engineering/frontend/api-consumption.md`
- `docs/engineering/frontend/state-management.md`
- `docs/engineering/frontend/ui-ux-guidelines.md`
- `docs/decisions/ADR-001-monorepo-structure.md`
- `docs/decisions/ADR-002-voting-model.md`

# Repository-Wide Operating Rules

## Scope

These rules apply to all work across this repository: frontend, backend, docs, configuration, and any cross-layer changes. They are operational constraints, not suggestions. Agents must follow them during planning, implementation, editing, and review.

---

## 1. Documentation Priority

`docs/` is the authoritative source of truth for this repository.

**Mandatory:**
- Read relevant docs before implementing any non-trivial change. Do not assume you know what the doc says — read it.
- The following docs are always relevant for structural decisions:
  - `docs/architecture/system-overview.md` — domain model and system invariants
  - `docs/architecture/backend-architecture.md` — backend layer responsibilities
  - `docs/architecture/frontend-architecture.md` — frontend architectural constraints
  - `docs/domain/voting-rules.md` — authoritative voting behavior
  - `docs/engineering/backend/api-conventions.md` — API contract standard
  - `docs/engineering/backend/security.md` — security posture
- When code conflicts with docs, surface the conflict explicitly before proceeding. Do not silently diverge.
- When docs are missing or ambiguous on a point, surface that ambiguity explicitly. Do not invent behavior.
- When a decision changes what a doc describes, update the doc. Implementation and documentation must stay aligned.

**Forbidden:**
- Silently inventing behavior that is not defined or implied by docs.
- Implementing a pattern that contradicts a documented constraint without flagging it first.
- Treating undocumented behavior as intentionally left open unless confirmed.

---

## 2. Scope Control

Every change must be the smallest correct change that achieves the stated goal.

**Mandatory:**
- Identify the affected layer (frontend, backend, docs, or cross-layer) before writing any code.
- Limit the change to what was requested.
- If a related issue is noticed but not requested, surface it as a separate observation — do not fix it inline.

**Forbidden:**
- Refactoring unrelated code during a scoped task.
- Opportunistic cleanup that was not part of the task.
- Broad sweeping changes across the repository without explicit instruction.
- Adding features, abstractions, or utilities beyond what the task requires.
- Introducing backwards-compatibility shims, unused variable renames, or removed-code comments unless explicitly requested.

---

## 3. Layer Boundaries

Frontend and backend responsibilities are strictly separated.

**Mandatory:**
- Backend owns business logic, data integrity, ranking, validation, and authorization.
- Frontend is an API consumer. It renders what the API returns.
- Every cross-layer interaction goes through the documented API contract.
- The API contract is the explicit boundary. Nothing crosses it implicitly.

**Forbidden:**
- Reimplementing backend logic in frontend code.
- Deriving domain state (vote counts, ranking, permissions) in the frontend without explicit API data.
- Making the frontend a co-authority on domain decisions.
- Making backend views or serializers aware of frontend-specific concerns.
- Any pattern where client-supplied data bypasses the backend's authority over identity, votes, ranking, or status transitions.

---

## 4. File Creation and Editing Discipline

**Mandatory:**
- New files must follow the repository's existing naming conventions and directory structure.
- New backend files must follow the app-module layout defined in `docs/architecture/backend-architecture.md`.
- New frontend files must follow the directory structure defined in `docs/architecture/frontend-architecture.md`.
- Before creating a new file, verify no existing file serves the same purpose.
- Before creating a new abstraction, verify it is used in more than one place in the current implementation.

**Forbidden:**
- Creating new top-level directories without explicit justification.
- Duplicating documentation, helpers, or abstractions that already exist.
- Creating utility modules or helper files for single-use operations.
- Writing new files when editing an existing file would be sufficient.

---

## 5. Cross-Layer Changes

Changes that affect both frontend and backend are architectural in nature and must be treated as such.

**Mandatory:**
- Identify the contract change first before modifying either layer.
- Implement the backend change, then adapt the frontend to the new contract.
- Leave no partial state where one layer expects a contract the other does not yet implement.
- Verify end-to-end consistency after both layers are updated.

**Forbidden:**
- Partial cross-layer changes that leave frontend and backend out of sync.
- Changing an API response shape without identifying all frontend consumers.
- Making breaking API changes without explicit acknowledgment and corresponding frontend updates.
- Introducing a new API field in the backend without defining how the frontend should handle it, or vice versa.

---

## 6. Testing and Validation

**Mandatory:**
- Identify what tests must be added or updated for every non-trivial change.
- Business rules, security constraints, and domain invariants must always have test coverage.
- Negative paths (unauthorized access, invalid input, duplicate operations) must not be skipped.
- Tests must be close to the behavior they validate. Do not test implementation details.

**Forbidden:**
- Merging changes that introduce untested business rules.
- Skipping tests for negative paths or constraint-sensitive behavior.
- Rewriting existing passing tests unless they are provably wrong.
- Prioritizing coverage numbers over meaningful behavioral coverage.

---

## 7. Repository Consistency

Agents must prefer patterns that already exist in this repository over introducing new ones.

**Mandatory:**
- Check existing code for established patterns before choosing an approach.
- When multiple valid approaches exist, choose the one that aligns with current repository conventions.
- Surface deviations from established patterns explicitly if they are truly necessary.

**Forbidden:**
- Introducing personal style preferences that conflict with established patterns.
- Silently mixing new patterns into existing code without justification.
- Applying patterns from other projects that have no equivalent in this repository.

---

## 9. Prompt Logging

Every user instruction must be logged in `PROMPT_HISTORY.md` at the project root.

**Mandatory:**
- Every prompt received must be appended to `PROMPT_HISTORY.md` before the work is declared complete.
- Each entry must use the structured format: timestamp (ISO 8601), short summary, full prompt content under `### Prompt`, and description of what was done under `### Action Taken`.
- The file is append-only. Existing entries must never be modified or removed.
- Entries must be in chronological order.
- The full prompt content must be logged. Truncation is prohibited.

**Forbidden:**
- Skipping a prompt entry for any reason.
- Logging to an alternative file (`prompts.txt` or any other name).
- Using unstructured or plain-text format instead of the required Markdown structure.
- Truncating, summarizing, or paraphrasing the prompt in the `### Prompt` field.
- Declaring work complete before the prompt entry has been appended.

---

## 8. Anti-Patterns — Explicitly Forbidden

The following behaviors are prohibited across all work in this repository:

- **Silent divergence from docs:** Never implement behavior that contradicts documented rules without surfacing the conflict.
- **Cross-layer hacks:** Never circumvent the API boundary with shared state, coupling, or unauthorized field passing.
- **Architecture drift:** Never introduce structural patterns that deviate from the documented architecture without explicit approval.
- **Broad refactors without reason:** Never touch unrelated code as part of a scoped task.
- **Inventing system behavior from assumptions:** Never guess what a rule should be when documentation exists to consult.
- **Opportunistic complexity:** Never add abstractions, helpers, or utilities that are not required by the current task.
- **Leaving the system inconsistent:** Never finish a task that leaves frontend and backend out of sync, or code and docs misaligned.

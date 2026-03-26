# UI/UX Guidelines

This document defines the behavioral and interaction standards for the frontend application. It specifies how the interface must respond to user actions, how application state is communicated, and what interaction patterns are consistent and mandatory.

This document does not define colors, typography, or branding. It defines behavior.

It is aligned with:
- `docs/domain/feature-voting.md` — domain rules that UI must reflect accurately
- `docs/architecture/frontend-architecture.md` — structural constraints that shape what the UI can do
- `docs/engineering/frontend/state-management.md` — how state drives UI rendering

---

## 1. Core UX Principles

### Clarity over cleverness

Every UI element does what it appears to do. Labels match actions. State is visible. Interactions are predictable. There are no surprising behaviors, hidden triggers, or actions that produce effects the user could not have anticipated from the interface.

### Consistency across all screens

The same action performed in different parts of the application behaves identically. Vote buttons on the list and on the detail page follow the same states and feedback patterns. Form validation errors appear in the same position and format on every form. Loading states look and behave the same way throughout.

### Explicit feedback for all user actions

Every action produces a visible response. A button click produces a loading state. A successful form submission produces a confirmation. A failed request produces an error message. There are no actions that complete — or fail — in silence.

### Minimal cognitive load

The interface communicates what the user needs to act. It does not present irrelevant information, multiple competing actions at the same priority level, or unclear next steps. Each screen has a primary purpose and the UI is organized around it.

### Predictable interaction patterns

A user who learns how to vote on one feature knows how to vote on all features. A user who sees a status badge on the list knows what to expect when they see one on the detail page. Patterns are introduced once and applied consistently.

### Prohibited behaviors

- Hidden actions — actions that exist but require the user to discover them by accident
- Unclear UI states — a UI element that could be interpreted as active or inactive is a defect
- Inconsistent behavior between similar components — a vote button that works differently in two places is prohibited

---

## 2. Feature List Behavior

### Display order

Features are displayed in the order returned by the API: `vote_count` descending, then `created_at` descending, then `id` descending. This order is authoritative. The frontend does not sort, reorder, or override it.

### Required information per list item

Each item in the feature list must display:

- **Title** — the primary identifier; must be legible at a glance
- **Description** — truncated to a readable length; must not overflow or wrap excessively
- **Vote count** — displayed as a number with a clear label (e.g., "42 votes"); the primary ranking signal
- **Vote state** — the current user's vote status must be visually distinguishable (voted vs not voted)
- **Category** — displayed as a label or badge; provides context without dominating
- **Status** — displayed as a badge; communicates lifecycle stage
- **Author** — minimal display using `author.name`; not a link to a profile in MVP

### Scannability

The list must be scannable. Title and vote count must be immediately readable without requiring the user to parse the full item. Secondary information (category, status, author) supports context but does not compete with the primary signal.

### Pagination

The list is paginated. Page controls are visible when `meta.total_pages > 1`. The current page number and total pages are displayed. Navigation to previous and next pages is available. Navigating to a new page shows a loading state while the new page loads; the previous page content is not blanked during this transition.

### Filtering

When active filters are applied, the list reflects filtered results. An active filter state is visible to the user — the user can see what is currently filtered and can clear individual filters or all filters. An empty result set from filtering triggers the empty state for filtered results (Section 10), not the general empty state.

---

## 3. Feature Detail View

### Information hierarchy

The detail view presents the full feature request. The hierarchy is:

1. Title — prominent, immediately readable
2. Vote action — the primary interactive element; voting is the central action
3. Description — full text, not truncated
4. Category and status — visible, clearly labeled, secondary to the title
5. Author and submission date — attribution context, lowest visual priority

### Vote state on detail

The vote button on the detail page reflects the same `has_voted` state as the list. If the user has voted, the button is in its voted state. If they have not, it is in its unvoted state. These must be consistent — if the user votes on the detail page and navigates back to the list, the list reflects the updated vote state.

### Action clarity

The primary action area (vote/unvote) is unambiguous. The user always knows whether a click will cast or remove a vote. The button label or visual state makes the current and resulting state clear.

### Admin-only elements

Status change controls are visible only to admin users. Regular users see the current status but have no UI element to change it. This is a display rule — the backend enforces the permission regardless.

---

## 4. Voting Interaction

### Vote button states

The vote button has four distinct visual states. Each must be distinguishable from the others:

| State      | Condition                                          | User sees                                              |
|------------|----------------------------------------------------|--------------------------------------------------------|
| Unvoted    | `has_voted` is `false`, no action in progress      | Button indicates the user has not voted; action is to vote |
| Voted      | `has_voted` is `true`, no action in progress       | Button indicates the user has voted; action is to unvote |
| Loading    | Mutation is in flight                              | Button is disabled; a loading indicator is visible     |
| Disabled   | User is not authenticated                          | Button is disabled or replaced with a prompt to log in |

The transition between states must be immediate when driven by optimistic update, and must settle to the server-confirmed state when the response arrives.

### Feedback on vote action

When the user clicks the vote button:
1. The button immediately enters the loading state (disabled, loading indicator visible).
2. The optimistic update applies: `has_voted` and `vote_count` are updated in the UI immediately.
3. When the response arrives, the UI settles to the values in the `VoteResponse` (which may match the optimistic values).
4. If the request fails, the UI rolls back to the pre-action state and an error message is shown.

### Repeated clicks

The vote button is disabled while a mutation is in flight. A second click before the response arrives does nothing. After the response settles, the button is re-enabled and a second interaction is processed normally.

### Failure communication

If the vote or unvote request fails, the vote button returns to its pre-action state and an error message is displayed near the button. The error message must describe that the action failed. The vote count and `has_voted` state revert to their pre-action values.

### Unauthenticated users

Unauthenticated users cannot vote. The vote button is either disabled with a tooltip or replaced with a prompt to log in. The current vote count is visible to all users regardless of authentication.

---

## 5. Create Feature Flow

### Form structure

The create feature form presents exactly the fields required to submit a feature request:

| Field         | Input type          | Notes                                                   |
|---------------|---------------------|---------------------------------------------------------|
| Title         | Text input          | Required; short, descriptive                            |
| Description   | Textarea            | Required; full explanation of the need                  |
| Category      | Select / dropdown   | Required; populated from `GET /api/categories/`         |
| Rate          | Number input or segmented control | Required; integer 1–5                   |

No other fields appear. `author`, `status`, and `vote_count` are not present — they are backend-assigned.

### Validation feedback

Frontend validation runs before submission to catch obvious errors (empty required fields, rate out of range). Errors are shown immediately below or adjacent to the offending field. Field-level errors from the API (`400` response with `error.details`) are also shown at the field level, not as a page-level message.

### Submission flow

1. User fills out the form and submits.
2. Frontend validation runs. If it fails, errors are shown inline. The request is not sent.
3. If validation passes, the submit button is disabled and shows a loading state.
4. The request is sent.
5. On success (`201 Created`): the user is navigated to the new feature's detail page or back to the list, and the list cache is invalidated.
6. On failure: the submit button is re-enabled, validation errors from the API are shown at the field level, and any non-field error is shown as a form-level message.

### Success communication

Navigation to the created feature or the feature list is sufficient confirmation of success. A transient success toast or banner is acceptable but not required. The user must not be left on a blank or stale form state after a successful submission.

---

## 6. Status Representation

### Display

Status is displayed as a badge on both the list item and the detail view. The badge displays `status.name`. The `status.color` value from the API is used for the badge's visual styling.

### Semantics in UI

Status communicates product decision, not popularity or priority. The UI must not present status as a ranking signal. A "Planned" feature is not presented as more important than an "Open" feature — ranking is determined by `vote_count`, not status.

### Terminal states

When `status.is_terminal` is `true` (e.g., Completed, Rejected), the UI may apply additional visual treatment to indicate the feature is no longer active (e.g., reduced visual weight on the vote button). Terminal status does not hide the feature from the list or disable information display.

### Status must not affect list order

The list order is determined by the API response. The frontend does not sort or group by status. A "Completed" feature with 100 votes appears above an "Open" feature with 50 votes.

---

## 7. Category Representation

### Display

Category is displayed as a label or badge on list items and the detail view. The badge displays `category.name`. `category.icon` and `category.color` from the API are used to render visual styling if the design includes them.

### Role in navigation

Categories are used for filtering. A user can filter the list by selecting a category. The active filter is visually indicated. Clearing the filter restores the full ranked list.

### Categories must not imply priority

A feature in the "Performance" category is not displayed as more or less important than one in the "UI" category. Category is a classification, not a ranking. The UI must not suggest otherwise.

### Category display must not dominate

Category is secondary information. On a list item, it must not visually compete with the title and vote count. It is present for context, not as the primary signal.

---

## 8. Loading States

### When to show a loading indicator

| Context                         | Loading treatment                                                     |
|---------------------------------|-----------------------------------------------------------------------|
| Initial page or section load    | Spinner or skeleton in place of the content area                     |
| Navigating to a new page        | Spinner or skeleton while the new page's data loads                  |
| Paginating the list             | Loading indicator visible; existing content remains until new page is ready |
| Form submission in progress     | Submit button disabled, showing a loading label or spinner           |
| Vote / unvote in progress       | Vote button disabled, loading indicator visible on the button        |
| Background refetch (TanStack)   | No loading indicator shown to the user                               |
| Dropdown / select populating    | Show a loading state inside the select if reference data is not yet available |

### Skeleton vs spinner

Skeletons are preferred for content areas where the shape of the content is known (e.g., the feature list). Spinners are appropriate for smaller scoped actions (button loading states, inline actions). Full-page spinners that blank the entire screen are not used.

### Loading must not block unrelated UI

A loading state in the feature list does not disable the navigation, header, or filter controls. Independent sections of the page have independent loading states.

---

## 9. Error States

### Levels of error display

| Error scope        | Display location                                                   |
|--------------------|--------------------------------------------------------------------|
| Field-level (form) | Directly below the relevant form field                             |
| Form-level         | Above or below the form submit button, as a visible error summary  |
| Section-level      | In place of the content section that failed to load               |
| Page-level         | In place of the page content for `404` and unrecoverable errors    |

### Error message content

Error messages are written in user-facing language. They describe what went wrong and, when possible, what the user can do. Raw backend error strings, HTTP status codes, and stack traces are never shown to the user.

| Error type          | User-facing message (examples)                                    |
|---------------------|-------------------------------------------------------------------|
| Required field      | "Title is required."                                              |
| Rate out of range   | "Rate must be between 1 and 5."                                   |
| Vote failed         | "Your vote could not be saved. Please try again."                 |
| Feature not found   | "This feature request no longer exists."                          |
| Permission denied   | "You do not have permission to perform this action."              |
| Server error        | "Something went wrong. Please try again later."                   |

### Retry

For section-level and page-level errors caused by network or server failures, a retry button or link is provided where appropriate. The retry re-triggers the failed query. For form submission failures, the user retries by submitting the form again — no automatic retry occurs.

---

## 10. Empty States

### When empty states appear

| Condition                                    | Empty state message                                           |
|----------------------------------------------|---------------------------------------------------------------|
| No feature requests exist at all             | Inform the user no features have been submitted; offer a link or button to create one |
| No results match the active filters          | Inform the user the filters returned no results; provide a clear action to clear filters |
| A paginated page beyond total results        | This case is handled by the API returning an empty `data` array; display the same empty-filtered-results state |

### Empty states must guide the user

An empty state is not a blank page. It contains:
- A clear statement of why the content is absent
- A contextual next action when appropriate (e.g., "Submit the first feature request" with a link to the create form)

### Empty states must not be ambiguous

A user looking at an empty list must know whether the list is empty because nothing exists, because their filters returned no results, or because an error occurred. These are three different states and each has a distinct message.

---

## 11. Feedback and Transitions

### All actions produce feedback

| Action                        | Feedback                                                            |
|-------------------------------|---------------------------------------------------------------------|
| Vote / unvote                 | Immediate loading state on button; UI updates on response           |
| Create feature (success)      | Navigation to the new feature or the updated list                   |
| Create feature (failure)      | Inline field errors and/or form-level error message                 |
| Update feature (success)      | Form resolves; user sees the updated state                          |
| Update feature (failure)      | Form remains; error shown at field or form level                    |
| Delete feature (if supported) | Confirmation prompt before action; redirect after success           |
| Filter applied                | List updates to reflect filtered results                            |
| Filter cleared                | List returns to the full ranked view                                |
| Page navigation               | New page loads with a visible loading state                         |

### No abrupt changes

A content area does not jump, flicker, or shift position without explanation. Loading skeletons preserve the approximate layout of the content they replace. When new content arrives, it replaces the skeleton smoothly.

### No unexplained state changes

If the UI changes — a vote count updates, a status badge changes, a feature disappears from the list — the reason is apparent from the user's action or from a visible system event. Spontaneous changes without context are prohibited in MVP (there is no real-time update layer).

---

## 12. Accessibility

### Semantic HTML

Use the correct HTML element for every purpose. Buttons are `<button>`. Navigation links are `<a>`. Form fields are `<input>`, `<select>`, or `<textarea>`. Lists are `<ul>` or `<ol>` with `<li>`. Headings use `<h1>`–`<h6>` in logical hierarchy. No `<div>` or `<span>` elements with click handlers in place of interactive elements.

### Keyboard accessibility

Every interactive element is reachable via Tab and operable via keyboard:
- Buttons activate on Enter and Space
- Links activate on Enter
- Select dropdowns open on Space or Enter, navigate with arrow keys
- Modals trap focus while open and return focus to the trigger when closed

### Form labels

Every form input has a visible `<label>` associated via `htmlFor`. Placeholder text is supplementary — it is not used as the sole label for a field. When a field has an error, the error message is associated with the input via `aria-describedby`.

### Focus states

Focus is visible at all times. The default browser focus ring is not removed unless a custom replacement is provided that is equally or more visible. Every interactive element shows a clear focus indicator when navigated to via keyboard.

### Button and action text

Buttons have meaningful text. "Vote" and "Remove vote" are acceptable. A button containing only an icon must have an `aria-label` that describes the action. "Submit", "Save", and "Cancel" are acceptable. "Click here" is not.

### Loading and disabled states

When a button or form is disabled, `disabled` is set on the HTML element — not simulated through CSS alone. When a loading state is active on a button, `aria-busy="true"` or an `aria-label` that reflects the in-progress state is applied. Screen reader users must be informed that an action is in progress.

### Text hierarchy

Page content uses a logical heading hierarchy. Each page has one `<h1>` that names the page or primary content area. Section headings follow in order (`<h2>`, `<h3>`). Heading levels are not chosen for visual size — visual size is controlled by styling.

---

## 13. Consistency Rules

### Interaction patterns are applied once and reused

If vote buttons follow a specific pattern on the list page, the identical pattern is used on the detail page. If error messages appear below form fields on the create form, they appear below form fields on the edit form. New patterns are not introduced for the same interaction type.

### Labels and terminology match the domain

UI labels match the terminology defined in `docs/domain/feature-voting.md`:
- "Vote" and "Remove vote" (or "Unvote") for the voting action
- "Feature request" or "Feature" for the primary entity (use consistently, do not alternate with "idea", "suggestion", "ticket")
- Status names match the controlled values from the API (`status.name`)
- Category names match the controlled values from the API (`category.name`)

UI copy must not invent alternative names for domain concepts.

### Spacing and layout patterns

Page layout, card structure, form layout, and list item structure follow a defined pattern. The same type of content in different parts of the application uses the same structural pattern. An engineer implementing a new page uses the existing pattern — they do not design a new layout for the same content type.

### Interactive elements behave the same everywhere

A disabled button is always visually consistent with other disabled buttons. A form error is always positioned and styled the same way. A loading spinner on a button looks the same on every button that uses one.

---

## 14. Anti-Patterns

These behaviors are prohibited. Any implementation exhibiting them must be corrected before merge.

| Anti-pattern                                                  | Why it is prohibited                                                 |
|---------------------------------------------------------------|----------------------------------------------------------------------|
| Client-side reordering of the feature list                    | Ranking is defined by the API. The frontend reflects it, does not override it. |
| Vote button with no visible loading state during mutation     | All actions produce feedback. Silent in-progress states are prohibited. |
| Vote count updated by local math after a vote                 | `vote_count` comes from `VoteResponse`. Local arithmetic is prohibited. |
| Ambiguous vote button state (could be voted or not voted)     | The user must always know their current vote state unambiguously.    |
| Form submission with no loading state on the submit button    | The user must know the form is processing.                           |
| Form validation errors shown only as a top-level alert        | Field-level errors appear at the field. Generic alerts are supplementary only. |
| Empty list shown as blank space without explanation           | Empty states are informative. Blank space communicates nothing.      |
| Error swallowed without user-visible feedback                 | All errors produce visible UI. Console-only errors are prohibited.   |
| Status displayed in a way that suggests it affects ranking    | Status communicates lifecycle. It does not affect list order.        |
| Category displayed in a way that suggests it implies priority | Category classifies. It does not rank.                               |
| Rate displayed or described as a ranking or popularity signal | Rate is author sentiment. `vote_count` is the ranking signal.        |
| UI that contradicts the API response                          | The API is the source of truth. UI must reflect it, not override it. |
| Different interaction patterns for the same action on different pages | Consistency is mandatory. One pattern per action type.         |

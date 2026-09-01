---
trigger: always_on
---

# Implementation Plan Layout Standard

Every implementation plan artifact MUST follow this exact structure. No
exceptions.

````
# [Title — Descriptive, Project-Specific]

> **Design Read:** [1-line project context]. Vibe: *[adjectives]*. Dials: `KEY: N / KEY: N`.

---

## Scope Summary

[1 paragraph: how many changes, which pages/areas, backend impact, new deps needed/not]

---

## Change N — [Short Descriptive Title]

**Goal:** [1 sentence: what and why]

### Files Affected
- [`filename.ext`](file:///abs/path) lines X–Y
- [more files with line refs]

### Research Basis (if applicable)
[Numbered list of research-backed decisions with real project/tool examples]

### Dependencies Check (if applicable)
- `package`: **present/NOT present** (`^version`) — [purpose]
> [!WARNING] / [!IMPORTANT] / [!NOTE] blocks for risks, gotchas, alternatives

### Exact Changes
[Per-file, with exact line numbers and diff blocks:]
`filename.ext` line X:
\```diff
- old line
+ new line
\```

### Verification
- [Specific Playwright/grep/CLI commands]
- [Regression checks]

---

[Repeat Change N+1, N+2, etc.]

---

## Implementation Sequence

| Step | File | Risk | Rollback |
|------|------|------|---------|
| N | `file` — description | Low/Med/High | [how to undo] |

> [!WARNING] for highest-risk steps

---

## Definition of DONE

All must be physically verified via Playwright MCP:

- [ ] [specific, measurable, observable criterion]
- [ ] [regression items]
- [ ] [no console errors, no broken routes]
````

Rules:

- ALWAYS include line numbers for affected code
- ALWAYS use `diff` blocks for exact changes
- ALWAYS use GitHub alerts (WARNING/IMPORTANT/NOTE) for risks and gotchas
- ALWAYS include a Dependencies Check for any change touching imports/packages
- ALWAYS include per-change Verification with regression
- ALWAYS end with a checkbox Definition of DONE
- NEVER omit research basis when categories/terminology/design decisions are
  involved
- NEVER produce a generic checklist — every item must be directly executable

# Known issues

_No open issues._

---

## RESOLVED 2026-07-20 — `CLAUDE.md` / `AGENTS.md` divergence

**Status:** closed. Recorded 2026-07-20 during the agents-realtime 3.0.x adoption, reconciled the same day.

### What was wrong

`CLAUDE.md` was 229 lines and `AGENTS.md` was 85. `AGENTS.md` carried its own Codex-specific delegation
section but delegated everything else to its peer with the line *"everything else in `CLAUDE.md` (dedupe,
validate, persist, draft-on-edit) applies unchanged"*.

### The original diagnosis was wrong, and the correction matters

This was first recorded as a *byte-for-byte sync-rule violation*. It was not. The two files address two
different runtimes, so byte equality was never the right target — and "fixing" it by flattening them into one
byte-identical file would have **deleted** the Codex typed-spawn contract. A rule applied without checking
whether it fits is how a correct-looking change destroys content.

The real defect was narrower and more serious: **Codex loads `AGENTS.md`, and nothing forces it to open
`CLAUDE.md`.** So the guide the Codex runtime actually reads was missing Step 0 (common-name
disambiguation), the critical sibling-taxon dedupe in Step 1, the validation gate, and the draft-on-edit
invariant. That is not documentation hygiene — it is a curation run reaching the database without its
safeguards.

### How it was closed

The workspace guide gained an explicit **intent-parity rule** for the agent-driven submodules: the pair must
be identical in intent — same workflow, steps, rules, invariants and warnings, stated **in full in both
files** — with only each runtime's delegation syntax allowed to differ, and **neither file may delegate its
content to the other**.

Both files were merged into one body stating both the Claude `Task` path and the Codex typed-spawn path, which
lands them at byte equality anyway. `scripts/guide-marker.test.ts` (edit-level assertions only) was replaced
by `scripts/guide-pair.test.ts`, which asserts whole-file parity, that both runtimes' syntax appears in both
files, and that neither file reintroduces a "see the other file" delegation.

### The lesson worth keeping

A guide pair split across runtimes hides a failure mode a diff does not show: a rule that exists in one file
is, for the other runtime, a rule that does not exist at all. Parity here is a safety property, not a
formatting preference — which is why it is now enforced by a test rather than by reviewer attention.

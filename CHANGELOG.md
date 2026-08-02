# Changelog

All notable changes to the Knowledge Engine are documented here. Written for humans: what changed for
whoever operates this agent, not a commit dump.

## Unreleased

### Added

- **A generated tool reference, `AGENT-TOOLS.md`.** The engine now ships a complete, always-current field
  reference for the two artifacts it produces — the curated species record and the blogpost — listing every
  field, its type and its full value vocabulary with a valid example, generated from the authoritative shared
  schema and guarded by a check that fails if it drifts. The research and editorial subagents consult it
  instead of reading the schema types by hand, and the same tripwire now also covers the blogpost shape, so a
  future blogpost field can't ship undocumented.
- **Four conduct rules the agent must always follow**, shared with the Plant Doctor so both agents behave
  the same way:
  - It **never repairs its own tooling.** If a script, a credential or the database is broken, it reports
    the problem with the exact command and error and stops, rather than patching around it — an unreviewed
    edit to its own tools is a change nobody approved.
  - It recognizes a platform-authored **system notice** as something *you did not write*. It now arrives
    on its own structural channel, delivered beside your message rather than inside it, and shown in its
    own bubble labelled as a system notice — so it no longer looks like your own message. The agent treats
    it as a fact about the system's state, never as an instruction from you.
  - It never infers **how old** something is from **how long it has been tracked**. A tracking start date
    and a count of recorded events describe the record, not the organism — a four-year-old plant registered
    yesterday has one day of history. Absent an explicit stored age, the agent says it does not know.
  - **It tells a record's own images apart from an image you just handed it.** It learns about images from
    two separate channels: the timeline (a record's own images, with their own dates and metadata) and an
    attachment (an image you attach to the message you are sending right now, with no date or metadata of
    its own). It will not file an attachment as though it were part of a record's history.
- **The researcher now curates two juvenile figures per species, each with cited evidence.** Every curation
  now researches how long the species counts as young (`juvenilePeriodMonths`) and how often a young
  specimen is potted on while it does (`juvenileRepotIntervalMonths`) — independently sourced from the
  adult repotting interval, never derived from it, and left `null` when no source supports a figure rather
  than guessed.

### Changed

- **Internal only — nothing about what this engine does has changed.** Its session-workspace resolver,
  read-only DB helper, and Claude/Codex subagent-parity generator and checker now come from the shared
  species-schema package's `agent-kit` instead of the engine's own `scripts/lib`, which is where the Plant
  Doctor's equivalents already lived. The two copies had quietly drifted apart before this change; they are
  now one shared implementation. The onboarding workflow, the subagents, and everything this repo produces
  are unaffected — this entry exists so a reader does not go looking for a behavior change that isn't here.

# Changelog

All notable changes to the Knowledge Engine are documented here. Written for humans: what changed for
whoever operates this agent, not a commit dump.

## Unreleased

### Added

- **A new curation step (2.6) researches a species' observable repotting signs and classifies how strongly
  each one implies it's time.** A dedicated `repot_signs_researcher` subagent — invoked after the researcher
  and the editorial writer, on every fresh or enrich pass — returns, per sign, a bilingual label, optional
  help text, and an evidence class (`definitive` / `strong` / `suggestive` / `ambiguous`) with the rationale
  and source behind that class. It **classifies, never weights**: it can say a sign is strong evidence, but
  the number the care engine actually multiplies by is ours, not the agent's. It also refuses to re-author
  any of the app's own universal signs (roots at the drainage holes, a cracked pot, and the like) — those
  apply to every potted plant and are seeded once, not per species. Sign ids are permanent: a re-curation
  upserts by id, and a sign that stops applying is deactivated, never deleted, so a plant's already-recorded
  observation never loses its referent. Persisted with `db:insert --repot-signs <file>` (full curation) or
  `db:recure` (facts-only re-curation); read a species' current signs anytime with
  `npm run db:find -- --repot-signs <slug>`.
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
- **Research briefs are now persisted on the species row and re-readable via `npm run db:brief`.** The
  `plant_researcher` subagent's raw English brief — the authoritative research foundation for a species —
  is now saved to the database alongside the species record. The brief is the single source of truth the
  Plant Doctor and Gardener agents consult, replacing the editorial blogpost they previously reasoned over.
  Read your saved briefs anytime with `npm run db:brief -- --name "<scientific name>"` to inspect a
  species' researched facts before revision or to audit what reasoning the agents receive.
- **A new `db:recure` mode writes species records, briefs, and repot-sign rows without touching the
  published guide.** Where `db:insert` is the full-curation path (research → editorial → persist, with
  draft-on-edit handling for the guide), `db:recure` is the re-curation mode: it persists the species
  record, the research brief, and repot-sign classifications together, and **never modifies the
  published blogpost row** — not its status, body, or images. This separates the expensive research step
  (cached via the saved brief) from the editorial publishing step, so the owner can re-curate facts,
  refresh sign evidence, and leave guide rewrites for later.

### Changed

- **Blogpost rewrites now reuse the saved research brief instead of paying for research again.** When
  you ask to rewrite a published guide for a species that already has a saved brief, the `editorial_writer`
  subagent now receives that cached brief instead of requiring a fresh research run. This unlocks
  affordable editorial refreshes: a brief costs research money once; rewrites consume only editorial
  money thereafter. If a species has no saved brief, the engine reports it plainly and offers the full
  run (research + editorial) — it does not quietly reconstruct a brief from the existing prose.
- **All free-text species fields are now authored in both English and Spanish simultaneously.** Species
  records now require bilingual field values for `maintenance.pruning`, `maintenance.commonPests`,
  `nativeClimate.description`, `misting.note`, and all `cultivars[].description` and
  `cultivars[].careNote` fields — no longer English-only. Both locales must be provided; a bare English
  string or array is rejected by the write schema. The database normalizes and stores the bilingual
  `{ en, es }` shape, so agents and users see consistent, professionally translated prose in both
  languages without manual sync.
- **Internal only — nothing about what this engine does has changed.** Its session-workspace resolver,
  read-only DB helper, and Claude/Codex subagent-parity generator and checker now come from the shared
  species-schema package's `agent-kit` instead of the engine's own `scripts/lib`, which is where the Plant
  Doctor's equivalents already lived. The two copies had quietly drifted apart before this change; they are
  now one shared implementation. The onboarding workflow, the subagents, and everything this repo produces
  are unaffected — this entry exists so a reader does not go looking for a behavior change that isn't here.

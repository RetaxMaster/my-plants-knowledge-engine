# my-plants-knowledge-engine

A **Claude-driven research workspace** that turns a plant's scientific name into a **validated,
curated species record** plus a **structured blogpost** (title / excerpt / body, in English and
Spanish), and persists both directly to the MyPlants database.

This is not a conventional service you "start". It is operated by an agent (Claude Code): the
`CLAUDE.md` in this repo is the operator's playbook, driving a `plant_researcher` subagent, an
`editorial_writer` subagent, and a set of deterministic scripts. The **database is the single
source of truth**; the `*.draft.json` files produced during research are ephemeral scratch.

All AI lives here, on purpose. The rest of MyPlants (the care app) is 100% deterministic and has
no runtime AI — knowledge is curated **once** in this engine and reused cheaply forever after.

## Where it fits

```
my-plants-species-schema   the contract this engine validates its output against
        │
        └── my-plants-knowledge-engine   ← you are here (curates species records → DB)
                    │
                    └── (writes to the shared MariaDB, read by my-plants-api)
```

Sibling repos:

- [my-plants-species-schema](https://github.com/RetaxMaster/my-plants-species-schema) — the record contract (dependency)
- [my-plants-api](https://github.com/RetaxMaster/my-plants-api) — reads the curated records this engine produces
- [my-plants-web](https://github.com/RetaxMaster/my-plants-web)

## Requirements

- Node.js 20+
- A local MariaDB server (the **same** database the API uses)
- The `@retaxmaster/my-plants-species-schema` package (installed as a packed tarball)
- Claude Code, to actually operate the research workflow

## Install & configure

```bash
npm install
cp .env.example .env   # then edit the DB_* values to point at your MariaDB
```

Environment variables (`.env`):

| Var | Meaning |
|---|---|
| `DB_HOST` | MariaDB host (e.g. `localhost`) |
| `DB_PORT` | MariaDB port (e.g. `3306`) |
| `DB_USER` | DB user |
| `DB_PASSWORD` | DB password |
| `DB_NAME` | Database name (shared with the API) |

The connection is assembled from these **separate** vars — never a hand-authored connection
string.

## Scripts

```bash
npm run validate   # validate a draft record against the species-schema contract
npm run db:list    # list the scientific names already curated (dedupe check)
npm run db:find    # pull one species' full record + blogpost by name
npm run db:dump    # dump a species' stored data
npm run db:brief   # read the saved raw research brief (read-only)
npm run db:insert  # persist a curated record + blogpost to the DB
npm run db:recure  # re-curation: writes the record, the brief and the species' repot-sign rows — never touches the blogpost
npm test           # agents:check && tools:check && typecheck && vitest run (the full gate)
npm run typecheck  # tsc --noEmit on its own — also runs as a step of `npm test`
```

To load the DB env into your shell for the `db:*` scripts:

```bash
set -a; source .env; set +a
```

## The workflow, in one paragraph

Given a plant name, the operator resolves it to a single scientific species, dedupes it against
what is already curated (`db:list` / `db:find`), runs the `plant_researcher` to produce a draft
record + a raw English brief, hands that to the `editorial_writer` to produce the polished
English + Spanish blogpost, validates the record against the schema, and inserts the record plus
the blogpost (as a **draft** a human later publishes) into the database. Full step-by-step:
`CLAUDE.md`.

The agent's field reference — every species-record and blogpost field, its type, its value vocabulary and a
valid example — is the generated [`AGENT-TOOLS.md`](./AGENT-TOOLS.md), emitted from the shared
`@retaxmaster/my-plants-species-schema` by `npm run tools:generate` and kept in sync by `tools:check` (wired
into `npm test`); the operator consults it instead of reading the schema types.

## Codex parity (subagents on both Claude and Codex)

The two subagents are authored **once** as `.claude/agents/*.md` (the source of truth) and
**generated** to `.codex/agents/*.toml` via `npm run agents:generate`. Drift is caught by
`npm test` (which runs `agents:check` first), so the Codex projection can never silently diverge
from the Claude source. Never hand-edit a `.toml`.

- `.codex/config.toml` enables Codex's `multi_agent_v2` (typed `spawn_agent`/`wait_agent`).
- Codex loads that config + the roles **only if this checkout is TRUSTED**: add
  `[projects."<abs path to this checkout>"] trust_level = "trusted"` to `~/.codex/config.toml`
  (or `$CODEX_HOME`). Without it, Codex ignores the repo's `.codex/`.
- On Codex the operator delegates with the typed spawn contract documented in `AGENTS.md`
  (`agent_type` selects the role; `task_name` is a unique execution label; `fork_turns="none"`).

`npm run agents:check-schema` is a **billable** live probe (never part of `npm test`) that certifies
`spawn_agent` is exposed AND this repo's roles actually load; it is run once during de-risk and at
each deploy to (re)write the per-engine verification record.

### Shared plumbing (agent-kit)

This repo used to carry its own copy of the same agent plumbing the Plant Doctor repo also
shipped. Migrating the doctor alone would have left three states where there are two — doctor on
the shared kit, the KE on its own drifted copy — so the KE moved onto
`@retaxmaster/my-plants-species-schema`'s `agent-kit` subpath family too. Nothing about what the
Knowledge Engine does has changed — its plumbing simply comes from the shared `agent-kit` subpath
now instead of its own `scripts/lib`. Per-file disposition:

| File | Outcome | Why |
|---|---|---|
| `lib/db.ts` | reconciled and migrated | the 7-line diff was **comment-only**; the executable code was byte-identical |
| `lib/codex-agent.ts` | reconciled and migrated | the 10-line diff was **comment-only** (each repo listed its own roles) |
| `codex-agents.test.ts` | migrated, difference **injected as a parameter** | the whole 4-line diff was the `describe()` label |
| `codex-delegation.test.ts` | migrated, difference **injected as a parameter** | same |
| `guide-pair.test.ts` | **deferred** | the KE's copy is strictly stronger (4 assertions vs 2) and the pair is under active reconciliation; "which one wins" is a design question, not a cleanup |

### `execa` / `smol-toml` / `yaml` / `mysql2` are NOT unused

Nothing in this repo's own source imports `execa`, `smol-toml` or `yaml` — a plain grep will make them look
orphaned. They are not: `@retaxmaster/my-plants-species-schema` declares all three (plus `mysql2`) as
**optional peer dependencies** for its `agent-kit`, and npm does **not** install a dependency's optional
peers on its own — the consuming repo has to carry them itself, or the kit's own imports fail to resolve at
run time. Concretely, this repo's copy satisfies:

- `smol-toml` and `yaml` — imported by the kit's `agent-kit/codex-parity/codex-agent.ts`
- `smol-toml` — also imported by `agent-kit/codex-parity/codex-delegation.ts`
- `execa` — imported by `agent-kit/cli/check-codex-spawn-schema.ts`
- `mysql2` — imported by `agent-kit/db.ts` (a real `dependency` here, for the same reason)

Removing any of them breaks `agents:check` / `agents:generate` (which run through the `smol-toml`/`yaml`/
`execa`-using modules above) and `agents:check-schema` — the latter is the probe the production deploy's
Codex re-verification window runs. Do not delete them just because nothing here imports them directly.

# Known issues

## Pre-existing sync-rule violation: `CLAUDE.md` and `AGENTS.md` have diverged

**Status:** open, recorded 2026-07-20. **Not** introduced by the agents-realtime 3.0.x adoption, and
deliberately **not** fixed by it.

The workspace sync rule requires `CLAUDE.md` ≡ `AGENTS.md` byte-for-byte, with only the H1 and the
self-reference sentence permitted to differ. In this repo they do not: as of this recording, `CLAUDE.md` is
229 lines and `AGENTS.md` is 85 (219/75 before the agents-realtime 3.0.x edits landed) — `AGENTS.md` is a
condensed **summary**, which the sync rule names explicitly as the forbidden outcome. Even individual rules
sit at different places in each file.

**Why the 3.0.x adoption did not fix it.** Reconciling the two means choosing which content is canonical for
a document that steers this agent's actual behaviour — a **behavioural change to the agent**, which deserves
its own review rather than riding along inside a package-adoption diff nobody would think to check for it.

That feature applied the same edits to both files (the `[system]` marker section, rewritten for the
structural `<agents-rt:system-message>` frame, and the two-image-channels section) and nothing more: it
introduced no new divergence and removed none of the existing one. `scripts/guide-marker.test.ts` asserts
edit-level equality for exactly that reason, and deliberately does **not** assert whole-file equality, which
would fail by design.

**To close this:** decide which file is canonical, reconcile them under their own review, then replace
`scripts/guide-marker.test.ts`'s edit-level assertions with a whole-file one.

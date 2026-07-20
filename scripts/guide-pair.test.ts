import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// This repo's CLAUDE.md/AGENTS.md pair is kept BYTE-FOR-BYTE identical except each file's H1 title (line 1)
// and its self-reference sentence ("This file (`X.md`) and its peer `Y.md` are kept **byte-for-byte
// identical** …").
//
// WHY THE STRONG ASSERTION. The two files address different runtimes — Claude Code and Codex — and the
// workspace guide's intent-parity rule allows only their DELEGATION SYNTAX to differ. The way this repo
// satisfies that rule is by stating BOTH runtimes' syntax in BOTH files, which lands the pair at whole-file
// equality anyway. That is deliberate: parity a test can fail on beats parity a reviewer has to notice.
//
// This pair previously carried a 144-line divergence (AGENTS.md was a condensed SUMMARY that delegated the
// curation workflow to CLAUDE.md with "everything else in CLAUDE.md applies unchanged"). That was a real
// safety gap, not a formatting one: Codex loads AGENTS.md and nothing forces it to open CLAUDE.md, so the
// dedupe step, the common-name disambiguation and the draft-on-edit invariant were absent from the guide
// the Codex runtime actually reads. The divergence was reconciled on 2026-07-20 by merging both files into
// one body. Do NOT reintroduce a "see the other file" delegation — it is exactly what this test exists to
// prevent.
//
// The sibling `my-plants-plant-doctor` repo asserts the same contract in its own `scripts/guide-pair.test.ts`.

const CLAUDE_MD_PATH = fileURLToPath(new URL("../CLAUDE.md", import.meta.url));
const AGENTS_MD_PATH = fileURLToPath(new URL("../AGENTS.md", import.meta.url));

// Matches this pair's actual self-reference sentence — but only the CORRECT self/peer naming for a given
// file. The two alternations must NOT be independent: "AGENTS.md ... its peer AGENTS.md" (naming itself as
// its own peer) is exactly the copy-paste slip this guard exists to catch, so it must NOT be exempted.
const selfReferenceLine = (self: "CLAUDE" | "AGENTS", peer: "CLAUDE" | "AGENTS") =>
  new RegExp(
    `^This file \\(\`${self}\\.md\`\\) and its peer \`${peer}\\.md\` are kept \\*\\*byte-for-byte identical\\*\\* except each file's$`,
  );

const CLAUDE_SELF_REFERENCE_LINE = selfReferenceLine("CLAUDE", "AGENTS");
const AGENTS_SELF_REFERENCE_LINE = selfReferenceLine("AGENTS", "CLAUDE");

describe("CLAUDE.md / AGENTS.md guide pair", () => {
  const claudeText = readFileSync(CLAUDE_MD_PATH, "utf8");
  const agentsText = readFileSync(AGENTS_MD_PATH, "utf8");
  const claudeLines = claudeText.split("\n");
  const agentsLines = agentsText.split("\n");

  it("is identical apart from the H1 title and the self-reference line", () => {
    expect(claudeLines.length).toBe(agentsLines.length);

    let selfReferenceLinesSeen = 0;

    for (let i = 0; i < claudeLines.length; i++) {
      const lineNumber = i + 1;
      const claudeLine = claudeLines[i];
      const agentsLine = agentsLines[i];

      if (lineNumber === 1) {
        // The H1 title is allowed to differ (each file names its own audience).
        continue;
      }

      if (CLAUDE_SELF_REFERENCE_LINE.test(claudeLine) && AGENTS_SELF_REFERENCE_LINE.test(agentsLine)) {
        selfReferenceLinesSeen++;
        continue;
      }

      expect(agentsLine).toBe(claudeLine);
    }

    // Sanity check: the filter above must actually have matched something, or this test would pass
    // vacuously even if the whole self-reference sentence were deleted.
    expect(selfReferenceLinesSeen).toBe(1);
  });

  it("states both runtimes' delegation syntax in both files", () => {
    // The intent-parity rule is satisfied by DUPLICATING each runtime's syntax, never by delegating to the
    // sibling file. Each guide must therefore teach the Claude `Task` path AND the Codex typed-spawn path.
    for (const [fileName, text] of [
      ["CLAUDE.md", claudeText],
      ["AGENTS.md", agentsText],
    ] as const) {
      expect(text, `${fileName} must teach the Claude delegation path`).toContain("**On Claude:** the `Task` tool");
      expect(text, `${fileName} must teach the Codex delegation path`).toContain("spawn_agent(");
      expect(text, `${fileName} must name both curation roles`).toContain("plant_researcher");
      expect(text, `${fileName} must name both curation roles`).toContain("editorial_writer");
    }
  });

  it("does not delegate its own content to the sibling guide", () => {
    // The exact failure this pair used to have: a guide that told its runtime to go read the other file.
    const delegationPhrases = [
      "applies unchanged",
      "Where the rest of the truth lives",
      "holds the complete curation workflow",
    ];

    for (const [fileName, text] of [
      ["CLAUDE.md", claudeText],
      ["AGENTS.md", agentsText],
    ] as const) {
      for (const phrase of delegationPhrases) {
        expect(text, `${fileName} must not delegate its content with "${phrase}"`).not.toContain(phrase);
      }
    }
  });

  it("no longer teaches the retired `[system]` marker in either file", () => {
    expect(claudeText).not.toContain("[system]");
    expect(agentsText).not.toContain("[system]");
  });
});

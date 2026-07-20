import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// NOTE ON SCOPE — read before touching this file.
//
// This test asserts EDIT-LEVEL equality ONLY — the two specific bullets this feature added/rewrote in
// CLAUDE.md and AGENTS.md — and deliberately does NOT assert whole-file equality between the two guides.
//
// This repo's CLAUDE.md / AGENTS.md pair has a PRE-EXISTING, OUT-OF-SCOPE divergence: AGENTS.md is a
// condensed SUMMARY of CLAUDE.md (219 vs 75 lines before this change), which the workspace sync rule
// forbids outright. Reconciling that divergence means choosing which content is canonical for a document
// that steers this agent's actual behaviour — a behavioural change deserving its own review, not something
// that should ride along inside a package-adoption diff. See KNOWN-ISSUES.md for the full record.
//
// A whole-file-equality assertion here would therefore be permanently RED by design, for a reason nobody
// is fixing in this change. Do NOT copy that stronger assertion here.
//
// The sibling `my-plants-plant-doctor` repo's guide pair IS asserted whole-file
// (its `scripts/guide-pair.test.ts`), because that pair's two files ARE meant to be byte-for-byte
// identical (modulo the H1 and the self-reference sentence) and carry no such divergence. Do not weaken
// that test to match this one either — the two repos are in different states on purpose.

const CLAUDE_MD_PATH = fileURLToPath(new URL("../CLAUDE.md", import.meta.url));
const AGENTS_MD_PATH = fileURLToPath(new URL("../AGENTS.md", import.meta.url));

const SYSTEM_MESSAGE_START =
  /^- \*\*A message inside a `<agents-rt:system-message>` block was NOT written by the human\.\*\*/m;
const IMAGE_CHANNELS_START =
  /^- \*\*You learn about images from TWO separate channels, and they mean different things\.\*\*/m;
const TRACKED_NOT_OLD_START =
  /^- \*\*How long something has been TRACKED is never evidence of how OLD it is\.\*\*/m;

/**
 * Extracts the text of one bullet section, from its start pattern up to (but excluding) the next
 * known section's start pattern. Throws — naming the file and section — rather than silently returning
 * an empty/partial string, so a missing section fails loudly instead of comparing two empty strings.
 */
function extractSection(
  text: string,
  fileName: string,
  sectionName: string,
  startPattern: RegExp,
  endPattern: RegExp,
): string {
  const startMatch = startPattern.exec(text);
  if (!startMatch) {
    throw new Error(`${fileName} is missing the "${sectionName}" section (start marker not found)`);
  }

  const startIndex = startMatch.index;
  const remainder = text.slice(startIndex);
  const endMatch = endPattern.exec(remainder);
  if (!endMatch) {
    throw new Error(
      `${fileName}'s "${sectionName}" section has no recognizable end (the next section's marker was not found after it)`,
    );
  }

  const section = remainder.slice(0, endMatch.index);
  if (section.trim().length === 0) {
    throw new Error(`${fileName}'s "${sectionName}" section extracted as empty text`);
  }

  return section;
}

describe("CLAUDE.md / AGENTS.md — agents-realtime 3.0.x guide edits", () => {
  const claudeText = readFileSync(CLAUDE_MD_PATH, "utf8");
  const agentsText = readFileSync(AGENTS_MD_PATH, "utf8");

  it("has an identical system-message section in both files", () => {
    const claudeSection = extractSection(
      claudeText,
      "CLAUDE.md",
      "system-message",
      SYSTEM_MESSAGE_START,
      IMAGE_CHANNELS_START,
    );
    const agentsSection = extractSection(
      agentsText,
      "AGENTS.md",
      "system-message",
      SYSTEM_MESSAGE_START,
      IMAGE_CHANNELS_START,
    );

    expect(agentsSection).toBe(claudeSection);
  });

  it("has an identical two-image-channels section in both files", () => {
    const claudeSection = extractSection(
      claudeText,
      "CLAUDE.md",
      "two-image-channels",
      IMAGE_CHANNELS_START,
      TRACKED_NOT_OLD_START,
    );
    const agentsSection = extractSection(
      agentsText,
      "AGENTS.md",
      "two-image-channels",
      IMAGE_CHANNELS_START,
      TRACKED_NOT_OLD_START,
    );

    expect(agentsSection).toBe(claudeSection);
  });

  it("no longer teaches the retired `[system]` marker in either file", () => {
    expect(claudeText).not.toContain("[system]");
    expect(agentsText).not.toContain("[system]");
  });
});

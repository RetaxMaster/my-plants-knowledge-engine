// The editorial-writer returns the blogpost author payload as a single fenced ```json block, and the
// operator saves that reply VERBATIM as `<slug>.blogpost.draft.json` (editorial-writer.md / CLAUDE.md).
// A verbatim fenced block is NOT valid JSON, so `db:insert` must tolerate it: strip an optional outer
// markdown code fence before parsing. A plain `.json` file (no fence) is returned unchanged.
//
// Robustness: the blogpost body is Markdown that may itself contain ``` code fences, so we must NOT
// regex-strip the first/last ``` we find. The OUTER fence is always the first and last LINE of the
// content; inner code fences never are. So we only unwrap when the first line is ``` / ```json AND the
// last line is ``` — leaving any inner code fences in bodyEs/bodyEn intact.
export function stripJsonFence(content: string): string {
  const trimmed = content.trim();
  const lines = trimmed.split('\n');
  if (lines.length >= 2) {
    const first = lines[0].trim();
    const last = lines[lines.length - 1].trim();
    if (/^```(?:json)?$/i.test(first) && last === '```') {
      return lines.slice(1, -1).join('\n').trim();
    }
  }
  return trimmed;
}

// Parse a blogpost author-payload file that may be raw JSON or a single fenced ```json block.
export function parseBlogpostPayload(content: string): unknown {
  return JSON.parse(stripJsonFence(content));
}

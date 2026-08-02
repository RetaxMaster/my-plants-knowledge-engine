import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * THE SAFETY TEST (Spec 3 §3.2). A re-curation that silently unpublished or rewrote the owner's live
 * species guides is the exact surprise this mode exists to prevent, and the guarantee is worth asserting
 * from two directions: the PLAN cannot contain a blogpost statement (recure-plan.test.ts), and the CLI
 * cannot reach one (here) — no import, no SQL, no status handling anywhere in the file.
 *
 * `src` is read once at MODULE scope, not inside this `describe`'s callback, because Task 19 adds a SECOND,
 * sibling `describe` block below (Spec 3 §7's "no false green" coverage) that also needs it — a `const`
 * declared inside one `describe`'s callback is scoped to that callback's closure and is not visible from a
 * sibling `describe`, which would not compile.
 */
const src = readFileSync(fileURLToPath(new URL('../db-recure.ts', import.meta.url)), 'utf8');

describe('db-recure.ts can never write a blogpost', () => {
  it('imports no blogpost machinery', () => {
    expect(src).not.toContain('buildBlogpostRow');
    expect(src).not.toContain('selectBlogpostUpsertSql');
    expect(src).not.toContain('BLOGPOST_UPSERT');
    expect(src).not.toContain('parseBlogpostPayload');
    expect(src).not.toContain('BlogpostStatus');
  });

  it('names no blogpost table or column', () => {
    expect(src.toLowerCase()).not.toContain('blogposts');
    expect(src).not.toContain('body_es');
    expect(src).not.toContain('body_en');
  });

  it('accepts no --blogpost argument', () => {
    expect(src).not.toContain("blogpost: { type: 'string' }");
  });
});

describe('db-recure.ts actually writes the third artifact (Spec 3 §7 — no false green)', () => {
  it('imports the shared repot-signs writer, never a second implementation', () => {
    expect(src).toContain("import { buildRepotSignRows, writeRepotSigns } from './lib/repot-signs.js';");
  });

  it('calls writeRepotSigns with the transaction connection, the plan slug and the built rows', () => {
    expect(src).toMatch(/writeRepotSigns\(\s*conn\s*,\s*plan\.slug\s*,\s*signRows\s*\)/);
  });

  it('writes in the correct order: begin -> species/brief write -> signs write -> commit', () => {
    const beginAt = src.indexOf('conn.beginTransaction()');
    const recordWriteAt = src.indexOf('conn.execute(statement.sql, statement.params)');
    const signsWriteAt = src.indexOf('writeRepotSigns(conn');
    const commitAt = src.indexOf('conn.commit()');
    expect(beginAt).toBeGreaterThan(-1);
    expect(recordWriteAt).toBeGreaterThan(beginAt);
    expect(signsWriteAt).toBeGreaterThan(recordWriteAt);
    expect(commitAt).toBeGreaterThan(signsWriteAt);
  });
});

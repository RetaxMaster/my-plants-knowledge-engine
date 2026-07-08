import { describe, expect, it } from 'vitest';
import {
  SPECIES_UPSERT_SQL,
  BLOGPOST_UPSERT_SQL,
  BLOGPOST_UPSERT_AS_DRAFT_SQL,
  selectBlogpostUpsertSql,
} from './db-sql.js';

describe('SPECIES_UPSERT_SQL', () => {
  it('upserts only slug/scientific_name/record — the dropped brief columns are gone', () => {
    expect(SPECIES_UPSERT_SQL).toContain('INSERT INTO `species`');
    expect(SPECIES_UPSERT_SQL).toContain('`scientific_name`');
    expect(SPECIES_UPSERT_SQL).toContain('`record`');
    expect(SPECIES_UPSERT_SQL).not.toContain('brief_en');
    expect(SPECIES_UPSERT_SQL).not.toContain('brief_es');
  });
});

describe('BLOGPOST_UPSERT_SQL', () => {
  const insertHead = BLOGPOST_UPSERT_SQL.split('ON DUPLICATE KEY UPDATE')[0];
  const updateClause = BLOGPOST_UPSERT_SQL.split('ON DUPLICATE KEY UPDATE')[1] ?? '';

  it('has an ON DUPLICATE KEY UPDATE clause', () => {
    expect(BLOGPOST_UPSERT_SQL).toContain('INSERT INTO `blogposts`');
    expect(updateClause).not.toBe('');
  });

  it('updates the seven engine-owned text columns (incl. cover_image_prompt)', () => {
    for (const col of [
      'title_es',
      'title_en',
      'excerpt_es',
      'excerpt_en',
      'body_es',
      'body_en',
      'cover_image_prompt',
    ]) {
      expect(updateClause).toContain(`\`${col}\``);
    }
  });

  it('DOES update cover_image_prompt (engine-authored, unlike the human-owned cover URL/key)', () => {
    expect(updateClause).toContain('`cover_image_prompt`');
    expect(updateClause).not.toContain('`cover_image_url`');
    expect(updateClause).not.toContain('`cover_image_object_key`');
  });

  it('never clobbers human-owned or first-insert-only columns on update', () => {
    for (const col of [
      'status',
      'species_slug',
      'cover_image_url',
      'cover_image_object_key',
      'youtube_url',
      'cta_link',
      'cta_label_es',
      'cta_label_en',
      'published_at',
      'created_at',
    ]) {
      expect(updateClause).not.toContain(`\`${col}\``);
    }
  });

  it('sets updated_at = NOW(3) on INSERT (no DB default — Prisma @updatedAt is app-level)', () => {
    expect(insertHead).toContain('`updated_at`');
    expect(insertHead).toContain('NOW(3)');
  });

  it('bumps updated_at = NOW(3) on UPDATE (an enrich is a change)', () => {
    expect(updateClause).toContain('`updated_at` = NOW(3)');
  });

  it('inserts the DRAFT-safe column set (slug, species_slug, status + the seven text columns)', () => {
    for (const col of ['slug', 'species_slug', 'status', 'title_es', 'body_es', 'body_en', 'cover_image_prompt']) {
      expect(insertHead).toContain(`\`${col}\``);
    }
  });

  it('has exactly 10 bound value placeholders (was 9; cover_image_prompt is the 10th)', () => {
    // The INSERT half has NO '?' anywhere except the VALUES list, so counting '?' across insertHead is a
    // safe, nested-paren-proof way to assert the bind arity. NOW(3) is inline (not a '?'), so a correct
    // statement has exactly 10 placeholders.
    const placeholders = (insertHead.match(/\?/g) ?? []).length;
    expect(placeholders).toBe(10);
    expect(insertHead).toContain('NOW(3)'); // updated_at stays inline, NOT a bound ?
  });

  it('orders cover_image_prompt AFTER body_en and BEFORE updated_at in the insert column list', () => {
    // Compare positions within the column list (everything before 'VALUES').
    const colList = insertHead.split(/VALUES/i)[0];
    expect(colList.indexOf('`body_en`')).toBeLessThan(colList.indexOf('`cover_image_prompt`'));
    expect(colList.indexOf('`cover_image_prompt`')).toBeLessThan(colList.indexOf('`updated_at`'));
  });
});

describe('BLOGPOST_UPSERT_AS_DRAFT_SQL (D1 — return a currently-PUBLISHED post to DRAFT)', () => {
  const draftUpdateClause =
    BLOGPOST_UPSERT_AS_DRAFT_SQL.split('ON DUPLICATE KEY UPDATE')[1] ?? '';
  const defaultInsertHead = BLOGPOST_UPSERT_SQL.split('ON DUPLICATE KEY UPDATE')[0];
  const draftInsertHead = BLOGPOST_UPSERT_AS_DRAFT_SQL.split('ON DUPLICATE KEY UPDATE')[0];

  it('resets status back to DRAFT (0) on update — a previously-PUBLISHED row ends DRAFT', () => {
    expect(draftUpdateClause).toContain('`status` = 0');
  });

  it('leaves the INSERT half byte-identical to the default (a FRESH post is unaffected)', () => {
    expect(draftInsertHead).toBe(defaultInsertHead);
  });

  it('still refreshes the seven engine-owned text columns like the default upsert', () => {
    for (const col of [
      'title_es',
      'title_en',
      'excerpt_es',
      'excerpt_en',
      'body_es',
      'body_en',
      'cover_image_prompt',
    ]) {
      expect(draftUpdateClause).toContain(`\`${col}\``);
    }
  });

  it('adds ONLY status vs the default — never touches other human-owned columns', () => {
    for (const col of [
      'species_slug',
      'cover_image_url',
      'cover_image_object_key',
      'youtube_url',
      'cta_link',
      'cta_label_es',
      'cta_label_en',
      'published_at',
      'created_at',
    ]) {
      expect(draftUpdateClause).not.toContain(`\`${col}\``);
    }
  });
});

describe('selectBlogpostUpsertSql (D1 — the existing row status decides the statement)', () => {
  it('returns the DRAFT-forcing SQL when the existing row is currently PUBLISHED', () => {
    expect(selectBlogpostUpsertSql(true)).toBe(BLOGPOST_UPSERT_AS_DRAFT_SQL);
  });

  it('returns the non-clobbering default (status preserved) for a new or already-DRAFT row', () => {
    expect(selectBlogpostUpsertSql(false)).toBe(BLOGPOST_UPSERT_SQL);
  });
});

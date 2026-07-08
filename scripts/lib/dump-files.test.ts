import { describe, expect, it } from 'vitest';
import { buildDumpFiles, type StoredSpeciesRow } from './dump-files.js';

const blogpost = {
  titleEs: 'Costilla de Adán',
  titleEn: 'Swiss cheese plant',
  excerptEs: 'Hojas perforadas y un carácter tranquilo.',
  excerptEn: 'Fenestrated leaves and an easygoing nature.',
  bodyEs: '# Costilla de Adán\nContenido.',
  bodyEn: '# Swiss cheese plant\nContent.',
  coverImagePrompt: 'Macro Monstera leaf, 16:9, soft morning light.',
};

const baseRow: StoredSpeciesRow = {
  slug: 'monstera-deliciosa',
  record: { scientificName: 'Monstera deliciosa', commonNamesEn: ['Swiss cheese plant'], commonNamesEs: ['Costilla de Adán'] },
  blogpost,
};

describe('buildDumpFiles', () => {
  it('emits the record draft + the blogpost draft (in order) when a blogpost is stored', () => {
    const files = buildDumpFiles(baseRow);
    expect(files.map((f) => f.path)).toEqual([
      'monstera-deliciosa.draft.json',
      'monstera-deliciosa.blogpost.draft.json',
    ]);
  });

  it('serializes the record as parseable, pretty-printed JSON with a trailing newline', () => {
    const [recordFile] = buildDumpFiles(baseRow);
    expect(recordFile.content.endsWith('\n')).toBe(true);
    expect(recordFile.content).toContain('\n  "scientificName": "Monstera deliciosa"');
    expect(JSON.parse(recordFile.content).commonNamesEn[0]).toBe('Swiss cheese plant');
  });

  it('parses a record handed back as a raw JSON string (mysql2 may not pre-parse it)', () => {
    const files = buildDumpFiles({ ...baseRow, record: JSON.stringify(baseRow.record) });
    expect(JSON.parse(files[0].content).scientificName).toBe('Monstera deliciosa');
  });

  it('round-trips the blogpost draft: exact seven fields, re-parseable into db:insert', () => {
    const files = buildDumpFiles(baseRow);
    const parsed = JSON.parse(files[1].content);
    expect(parsed).toEqual(blogpost);
    expect(files[1].content.endsWith('\n')).toBe(true);
  });

  it('dumps coverImagePrompt as JSON null when the stored value is null (never omitted, never "")', () => {
    const files = buildDumpFiles({
      ...baseRow,
      blogpost: { ...blogpost, coverImagePrompt: null },
    });
    const parsed = JSON.parse(files[1].content);
    expect(parsed).toHaveProperty('coverImagePrompt');
    expect(parsed.coverImagePrompt).toBeNull();
  });

  it('dumps NULL English fields as JSON null — NEVER an empty string (would fail min(1)-when-present on re-insert)', () => {
    const files = buildDumpFiles({
      ...baseRow,
      blogpost: { ...blogpost, titleEn: null, excerptEn: null, bodyEn: null },
    });
    const parsed = JSON.parse(files[1].content);
    expect(parsed.titleEn).toBeNull();
    expect(parsed.excerptEn).toBeNull();
    expect(parsed.bodyEn).toBeNull();
    // Explicitly NOT the empty string the old brief transform produced for NULL columns.
    expect(parsed.titleEn).not.toBe('');
    expect(parsed.bodyEn).not.toBe('');
  });

  it('dumps ONLY the record draft when the species has no blogpost yet (no empty blogpost draft)', () => {
    const files = buildDumpFiles({ ...baseRow, blogpost: null });
    expect(files.map((f) => f.path)).toEqual(['monstera-deliciosa.draft.json']);
  });

  it('prefixes every file with the given out-dir', () => {
    const files = buildDumpFiles(baseRow, '/tmp/work');
    expect(files.map((f) => f.path)).toEqual([
      '/tmp/work/monstera-deliciosa.draft.json',
      '/tmp/work/monstera-deliciosa.blogpost.draft.json',
    ]);
  });
});

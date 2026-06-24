import { describe, expect, it } from 'vitest';
import { buildDumpFiles, type StoredSpeciesRow } from './dump-files.js';

const baseRow: StoredSpeciesRow = {
  slug: 'monstera-deliciosa',
  record: { scientificName: 'Monstera deliciosa', commonNames: ['Swiss cheese plant'] },
  briefEn: '# Swiss cheese plant\n\nFenestrated leaves and an easygoing nature.',
  briefEs: '# Costilla de Adán\n\nHojas perforadas y un carácter tranquilo.',
};

describe('buildDumpFiles', () => {
  it('emits the three slug-based draft files in order (record, en, es)', () => {
    const files = buildDumpFiles(baseRow);
    expect(files.map((f) => f.path)).toEqual([
      'monstera-deliciosa.draft.json',
      'monstera-deliciosa.en.draft.md',
      'monstera-deliciosa.es.draft.md',
    ]);
  });

  it('serializes the record as parseable, pretty-printed JSON with a trailing newline', () => {
    const [recordFile] = buildDumpFiles(baseRow);
    expect(recordFile.content.endsWith('\n')).toBe(true);
    expect(recordFile.content).toContain('\n  "scientificName": "Monstera deliciosa"');
    expect(JSON.parse(recordFile.content).commonNames[0]).toBe('Swiss cheese plant');
  });

  it('parses a record handed back as a raw JSON string (mysql2 may not pre-parse it)', () => {
    const files = buildDumpFiles({ ...baseRow, record: JSON.stringify(baseRow.record) });
    expect(JSON.parse(files[0].content).scientificName).toBe('Monstera deliciosa');
  });

  it('writes each brief verbatim and falls back to an empty string when a column is NULL', () => {
    const files = buildDumpFiles({ ...baseRow, briefEs: null });
    expect(files[1].content).toBe(baseRow.briefEn);
    expect(files[2].content).toBe('');
  });

  it('never appends a trailing newline to a brief (only the record gets one)', () => {
    const files = buildDumpFiles(baseRow);
    expect(files[1].content.endsWith('\n')).toBe(false);
    expect(files[2].content.endsWith('\n')).toBe(false);
  });

  it('prefixes every file with the given out-dir', () => {
    const files = buildDumpFiles(baseRow, '/tmp/work');
    expect(files.map((f) => f.path)).toEqual([
      '/tmp/work/monstera-deliciosa.draft.json',
      '/tmp/work/monstera-deliciosa.en.draft.md',
      '/tmp/work/monstera-deliciosa.es.draft.md',
    ]);
  });
});

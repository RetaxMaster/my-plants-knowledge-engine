import { describe, expect, it } from 'vitest';
import type { SpeciesRecord } from '@retaxmaster/my-plants-species-schema';
import { buildSpeciesRow, buildBlogpostRow, type BlogpostAuthorPayload } from './db-row.js';

const record = {
  scientificName: 'Nephrolepis exaltata',
  commonNamesEn: ['Boston fern'],
  commonNamesEs: ['Helecho de Boston'],
  watering: { baseIntervalDays: 4, soilDrynessBeforeWatering: 'keep-moist', droughtTolerance: 'low', temperatureSensitivity: 'medium', lightSensitivity: 'medium', humiditySensitivity: 'high', reduceInDormancy: false },
  misting: { benefit: 'beneficial', baseFrequencyDays: 3, note: null },
  light: { minimum: 'medium', ideal: 'bright-indirect', maximum: 'bright-indirect' },
  temperature: { survivalMinC: 7, idealMinC: 16, idealMaxC: 24, survivalMaxC: 30 },
  humidity: { minimumPct: 50, idealPct: 80 },
  fertilizing: { activeSeasons: ['spring', 'summer'], inSeasonFrequencyDays: 30, reduceInDormancy: true },
  repotting: { typicalIntervalMonths: 18, signs: [] },
  maintenance: { pruning: 'Trim dead fronds.', rotationDays: 14, leafCleaningDays: null, commonPests: [] },
  nativeClimate: { description: 'Humid tropical forests.', hardinessMinC: 7, hardinessMaxC: 32 },
  cultivars: [{ name: 'Bostoniensis', alsoKnownAs: [], group: null, description: 'Arching, finely divided fronds.', careNote: null }],
  metadata: { confidence: 'high', sources: [{ title: 'RHS', url: 'https://www.rhs.org.uk/', accessedAt: '2026-06-18' }] },
} satisfies SpeciesRecord;

describe('buildSpeciesRow', () => {
  it('derives slug + scientificName + a JSON record string (no brief columns)', () => {
    const row = buildSpeciesRow(record);
    expect(row.slug).toBe('nephrolepis-exaltata');
    expect(row.scientificName).toBe('Nephrolepis exaltata');
    expect(JSON.parse(row.recordJson).light.ideal).toBe('bright-indirect');
    // The brief columns are gone from the row (they were dropped by API migration 0009).
    expect(row).not.toHaveProperty('briefEn');
    expect(row).not.toHaveProperty('briefEs');
  });
});

const fullPayload: BlogpostAuthorPayload = {
  titleEs: 'Cómo cuidar tu helecho de Boston',
  titleEn: 'How to care for your Boston fern',
  excerptEs: 'Una guía breve y cálida.',
  excerptEn: 'A short, warm guide.',
  bodyEs: '# Helecho\nContenido en español.',
  bodyEn: '# Fern\nContent in English.',
  coverImagePrompt: 'Macro of a Boston fern frond, 16:9, soft window light.',
};

describe('buildBlogpostRow', () => {
  it('derives slug === speciesSlug === toSpeciesSlug, status DRAFT (0), carries the seven author fields', () => {
    const result = buildBlogpostRow(record, fullPayload);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.slug).toBe('nephrolepis-exaltata');
    expect(result.row.speciesSlug).toBe('nephrolepis-exaltata');
    expect(result.row.status).toBe(0);
    expect(result.row.titleEs).toBe(fullPayload.titleEs);
    expect(result.row.titleEn).toBe(fullPayload.titleEn);
    expect(result.row.excerptEs).toBe(fullPayload.excerptEs);
    expect(result.row.bodyEs).toBe(fullPayload.bodyEs);
    expect(result.row.bodyEn).toBe(fullPayload.bodyEn);
    expect(result.row.coverImagePrompt).toBe(fullPayload.coverImagePrompt);
  });

  it('passes null English fields through unchanged (ES-only post)', () => {
    const result = buildBlogpostRow(record, {
      ...fullPayload,
      titleEn: null,
      excerptEn: null,
      bodyEn: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.titleEn).toBeNull();
    expect(result.row.excerptEn).toBeNull();
    expect(result.row.bodyEn).toBeNull();
  });

  it('rejects a payload with an empty required Spanish field (assemble-then-validate)', () => {
    const result = buildBlogpostRow(record, { ...fullPayload, titleEs: '' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.join(' ')).toMatch(/titleEs/);
  });

  it('rejects a payload missing a required Spanish field', () => {
    const { bodyEs: _drop, ...noBody } = fullPayload;
    const result = buildBlogpostRow(record, noBody);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.join(' ')).toMatch(/bodyEs/);
  });

  it('never leaks server-owned media/CTA fields into the row (engine authors text only)', () => {
    const result = buildBlogpostRow(record, fullPayload);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row).not.toHaveProperty('coverImageUrl');
    expect(result.row).not.toHaveProperty('youtubeUrl');
    expect(result.row).not.toHaveProperty('ctaLink');
    expect(result.row).toHaveProperty('coverImagePrompt'); // engine-authored, NOT nulled
  });

  it('carries coverImagePrompt through the assembled + validated row', () => {
    const result = buildBlogpostRow(record, fullPayload);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.coverImagePrompt).toBe(fullPayload.coverImagePrompt);
  });

  it('passes a null coverImagePrompt through unchanged', () => {
    const result = buildBlogpostRow(record, { ...fullPayload, coverImagePrompt: null });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.coverImagePrompt).toBeNull();
  });

  it('defaults coverImagePrompt to null when the payload omits it', () => {
    const { coverImagePrompt: _drop, ...noPrompt } = fullPayload;
    const result = buildBlogpostRow(record, noPrompt);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.coverImagePrompt).toBeNull();
  });
});

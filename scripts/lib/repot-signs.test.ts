import { describe, expect, it } from 'vitest';
import { buildRepotSignRows } from './repot-signs.js';

const draft = {
  semanticSlug: 'crowded-clump',
  labelEn: 'The clump has congested',
  labelEs: 'La mata se apretó',
  helpEn: 'Look at the centre.',
  helpEs: null,
  evidence: 'strong' as const,
  sortOrder: 100,
  rationale: 'Inner offsets are root-starved first.',
  source: 'https://extension.example.edu/x',
};

describe('buildRepotSignRows', () => {
  it('composes the namespaced id from the species slug and the semantic tail', () => {
    expect(buildRepotSignRows('spider-plant', [draft])[0].id).toBe('spider-plant--crowded-clump');
  });

  it('marks every produced row active and species-scoped', () => {
    const row = buildRepotSignRows('spider-plant', [draft])[0];
    expect(row.active).toBe(true);
    expect(row.speciesSlug).toBe('spider-plant');
  });

  it('REJECTS a blank or whitespace-only labelEs — never silently coerced to English', () => {
    for (const bad of ['', '   ']) {
      expect(() => buildRepotSignRows('spider-plant', [{ ...draft, labelEs: bad }]), bad).toThrow(/labelEs|non-empty/i);
    }
  });

  it('REJECTS a semantic slug containing the reserved separator', () => {
    expect(() => buildRepotSignRows('spider-plant', [{ ...draft, semanticSlug: 'crowded--clump' }])).toThrow(/semantic slug/i);
  });

  it('REJECTS a composed id over the 257-character ceiling', () => {
    expect(() => buildRepotSignRows('a'.repeat(200), [draft])).toThrow(/257/);
  });

  it('REJECTS a species row that merely restates a UNIVERSAL sign — the double-count trap', () => {
    expect(() =>
      buildRepotSignRows('spider-plant', [{ ...draft, semanticSlug: 'water-runs-through' }]),
    ).toThrow(/universal/i);
  });

  it('REJECTS two drafts sharing one semantic slug', () => {
    expect(() => buildRepotSignRows('spider-plant', [draft, { ...draft, labelEn: 'Other' }])).toThrow(/duplicate/i);
  });

  it('REJECTS a missing rationale or source — a class with no mechanism does not ship', () => {
    for (const key of ['rationale', 'source'] as const) {
      const { [key]: _dropped, ...without } = draft;
      expect(() => buildRepotSignRows('spider-plant', [without as never]), key).toThrow();
    }
  });

  it('accepts an EMPTY array — "this species adds nothing to the universal set" is a valid answer', () => {
    expect(buildRepotSignRows('spider-plant', [])).toEqual([]);
  });
});

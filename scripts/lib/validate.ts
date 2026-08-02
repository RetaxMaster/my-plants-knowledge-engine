import {
  safeParseSpeciesRecord,
  speciesRecordWriteSchema,
  type SpeciesRecord,
} from '@retaxmaster/my-plants-species-schema';

export type ValidateResult =
  | { ok: true; record: SpeciesRecord }
  | { ok: false; issues: string[] };

export function validateRecord(data: unknown): ValidateResult {
  const result = safeParseSpeciesRecord(data);
  if (result.success) {
    return { ok: true, record: result.data };
  }
  const issues = result.error.issues.map(
    (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
  );
  return { ok: false, issues };
}

/**
 * THE STRICT WRITE GATE (Spec 3 §4.2).
 *
 * WHY IT CANNOT JUST BE `validateRecord`: `safeParseSpeciesRecord` is the TOLERANT reader, and its
 * `.transform()` is precisely what accepts a legacy English-only string and upgrades it to `{ en, es: null }`.
 * Calling it at write time therefore cannot reject the legacy shape — it exists to accept it. So "tolerant
 * in, strict out" needs a second schema, and the shared package exports one built from the SAME object arms
 * with the legacy branch removed.
 *
 * ORDER MATTERS: this runs against the RAW payload, BEFORE validateRecord's tolerant parse ever sees it.
 * Only a payload that survives here proceeds to the existing tolerant parse, which is still what produces
 * the typed SpeciesRecord the rest of the write path consumes.
 *
 * READ PATHS ARE UNTOUCHED. The web, the API and both agent context builders keep using the tolerant reader
 * — old rows must keep parsing until the one-time re-curation has filled both locales everywhere.
 */
export function validateWritableRecord(data: unknown): ValidateResult {
  const strict = speciesRecordWriteSchema.safeParse(data);
  if (!strict.success) {
    return {
      ok: false,
      issues: strict.error.issues.map(
        (issue) =>
          `${issue.path.join('.') || '(root)'}: ${issue.message}` +
          ' (a localized field must be authored in BOTH locales as { "en": …, "es": … } — a bare string or' +
          ' array is the legacy English-only shape and is no longer writable)',
      ),
    };
  }
  // The strict schema proved the SHAPE; the tolerant parse is still what produces the typed record.
  return validateRecord(data);
}

// The NEW-CURATION gate (spec §2.3). The shared contract stays nullable so legacy rows parse, but a FRESH or
// ENRICH curation must set a real growthHabit — the researcher fills it. "Genuinely unknown" is the explicit
// override value 'other', which per spec §2.3 must RECORD WHY: a bare 'other' is rejected; it must be
// accompanied by a non-empty `growthHabitOtherReason` (BLOCKER 8). That reason is a KE-curation-level field
// (NOT part of the shared species record — the shared contract keeps only the nullable `growthHabit`); it is
// read here from the raw curation payload BEFORE the shared parse strips unknown keys, and it is persisted in
// the curation brief (buildSpeciesRow). This gate lives in the KE (the operator's `npm run validate` step),
// never in the shared schema. It runs AFTER the shared parse succeeds, so `record.growthHabit` is typed.
export function validateCuration(data: unknown): ValidateResult {
  const base = validateWritableRecord(data);
  if (!base.ok) return base;
  if (base.record.growthHabit == null) {
    return {
      ok: false,
      issues: [
        'growthHabit: a fresh or enrich curation must set growthHabit ' +
          '(one of upright|climber|trailing|clumping|rosette|tree|shrub|other; use "other" ONLY with a recorded reason)',
      ],
    };
  }
  // The 'other' override must record WHY it is unknown (spec §2.3). Read the reason off the RAW payload
  // (unknown to the shared schema, so not on base.record). Require a non-empty, non-whitespace string.
  if (base.record.growthHabit === 'other') {
    const reason = (data as { growthHabitOtherReason?: unknown })?.growthHabitOtherReason;
    if (typeof reason !== 'string' || reason.trim().length === 0) {
      return {
        ok: false,
        issues: [
          'growthHabitOtherReason: growthHabit "other" is an explicit UNKNOWN override and must record why ' +
            '(a non-empty growthHabitOtherReason on the curation). A bare "other" is not accepted.',
        ],
      };
    }
  }
  return base;
}

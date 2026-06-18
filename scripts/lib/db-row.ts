import { toSpeciesSlug, type SpeciesRecord } from '@retaxmaster/my-plants-species-schema';

export interface SpeciesRow {
  slug: string;
  scientificName: string;
  recordJson: string;
}

export function buildSpeciesRow(record: SpeciesRecord): SpeciesRow {
  return {
    slug: toSpeciesSlug(record.scientificName),
    scientificName: record.scientificName,
    recordJson: JSON.stringify(record),
  };
}

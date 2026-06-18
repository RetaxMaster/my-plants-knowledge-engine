import { toSpeciesSlug, type SpeciesRecord } from '@retaxmaster/my-plants-species-schema';
import { speciesArtifactPaths } from './paths.js';

export interface SpeciesArtifacts {
  slug: string;
  dir: string;
  recordPath: string;
  briefPath: string;
  recordJson: string;
  briefContent: string;
}

export function buildSpeciesArtifacts(
  speciesRoot: string,
  record: SpeciesRecord,
  brief: string,
): SpeciesArtifacts {
  const slug = toSpeciesSlug(record.scientificName);
  const paths = speciesArtifactPaths(speciesRoot, slug);
  // The brief always lives next to the record under a fixed name.
  const normalized: SpeciesRecord = {
    ...record,
    metadata: { ...record.metadata, briefPath: paths.briefFileName },
  };
  return {
    slug,
    dir: paths.dir,
    recordPath: paths.recordPath,
    briefPath: paths.briefPath,
    recordJson: `${JSON.stringify(normalized, null, 2)}\n`,
    briefContent: brief,
  };
}

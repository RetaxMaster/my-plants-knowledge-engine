import path from 'node:path';

export interface SpeciesArtifactPaths {
  dir: string;
  recordPath: string;
  briefPath: string;
  briefFileName: string;
}

export function speciesArtifactPaths(speciesRoot: string, slug: string): SpeciesArtifactPaths {
  const dir = path.join(speciesRoot, slug);
  const briefFileName = 'brief.md';
  return {
    dir,
    recordPath: path.join(dir, 'record.json'),
    briefPath: path.join(dir, briefFileName),
    briefFileName,
  };
}

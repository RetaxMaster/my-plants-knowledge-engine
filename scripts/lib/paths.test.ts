import { describe, expect, it } from 'vitest';
import { speciesArtifactPaths } from './paths.js';

describe('speciesArtifactPaths', () => {
  it('places record.json and brief.md under species/<slug>/', () => {
    const paths = speciesArtifactPaths('/repo/species', 'monstera-deliciosa');
    expect(paths.dir).toBe('/repo/species/monstera-deliciosa');
    expect(paths.recordPath).toBe('/repo/species/monstera-deliciosa/record.json');
    expect(paths.briefPath).toBe('/repo/species/monstera-deliciosa/brief.md');
    expect(paths.briefFileName).toBe('brief.md');
  });
});

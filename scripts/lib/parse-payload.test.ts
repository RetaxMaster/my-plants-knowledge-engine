import { describe, expect, it } from 'vitest';
import { parseBlogpostPayload, stripJsonFence } from './parse-payload.js';

const payload = {
  titleEs: 'Costilla de Adán',
  titleEn: null,
  excerptEs: 'Un clásico del salón.',
  excerptEn: null,
  bodyEs: '## Cuidados\n\n```js\nconst x = 1;\n```\n\nRiega cuando el sustrato se seque.',
  bodyEn: null,
};
const json = JSON.stringify(payload, null, 2);

describe('stripJsonFence', () => {
  it('returns raw JSON unchanged (no fence)', () => {
    expect(stripJsonFence(json)).toBe(json);
  });

  it('strips a ```json fenced block (the editorial-writer verbatim output)', () => {
    const fenced = '```json\n' + json + '\n```';
    expect(stripJsonFence(fenced)).toBe(json);
  });

  it('strips a bare ``` fenced block', () => {
    const fenced = '```\n' + json + '\n```\n';
    expect(stripJsonFence(fenced)).toBe(json);
  });

  it('preserves inner ``` code fences inside body Markdown (only the outer fence is removed)', () => {
    const fenced = '```json\n' + json + '\n```';
    // The parsed body must still contain the inner ```js code fence.
    const parsed = parseBlogpostPayload(fenced) as typeof payload;
    expect(parsed.bodyEs).toContain('```js');
    expect(parsed.bodyEs).toBe(payload.bodyEs);
  });

  it('does not unwrap when only one line / not truly fenced', () => {
    expect(stripJsonFence('{"a":1}')).toBe('{"a":1}');
  });
});

describe('parseBlogpostPayload', () => {
  it('parses both raw and fenced payloads to the same object', () => {
    expect(parseBlogpostPayload(json)).toEqual(payload);
    expect(parseBlogpostPayload('```json\n' + json + '\n```')).toEqual(payload);
  });

  it('throws on genuinely invalid JSON (after fence strip)', () => {
    expect(() => parseBlogpostPayload('```json\n{ not valid\n```')).toThrow();
  });
});

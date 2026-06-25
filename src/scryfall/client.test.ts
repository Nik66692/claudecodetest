import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { ScryfallClient, ScryfallError } from './client';

const schema = z.object({ value: z.string() });

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('ScryfallClient', () => {
  it('caches responses keyed by cacheKey', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ value: 'hi' }));
    const client = new ScryfallClient({ fetch: fetchMock, minInterval: 0 });

    const a = await client.request({ path: '/x', cacheKey: 'k' }, schema);
    const b = await client.request({ path: '/x', cacheKey: 'k' }, schema);

    expect(a).toEqual({ value: 'hi' });
    expect(b).toEqual({ value: 'hi' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent identical requests', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(
        () =>
          new Promise<Response>((resolve) =>
            setTimeout(() => resolve(jsonResponse({ value: 'y' })), 10),
          ),
      );
    const client = new ScryfallClient({ fetch: fetchMock, minInterval: 0 });

    const [a, b] = await Promise.all([
      client.request({ path: '/y', cacheKey: 'dedupe' }, schema),
      client.request({ path: '/y', cacheKey: 'dedupe' }, schema),
    ]);

    expect(a).toEqual({ value: 'y' });
    expect(b).toEqual({ value: 'y' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('maps a 404 to a not-found ScryfallError', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          { object: 'error', status: 404, code: 'not_found', details: 'No card found' },
          404,
        ),
      );
    const client = new ScryfallClient({ fetch: fetchMock, minInterval: 0 });

    await expect(client.request({ path: '/missing' }, schema)).rejects.toMatchObject({
      kind: 'not-found',
    });
  });

  it('maps network failures to a network ScryfallError', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const client = new ScryfallClient({ fetch: fetchMock, minInterval: 0 });

    const error = await client.request({ path: '/down' }, schema).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ScryfallError);
    expect((error as ScryfallError).kind).toBe('network');
  });

  it('rejects malformed response shapes', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ unexpected: true }));
    const client = new ScryfallClient({ fetch: fetchMock, minInterval: 0 });

    await expect(client.request({ path: '/weird', cacheKey: 'w' }, schema)).rejects.toMatchObject({
      kind: 'invalid-response',
    });
  });
});

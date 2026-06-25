import { z } from 'zod';
import { scryfallErrorSchema } from './schema';

export const SCRYFALL_BASE_URL = 'https://api.scryfall.com';

/** Minimum delay between requests. Scryfall asks for 50–100ms; we use 120ms. */
const MIN_REQUEST_INTERVAL_MS = 120;

export type ScryfallErrorKind =
  | 'network'
  | 'http'
  | 'not-found'
  | 'rate-limited'
  | 'invalid-response';

export class ScryfallError extends Error {
  readonly kind: ScryfallErrorKind;
  readonly status?: number;

  constructor(kind: ScryfallErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ScryfallError';
    this.kind = kind;
    if (status !== undefined) this.status = status;
  }
}

export interface ScryfallClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
  /** Set to 0 in tests to disable throttling. */
  minInterval?: number;
  /** Max cached parsed responses kept in memory. */
  cacheSize?: number;
}

interface ClientRequest {
  path: string;
  method?: 'GET' | 'POST';
  body?: unknown;
  /** Cache key. When omitted, the request is not cached. */
  cacheKey?: string;
  signal?: AbortSignal;
}

/**
 * Low-level Scryfall HTTP client. Responsibilities:
 *  - centralizes base URL, headers and request scheduling;
 *  - throttles requests to stay under Scryfall's documented rate limits;
 *  - deduplicates concurrent identical requests (in-flight map);
 *  - caches successful GET/collection responses in memory;
 *  - normalizes HTTP, network and malformed-response failures into
 *    {@link ScryfallError}.
 *
 * It returns the raw parsed JSON; schema validation happens in the API layer.
 */
export class ScryfallClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly minInterval: number;
  private readonly cacheSize: number;
  private readonly cache = new Map<string, unknown>();
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private queue: Promise<void> = Promise.resolve();
  private lastRequestAt = 0;

  constructor(options: ScryfallClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? SCRYFALL_BASE_URL;
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.minInterval = options.minInterval ?? MIN_REQUEST_INTERVAL_MS;
    this.cacheSize = options.cacheSize ?? 500;
  }

  clearCache(): void {
    this.cache.clear();
  }

  async request<T>(req: ClientRequest, schema: z.ZodType<T>): Promise<T> {
    const dedupeKey =
      req.cacheKey ?? `${req.method ?? 'GET'} ${req.path} ${JSON.stringify(req.body ?? null)}`;

    if (req.cacheKey && this.cache.has(req.cacheKey)) {
      return this.validate(this.cache.get(req.cacheKey), schema);
    }

    const existing = this.inFlight.get(dedupeKey);
    if (existing) {
      return this.validate(await existing, schema);
    }

    const promise = this.scheduleRequest(req)
      .then((json) => {
        if (req.cacheKey) this.writeCache(req.cacheKey, json);
        return json;
      })
      .finally(() => {
        this.inFlight.delete(dedupeKey);
      });

    this.inFlight.set(dedupeKey, promise);
    return this.validate(await promise, schema);
  }

  private validate<T>(json: unknown, schema: z.ZodType<T>): T {
    const result = schema.safeParse(json);
    if (!result.success) {
      throw new ScryfallError(
        'invalid-response',
        `Unexpected response shape from Scryfall: ${result.error.issues[0]?.message ?? 'invalid'}`,
      );
    }
    return result.data;
  }

  private writeCache(key: string, value: unknown): void {
    if (this.cache.size >= this.cacheSize) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(key, value);
  }

  /** Serialize requests through a queue so the throttle interval is respected. */
  private scheduleRequest(req: ClientRequest): Promise<unknown> {
    const run = this.queue.then(async () => {
      const wait = this.minInterval - (Date.now() - this.lastRequestAt);
      if (wait > 0) await delay(wait);
      this.lastRequestAt = Date.now();
      return this.execute(req);
    });
    // Keep the queue chain alive even if a request rejects.
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async execute(req: ClientRequest): Promise<unknown> {
    const url = `${this.baseUrl}${req.path}`;
    const init: RequestInit = {
      method: req.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(req.body ? { 'Content-Type': 'application/json' } : {}),
      },
    };
    if (req.body) init.body = JSON.stringify(req.body);
    if (req.signal) init.signal = req.signal;

    let response: Response;
    try {
      response = await this.fetchImpl(url, init);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
      throw new ScryfallError('network', 'Could not reach Scryfall. Check your connection.');
    }

    if (response.status === 429) {
      throw new ScryfallError(
        'rate-limited',
        'Scryfall rate limit reached. Please slow down.',
        429,
      );
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new ScryfallError(
        'invalid-response',
        'Scryfall returned a malformed response.',
        response.status,
      );
    }

    if (!response.ok) {
      const parsed = scryfallErrorSchema.safeParse(json);
      const details = parsed.success ? parsed.data.details : `HTTP ${response.status}`;
      if (response.status === 404) {
        throw new ScryfallError('not-found', details, 404);
      }
      throw new ScryfallError('http', details, response.status);
    }

    return json;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

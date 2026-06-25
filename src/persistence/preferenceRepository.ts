import { ManabaseDb, getDb, type PreferenceRecord } from './db';

/** Typed key/value store for cross-deck preferences (e.g. default deck view). */
export class PreferenceRepository {
  constructor(private readonly db: ManabaseDb = getDb()) {}

  async get<T>(key: string): Promise<T | null> {
    const row = await this.db.preferences.get(key);
    return row ? (row.value as T) : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const record: PreferenceRecord = { key, value, updatedAt: Date.now() };
    await this.db.preferences.put(record);
  }

  async delete(key: string): Promise<void> {
    await this.db.preferences.delete(key);
  }
}

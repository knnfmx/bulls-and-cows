import { beforeEach, describe, expect, it } from 'vitest';
import { loadRecords, RecordEntry, saveRecord } from '../src/core/records.js';

const createStorage = (): Storage => {
  const data = new Map<string, string>();
  return {
    get length(): number {
      return data.size;
    },
    clear: (): void => data.clear(),
    getItem: (k: string): string | null => data.get(k) ?? null,
    key: (i: number): string | null => [...data.keys()][i] ?? null,
    removeItem: (k: string): void => {
      data.delete(k);
    },
    setItem: (k: string, v: string): void => {
      data.set(k, v);
    },
  };
};

const makeEntry = (overrides: Partial<RecordEntry> = {}): RecordEntry => ({
  attempts: 5,
  timeMs: 10000,
  length: 3,
  base: 10,
  date: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('loadRecords', () => {
  it('пустой storage в пустой массив', () => {
    expect(loadRecords(createStorage())).toEqual([]);
  });

  it('возвращает записи из storage', () => {
    const storage = createStorage();
    const entry = makeEntry();
    storage.setItem('bulls-cows-records', JSON.stringify([entry]));
    expect(loadRecords(storage)).toEqual([entry]);
  });

  it('битый JSON в пустой массив (без исключений)', () => {
    const storage = createStorage();
    storage.setItem('bulls-cows-records', '{ not json');
    expect(loadRecords(storage)).toEqual([]);
  });
});

describe('saveRecord', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createStorage();
  });

  it('добавляет запись в пустой storage', () => {
    const entry = makeEntry();
    const result = saveRecord(entry, storage);
    expect(result).toEqual([entry]);
    expect(loadRecords(storage)).toEqual([entry]);
  });

  it('сортирует по числу попыток (asc), при равенстве — по времени (asc)', () => {
    saveRecord(makeEntry({ attempts: 5, timeMs: 10000 }), storage);
    saveRecord(makeEntry({ attempts: 3, timeMs: 20000 }), storage);
    saveRecord(makeEntry({ attempts: 5, timeMs: 5000 }), storage);

    const records = loadRecords(storage);
    expect(records.map((r) => r.attempts)).toEqual([3, 5, 5]);
    expect(records[1].timeMs).toBe(5000);
    expect(records[2].timeMs).toBe(10000);
  });

  it('обрезает до TOP_N (10)', () => {
    for (let i = 1; i <= 15; i += 1) {
      saveRecord(makeEntry({ attempts: i, timeMs: i * 1000 }), storage);
    }
    const records = loadRecords(storage);
    expect(records).toHaveLength(10);
    // В топе — 10 лучших (attempts 1..10)
    expect(records[0].attempts).toBe(1);
    expect(records[9].attempts).toBe(10);
  });

  it('возвращает новый массив (иммутабельность)', () => {
    const first = saveRecord(makeEntry(), storage);
    const second = saveRecord(makeEntry({ attempts: 4 }), storage);
    expect(first).not.toBe(second);
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(2);
  });

  it('не мутирует входной entry', () => {
    const entry = makeEntry();
    const copy = { ...entry };
    saveRecord(entry, storage);
    expect(entry).toEqual(copy);
  });

  it('переживает «перезагрузку» (новый storage-объект с тем же key)', () => {
    const entry = makeEntry({ attempts: 2 });
    saveRecord(entry, storage);
    const reloaded = loadRecords(storage);
    expect(reloaded).toEqual([entry]);
  });

  it('записи с одинаковыми полями считаются разными (не дедуплицируются)', () => {
    const entry = makeEntry();
    saveRecord(entry, storage);
    saveRecord(entry, storage);
    expect(loadRecords(storage)).toHaveLength(2);
  });

  it('хранение данных в localStorage — с ключом "bulls-cows-records"', () => {
    saveRecord(makeEntry(), storage);
    const raw = storage.getItem('bulls-cows-records');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toHaveLength(1);
  });
});

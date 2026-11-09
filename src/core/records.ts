export interface RecordEntry {
  readonly attempts: number;
  readonly timeMs: number;
  readonly length: number;
  readonly base: number;
  readonly date: string; // ISO-8601
}

export const RECORDS_KEY = 'bulls-cows-records';

export const TOP_N = 10;

export const loadRecords = (storage: Storage = localStorage): readonly RecordEntry[] => {
  try {
    const raw = storage.getItem(RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecordEntry[]) : [];
  } catch {
    return [];
  }
};

export const saveRecord = (
  entry: RecordEntry,
  storage: Storage = localStorage,
): readonly RecordEntry[] => {
  const all = [...loadRecords(storage), entry];
  const top = all
    .slice()
    .sort((a, b) => a.attempts - b.attempts || a.timeMs - b.timeMs)
    .slice(0, TOP_N);
  storage.setItem(RECORDS_KEY, JSON.stringify(top));
  return top;
};

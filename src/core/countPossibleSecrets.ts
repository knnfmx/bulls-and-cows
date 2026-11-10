const memo = new Map<string, number>();

export const countPossibleSecrets = (length: number, base: number): number => {
  if (length < 0 || base < 0 || length > base) return 0;
  if (length === 0) return 1;

  const key = `${length}:${base}`;
  const cached = memo.get(key);
  if (cached !== undefined) return cached;

  const result = base * countPossibleSecrets(length - 1, base - 1);
  memo.set(key, result);
  return result;
};

import { DIGITS, normalizeDigits } from './createDigitValidator.js';

export const generateSecret = (
  length: number,
  base: number,
  random: () => number = Math.random,
): string => {
  if (!DIGITS[base]) {
    throw new Error(`generateSecret: unsupported base ${base}`);
  }
  if (length <= 0) {
    throw new Error(`generateSecret: length must be positive, got ${length}`);
  }
  if (length > base) {
    throw new Error(`generateSecret: cannot pick ${length} unique digits from base ${base}`);
  }

  const pool = [...DIGITS[base]].map(normalizeDigits);
  const result: string[] = [];

  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }

  return result.join('');
};

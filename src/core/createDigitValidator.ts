export const DIGITS: Record<number, string> = {
  2: '01',
  8: '01234567',
  10: '0123456789',
  16: '0123456789abcdef',
};

export const createDigitValidator =
  (base: number) =>
  (char: string): boolean => {
    const alphabet = DIGITS[base];
    if (!alphabet || char.length !== 1) return false;
    return alphabet.includes(char.toLowerCase());
  };

export const normalizeDigits = (char: string): string => char.toLowerCase();

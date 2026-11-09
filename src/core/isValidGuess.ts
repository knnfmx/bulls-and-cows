import { createDigitValidator, normalizeDigits } from './createDigitValidator.js';

export const isValidGuess = (guess: string, length: number, base: number): boolean => {
  if (guess.length !== length) return false;

  const isValidDigit = createDigitValidator(base);
  const digits = [...guess].map(normalizeDigits);
  if (!digits.every(isValidDigit)) return false;

  return new Set(digits).size === digits.length;
};

import { normalizeDigits } from './createDigitValidator.js';

export interface GuessResult {
  readonly bulls: number;
  readonly cows: number;
}

export const evaluateGuess = (secret: string, guess: string): GuessResult => {
  const secretDigits = [...secret].map(normalizeDigits);
  const guessDigits = [...guess].map(normalizeDigits);

  const bulls = guessDigits.filter((digit, i) => digit === secretDigits[i]).length;

  const secretRest = secretDigits.filter((digit, i) => digit !== guessDigits[i]);

  const cows = guessDigits
    .filter((digit, i) => digit !== secretDigits[i])
    .reduce((acc, digit) => {
      const pos = secretRest.indexOf(digit);
      if (pos === -1) return acc;
      secretRest.splice(pos, 1);
      return acc + 1;
    }, 0);

  return { bulls, cows };
};

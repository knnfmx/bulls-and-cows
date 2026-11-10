import { describe, expect, it } from 'vitest';
import { isValidGuess } from '../src/core/isValidGuess.js';

describe('isValidGuess', () => {
  it('валидна корректная попытка в десятичной', () => {
    expect(isValidGuess('123', 3, 10)).toBe(true);
  });

  it('невалидна при длине короче требуемой', () => {
    expect(isValidGuess('12', 3, 10)).toBe(false);
  });

  it('невалидна при длине больше требуемой', () => {
    expect(isValidGuess('1234', 3, 10)).toBe(false);
  });

  it('невалидна при повторе цифры', () => {
    expect(isValidGuess('112', 3, 10)).toBe(false);
  });

  it('невалидна при недопустимом для base символе (9 в oct)', () => {
    expect(isValidGuess('129', 3, 8)).toBe(false);
  });

  it('hex в верхнем регистре валиден', () => {
    expect(isValidGuess('ABC', 3, 16)).toBe(true);
  });

  it('hex в смешанном регистре валиден', () => {
    expect(isValidGuess('aBc', 3, 16)).toBe(true);
  });

  it('hex: a и A — одна и та же цифра (не дубликат)', () => {
    expect(isValidGuess('aA1', 3, 16)).toBe(false);
  });

  it('допускает ведущий ноль', () => {
    expect(isValidGuess('012', 3, 10)).toBe(true);
  });

  it('невалидна при нецифровом символе', () => {
    expect(isValidGuess('12x', 3, 10)).toBe(false);
  });

  it('невалидна при спецсимволе', () => {
    expect(isValidGuess('1 2', 3, 10)).toBe(false);
  });

  it('валидна граничная попытка в bin (все доступные цифры)', () => {
    expect(isValidGuess('01', 2, 2)).toBe(true);
  });

  it('невалидна при length > base (нельзя выбрать больше уникальных)', () => {
    expect(isValidGuess('012', 3, 2)).toBe(false);
  });

  it('невалидна при пустой строке, если length > 0', () => {
    expect(isValidGuess('', 3, 10)).toBe(false);
  });
});

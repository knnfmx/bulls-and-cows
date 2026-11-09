import { describe, expect, it } from 'vitest';
import { evaluateGuess } from '../src/core/evaluateGuess.js';

describe('evaluateGuess', () => {
  it('все быки при полном совпадении', () => {
    expect(evaluateGuess('123', '123')).toEqual({ bulls: 3, cows: 0 });
  });

  it('все коровы при полной перестановке', () => {
    expect(evaluateGuess('123', '231')).toEqual({ bulls: 0, cows: 3 });
  });

  it('нет совпадений', () => {
    expect(evaluateGuess('123', '456')).toEqual({ bulls: 0, cows: 0 });
  });

  it('2 быка 2 коровы', () => {
    expect(evaluateGuess('1234', '1243')).toEqual({ bulls: 2, cows: 2 });
  });

  it('1 бык 2 коровы', () => {
    expect(evaluateGuess('123', '321')).toEqual({ bulls: 1, cows: 2 });
  });

  it('hex регистронезависим: полное совпадение', () => {
    expect(evaluateGuess('abc', 'ABC')).toEqual({ bulls: 3, cows: 0 });
  });

  it('hex смешанный регистр: полное совпадение', () => {
    expect(evaluateGuess('abc', 'aBc')).toEqual({ bulls: 3, cows: 0 });
  });

  it('hex смешанный регистр: перестановка', () => {
    expect(evaluateGuess('abc', 'CAB')).toEqual({ bulls: 0, cows: 3 });
  });

  it('учитывает лидирующий ноль', () => {
    expect(evaluateGuess('012', '021')).toEqual({ bulls: 1, cows: 2 });
  });

  it('0 быков, 1 корова', () => {
    expect(evaluateGuess('123', '415')).toEqual({ bulls: 0, cows: 1 });
  });

  it('цифра на своём месте не учитывается как корова', () => {
    expect(evaluateGuess('123', '132')).toEqual({ bulls: 1, cows: 2 });
  });

  it('результат — новый объект (иммутабельность)', () => {
    const r1 = evaluateGuess('123', '123');
    const r2 = evaluateGuess('123', '123');
    expect(r1).not.toBe(r2);
    expect(r1).toEqual(r2);
  });

  it('одинаковые значения в guess не задваивают подсчёт (страховка)', () => {
    expect(evaluateGuess('123', '112')).toEqual({ bulls: 1, cows: 1 });
  });

  it('все цифры на своих местах (bin)', () => {
    expect(evaluateGuess('01', '01')).toEqual({ bulls: 2, cows: 0 });
  });

  it('перестановка в bin', () => {
    expect(evaluateGuess('01', '10')).toEqual({ bulls: 0, cows: 2 });
  });
});

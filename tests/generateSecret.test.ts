import { describe, expect, it } from 'vitest';
import { generateSecret } from '../src/core/generateSecret.js';

const seq =
  (...vals: number[]) =>
  (): number => {
    return vals.length ? (vals.shift() as number) : 0;
  };

describe('generateSecret', () => {
  it('детерминирована при фиксированном random: все 0 "012"', () => {
    expect(generateSecret(3, 10, seq(0, 0, 0))).toBe('012');
  });

  it('детерминирована при random 1: берёт последний элемент "987"', () => {
    expect(generateSecret(3, 10, seq(0.99, 0.99, 0.99))).toBe('987');
  });

  it('возвращает ровно length символов', () => {
    expect(generateSecret(4, 10, seq(0.1, 0.2, 0.3, 0.4))).toHaveLength(4);
  });

  it('все цифры уникальны', () => {
    const s = generateSecret(4, 10, seq(0.1, 0.2, 0.3, 0.4));
    expect(new Set(s).size).toBe(4);
  });

  it('использует только допустимые цифры в bin', () => {
    const s = generateSecret(2, 2, seq(0.5, 0.5));
    expect([...s].every((c) => '01'.includes(c))).toBe(true);
  });

  it('может выдать 0 первой цифрой (лидирующий ноль допустим)', () => {
    expect(generateSecret(2, 10, seq(0, 0))).toBe('01');
  });

  it('генерирует корректно для hex (все цифры в нижнем регистре)', () => {
    const s = generateSecret(6, 16, seq(0.1, 0.2, 0.3, 0.4, 0.5, 0.6));
    expect(s).toHaveLength(6);
    expect(new Set(s).size).toBe(6);
    expect([...s].every((c) => '0123456789abcdef'.includes(c))).toBe(true);
  });

  it('для максимальной длины base=2 выдаёт "01" или "10"', () => {
    const s = generateSecret(2, 2, seq(0.5, 0.5));
    expect(['01', '10']).toContain(s);
  });

  it('бросает ошибку, если length > base', () => {
    expect(() => generateSecret(5, 2)).toThrow();
  });

  it('бросает ошибку при length = 0', () => {
    expect(() => generateSecret(0, 10)).toThrow();
  });

  it('бросает ошибку при отрицательной длине', () => {
    expect(() => generateSecret(-1, 10)).toThrow();
  });

  it('не зависит от Math.random: без random использует его, но результат валиден', () => {
    const s = generateSecret(4, 10);
    expect(s).toHaveLength(4);
    expect(new Set(s).size).toBe(4);
  });

  it('не мутирует переданный random: вызывает его length раз', () => {
    let calls = 0;
    const countingRandom = (): number => {
      calls += 1;
      return 0.5;
    };
    generateSecret(4, 10, countingRandom);
    expect(calls).toBe(4);
  });
});

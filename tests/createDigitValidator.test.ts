import { describe, expect, it } from 'vitest';
import { createDigitValidator } from '../src/core/createDigitValidator.js';

describe('createDigitValidator', () => {
  it('принимает 0 и 1 в двоичной системе', () => {
    const v = createDigitValidator(2);
    expect(v('0')).toBe(true);
    expect(v('1')).toBe(true);
  });

  it('отклоняет 2 в двоичной системе', () => {
    expect(createDigitValidator(2)('2')).toBe(false);
  });

  it('принимает цифры 0–7 в восьмеричной', () => {
    const v = createDigitValidator(8);
    expect(v('0')).toBe(true);
    expect(v('7')).toBe(true);
  });

  it('отклоняет 8 в восьмеричной', () => {
    expect(createDigitValidator(8)('8')).toBe(false);
  });

  it('принимает 0–9 в десятичной', () => {
    const v = createDigitValidator(10);
    expect(v('0')).toBe(true);
    expect(v('9')).toBe(true);
  });

  it('принимает a–f в hex в нижнем регистре', () => {
    const v = createDigitValidator(16);
    expect(v('a')).toBe(true);
    expect(v('f')).toBe(true);
  });

  it('принимает A–F в hex в верхнем регистре (регистронезависимость)', () => {
    const v = createDigitValidator(16);
    expect(v('A')).toBe(true);
    expect(v('F')).toBe(true);
  });

  it('отклоняет g в hex', () => {
    expect(createDigitValidator(16)('g')).toBe(false);
  });

  it('отклоняет многосимвольную строку', () => {
    expect(createDigitValidator(10)('12')).toBe(false);
  });

  it('отклоняет пустую строку', () => {
    expect(createDigitValidator(10)('')).toBe(false);
  });

  it('возвращает функцию (каррирование)', () => {
    expect(typeof createDigitValidator(10)).toBe('function');
  });

  it('для неподдерживаемого основания всегда false', () => {
    expect(createDigitValidator(3)('0')).toBe(false);
  });

  it('не зависит от внешнего состояния: два вызова дают одинаковый результат', () => {
    const v1 = createDigitValidator(10);
    const v2 = createDigitValidator(10);
    expect(v1('5')).toBe(v2('5'));
  });
});

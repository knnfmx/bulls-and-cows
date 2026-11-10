import { describe, expect, it } from 'vitest';
import { countPossibleSecrets } from '../src/core/countPossibleSecrets.js';

describe('countPossibleSecrets', () => {
  it('P(2,2)=2 — только 01 и 10', () => {
    expect(countPossibleSecrets(2, 2)).toBe(2);
  });

  it('P(3,10)=720', () => {
    expect(countPossibleSecrets(3, 10)).toBe(720);
  });

  it('P(4,10)=5040', () => {
    expect(countPossibleSecrets(4, 10)).toBe(5040);
  });

  it('P(6,16)=5765760', () => {
    expect(countPossibleSecrets(6, 16)).toBe(5765760);
  });

  it('P(1,8)=8', () => {
    expect(countPossibleSecrets(1, 8)).toBe(8);
  });

  it('P(5,10)=30240', () => {
    expect(countPossibleSecrets(5, 10)).toBe(30240);
  });

  it('P(0,10)=1 — одно пустое секретное число', () => {
    expect(countPossibleSecrets(0, 10)).toBe(1);
  });

  it('length > base к 0 (нельзя выбрать больше уникальных, чем есть)', () => {
    expect(countPossibleSecrets(5, 2)).toBe(0);
  });

  it('length < 0 или base < 0 к 0', () => {
    expect(countPossibleSecrets(-1, 10)).toBe(0);
    expect(countPossibleSecrets(3, -1)).toBe(0);
  });

  it('мемоизация: повторный вызов даёт тот же результат', () => {
    const first = countPossibleSecrets(4, 16);
    const second = countPossibleSecrets(4, 16);
    expect(second).toBe(first);
  });

  it('мемоизация не ломает разные аргументы: P(4,10)/P(3,10) = 7', () => {
    const a = countPossibleSecrets(3, 10);
    const b = countPossibleSecrets(4, 10);
    expect(b).toBe(a * 7);
  });

  it('мемоизация не ломает обратный порядок аргументов', () => {
    const big = countPossibleSecrets(5, 10);
    const small = countPossibleSecrets(2, 10);
    expect(big).toBe(30240);
    expect(small).toBe(90);
  });
});

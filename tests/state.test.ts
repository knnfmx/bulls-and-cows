import { describe, expect, it } from 'vitest';
import { addAttempt, createGame, GameState } from '../src/core/state.js';

describe('createGame', () => {
  it('создаёт пустое состояние с заданными параметрами', () => {
    const s = createGame('123', 3, 10, 1000);
    expect(s.secret).toBe('123');
    expect(s.length).toBe(3);
    expect(s.base).toBe(10);
    expect(s.history).toEqual([]);
    expect(s.startedAt).toBe(1000);
    expect(s.finishedAt).toBeNull();
    expect(s.won).toBe(false);
  });
});

describe('addAttempt', () => {
  it('иммутабельно добавляет попытку: исходное состояние не меняется', () => {
    const s0 = createGame('123', 3, 10, 0);
    const s1 = addAttempt(s0, '456', 1000);

    // Исходное состояние не изменилось
    expect(s0.history).toEqual([]);
    expect(s0.won).toBe(false);
    expect(s0.finishedAt).toBeNull();

    // Новое состояние
    expect(s1).not.toBe(s0);
    expect(s1.history).not.toBe(s0.history);
    expect(s1.history).toHaveLength(1);
    expect(s1.history[0].guess).toBe('456');
    expect(s1.history[0].result).toEqual({ bulls: 0, cows: 0 });
  });

  it('создаёт новый массив истории при каждой попытке', () => {
    const s0 = createGame('123', 3, 10, 0);
    const s1 = addAttempt(s0, '456', 1000);
    const s2 = addAttempt(s1, '789', 2000);

    expect(s0.history).not.toBe(s1.history);
    expect(s1.history).not.toBe(s2.history);
    expect(s0.history).toHaveLength(0);
    expect(s1.history).toHaveLength(1);
    expect(s2.history).toHaveLength(2);
  });

  it('записывает корректные bulls/cows через evaluateGuess', () => {
    const s0 = createGame('123', 3, 10, 0);
    const s1 = addAttempt(s0, '132', 1000);
    expect(s1.history[0].result).toEqual({ bulls: 1, cows: 2 });
  });

  it('повторная попытка не задваивает запись в истории', () => {
    const s0 = createGame('123', 3, 10, 0);
    const s1 = addAttempt(s0, '456', 1000);
    const s2 = addAttempt(s1, '456', 2000);

    expect(s2).toBe(s1); // та же ссылка
    expect(s2.history).toHaveLength(1);
    expect(s2.finishedAt).toBeNull();
  });

  it('не добавляет запись после победы', () => {
    const s0 = createGame('123', 3, 10, 0);
    const s1 = addAttempt(s0, '123', 1000); // победа
    expect(s1.won).toBe(true);

    const s2 = addAttempt(s1, '456', 2000);
    expect(s2).toBe(s1); // состояние не меняется
    expect(s2.history).toHaveLength(1);
  });

  it('устанавливает won=true и finishedAt при победе', () => {
    const s0 = createGame('123', 3, 10, 0);
    const s1 = addAttempt(s0, '123', 1000);
    expect(s1.won).toBe(true);
    expect(s1.finishedAt).toBe(1000);
  });

  it('при проигрыше finishedAt остаётся null', () => {
    const s0 = createGame('123', 3, 10, 0);
    const s1 = addAttempt(s0, '132', 1000);
    expect(s1.won).toBe(false);
    expect(s1.finishedAt).toBeNull();
  });

  it('не мутирует исходное состояние при победе', () => {
    const s0 = createGame('123', 3, 10, 0);
    const s1 = addAttempt(s0, '123', 1000);

    // Исходное состояние не изменилось
    expect(s0.won).toBe(false);
    expect(s0.finishedAt).toBeNull();
    expect(s0.history).toHaveLength(0);

    // Победа
    expect(s1).not.toBe(s0);
    expect(s1.won).toBe(true);
    expect(s1.finishedAt).toBe(1000);
    expect(s1.history).toHaveLength(1);
  });

  it('попытки в разном регистре hex считаются разными (по строке)', () => {
    const s0 = createGame('abc', 3, 16, 0);
    const s1 = addAttempt(s0, 'ABC', 1000);
    expect(s1.history).toHaveLength(1);
    expect(s1.history[0].result).toEqual({ bulls: 3, cows: 0 });
    expect(s1.won).toBe(true);
  });

  it('GameState доступен как тип (компиляция)', () => {
    const s: GameState = createGame('12', 2, 10, 0);
    expect(s.secret).toBe('12');
  });
});

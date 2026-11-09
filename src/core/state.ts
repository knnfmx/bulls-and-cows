import { evaluateGuess, GuessResult } from './evaluateGuess.js';

export interface Attempt {
  readonly guess: string;
  readonly result: GuessResult;
}

export interface GameState {
  readonly secret: string;
  readonly length: number;
  readonly base: number;
  readonly history: readonly Attempt[];
  readonly startedAt: number;
  readonly finishedAt: number | null;
  readonly won: boolean;
}

export const createGame = (
  secret: string,
  length: number,
  base: number,
  now: number,
): GameState => ({
  secret,
  length,
  base,
  history: [],
  startedAt: now,
  finishedAt: null,
  won: false,
});

export const addAttempt = (state: GameState, guess: string, now: number): GameState => {
  if (state.won) return state;

  const alreadyPlayed = state.history.some((attempt) => attempt.guess === guess);
  if (alreadyPlayed) return state;

  const result = evaluateGuess(state.secret, guess);
  const won = result.bulls === state.length;

  return {
    ...state,
    history: [...state.history, { guess, result }],
    won,
    finishedAt: won ? now : null,
  };
};

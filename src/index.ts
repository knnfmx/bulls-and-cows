import { generateSecret } from './core/generateSecret.js';
import { loadRecords, saveRecord } from './core/records.js';
import { addAttempt, createGame, GameState } from './core/state.js';
import { el } from './ui/dom.js';
import { renderGame, renderSettings } from './ui/render.js';

const root = el('div', { id: 'app' });
document.body.append(root);

let currentGame: GameState | null = null;

const showSettings = (): void => {
  currentGame = null;
  renderSettings(root, {
    records: loadRecords(),
    onStart: (length, base) => {
      const secret = generateSecret(length, base);
      currentGame = createGame(secret, length, base, Date.now());
      showGame();
    },
  });
};

const showGame = (): void => {
  if (!currentGame) return;

  renderGame(root, {
    state: currentGame,
    timeMs: (currentGame.finishedAt ?? Date.now()) - currentGame.startedAt,
    onGuess: (guess) => {
      if (!currentGame) return;
      const next = addAttempt(currentGame, guess, Date.now());
      const justWon = !currentGame.won && next.won;
      currentGame = next;
      if (justWon && currentGame.finishedAt !== null) {
        saveRecord({
          attempts: currentGame.history.length,
          timeMs: currentGame.finishedAt - currentGame.startedAt,
          length: currentGame.length,
          base: currentGame.base,
          date: new Date().toISOString(),
        });
      }
      showGame();
    },
    onNewGame: showSettings,
  });
};

showSettings();

void el;

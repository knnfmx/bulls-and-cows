import { countPossibleSecrets } from '../core/countPossibleSecrets.js';
import { createDigitValidator } from '../core/createDigitValidator.js';
import { RecordEntry, TOP_N } from '../core/records.js';
import { GameState } from '../core/state.js';
import { el, mount } from './dom.js';

const BASES = [2, 8, 10, 16] as const;
const LENGTHS = [2, 3, 4, 5, 6] as const;

/**
 * Экран настроек: длина, base, подсказка «возможных секретов»,
 * таблица рекордов, кнопка «Играть».
 */
export const renderSettings = (
  root: HTMLElement,
  options: {
    records: readonly RecordEntry[];
    onStart: (length: number, base: number) => void;
  },
): void => {
  const baseSelect = el('select', { id: 'base-select' });
  BASES.forEach((b) => {
    baseSelect.append(el('option', { value: String(b), textContent: `base ${b}` }));
  });

  const lengthSelect = el('select', { id: 'length-select' });

  const hint = el('p', { className: 'hint' });

  const startBtn = el('button', {
    type: 'button',
    textContent: 'Играть',
    className: 'primary',
  });

  const refresh = (): void => {
    const base = Number(baseSelect.value);
    const currentLength = Number(lengthSelect.value) || 0;

    // Пересобираем опции длины: недоступные (length > base).
    mount(
      lengthSelect,
      LENGTHS.map((len) =>
        el('option', {
          value: String(len),
          textContent: String(len),
          disabled: len > base,
        }),
      ),
    );

    // Сохраняем доступную длину.
    const available = LENGTHS.filter((len) => len <= base);
    lengthSelect.value = String(
      available.includes(currentLength as (typeof LENGTHS)[number]) ? currentLength : available[0],
    );

    const chosen = Number(lengthSelect.value);
    const possible = countPossibleSecrets(chosen, base);
    hint.textContent = `Возможных секретов: ${possible.toLocaleString('ru-RU')}`;
  };

  baseSelect.addEventListener('change', refresh);
  lengthSelect.addEventListener('change', refresh);

  startBtn.addEventListener('click', () => {
    const base = Number(baseSelect.value);
    const length = Number(lengthSelect.value);
    options.onStart(length, base);
  });

  mount(root, [
    el('h1', { textContent: 'Bulls & Cows' }),
    el('section', { className: 'settings' }, [
      el('label', { textContent: 'Система счисления' }),
      baseSelect,
      el('label', { textContent: 'Длина секрета' }),
      lengthSelect,
      hint,
      startBtn,
    ]),
    el('section', { className: 'records' }, [
      el('h2', { textContent: `Таблица рекордов (топ-${TOP_N})` }),
      renderRecordsTable(options.records),
    ]),
  ]);

  refresh();
};

// Экран игры: поле ввода, история попыток, статус (победа/время), «Новая игра».

export const renderGame = (
  root: HTMLElement,
  options: {
    state: GameState;
    timeMs: number;
    onGuess: (guess: string) => void;
    onNewGame: () => void;
  },
): void => {
  const { state } = options;

  const isValidDigit = createDigitValidator(state.base);

  const input = el('input', {
    type: 'text',
    placeholder: `Введите ${state.length} цифр (base ${state.base})`,
    maxLength: state.length,
    className: 'guess-input',
    autocomplete: 'off',
  });

  // Фильтрация ввода: удаляем недопустимые символы и приводим к нижнему регистру (hex).
  input.addEventListener('input', () => {
    const filtered = [...input.value].filter(isValidDigit).join('').toLowerCase();
    if (input.value !== filtered) input.value = filtered;
  });

  const submit = (): void => {
    if (input.value.length === state.length) {
      options.onGuess(input.value);
      input.value = '';
    }
  };

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submit();
  });

  const guessBtn = el('button', {
    type: 'button',
    textContent: 'Проверить',
    className: 'primary',
  });
  guessBtn.addEventListener('click', submit);

  const historyItems = state.history.map((attempt) =>
    el('li', {
      className: 'history-item',
      textContent: `${attempt.guess} — 🐂 ${attempt.result.bulls}, 🐄 ${attempt.result.cows}`,
    }),
  );

  const status = state.won
    ? el('p', {
        className: 'status won',
        textContent: `Победа! Попыток: ${state.history.length}, время: ${formatTime(options.timeMs)}`,
      })
    : el('p', {
        className: 'status',
        textContent: `Попыток: ${state.history.length}`,
      });

  const newGameBtn = el('button', {
    type: 'button',
    textContent: 'Новая игра',
  });
  newGameBtn.addEventListener('click', options.onNewGame);

  mount(root, [
    el('h1', { textContent: 'Bulls & Cows' }),
    el('section', { className: 'game' }, [
      el('p', {
        className: 'legend',
        textContent: `🐂 бык — цифра на своём месте. 🐄 корова — цифра есть, но не на своём.`,
      }),
      el('div', { className: 'input-row' }, [input, guessBtn]),
      status,
      el('h2', { textContent: 'История попыток' }),
      state.history.length
        ? el('ul', { className: 'history' }, historyItems)
        : el('p', { className: 'empty', textContent: 'Пока нет попыток' }),
      newGameBtn,
    ]),
  ]);

  input.focus();
};

// Таблица рекордов

export const renderRecordsTable = (records: readonly RecordEntry[]): HTMLElement => {
  if (records.length === 0) {
    return el('p', {
      className: 'empty',
      textContent: 'Рекордов пока нет. Сыграйте раунд!',
    });
  }

  const rows = records.map((rec, index) =>
    el('tr', {}, [
      el('td', { textContent: String(index + 1) }),
      el('td', { textContent: String(rec.attempts) }),
      el('td', { textContent: formatTime(rec.timeMs) }),
      el('td', {
        className: 'mode-badge',
        textContent: `base ${rec.base}, len ${rec.length}`,
      }),
      el('td', {
        className: 'date',
        textContent: new Date(rec.date).toLocaleDateString('ru-RU'),
      }),
    ]),
  );

  return el('table', { className: 'records-table' }, [
    el('thead', {}, [
      el('tr', {}, [
        el('th', { textContent: '#' }),
        el('th', { textContent: 'Попыток' }),
        el('th', { textContent: 'Время' }),
        el('th', { textContent: 'Режим' }),
        el('th', { textContent: 'Дата' }),
      ]),
    ]),
    el('tbody', {}, rows),
  ]);
};

const formatTime = (ms: number): string => `${(ms / 1000).toFixed(2)} с`;

# DESIGN — Bulls & Cows

Документ описывает архитектурные решения: структуры данных, алгоритмы, сложность и принципы чистого кода, применённые в проекте.

## 1. Структуры данных и алгоритмы

### 1.1. Состояние игры (src/core/state.ts)

Состояние — иммутабельный объект GameState:

interface GameState {
readonly secret: string;
readonly length: number;
readonly base: number;
readonly history: readonly Attempt[];
readonly startedAt: number;
readonly finishedAt: number | null;
readonly won: boolean;
}

interface Attempt {
readonly guess: string;
readonly result: GuessResult; // { bulls, cows }
}

Почему так:

- secret — строка, а не число. Секрет может начинаться с 0 (например, 0123), и как number он бы терял лидирующий ноль. Строка — естественное представление для последовательности цифр фиксированной длины.
- history — readonly Attempt[]. История — неизменяемый лог: старые записи не редактируются, новая попытка добавляется через [...state.history, entry] (см. addAttempt). Это прямое требование ТЗ и заодно делает состояние безопасным для Object.is-проверок в UI: если ссылка не поменялась — ничего не произошло.
- readonly у всех полей. Компилятор не даёт случайно сделать state.won = true; любое изменение — только через возврат нового объекта ({ ...state, ... }).
- startedAt / finishedAt — числа (ms с epoch). Время инъектируется параметром (now: number) — это делает createGame и addAttempt детерминированными в тестах.
- won — производный флаг. Хотя его можно вычислить из history.at(-1).result.bulls === length, храним явно, потому что: (а) UI читает его на каждом кадре — O(1) вместо O(1) через .at(-1), (б) он фиксирует момент окончания (finishedAt), который не восстановить из истории.

addAttempt — иммутабельное обновление:

export const addAttempt = (state, guess, now) => {
if (state.won) return state;
if (state.history.some(a => a.guess === guess)) return state;
const result = evaluateGuess(state.secret, guess);
const won = result.bulls === state.length;
return {
...state,
history: [...state.history, { guess, result }],
won,
finishedAt: won ? now : null,
};
};

Возврат той же ссылки при отказе — сигнал UI «перерисовывать нечего». Это идиоматично для иммутабельного состояния.

### 1.2. Алгоритм evaluateGuess (src/core/evaluateGuess.ts)

Задача: посчитать bulls (цифра на своём месте) и cows (цифра есть в секрете, но не на этой позиции).

Алгоритм — три шага через HOF:

1. Нормализация. Обе строки → массивы символов, каждый символ → normalizeDigits (hex a и A — одна цифра).

   const secretDigits = [...secret].map(normalizeDigits);
   const guessDigits = [...guess ].map(normalizeDigits);

2. Быки — filter по индексу.

   const bulls = guessDigits.filter((digit, i) => digit === secretDigits[i]).length;

3. Коровы — filter + reduce по «остатку секрета». secretRest — цифры секрета, не стоящие на своём месте (быки уже посчитаны, они не должны попасть в коровы). Затем идём по не-быкам guess; для каждой цифры ищем её в secretRest; если нашли — cows++ и удаляем из secretRest, чтобы одинаковые цифры в guess не посчитались дважды.

   const secretRest = secretDigits.filter((digit, i) => digit !== guessDigits[i]);
   const cows = guessDigits
   .filter((digit, i) => digit !== secretDigits[i])
   .reduce((acc, digit) => {
   const pos = secretRest.indexOf(digit);
   if (pos === -1) return acc;
   secretRest.splice(pos, 1);
   return acc + 1;
   }, 0);

Почему именно так:

- HOF вместо ручных счётчиков. Требование ТЗ. Читается как «фильтрую по предикату, сворачиваю в число» — в отличие от for со счётчиком, где намерение теряется за механикой.
- secretRest — именно не-быки. Пример: 123 vs 132. Бык — 1 на позиции 0. Остаток секрета — '23'. Цифры 3 и 2 из guess находятся в остатке → 2 коровы. Если бы в остатке был весь '123', 2 посчиталась бы и быком (уже посчитано), и коровой.
- splice по secretRest — локальная мутация. secretRest создан через filter — это новый массив, не часть входа. Мутировать его безопасно: чистота относительно аргументов secret/guess сохранена. Без splice при повторах в guess (например, 112 vs 123) одна цифра могла бы посчитаться дважды.

### 1.3. Алгоритм countPossibleSecrets (src/core/countPossibleSecrets.ts)

Считает число секретов длины length в системе base — это число перестановок без повторений:

P(base, length) = base · (base−1) · … · (base−length+1) = base! / (base−length)!

Рекурсивная формула:

P(n, 0) = 1
P(n, k) = n · P(n−1, k−1)

Мемоизация через Map<string, number> на уровне модуля:

const memo = new Map<string, number>();

export const countPossibleSecrets = (length, base) => {
if (length < 0 || base < 0 || length > base) return 0;
if (length === 0) return 1;

const key = `${length}:${base}`;
const cached = memo.get(key);
if (cached !== undefined) return cached;

const result = base * countPossibleSecrets(length - 1, base - 1);
memo.set(key, result);
return result;
};

Почему так:

- Рекурсия — прямо по формуле. Читается как математика, а не как итеративный цикл с накоплением. Требование ТЗ: «Реализуйте рекурсивно».
- Мемоизация — требование ТЗ и практическая польза. Функция вызывается при каждом открытии настроек и при каждом переключении длины/базы в UI. Без кэша каждый такой вызов — O(length) умножений. С кэшем повторный вызов — O(1). Map на уровне модуля живёт, пока живёт модуль.
- Ключ ${length}:${base} — не только length. Разные комбинации (length, base) дают разные результаты; коллизии исключены.
- Границы → 0, база → 1. length > base → 0 (нельзя выбрать больше уникальных, чем есть; UI может запросить любое значение, 0 — корректный ответ). length === 0 → 1 (пустая перестановка). База рекурсии не кэшируется — она O(1), кэш не нужен.

## 2. Сложность (Big O)

Обозначения: n — длина секрета (length), b — основание (base), k = min(n, b) — фактическая длина секрета.

### generateSecret(length, base, random)

- Время: O(length). Частичный Fisher–Yates: ровно length итераций, на каждой floor(random() * pool.length) + splice. splice по массиву длины b — O(b), но b ≤ 16 (bin/oct/dec/hex) — константа. Значит, асимптотически O(length). Не O(length·base): splice с idx сдвигает b − idx элементов, но при фиксированном max base это O(1).
- Память: O(base) на копию алфавита pool + O(length) на результат. Итого O(base).
- Обоснование: именно length обращений к random — это важно и проверено тестом countingRandom в tests/generateSecret.test.ts. Перемешивание всего массива дало бы base обращений; частичный Fisher–Yates — length.

### evaluateGuess(secret, guess)

- Время: O(n²) в худшем случае. Три прохода filter/reduce — O(n) каждый; внутри reduce — indexOf + splice по secretRest длиной ≤ n. Худший случай — O(n²). Но n ≤ 6 (максимум секрета по ТЗ), поэтому фактически ≤ 36 элементарных операций. При таких масштабах O(n²) — оптимальный компромисс по читаемости: можно было бы сделать O(n) через Map<char, count>, но это усложнило бы код без практической выгоды.
- Память: O(n) — три массива символов + Set из evaluateGuess не используется; secretRest + guessDigits + secretDigits.
- Обоснование: O(n²) — следствие indexOf внутри reduce. При фиксированном n ≤ 6 это константа. Альтернатива через Map дала бы O(n), но потребовала бы ручного подсчёта — против требования «HOF, не ручные счётчики».

### isValidGuess(guess, length, base)

- Время: O(n). Ранний выход при guess.length !== length — O(1). Иначе: map(normalizeDigits) — O(n), every(isValidDigit) — O(n), new Set(...).size === n — O(n). Итого O(n).
- Память: O(n) — digits (массив) + Set.
- Обоснование: единственный проход по каждому символу три раза (нормализация → проверка допустимости → множество). Три O(n) прохода = O(n).

### countPossibleSecrets(length, base)

- Время: O(length) на первый вызов, O(1) на последующие с теми же аргументами. Рекурсия идёт от (length, base) до (0, …), глубина length, и каждый уровень — O(1) арифметики + O(1) Map.get/set. После первого вызова Map содержит все промежуточные (k, b) для k = 1..length, поэтому повторный вызов с теми же аргументами — O(1) (memo.get(key)).
- Память: O(length · base) на кэш в худшем случае — все комбинации (k, b) с 0 ≤ k ≤ length, 0 ≤ b ≤ base. На практике при length ≤ 6 и base ≤ 16 это ≤ 112 пар, константа.
- Обоснование: без мемоизации было бы O(length) на каждый вызов; с мемоизацией — O(1) на повтор. ТЗ требует именно это.

## 3. Принципы Clean Code — где применены

### 3.1. Чистые функции без побочных эффектов

- src/core/*.ts — всё игровое ядро (кроме records.ts — там неизбежен localStorage) состоит из чистых функций: createDigitValidator, normalizeDigits, isValidGuess, generateSecret, evaluateGuess, countPossibleSecrets, createGame, addAttempt. Каждая зависит только от аргументов, не мутирует вход, не читает глобалы.
- src/core/generateSecret.ts — random инъектируется параметром (random: () => number = Math.random), что делает функцию чистой относительно тестов: при фиксированном random результат детерминирован. Без инъекции функция не была бы чистой.
- src/core/state.ts — now: number инъектируется параметром (в createGame и addAttempt), а не читается из Date.now() внутри. Это делает обновления состояния детерминированными для тестов.

### 3.2. Иммутабельность

- src/core/state.ts: addAttempt — добавление попытки через { ...state, history: [...state.history, entry] }. Вход не мутируется, возвращается новый объект. При отказе (победа/дубликат) возвращается та же ссылка — идиоматично для иммутабельного состояния.
- src/core/records.ts: saveRecord — [...loadRecords(storage), entry] и .slice().sort().slice(0, TOP_N). Не мутирует ни вход, ни текущий массив в storage: чтение → новый массив → запись.
- src/core/evaluateGuess.ts — splice применяется только к secretRest, созданному через filter. Входные secret/guess не мутируются.

### 3.3. Функции высшего порядка

- src/core/evaluateGuess.ts: evaluateGuess — реализован через filter (быки) + filter (остаток) + reduce (коровы). Никаких for со счётчиками.
- src/core/isValidGuess.ts: isValidGuess — [...guess].map(normalizeDigits) и digits.every(isValidDigit). Никаких ручных проверок в цикле.
- src/core/generateSecret.ts — внутри for, но это генерация с изменяющимся pool на каждом шаге; HOF-форма (map/reduce с мутирующим аккумулятором) была бы не чище, а запутаннее. Функциональный стиль не догма: в местах, где HOF ухудшает читаемость, используем императивный for.

### 3.4. Каррирование

- src/core/createDigitValidator.ts: createDigitValidator — каррированная фабрика: (base) => (char) => boolean. Применяется минимум в двух местах (требование ТЗ):
  1. src/core/isValidGuess.ts — const isValidDigit = createDigitValidator(base); затем digits.every(isValidDigit).
  2. src/ui/render.ts: renderGame — фильтр input в реальном времени: const isValidDigit = createDigitValidator(state.base); затем [...input.value].filter(isValidDigit).

  Одна фабрика, два разных контекста (валидация на ядре, фильтрация в UI) — это и есть смысл каррирования: «частичное применение» параметра base, которое затем переиспользуется как предикат.

### 3.5. Мемоизация

- src/core/countPossibleSecrets.ts — модульный Map<string, number>, ключ ${length}:${base}. Функция детерминирована → кэш всегда валиден. Требование ТЗ.

### 3.6. Рекурсия

- src/core/countPossibleSecrets.ts — рекурсивная формула P(n, k) = n · P(n−1, k−1), база P(_, 0) = 1. Глубина ≤ 6 — безопасно.

### 3.7. Именование и маленькие функции

- src/core/evaluateGuess.ts — интерфейс GuessResult, поля bulls/cows; имена совпадают с игровой терминологией.
- src/core/records.ts — RECORDS_KEY, TOP_N — именованные константы вместо «магических» строк и чисел.
- src/ui/dom.ts — крошечная el() (15 строк) вместо повторения document.createElement в каждом рендер-файле. Одна ответственность.
- src/ui/render.ts — renderSettings, renderGame, renderRecordsTable — каждая функция рисует один экран. Легко менять один, не задевая другие.

### 3.8. Обработка ошибок

- src/core/generateSecret.ts — ранние проверки length <= 0, length > base, !DIGITS[base] с осмысленными сообщениями. Ошибка выбрасывается сразу, а не «где-то потом».
- src/core/records.ts: loadRecords — try/catch вокруг JSON.parse + Array.isArray. Битый localStorage не роняет UI.
- src/ui/dom.ts: mount — безопасная очистка контейнера через while (root.firstChild) root.removeChild(...), а не innerHTML = '' (никаких HTML-строк — XSS невозможен).

### 3.9. Отсутствие innerHTML для динамического контента

- src/ui/dom.ts — единственное место, где создаются DOM-узлы: document.createElement + Object.assign(props) + node.append(...). Строки-дети становятся текстовыми узлами (без HTML-парсинга).
- src/ui/render.ts — все экраны через el(...) и mount(...). Ни одного innerHTML, insertAdjacentHTML, outerHTML, document.write.
- index.html — <body> пустой, кроме <script type="module" src="dist/index.js">. Вся разметка генерируется кодом (требование ТЗ).

### 3.10. TDD / FIRST

- Все функции ядра (createDigitValidator, isValidGuess, generateSecret, evaluateGuess, countPossibleSecrets) и модули state и records имеют пары коммитов test: → feat: (см. git log). Тесты — в tests/*.test.ts, соответствуют FIRST: быстрые (in-memory), независимые (нет общего состояния), детерминированные (random/now/storage инъектируются), самопроверяющиеся (expect(...).toBe(...)), timely (пишутся до реализации).

import {
  PROMPT_MAX_MS,
  PROMPT_MIN_MS,
  SPEED_CONFIG,
  WUBBLE_DURATION_SECONDS
} from './wubble.config.js';

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clampPromptDuration(remainingMs) {
  if (remainingMs <= PROMPT_MAX_MS) return remainingMs;
  const min = Math.min(PROMPT_MIN_MS, remainingMs);
  const max = Math.min(PROMPT_MAX_MS, remainingMs);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickBalancedWord(pool, wordUsageCount, recentWordIds) {
  const recentSet = new Set(recentWordIds);
  const nonRecent = pool.filter((word) => !recentSet.has(word.wordId));
  const candidatePool = nonRecent.length ? nonRecent : pool;

  let minUsage = Number.POSITIVE_INFINITY;
  for (const word of candidatePool) {
    minUsage = Math.min(minUsage, wordUsageCount.get(word.wordId) || 0);
  }

  const lowestUsageWords = candidatePool.filter((word) => (wordUsageCount.get(word.wordId) || 0) === minUsage);
  return pickRandom(lowestUsageWords);
}

export function generatePromptSchedule({ categories, durationSeconds = WUBBLE_DURATION_SECONDS }) {
  const durationMs = durationSeconds * 1000;
  const schedule = [];
  let cursorMs = 0;
  let previousCategorySlug = null;
  let promptIndex = 0;

  while (cursorMs < durationMs) {
    const remainingMs = durationMs - cursorMs;
    const promptDurationMs = clampPromptDuration(remainingMs);

    const availableCategories = categories.filter((category) => category.slug !== previousCategorySlug);
    const category = pickRandom(availableCategories.length ? availableCategories : categories);

    schedule.push({
      promptIndex,
      categorySlug: category.slug,
      label: `Tap the ${category.label}`,
      startsAtMs: cursorMs,
      endsAtMs: cursorMs + promptDurationMs
    });

    previousCategorySlug = category.slug;
    cursorMs += promptDurationMs;
    promptIndex += 1;
  }

  return schedule;
}

function getPromptIndexAtTime(promptSchedule, timestampMs) {
  return promptSchedule.findIndex((prompt) => timestampMs >= prompt.startsAtMs && timestampMs < prompt.endsAtMs);
}

function chooseWordPool({ words, currentPrompt, shouldMatchPrompt }) {
  if (shouldMatchPrompt) {
    return words.filter((word) => word.categories.includes(currentPrompt.categorySlug));
  }

  return words.filter((word) => !word.categories.includes(currentPrompt.categorySlug));
}

export function generateSpawnPlan({ words, promptSchedule, speedDifficulty, durationSeconds = WUBBLE_DURATION_SECONDS }) {
  const config = SPEED_CONFIG[speedDifficulty];
  const durationMs = durationSeconds * 1000;
  const spawnPlan = [];
  const activeEndTimes = [];
  const wordUsageCount = new Map();
  const recentWordIds = [];
  const categoryQueues = new Map();
  const categoryQueueIndices = new Map();
  let appearsAtMs = 0;
  let spawnOrdinal = 0;

  while (appearsAtMs < durationMs) {
    const promptIndex = getPromptIndexAtTime(promptSchedule, appearsAtMs);
    const currentPrompt = promptSchedule[promptIndex];
    if (!currentPrompt) break;

    while (activeEndTimes.length && activeEndTimes[0] <= appearsAtMs) {
      activeEndTimes.shift();
    }

    if (activeEndTimes.length < config.maxConcurrent) {
      const shouldMatchPrompt = Math.random() < config.matchProbability;
      const pool = chooseWordPool({ words, currentPrompt, shouldMatchPrompt });

      if (pool.length) {
        let chosenWord = null;

        if (shouldMatchPrompt) {
          const categorySlug = currentPrompt.categorySlug;
          if (!categoryQueues.has(categorySlug)) {
            categoryQueues.set(categorySlug, shuffle(pool));
            categoryQueueIndices.set(categorySlug, 0);
          }

          let queue = categoryQueues.get(categorySlug);
          let queueIndex = categoryQueueIndices.get(categorySlug) || 0;

          if (queueIndex >= queue.length) {
            queue = shuffle(pool);
            queueIndex = 0;
            categoryQueues.set(categorySlug, queue);
            categoryQueueIndices.set(categorySlug, queueIndex);
          }

          chosenWord = queue[queueIndex];
          categoryQueueIndices.set(categorySlug, queueIndex + 1);
        } else {
          chosenWord = pickBalancedWord(pool, wordUsageCount, recentWordIds);
        }

        const spawnId = `spawn-${spawnOrdinal}`;
        const travelDurationMs = Math.max(1800, config.travelDurationMs + Math.floor(Math.random() * 600) - 300);

        spawnPlan.push({
          spawnId,
          appearsAtMs,
          wordId: chosenWord.wordId,
          wordText: chosenWord.wordText,
          wordCategories: chosenWord.categories,
          xStartNormalized: Number(Math.random().toFixed(4)),
          travelDurationMs,
          promptIndexAtSpawn: promptIndex,
          matchesPromptAtSpawn: shouldMatchPrompt,
          expiresAtMs: appearsAtMs + travelDurationMs
        });

        wordUsageCount.set(chosenWord.wordId, (wordUsageCount.get(chosenWord.wordId) || 0) + 1);
        recentWordIds.push(chosenWord.wordId);
        if (recentWordIds.length > 10) {
          recentWordIds.shift();
        }

        activeEndTimes.push(appearsAtMs + travelDurationMs);
        activeEndTimes.sort((a, b) => a - b);
        spawnOrdinal += 1;
      }
    }

    appearsAtMs += config.spawnIntervalMs;
  }

  return spawnPlan;
}

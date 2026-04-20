export const WUBBLE_DURATION_SECONDS = 120;

export const SPEED_CONFIG = {
  normal: { spawnIntervalMs: 1200, travelDurationMs: 7000, maxConcurrent: 8, matchProbability: 0.55 },
  fast: { spawnIntervalMs: 900, travelDurationMs: 5800, maxConcurrent: 10, matchProbability: 0.52 },
  extreme: { spawnIntervalMs: 700, travelDurationMs: 4600, maxConcurrent: 12, matchProbability: 0.5 },
  usain_bolt: { spawnIntervalMs: 500, travelDurationMs: 3500, maxConcurrent: 15, matchProbability: 0.48 }
};

export const WORD_DIFFICULTIES = ['easy', 'medium', 'hard'];
export const SPEED_DIFFICULTIES = Object.keys(SPEED_CONFIG);

export const PROMPT_MIN_MS = 15000;
export const PROMPT_MAX_MS = 30000;
export const MIN_CATEGORY_WORDS = 3;

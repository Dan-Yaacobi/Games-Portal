export const WUBBLE_DURATION_OPTIONS = [60, 120];
export const DEFAULT_WUBBLE_DURATION_SECONDS = 120;

export const SPEED_CONFIG = {
  normal: { spawnIntervalMs: 900, travelDurationMs: 6800, maxConcurrent: 11, matchProbability: 0.54 },
  fast: { spawnIntervalMs: 650, travelDurationMs: 5600, maxConcurrent: 14, matchProbability: 0.52 },
  extreme: { spawnIntervalMs: 480, travelDurationMs: 4400, maxConcurrent: 17, matchProbability: 0.5 },
  usain_bolt: { spawnIntervalMs: 340, travelDurationMs: 3200, maxConcurrent: 22, matchProbability: 0.48 }
};

export const WORD_DIFFICULTIES = ['easy', 'medium', 'hard'];
export const SPEED_DIFFICULTIES = Object.keys(SPEED_CONFIG);

export const PROMPT_MIN_MS = 15000;
export const PROMPT_MAX_MS = 30000;
export const MIN_CATEGORY_WORDS = 8;

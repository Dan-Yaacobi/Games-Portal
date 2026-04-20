import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePromptSchedule, generateSpawnPlan } from '../src/modules/wubbleWeb/wubbleSessionGeneration.service.js';
import { validateWubbleSubmission } from '../src/modules/wubbleWeb/wubbleValidation.service.js';
import { startWubbleSchema } from '../src/modules/wubbleWeb/wubble.schema.js';

const categories = [
  { slug: 'animals', label: 'animals', wordIds: ['1', '2', '3'] },
  { slug: 'fruits', label: 'fruits', wordIds: ['4', '5', '6'] },
  { slug: 'vehicles', label: 'vehicles', wordIds: ['7', '8', '9'] }
];

const words = [
  { wordId: '1', wordText: 'cat', categories: ['animals'] },
  { wordId: '2', wordText: 'dog', categories: ['animals'] },
  { wordId: '3', wordText: 'lion', categories: ['animals'] },
  { wordId: '4', wordText: 'apple', categories: ['fruits'] },
  { wordId: '5', wordText: 'banana', categories: ['fruits'] },
  { wordId: '6', wordText: 'grape', categories: ['fruits'] },
  { wordId: '7', wordText: 'car', categories: ['vehicles'] },
  { wordId: '8', wordText: 'bus', categories: ['vehicles'] },
  { wordId: '9', wordText: 'train', categories: ['vehicles'] }
];

test('prompt schedule uses valid contiguous windows', () => {
  const schedule = generatePromptSchedule({ categories, durationSeconds: 120 });

  assert.equal(schedule[0].startsAtMs, 0);
  assert.equal(schedule.at(-1).endsAtMs, 120000);

  for (let i = 0; i < schedule.length; i += 1) {
    const prompt = schedule[i];
    const duration = prompt.endsAtMs - prompt.startsAtMs;

    if (i !== schedule.length - 1) {
      assert.ok(duration >= 15000 && duration <= 30000);
    }

    if (i > 0) {
      assert.equal(schedule[i - 1].endsAtMs, prompt.startsAtMs);
      assert.notEqual(schedule[i - 1].categorySlug, prompt.categorySlug);
    }
  }
});

test('spawn generation respects speed settings envelope', () => {
  const schedule = generatePromptSchedule({ categories, durationSeconds: 30 });
  const normal = generateSpawnPlan({ words, promptSchedule: schedule, speedDifficulty: 'normal', durationSeconds: 30 });
  const usain = generateSpawnPlan({ words, promptSchedule: schedule, speedDifficulty: 'usain_bolt', durationSeconds: 30 });

  assert.ok(usain.length > normal.length);
  assert.ok(normal.every((spawn) => spawn.travelDurationMs >= 1800));
  assert.ok(usain.every((spawn) => spawn.travelDurationMs >= 1800));
});

test('validation handles correct, incorrect, duplicate and out-of-range clicks', () => {
  const promptSchedule = [
    { promptIndex: 0, categorySlug: 'animals', startsAtMs: 0, endsAtMs: 10000 },
    { promptIndex: 1, categorySlug: 'fruits', startsAtMs: 10000, endsAtMs: 20000 }
  ];

  const spawnPlan = [
    {
      spawnId: 's1',
      wordCategories: ['animals'],
      appearsAtMs: 0,
      expiresAtMs: 15000
    },
    {
      spawnId: 's2',
      wordCategories: ['vehicles'],
      appearsAtMs: 0,
      expiresAtMs: 15000
    }
  ];

  const eventLog = [
    { type: 'click', spawnId: 's1', timestampMs: 2000 },
    { type: 'click', spawnId: 's2', timestampMs: 3000 },
    { type: 'click', spawnId: 's1', timestampMs: 4000 },
    { type: 'click', spawnId: 's2', timestampMs: 25000 }
  ];

  const result = validateWubbleSubmission({
    promptSchedule,
    spawnPlan,
    durationSeconds: 20,
    wordDifficulty: 'easy',
    eventLog
  });

  assert.equal(result.finalScore, 0);
  assert.equal(result.summary.acceptedClicks, 2);
  assert.equal(result.summary.duplicateClickCount, 1);
  assert.equal(result.summary.outOfRangeTimestampCount, 1);
});


test('combo scoring doubles every ten consecutive correct clicks and resets on wrong', () => {
  const promptSchedule = [{ promptIndex: 0, categorySlug: 'animals', startsAtMs: 0, endsAtMs: 30000 }];

  const spawnPlan = Array.from({ length: 12 }).map((_, index) => ({
    spawnId: `c${index}`,
    wordCategories: index === 11 ? ['vehicles'] : ['animals'],
    appearsAtMs: 0,
    expiresAtMs: 30000
  }));

  const eventLog = spawnPlan.map((spawn, index) => ({
    type: 'click',
    spawnId: spawn.spawnId,
    timestampMs: 1000 + index * 100
  }));

  const result = validateWubbleSubmission({
    promptSchedule,
    spawnPlan,
    durationSeconds: 30,
    wordDifficulty: 'easy',
    eventLog
  });

  // correct points: 10*1 + 1*2 = 12, final wrong click = -1 => 11
  assert.equal(result.finalScore, 11);
  assert.equal(result.summary.correctClicks, 11);
  assert.equal(result.summary.wrongClicks, 1);
  assert.equal(result.summary.highestComboMultiplier, 2);
});


test('hard mode applies base x2 scoring and miss penalties for unclicked correct bubbles', () => {
  const promptSchedule = [{ promptIndex: 0, categorySlug: 'animals', startsAtMs: 0, endsAtMs: 20000 }];

  const spawnPlan = [
    {
      spawnId: 'h1',
      wordCategories: ['animals'],
      appearsAtMs: 0,
      expiresAtMs: 5000,
      promptIndexAtSpawn: 0,
      matchesPromptAtSpawn: true
    },
    {
      spawnId: 'h2',
      wordCategories: ['animals'],
      appearsAtMs: 0,
      expiresAtMs: 5000,
      promptIndexAtSpawn: 0,
      matchesPromptAtSpawn: true
    }
  ];

  const eventLog = [{ type: 'click', spawnId: 'h1', timestampMs: 2000 }];

  const result = validateWubbleSubmission({
    promptSchedule,
    spawnPlan,
    durationSeconds: 20,
    wordDifficulty: 'hard',
    eventLog
  });

  // +2 for clicked correct (hard base), -2 for missed correct bubble on expiry
  assert.equal(result.finalScore, 0);
  assert.equal(result.summary.correctClicks, 1);
  assert.equal(result.summary.missedCorrectCount, 1);
  assert.equal(result.summary.baseCorrectPoints, 2);
});

test('start schema accepts supported duration options and rejects unsupported values', () => {
  const valid = startWubbleSchema.safeParse({
    wordDifficulty: 'easy',
    speedDifficulty: 'normal',
    durationSeconds: 60
  });

  const invalid = startWubbleSchema.safeParse({
    wordDifficulty: 'easy',
    speedDifficulty: 'normal',
    durationSeconds: 90
  });

  assert.equal(valid.success, true);
  assert.equal(invalid.success, false);
});

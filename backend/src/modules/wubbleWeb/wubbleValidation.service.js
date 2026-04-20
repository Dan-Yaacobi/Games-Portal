const PROMPT_PREP_MS = 3000;

function getPromptAtMs(promptSchedule, timestampMs) {
  return promptSchedule.find((prompt) => timestampMs >= prompt.startsAtMs && timestampMs < prompt.endsAtMs);
}

function getComboMultiplier(correctStreak) {
  return 2 ** Math.floor(correctStreak / 10);
}

function getEffectiveSpawnTiming(spawn) {
  const promptPrepOffset = spawn.promptIndexAtSpawn > 0 ? PROMPT_PREP_MS : 0;
  return {
    appearsAtMs: spawn.appearsAtMs + promptPrepOffset,
    expiresAtMs: spawn.expiresAtMs + promptPrepOffset
  };
}

export function validateWubbleSubmission({ promptSchedule, spawnPlan, durationSeconds, wordDifficulty, eventLog }) {
  const spawnById = new Map(spawnPlan.map((spawn) => [spawn.spawnId, spawn]));
  const clickedSpawnIds = new Set();
  const orderedEvents = [...eventLog].sort((a, b) => a.timestampMs - b.timestampMs);

  const baseCorrectPoints = wordDifficulty === 'hard' ? 2 : 1;
  const missPenaltyPoints = wordDifficulty === 'hard' ? 2 : 0;

  let finalScore = 0;
  let acceptedClicks = 0;
  let rejectedClicks = 0;
  let duplicateClickCount = 0;
  let outOfRangeTimestampCount = 0;
  let unknownSpawnCount = 0;
  let correctClicks = 0;
  let wrongClicks = 0;
  let missedCorrectCount = 0;
  let currentCorrectStreak = 0;
  let maxCorrectStreak = 0;
  let highestComboMultiplier = 1;

  const hardModeMissExpirations =
    wordDifficulty === 'hard'
      ? spawnPlan
          .filter((spawn) => spawn.matchesPromptAtSpawn)
          .map((spawn) => ({
            spawnId: spawn.spawnId,
            expiresAtMs: getEffectiveSpawnTiming(spawn).expiresAtMs
          }))
          .sort((a, b) => a.expiresAtMs - b.expiresAtMs)
      : [];

  let missPointer = 0;

  function applyMissPenalties(untilTimestampMs) {
    if (!hardModeMissExpirations.length) return;

    while (
      missPointer < hardModeMissExpirations.length &&
      hardModeMissExpirations[missPointer].expiresAtMs <= untilTimestampMs
    ) {
      const expiration = hardModeMissExpirations[missPointer];
      if (!clickedSpawnIds.has(expiration.spawnId)) {
        finalScore -= missPenaltyPoints;
        missedCorrectCount += 1;
        currentCorrectStreak = 0;
      }
      missPointer += 1;
    }
  }

  for (const event of orderedEvents) {
    const timestampMs = event.timestampMs;

    applyMissPenalties(timestampMs);

    if (timestampMs < 0 || timestampMs > durationSeconds * 1000) {
      outOfRangeTimestampCount += 1;
      rejectedClicks += 1;
      continue;
    }

    const spawn = spawnById.get(event.spawnId);
    if (!spawn) {
      unknownSpawnCount += 1;
      rejectedClicks += 1;
      continue;
    }

    if (clickedSpawnIds.has(event.spawnId)) {
      duplicateClickCount += 1;
      rejectedClicks += 1;
      continue;
    }

    const timing = getEffectiveSpawnTiming(spawn);
    if (timestampMs < timing.appearsAtMs || timestampMs > timing.expiresAtMs) {
      rejectedClicks += 1;
      continue;
    }

    clickedSpawnIds.add(event.spawnId);

    const activePrompt = getPromptAtMs(promptSchedule, timestampMs);
    const isCorrect = Boolean(activePrompt && spawn.wordCategories.includes(activePrompt.categorySlug));

    if (isCorrect) {
      const comboMultiplier = getComboMultiplier(currentCorrectStreak);
      const points = baseCorrectPoints * comboMultiplier;
      finalScore += points;
      correctClicks += 1;
      currentCorrectStreak += 1;
      maxCorrectStreak = Math.max(maxCorrectStreak, currentCorrectStreak);
      highestComboMultiplier = Math.max(highestComboMultiplier, comboMultiplier);
    } else {
      finalScore -= 1;
      wrongClicks += 1;
      currentCorrectStreak = 0;
    }

    acceptedClicks += 1;
  }

  applyMissPenalties(durationSeconds * 1000);

  return {
    finalScore,
    summary: {
      totalClicks: eventLog.length,
      acceptedClicks,
      rejectedClicks,
      duplicateClickCount,
      outOfRangeTimestampCount,
      unknownSpawnCount,
      correctClicks,
      wrongClicks,
      missedCorrectCount,
      maxCorrectStreak,
      highestComboMultiplier,
      baseCorrectPoints,
      finalScore
    }
  };
}

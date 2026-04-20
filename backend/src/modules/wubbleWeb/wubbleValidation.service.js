function getPromptAtMs(promptSchedule, timestampMs) {
  return promptSchedule.find((prompt) => timestampMs >= prompt.startsAtMs && timestampMs < prompt.endsAtMs);
}

function getComboMultiplier(correctStreak) {
  return 2 ** Math.floor(correctStreak / 10);
}

export function validateWubbleSubmission({ promptSchedule, spawnPlan, durationSeconds, eventLog }) {
  const spawnById = new Map(spawnPlan.map((spawn) => [spawn.spawnId, spawn]));
  const clickedSpawnIds = new Set();
  const orderedEvents = [...eventLog].sort((a, b) => a.timestampMs - b.timestampMs);

  let finalScore = 0;
  let acceptedClicks = 0;
  let rejectedClicks = 0;
  let duplicateClickCount = 0;
  let outOfRangeTimestampCount = 0;
  let unknownSpawnCount = 0;
  let correctClicks = 0;
  let wrongClicks = 0;
  let currentCorrectStreak = 0;
  let maxCorrectStreak = 0;
  let highestComboMultiplier = 1;

  for (const event of orderedEvents) {
    const timestampMs = event.timestampMs;

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

    if (timestampMs < spawn.appearsAtMs || timestampMs > spawn.expiresAtMs) {
      rejectedClicks += 1;
      continue;
    }

    clickedSpawnIds.add(event.spawnId);

    const activePrompt = getPromptAtMs(promptSchedule, timestampMs);
    const isCorrect = Boolean(activePrompt && spawn.wordCategories.includes(activePrompt.categorySlug));

    if (isCorrect) {
      const points = getComboMultiplier(currentCorrectStreak);
      finalScore += points;
      correctClicks += 1;
      currentCorrectStreak += 1;
      maxCorrectStreak = Math.max(maxCorrectStreak, currentCorrectStreak);
      highestComboMultiplier = Math.max(highestComboMultiplier, points);
    } else {
      finalScore -= 1;
      wrongClicks += 1;
      currentCorrectStreak = 0;
    }

    acceptedClicks += 1;
  }

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
      maxCorrectStreak,
      highestComboMultiplier,
      finalScore
    }
  };
}

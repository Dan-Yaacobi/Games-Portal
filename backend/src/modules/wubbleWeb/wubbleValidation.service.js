function getPromptAtMs(promptSchedule, timestampMs) {
  return promptSchedule.find((prompt) => timestampMs >= prompt.startsAtMs && timestampMs < prompt.endsAtMs);
}

export function validateWubbleSubmission({ promptSchedule, spawnPlan, durationSeconds, eventLog }) {
  const spawnById = new Map(spawnPlan.map((spawn) => [spawn.spawnId, spawn]));
  const clickedSpawnIds = new Set();

  let finalScore = 0;
  let acceptedClicks = 0;
  let rejectedClicks = 0;
  let duplicateClickCount = 0;
  let outOfRangeTimestampCount = 0;
  let unknownSpawnCount = 0;

  for (const event of eventLog) {
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

    finalScore += isCorrect ? 1 : -1;
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
      finalScore
    }
  };
}

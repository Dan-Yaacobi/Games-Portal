import { useEffect, useMemo, useRef, useState } from 'react';
import { wubbleApi } from '../features/games/wubbleApi';
import { useAuth } from '../hooks/useAuth';

const WORD_DIFFICULTIES = ['easy', 'medium', 'hard'];
const SPEED_DIFFICULTIES = ['normal', 'fast', 'extreme', 'usain_bolt'];

function getPromptAtMs(schedule, elapsedMs) {
  return schedule.find((prompt) => elapsedMs >= prompt.startsAtMs && elapsedMs < prompt.endsAtMs) || null;
}

function getBubblePosition({ spawn, elapsedMs }) {
  const rawProgress = Math.min(
    1,
    Math.max(0, (elapsedMs - spawn.appearsAtMs) / Math.max(1, spawn.travelDurationMs))
  );
  const easedProgress = 1 - (1 - rawProgress) ** 1.45;
  const sway = Math.sin((elapsedMs + Number(spawn.spawnId.split('-')[1] || 0) * 70) / 220) * 2.8;

  return {
    bottom: Math.round(easedProgress * 100),
    left: Math.min(92, Math.max(8, spawn.xStartNormalized * 100 + sway))
  };
}

export default function WubbleWebPage() {
  const { refreshUser } = useAuth();
  const [phase, setPhase] = useState('setup');
  const [wordDifficulty, setWordDifficulty] = useState('easy');
  const [speedDifficulty, setSpeedDifficulty] = useState('normal');
  const [sessionData, setSessionData] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [eventLog, setEventLog] = useState([]);
  const [clickedIds, setClickedIds] = useState(() => new Set());
  const [provisionalScore, setProvisionalScore] = useState(0);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const loopRef = useRef(null);
  const startRef = useRef(0);

  const activePrompt = useMemo(() => {
    if (!sessionData) return null;
    return getPromptAtMs(sessionData.promptSchedule, elapsedMs);
  }, [elapsedMs, sessionData]);

  const activeSpawns = useMemo(() => {
    if (!sessionData || !activePrompt) return [];

    return sessionData.spawnPlan.filter((spawn) => {
      const inWindow = elapsedMs >= spawn.appearsAtMs && elapsedMs <= spawn.expiresAtMs;
      if (!inWindow || clickedIds.has(spawn.spawnId)) return false;

      const isFromPriorPrompt = spawn.appearsAtMs < activePrompt.startsAtMs;
      if (isFromPriorPrompt) {
        return spawn.wordCategories.includes(activePrompt.categorySlug);
      }

      return true;
    });
  }, [sessionData, elapsedMs, clickedIds, activePrompt]);

  useEffect(() => {
    if (phase !== 'playing' || !sessionData) return undefined;

    startRef.current = performance.now();
    loopRef.current = window.setInterval(() => {
      const nextElapsed = Math.floor(performance.now() - startRef.current);
      setElapsedMs(nextElapsed);

      if (nextElapsed >= sessionData.durationSeconds * 1000) {
        setPhase('submitting');
      }
    }, 33);

    return () => {
      if (loopRef.current) window.clearInterval(loopRef.current);
    };
  }, [phase, sessionData]);

  useEffect(() => {
    if (phase !== 'submitting' || !sessionData) return;

    if (loopRef.current) {
      window.clearInterval(loopRef.current);
      loopRef.current = null;
    }

    wubbleApi
      .submit({
        platformSessionId: sessionData.platformSessionId,
        wubbleSessionId: sessionData.wubbleSessionId,
        eventLog
      })
      .then(async (data) => {
        setResult(data);
        setPhase('done');
        await refreshUser();
      })
      .catch((error) => {
        setStatus(error.message);
        setPhase('setup');
      });
  }, [phase, sessionData, eventLog, refreshUser]);

  const startGame = async () => {
    try {
      setStatus('');
      setResult(null);
      setEventLog([]);
      setClickedIds(new Set());
      setProvisionalScore(0);
      setElapsedMs(0);

      const data = await wubbleApi.start({ wordDifficulty, speedDifficulty });
      setSessionData(data);
      setPhase('playing');
    } catch (error) {
      setStatus(error.message);
    }
  };

  const clickBubble = (spawn) => {
    if (!activePrompt || clickedIds.has(spawn.spawnId)) return;

    const isCorrect = spawn.wordCategories.includes(activePrompt.categorySlug);
    setProvisionalScore((value) => value + (isCorrect ? 1 : -1));
    setClickedIds((current) => new Set(current).add(spawn.spawnId));
    setEventLog((current) => [
      ...current,
      {
        type: 'click',
        spawnId: spawn.spawnId,
        timestampMs: elapsedMs
      }
    ]);
  };

  const remainingSeconds = sessionData
    ? Math.max(0, Math.ceil(sessionData.durationSeconds - elapsedMs / 1000))
    : 0;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1>Wubble Web</h1>

      {phase === 'setup' && (
        <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
          <label>
            Word difficulty
            <select value={wordDifficulty} onChange={(event) => setWordDifficulty(event.target.value)}>
              {WORD_DIFFICULTIES.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
          </label>

          <label>
            Speed difficulty
            <select value={speedDifficulty} onChange={(event) => setSpeedDifficulty(event.target.value)}>
              {SPEED_DIFFICULTIES.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
          </label>

          <button onClick={startGame}>Start Wubble Web</button>
        </div>
      )}

      {(phase === 'playing' || phase === 'submitting') && sessionData && (
        <>
          <div style={{ display: 'flex', gap: 20, marginBottom: 12, flexWrap: 'wrap' }}>
            <strong>Prompt: {activePrompt?.label || '...'}</strong>
            <span>Time left: {remainingSeconds}s</span>
            <span>Provisional score: {provisionalScore}</span>
            <span>Bubbles: {activeSpawns.length}</span>
          </div>

          <div
            style={{
              height: 460,
              border: '1px solid #9dc7ef',
              borderRadius: 14,
              position: 'relative',
              overflow: 'hidden',
              background: 'radial-gradient(circle at 20% 20%, #f8fdff, #cde7ff 70%)'
            }}
          >
            {activeSpawns.map((spawn) => {
              const position = getBubblePosition({ spawn, elapsedMs });
              const isCorrectNow = activePrompt
                ? spawn.wordCategories.includes(activePrompt.categorySlug)
                : false;

              return (
                <button
                  key={spawn.spawnId}
                  onClick={() => clickBubble(spawn)}
                  style={{
                    position: 'absolute',
                    left: `${position.left}%`,
                    bottom: `${position.bottom}%`,
                    transform: 'translate(-50%, 50%)',
                    borderRadius: 999,
                    border: isCorrectNow ? '2px solid #5da9f5' : '2px solid #7d93b0',
                    background:
                      'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.98), rgba(255,255,255,0.82) 45%, rgba(186,223,255,0.75) 100%)',
                    color: '#173049',
                    padding: '10px 15px',
                    minWidth: 88,
                    boxShadow: '0 8px 16px rgba(35, 87, 134, 0.18), inset 0 6px 10px rgba(255,255,255,0.45)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    letterSpacing: 0.2
                  }}
                >
                  {spawn.wordText}
                </button>
              );
            })}
          </div>
        </>
      )}

      {phase === 'done' && result && (
        <div style={{ marginTop: 16 }}>
          <h2>Round complete</h2>
          <p>Validated score: {result.validatedScore}</p>
          <p>Coins earned: {result.coinsEarned}</p>
          <p>Total coins: {result.totalCoins}</p>
          <button onClick={() => setPhase('setup')}>Play again</button>
        </div>
      )}

      {status && <p>{status}</p>}
    </div>
  );
}

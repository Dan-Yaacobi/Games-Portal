import { useEffect, useMemo, useRef, useState } from 'react';
import { wubbleApi } from '../features/games/wubbleApi';
import { useAuth } from '../hooks/useAuth';

const WORD_DIFFICULTIES = ['easy', 'medium', 'hard'];
const SPEED_DIFFICULTIES = ['normal', 'fast', 'extreme', 'usain_bolt'];

function getPromptAtMs(schedule, elapsedMs) {
  return schedule.find((prompt) => elapsedMs >= prompt.startsAtMs && elapsedMs < prompt.endsAtMs) || null;
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
      if (!inWindow) return false;
      if (clickedIds.has(spawn.spawnId)) return false;
      return spawn.wordCategories.includes(activePrompt.categorySlug);
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
    }, 50);

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
    <div>
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
          <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
            <strong>Prompt: {activePrompt?.label || '...'}</strong>
            <span>Time left: {remainingSeconds}s</span>
            <span>Provisional score: {provisionalScore}</span>
          </div>

          <div
            style={{
              height: 460,
              border: '1px solid #ccc',
              borderRadius: 12,
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(#f7fbff, #d9ecff)'
            }}
          >
            {activeSpawns.map((spawn) => {
              const progress = Math.min(
                1,
                Math.max(0, (elapsedMs - spawn.appearsAtMs) / Math.max(1, spawn.travelDurationMs))
              );

              return (
                <button
                  key={spawn.spawnId}
                  onClick={() => clickBubble(spawn)}
                  style={{
                    position: 'absolute',
                    left: `${Math.min(90, Math.max(0, spawn.xStartNormalized * 100))}%`,
                    bottom: `${Math.round(progress * 100)}%`,
                    transform: 'translateX(-50%)',
                    borderRadius: 999,
                    border: '1px solid #335',
                    background: '#fff',
                    padding: '8px 12px',
                    cursor: 'pointer'
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

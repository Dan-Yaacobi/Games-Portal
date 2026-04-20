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
  const easedProgress = 1 - (1 - rawProgress) ** 1.85;
  const sway = Math.sin((elapsedMs + Number(spawn.spawnId.split('-')[1] || 0) * 60) / 300) * 2.2;

  return {
    bottom: Math.round(easedProgress * 102),
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
  const [countdown, setCountdown] = useState(3);
  const [promptPulse, setPromptPulse] = useState(false);
  const [popEffects, setPopEffects] = useState([]);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const prevPromptSlugRef = useRef(null);

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
    if (!activePrompt) return;

    if (prevPromptSlugRef.current !== activePrompt.categorySlug) {
      prevPromptSlugRef.current = activePrompt.categorySlug;
      setPromptPulse(true);
      const timeout = window.setTimeout(() => setPromptPulse(false), 260);
      return () => window.clearTimeout(timeout);
    }

    return undefined;
  }, [activePrompt]);

  useEffect(() => {
    if (phase !== 'countdown') return undefined;

    setCountdown(3);
    const intervalId = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          setPhase('playing');
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing' || !sessionData) return undefined;

    startRef.current = performance.now();

    const frame = () => {
      const nextElapsed = Math.floor(performance.now() - startRef.current);
      setElapsedMs(nextElapsed);

      if (nextElapsed >= sessionData.durationSeconds * 1000) {
        setPhase('submitting');
        return;
      }

      rafRef.current = window.requestAnimationFrame(frame);
    };

    rafRef.current = window.requestAnimationFrame(frame);

    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [phase, sessionData]);

  useEffect(() => {
    if (phase !== 'submitting' || !sessionData) return;

    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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
      setPopEffects([]);
      prevPromptSlugRef.current = null;

      const data = await wubbleApi.start({ wordDifficulty, speedDifficulty });
      setSessionData(data);
      setPhase('countdown');
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

    if (isCorrect) {
      const effectId = `${spawn.spawnId}-${elapsedMs}`;
      const position = getBubblePosition({ spawn, elapsedMs });
      setPopEffects((effects) => [...effects, { id: effectId, left: position.left, bottom: position.bottom }]);
      window.setTimeout(() => {
        setPopEffects((effects) => effects.filter((effect) => effect.id !== effectId));
      }, 420);
    }
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

      {(phase === 'countdown' || phase === 'playing' || phase === 'submitting') && sessionData && (
        <>
          <div style={{ display: 'flex', gap: 20, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <strong
              style={{
                fontSize: 24,
                padding: '6px 14px',
                borderRadius: 12,
                color: '#123555',
                background: 'linear-gradient(90deg, rgba(247,252,255,1), rgba(218,236,255,1))',
                boxShadow: '0 3px 10px rgba(28, 86, 139, 0.2)',
                transform: promptPulse ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 180ms ease-out'
              }}
            >
              Prompt: {activePrompt?.label || '...'}
            </strong>
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
            {phase === 'countdown' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'rgba(10, 30, 56, 0.3)',
                  zIndex: 20,
                  color: '#fff',
                  fontSize: 70,
                  fontWeight: 700,
                  textShadow: '0 6px 18px rgba(0,0,0,0.4)'
                }}
              >
                {countdown > 0 ? countdown : 'GO!'}
              </div>
            )}

            {activeSpawns.map((spawn) => {
              const position = getBubblePosition({ spawn, elapsedMs });

              return (
                <button
                  key={spawn.spawnId}
                  onClick={() => clickBubble(spawn)}
                  style={{
                    position: 'absolute',
                    left: `${position.left}%`,
                    bottom: `${position.bottom}%`,
                    transform: 'translate(-50%, 50%)',
                    borderRadius: '50%',
                    width: 96,
                    height: 96,
                    border: '2px solid #6a89aa',
                    background:
                      'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.98), rgba(255,255,255,0.86) 45%, rgba(186,223,255,0.72) 100%)',
                    color: '#173049',
                    boxShadow: '0 8px 16px rgba(35, 87, 134, 0.16), inset 0 6px 10px rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    letterSpacing: 0.2,
                    fontSize: 13,
                    padding: 10,
                    display: 'grid',
                    placeItems: 'center',
                    textAlign: 'center',
                    lineHeight: 1.1
                  }}
                >
                  {spawn.wordText}
                </button>
              );
            })}

            {popEffects.map((effect) => (
              <div
                key={effect.id}
                style={{
                  position: 'absolute',
                  left: `${effect.left}%`,
                  bottom: `${effect.bottom}%`,
                  transform: 'translate(-50%, 50%)',
                  pointerEvents: 'none',
                  color: '#0a84ff',
                  fontWeight: 800,
                  fontSize: 26,
                  textShadow: '0 4px 12px rgba(10,132,255,0.45)',
                  animation: 'popRise 420ms ease-out forwards'
                }}
              >
                +1 ✦
              </div>
            ))}
          </div>
          <style>
            {`@keyframes popRise {
              0% { opacity: 1; transform: translate(-50%, 50%) scale(0.7); }
              100% { opacity: 0; transform: translate(-50%, -5%) scale(1.2); }
            }`}
          </style>
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

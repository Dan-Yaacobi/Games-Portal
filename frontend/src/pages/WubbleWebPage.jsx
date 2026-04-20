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
  const easedProgress = 1 - (1 - rawProgress) ** 1.9;
  const sway = Math.sin((elapsedMs + Number(spawn.spawnId.split('-')[1] || 0) * 30) / 720) * 0.7;

  return {
    bottom: Math.min(102, easedProgress * 102),
    left: Math.min(92, Math.max(8, spawn.xStartNormalized * 100 + sway))
  };
}

function createParticles(centerLeft, centerBottom, isCorrect) {
  const color = isCorrect ? '#2cbe7b' : '#ff5a6f';
  return Array.from({ length: 10 }).map((_, index) => ({
    id: `${Date.now()}-${index}-${Math.random()}`,
    left: centerLeft,
    bottom: centerBottom,
    dx: Math.cos((Math.PI * 2 * index) / 10) * (18 + Math.random() * 24),
    dy: Math.sin((Math.PI * 2 * index) / 10) * (18 + Math.random() * 22),
    size: 6 + Math.random() * 6,
    color
  }));
}


function getBubbleDimensions(wordText) {
  const chars = wordText.length;
  const width = Math.min(170, Math.max(92, 74 + chars * 8));
  const height = Math.min(126, Math.max(88, 74 + chars * 3.8));

  return {
    width,
    height,
    fontSize: chars > 13 ? 11 : chars > 9 ? 12 : 13
  };
}

function getWobbleSettings(spawnId) {
  const seed = Number(spawnId.split('-')[1] || 0);
  return {
    durationMs: 1850 + (seed % 7) * 120,
    delayMs: (seed % 5) * 85
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
  const [promptNotice, setPromptNotice] = useState(false);
  const [scorePulse, setScorePulse] = useState('none');
  const [popEffects, setPopEffects] = useState([]);
  const [particles, setParticles] = useState([]);
  const [wrongFlash, setWrongFlash] = useState(false);
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
      setPromptNotice(true);
      const timeout = window.setTimeout(() => setPromptPulse(false), 360);
      const noticeTimeout = window.setTimeout(() => setPromptNotice(false), 900);
      return () => {
        window.clearTimeout(timeout);
        window.clearTimeout(noticeTimeout);
      };
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
      setParticles([]);
      setWrongFlash(false);
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

    const position = getBubblePosition({ spawn, elapsedMs });

    const nextParticles = createParticles(position.left, position.bottom, isCorrect);
    setParticles((prev) => [...prev, ...nextParticles]);
    window.setTimeout(() => {
      setParticles((prev) => prev.filter((item) => !nextParticles.find((created) => created.id === item.id)));
    }, 520);

    if (isCorrect) {
      const effectId = `${spawn.spawnId}-${elapsedMs}`;
      setPopEffects((effects) => [...effects, { id: effectId, left: position.left, bottom: position.bottom }]);
      setScorePulse('positive');
      window.setTimeout(() => {
        setPopEffects((effects) => effects.filter((effect) => effect.id !== effectId));
      }, 520);
      window.setTimeout(() => setScorePulse('none'), 220);
    } else {
      setScorePulse('negative');
      setWrongFlash(true);
      window.setTimeout(() => setScorePulse('none'), 220);
      window.setTimeout(() => setWrongFlash(false), 180);
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
                transform: promptPulse ? 'scale(1.14)' : 'scale(1)',
                filter: promptPulse ? 'drop-shadow(0 0 12px rgba(36,149,255,0.55))' : 'none',
                transition: 'transform 220ms ease-out, filter 220ms ease-out'
              }}
            >
              Prompt: {activePrompt?.label || '...'}
            </strong>

            {promptNotice && (
              <span
                style={{
                  background: '#1f8fff',
                  color: 'white',
                  fontWeight: 700,
                  borderRadius: 999,
                  padding: '4px 10px',
                  letterSpacing: 0.4,
                  boxShadow: '0 4px 14px rgba(31,143,255,0.45)'
                }}
              >
                NEW PROMPT!
              </span>
            )}

            <span>Time left: {remainingSeconds}s</span>
            <span
              style={{
                fontWeight: 700,
                color: scorePulse === 'negative' ? '#df3652' : '#1e4568',
                transform:
                  scorePulse === 'positive' ? 'scale(1.14)' : scorePulse === 'negative' ? 'scale(0.92)' : 'scale(1)',
                transition: 'transform 130ms ease-out, color 130ms ease-out'
              }}
            >
              Provisional score: {provisionalScore}
            </span>
            <span>Bubbles: {activeSpawns.length}</span>
          </div>

          <div
            style={{
              height: 460,
              border: wrongFlash ? '2px solid #ff6d80' : '1px solid #9dc7ef',
              borderRadius: 14,
              position: 'relative',
              overflow: 'hidden',
              background: wrongFlash
                ? 'radial-gradient(circle at 20% 20%, #ffe8ec, #ffd0d8 70%)'
                : 'radial-gradient(circle at 20% 20%, #f8fdff, #cde7ff 70%)',
              transition: 'background 120ms ease-out, border-color 120ms ease-out'
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
              const bubbleDimensions = getBubbleDimensions(spawn.wordText);
              const wobble = getWobbleSettings(spawn.spawnId);

              return (
                <button
                  key={spawn.spawnId}
                  onClick={() => clickBubble(spawn)}
                  style={{
                    position: 'absolute',
                    left: `${position.left}%`,
                    bottom: `${position.bottom.toFixed(3)}%`,
                    transform: 'translate(-50%, 50%)',
                    borderRadius: '50%',
                    width: bubbleDimensions.width,
                    height: bubbleDimensions.height,
                    border: '2px solid #6a89aa',
                    background:
                      'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.98), rgba(255,255,255,0.86) 45%, rgba(186,223,255,0.72) 100%)',
                    color: '#173049',
                    boxShadow: '0 8px 16px rgba(35, 87, 134, 0.16), inset 0 6px 10px rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    letterSpacing: 0.2,
                    fontSize: bubbleDimensions.fontSize,
                    padding: 12,
                    display: 'grid',
                    placeItems: 'center',
                    textAlign: 'center',
                    lineHeight: 1.08,
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    animation: `bubbleWobble ${wobble.durationMs}ms ease-in-out ${wobble.delayMs}ms infinite alternate`
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
                  color: '#1dbf73',
                  fontWeight: 900,
                  fontSize: 30,
                  textShadow: '0 5px 14px rgba(27,191,115,0.45)',
                  animation: 'popRise 520ms ease-out forwards'
                }}
              >
                PERFECT! +1
              </div>
            ))}

            {particles.map((particle) => (
              <div
                key={particle.id}
                style={{
                  position: 'absolute',
                  left: `${particle.left}%`,
                  bottom: `${particle.bottom}%`,
                  width: particle.size,
                  height: particle.size,
                  borderRadius: '50%',
                  background: particle.color,
                  boxShadow: `0 0 12px ${particle.color}`,
                  transform: 'translate(-50%, 50%)',
                  pointerEvents: 'none',
                  animation: 'particleBurst 520ms ease-out forwards',
                  '--dx': `${particle.dx}px`,
                  '--dy': `${-particle.dy}px`
                }}
              />
            ))}
          </div>
          <style>
            {`@keyframes popRise {
              0% { opacity: 1; transform: translate(-50%, 50%) scale(0.65); }
              100% { opacity: 0; transform: translate(-50%, -12%) scale(1.18); }
            }
            @keyframes particleBurst {
              0% { opacity: 1; transform: translate(-50%, 50%); }
              100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(50% + var(--dy))); }
            }
            @keyframes bubbleWobble {
              0% { transform: translate(-50%, 50%) scaleX(0.992) scaleY(1.008); }
              100% { transform: translate(-50%, 50%) scaleX(1.008) scaleY(0.992); }
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

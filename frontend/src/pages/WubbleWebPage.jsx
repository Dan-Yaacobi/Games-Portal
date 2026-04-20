import { useEffect, useMemo, useRef, useState } from 'react';
import { wubbleApi } from '../features/games/wubbleApi';
import { useAuth } from '../hooks/useAuth';
import PageFrame from '../components/ui/PageFrame';
import Panel from '../components/ui/Panel';
import PixelButton from '../components/ui/PixelButton';

const WORD_DIFFICULTIES = ['easy', 'medium', 'hard'];
const SPEED_DIFFICULTIES = ['normal', 'fast', 'extreme', 'usain_bolt'];
const DURATION_OPTIONS = [60, 120];

const PROMPT_PREP_MS = 3000;

const GAME_BG_PALETTE = [
  ['#f8fdff', '#cde7ff'],
  ['#fff8f1', '#ffd7b5'],
  ['#f5f7ff', '#d9dbff'],
  ['#f3fff7', '#c7f1d8'],
  ['#fff2fb', '#f7c7e8'],
  ['#f1fffe', '#bdebea']
];

function getPromptAtMs(schedule, elapsedMs) {
  return schedule.find((prompt) => elapsedMs >= prompt.startsAtMs && elapsedMs < prompt.endsAtMs) || null;
}

function getEffectiveSpawnTiming(spawn) {
  const promptPrepOffset = spawn.promptIndexAtSpawn > 0 ? PROMPT_PREP_MS : 0;
  const appearsAtMs = spawn.appearsAtMs + promptPrepOffset;
  const expiresAtMs = spawn.expiresAtMs + promptPrepOffset;
  return { appearsAtMs, expiresAtMs };
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

function getComboMultiplier(correctStreak) {
  return 2 ** Math.floor(correctStreak / 10);
}

function getComboTier(correctStreak) {
  return Math.floor(correctStreak / 10);
}

function getComboTierColor(comboTier) {
  const palette = ['#8a9cb2', '#5cc8ff', '#a56dff', '#ff9f1c', '#ff4d8d', '#ffd166'];
  return palette[Math.min(comboTier, palette.length - 1)];
}

function formatDifficultyLabel(value) {
  if (value === 'usain_bolt') return 'Usain Bolt';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const COMPOUND_WORD_OVERRIDES = {
  elderberry: 'elder berry',
  boysenberry: 'boysen berry',
  gooseberry: 'goose berry',
  huckleberry: 'huckle berry',
  lingonberry: 'lingon berry',
  mulberryjam: 'mulberry jam',
  blackcurrant: 'black currant',
  dragonfruit: 'dragon fruit',
  grapefruit: 'grape fruit',
  passionfruit: 'passion fruit',
  starfruit: 'star fruit',
  jackfruit: 'jack fruit',
  bloodorange: 'blood orange',
  sunnyday: 'sunny day',
  musicnote: 'music note',
  bassline: 'bass line',
  turntable: 'turn table',
  soundboard: 'sound board',
  subwaycar: 'subway car',
  tramcar: 'tram car',
  cablecar: 'cable car',
  ferryboat: 'ferry boat',
  taxicab: 'taxi cab',
  roadtrain: 'road train',
  snowmobile: 'snow mobile',
  snowfall: 'snow fall',
  rainfall: 'rain fall',
  raincloud: 'rain cloud',
  raindrop: 'rain drop',
  rainfront: 'rain front',
  warmfront: 'warm front',
  gustfront: 'gust front',
  hailstorm: 'hail storm',
  thunderstorm: 'thunder storm'
};

function formatWordForDisplay(wordText) {
  const raw = String(wordText || '').trim();
  if (!raw) return '';
  if (raw.includes(' ')) return raw;

  const lower = raw.toLowerCase();
  if (COMPOUND_WORD_OVERRIDES[lower]) {
    return COMPOUND_WORD_OVERRIDES[lower];
  }

  const suffixes = ['berry', 'fruit', 'boat', 'car', 'bus', 'train', 'cloud', 'storm', 'line'];

  for (const suffix of suffixes) {
    if (lower.endsWith(suffix) && lower.length > suffix.length + 2) {
      return `${raw.slice(0, raw.length - suffix.length)} ${raw.slice(raw.length - suffix.length)}`.toLowerCase();
    }
  }

  return raw;
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
  const [durationSeconds, setDurationSeconds] = useState(120);
  const [sessionData, setSessionData] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [eventLog, setEventLog] = useState([]);
  const [clickedIds, setClickedIds] = useState(() => new Set());
  const [provisionalScore, setProvisionalScore] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [promptPulse, setPromptPulse] = useState(false);
  const [promptNotice, setPromptNotice] = useState(false);
  const [scorePulse, setScorePulse] = useState('none');
  const [comboStreak, setComboStreak] = useState(0);
  const [comboPulse, setComboPulse] = useState(false);
  const [correctClicks, setCorrectClicks] = useState(0);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [missedCorrectClicks, setMissedCorrectClicks] = useState(0);
  const [gameThemeIndex, setGameThemeIndex] = useState(0);
  const [previousThemeIndex, setPreviousThemeIndex] = useState(0);
  const [themeTransitioning, setThemeTransitioning] = useState(false);
  const [flyingScores, setFlyingScores] = useState([]);
  const [popEffects, setPopEffects] = useState([]);
  const [particles, setParticles] = useState([]);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const rafRef = useRef(null);
  const gameContainerRef = useRef(null);
  const scoreRef = useRef(null);
  const startRef = useRef(0);
  const prevPromptSlugRef = useRef(null);
  const penalizedSpawnIdsRef = useRef(new Set());

  const activePrompt = useMemo(() => {
    if (!sessionData) return null;
    return getPromptAtMs(sessionData.promptSchedule, elapsedMs);
  }, [elapsedMs, sessionData]);

  const activeSpawns = useMemo(() => {
    if (!sessionData || !activePrompt) return [];

    return sessionData.spawnPlan.filter((spawn) => {
      const prepDone = activePrompt.promptIndex === 0 || elapsedMs >= activePrompt.startsAtMs + PROMPT_PREP_MS;
      const timing = getEffectiveSpawnTiming(spawn);
      const inWindow = prepDone && elapsedMs >= timing.appearsAtMs && elapsedMs <= timing.expiresAtMs;
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
      const nextThemeIndex = Math.abs(
        Array.from(activePrompt.categorySlug).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
      ) % GAME_BG_PALETTE.length;
      setPreviousThemeIndex(gameThemeIndex);
      setGameThemeIndex(nextThemeIndex);
      setThemeTransitioning(true);
      const timeout = window.setTimeout(() => setPromptPulse(false), 360);
      const themeTimeout = window.setTimeout(() => setThemeTransitioning(false), 650);
      const noticeTimeout = window.setTimeout(() => setPromptNotice(false), 900);
      return () => {
        window.clearTimeout(timeout);
        window.clearTimeout(noticeTimeout);
        window.clearTimeout(themeTimeout);
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
      setComboStreak(0);
      setCorrectClicks(0);
      setWrongClicks(0);
      setMissedCorrectClicks(0);
      setComboPulse(false);
      setGameThemeIndex(0);
      setPreviousThemeIndex(0);
      setThemeTransitioning(false);
      setFlyingScores([]);
      prevPromptSlugRef.current = null;
      penalizedSpawnIdsRef.current = new Set();

      const data = await wubbleApi.start({ wordDifficulty, speedDifficulty, durationSeconds });
      setSessionData(data);
      setPhase('countdown');
    } catch (error) {
      setStatus(error.message);
    }
  };

  const clickBubble = (spawn) => {
    if (!activePrompt || clickedIds.has(spawn.spawnId)) return;

    const isCorrect = spawn.wordCategories.includes(activePrompt.categorySlug);
    const comboMultiplier = getComboMultiplier(comboStreak);
    const basePoints = sessionData?.wordDifficulty === 'hard' ? 2 : 1;
    const scoreDelta = isCorrect ? basePoints * comboMultiplier : -1;
    setClickedIds((current) => new Set(current).add(spawn.spawnId));
    setEventLog((current) => [
      ...current,
      {
        type: 'click',
        spawnId: spawn.spawnId,
        timestampMs: elapsedMs
      }
    ]);

    const timing = getEffectiveSpawnTiming(spawn);
    const position = getBubblePosition({
      spawn: { ...spawn, appearsAtMs: timing.appearsAtMs, travelDurationMs: timing.expiresAtMs - timing.appearsAtMs },
      elapsedMs
    });

    const scoreRect = scoreRef.current?.getBoundingClientRect();
    const containerRect = gameContainerRef.current?.getBoundingClientRect();

    if (scoreRect && containerRect) {
      const sourceX = containerRect.left + (position.left / 100) * containerRect.width;
      const sourceY = containerRect.top + (1 - position.bottom / 100) * containerRect.height;
      const targetX = scoreRect.left + scoreRect.width / 2;
      const targetY = scoreRect.top + scoreRect.height / 2;
      const id = `${spawn.spawnId}-${elapsedMs}-fly`;

      setFlyingScores((current) => [
        ...current,
        {
          id,
          label: `${scoreDelta > 0 ? '+' : ''}${scoreDelta}`,
          color: scoreDelta > 0 ? getComboTierColor(getComboTier(comboStreak)) : '#ff5a6f',
          sourceX,
          sourceY,
          targetX,
          targetY,
          reached: false,
          delta: scoreDelta
        }
      ]);

      window.requestAnimationFrame(() => {
        setFlyingScores((current) => current.map((item) => (item.id === id ? { ...item, reached: true } : item)));
      });

      window.setTimeout(() => {
        setFlyingScores((current) => {
          const exists = current.some((item) => item.id === id);
          if (exists) {
            setProvisionalScore((value) => value + scoreDelta);
          }
          return current.filter((item) => item.id !== id);
        });
      }, 650);
    } else {
      setProvisionalScore((value) => value + scoreDelta);
    }

    const nextParticles = createParticles(position.left, position.bottom, isCorrect);
    setParticles((prev) => [...prev, ...nextParticles]);
    window.setTimeout(() => {
      setParticles((prev) => prev.filter((item) => !nextParticles.find((created) => created.id === item.id)));
    }, 520);

    if (isCorrect) {
      const effectId = `${spawn.spawnId}-${elapsedMs}`;
      const comboMultiplier = getComboMultiplier(comboStreak);
      setPopEffects((effects) => [
        ...effects,
        {
          id: effectId,
          left: position.left,
          bottom: position.bottom,
          label: `+${comboMultiplier}`,
          color: getComboTierColor(getComboTier(comboStreak))
        }
      ]);
      setScorePulse('positive');
      setComboStreak((value) => value + 1);
      setCorrectClicks((value) => value + 1);
      setComboPulse(true);
      window.setTimeout(() => {
        setPopEffects((effects) => effects.filter((effect) => effect.id !== effectId));
      }, 520);
      window.setTimeout(() => setScorePulse('none'), 220);
      window.setTimeout(() => setComboPulse(false), 180);
    } else {
      setScorePulse('negative');
      setWrongFlash(true);
      setWrongClicks((value) => value + 1);
      setComboStreak(0);
      setComboPulse(false);
      window.setTimeout(() => setScorePulse('none'), 220);
      window.setTimeout(() => setWrongFlash(false), 180);
    }
  };


  useEffect(() => {
    if ((phase === 'submitting' || phase === 'setup' || phase === 'done') && flyingScores.length) {
      const pendingDelta = flyingScores.reduce((sum, item) => sum + item.delta, 0);
      if (pendingDelta !== 0) {
        setProvisionalScore((value) => value + pendingDelta);
      }
      setFlyingScores([]);
    }
  }, [phase, flyingScores]);


  useEffect(() => {
    if (phase !== 'playing' || !sessionData || sessionData.wordDifficulty !== 'hard') return;

    for (const spawn of sessionData.spawnPlan) {
      if (!spawn.matchesPromptAtSpawn) continue;
      if (clickedIds.has(spawn.spawnId)) continue;
      if (penalizedSpawnIdsRef.current.has(spawn.spawnId)) continue;

      const timing = getEffectiveSpawnTiming(spawn);
      if (elapsedMs > timing.expiresAtMs) {
        penalizedSpawnIdsRef.current.add(spawn.spawnId);
        setProvisionalScore((value) => value - 2);
        setComboStreak(0);
        setComboPulse(false);
        setMissedCorrectClicks((value) => value + 1);
      }
    }
  }, [phase, sessionData, elapsedMs, clickedIds]);

  const remainingSeconds = sessionData
    ? Math.max(0, Math.ceil(sessionData.durationSeconds - elapsedMs / 1000))
    : 0;

  return (
    <PageFrame title="Wubble Web" subtitle="Pop only the words that match the current prompt.">
      {phase === 'setup' && (
        <Panel>
          <div className="form-grid" style={{ maxWidth: 460 }}>
            <label>
              Word difficulty
              <select value={wordDifficulty} onChange={(event) => setWordDifficulty(event.target.value)}>
                {WORD_DIFFICULTIES.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {formatDifficultyLabel(difficulty)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Speed difficulty
              <select value={speedDifficulty} onChange={(event) => setSpeedDifficulty(event.target.value)}>
                {SPEED_DIFFICULTIES.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {formatDifficultyLabel(difficulty)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Game duration
              <select value={durationSeconds} onChange={(event) => setDurationSeconds(Number(event.target.value))}>
                {DURATION_OPTIONS.map((duration) => (
                  <option key={duration} value={duration}>
                    {duration} seconds
                  </option>
                ))}
              </select>
            </label>

            <PixelButton onClick={startGame}>Start Wubble Web</PixelButton>
          </div>
        </Panel>
      )}

      {(phase === 'countdown' || phase === 'playing' || phase === 'submitting') && sessionData && (
        <>
          <div className="hud">
            <div className={`hud-item hud-item--prompt ${promptPulse ? 'prompt-live' : ''}`}>
              <strong>Prompt</strong>
              {activePrompt?.label || '...'}
            </div>
            <div className="hud-item">
              <strong>Time Left</strong>
              {remainingSeconds}s
            </div>
            <div
              ref={scoreRef}
              className="hud-item"
              style={{
                color: scorePulse === 'negative' ? '#ff496e' : undefined,
                transform: scorePulse === 'positive' ? 'scale(1.08)' : scorePulse === 'negative' ? 'scale(0.96)' : 'scale(1)'
              }}
            >
              <strong>Score</strong>
              {provisionalScore}
            </div>
            <div
              className="hud-item"
              style={{
                color: getComboTierColor(getComboTier(comboStreak)),
                textShadow: comboStreak > 0 ? `0 0 14px ${getComboTierColor(getComboTier(comboStreak))}` : 'none',
                transform: comboPulse ? 'scale(1.07)' : 'scale(1)'
              }}
            >
              <strong>Combo</strong>
              {comboStreak} (x{getComboMultiplier(comboStreak)})
            </div>
          </div>

          <div
            ref={gameContainerRef}
            className="play-arena"
            style={{
              borderColor: wrongFlash ? '#ff496e' : '#4e679d',
              background: wrongFlash
                ? 'radial-gradient(circle at 20% 20%, #ffe8ec, #ffd0d8 70%)'
                : `radial-gradient(circle at 20% 20%, ${GAME_BG_PALETTE[previousThemeIndex][0]}, ${GAME_BG_PALETTE[previousThemeIndex][1]} 70%)`,
              transition: 'background 120ms ease-out, border-color 120ms ease-out'
            }}
          >

            {!wrongFlash && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `radial-gradient(circle at 20% 20%, ${GAME_BG_PALETTE[gameThemeIndex][0]}, ${GAME_BG_PALETTE[gameThemeIndex][1]} 70%)`,
                  opacity: themeTransitioning ? 1 : 0,
                  transition: 'opacity 650ms ease-in-out',
                  pointerEvents: 'none'
                }}
              />
            )}

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


            {promptNotice && phase !== 'countdown' && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 18,
                  pointerEvents: 'none',
                  background: 'linear-gradient(90deg, #ff7a18, #ffb347)',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: 30,
                  padding: '12px 20px',
                  borderRadius: 999,
                  boxShadow: '0 10px 24px rgba(255,126,24,0.45)',
                  animation: 'promptBurst 900ms ease-out forwards'
                }}
              >
                NEW PROMPT!
              </div>
            )}


            {phase === 'playing' && activePrompt.promptIndex > 0 && elapsedMs < activePrompt.startsAtMs + PROMPT_PREP_MS && (
              <div
                style={{
                  position: 'absolute',
                  top: 14,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 18,
                  background: 'rgba(9,22,44,0.75)',
                  color: '#fff',
                  padding: '8px 14px',
                  borderRadius: 999,
                  fontWeight: 700
                }}
              >
                Prepare... {Math.max(0, Math.ceil((activePrompt.startsAtMs + PROMPT_PREP_MS - elapsedMs) / 1000))}
              </div>
            )}

            {activeSpawns.map((spawn) => {
              const timing = getEffectiveSpawnTiming(spawn);
              const displayWord = formatWordForDisplay(spawn.wordText);
              const position = getBubblePosition({
                spawn: { ...spawn, appearsAtMs: timing.appearsAtMs, travelDurationMs: timing.expiresAtMs - timing.appearsAtMs },
                elapsedMs
              });
              const bubbleDimensions = getBubbleDimensions(displayWord);
              const wobble = getWobbleSettings(spawn.spawnId);

              return (
                <button
                  key={spawn.spawnId}
                  onClick={() => clickBubble(spawn)}
                  className="arena-bubble"
                  style={{
                    left: `${position.left}%`,
                    bottom: `${position.bottom.toFixed(3)}%`,
                    width: bubbleDimensions.width,
                    height: bubbleDimensions.height,
                    letterSpacing: 0.2,
                    fontSize: bubbleDimensions.fontSize,
                    padding: 12,
                    display: 'grid',
                    placeItems: 'center',
                    textAlign: 'center',
                    lineHeight: 1.08,
                    wordBreak: 'break-word',
                    animation: `bubbleWobble ${wobble.durationMs}ms ease-in-out ${wobble.delayMs}ms infinite alternate`
                  }}
                >
                  {displayWord}
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
                  color: effect.color,
                  fontWeight: 900,
                  fontSize: 30,
                  textShadow: `0 5px 14px ${effect.color}88`,
                  animation: 'popRise 520ms ease-out forwards'
                }}
              >
                PERFECT! {effect.label}
              </div>
            ))}


            {flyingScores.map((item) => (
              <div
                key={item.id}
                style={{
                  position: 'fixed',
                  left: item.reached ? item.targetX : item.sourceX,
                  top: item.reached ? item.targetY : item.sourceY,
                  transform: 'translate(-50%, -50%)',
                  color: item.color,
                  fontWeight: 900,
                  fontSize: 26,
                  textShadow: `0 0 12px ${item.color}`,
                  transition: 'left 650ms cubic-bezier(0.2, 0.9, 0.2, 1), top 650ms cubic-bezier(0.2, 0.9, 0.2, 1), opacity 650ms ease-out',
                  opacity: item.reached ? 0.2 : 1,
                  pointerEvents: 'none',
                  zIndex: 40
                }}
              >
                {item.label}
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
            }
            @keyframes promptBurst {
              0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
              18% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
              100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
            }
            @keyframes resultBubbleHue {
              0% { filter: hue-rotate(0deg); }
              100% { filter: hue-rotate(360deg); }
            }`}
          </style>
        </>
      )}

      {phase === 'done' && result && (
        <div
          style={{
            marginTop: 22,
            display: 'grid',
            placeItems: 'center'
          }}
        >
          <div
            style={{
              width: 'min(520px, 92vw)',
              borderRadius: '50%',
              padding: 14,
              background: 'conic-gradient(from 0deg, #68d2ff, #8f8bff, #ff7fbe, #ffd06a, #68d2ff)',
              animation: 'resultBubbleHue 8s linear infinite'
            }}
          >
            <div
              style={{
                borderRadius: '48%',
                background: 'radial-gradient(circle at 26% 20%, #ffffff, #d9ecff 72%)',
                border: '2px solid rgba(87, 147, 212, 0.6)',
                boxShadow: '0 14px 30px rgba(31, 95, 163, 0.24), inset 0 8px 18px rgba(255,255,255,0.6)',
                padding: '24px 28px',
                textAlign: 'center'
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: 14, color: '#123b63' }}>Round Complete ✨</h2>
              <p><strong>Final score:</strong> {result.validatedScore}</p>
              <p><strong>Coins earned:</strong> {result.coinsEarned}</p>
              <p><strong>Total coins:</strong> {result.totalCoins}</p>
              <p><strong>Correct clicks:</strong> {result.validationSummary?.correctClicks ?? correctClicks}</p>
              <p><strong>Wrong clicks:</strong> {result.validationSummary?.wrongClicks ?? wrongClicks}</p>
              <p><strong>Missed correct bubbles:</strong> {result.validationSummary?.missedCorrectCount ?? missedCorrectClicks}</p>
              <p><strong>Best combo streak:</strong> {result.validationSummary?.maxCorrectStreak ?? comboStreak}</p>
              <PixelButton onClick={() => setPhase('setup')}>Play again</PixelButton>
            </div>
          </div>
        </div>
      )}

      {status && <p className="status-error">{status}</p>}
    </PageFrame>
  );
}

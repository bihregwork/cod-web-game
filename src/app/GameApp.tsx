import type { CSSProperties, PointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ASSETS } from "../game/data/assets";
import { BALANCE } from "../game/data/balance";
import { preloadGameAssets } from "../game/data/preloadAssets";
import { intersects, missedBottom, type Rect } from "../game/engine/collision";
import { directionFromKeys } from "../game/engine/input";
import { createInitialState } from "../game/engine/state";
import { renderStartupScene } from "../game/render/canvasRenderer";
import { difficultyLevel, movementSpeedMultiplier, spawnIntervalMs } from "../game/systems/difficulty";
import { applyCaughtItem, applyMissedItem, consumeFuel, countsTowardMissPenalty, fuelForHud, moveFallingItem } from "../game/systems/gameplay";
import { createFallingItem } from "../game/systems/spawning";
import type { FallingItem, FloatingText, GameMode, GameState, LeaderboardEntry, ScoreEntry } from "../game/types";
import { fetchScores, submitScore } from "../services/leaderboardApi";
import { readLocalScores, submitLocalScore } from "../services/localLeaderboard";
import { readPendingScore } from "../services/pendingScore";
import { getCurrentPlayerProfile, getOrCreatePlayerProfile, validatePlayerName, type PlayerProfile } from "../services/playerIdentity";
import { GameOverModal } from "../ui/GameOverModal";
import { Hud } from "../ui/Hud";
import { LeaderboardModal } from "../ui/LeaderboardModal";
import { PauseRestartPanel } from "../ui/PauseRestartPanel";
import { PromoActionPanel } from "../ui/PromoActionPanel";

const DAMAGE_COOLDOWN_MS = 700;

type StageMetrics = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type WalletMetrics = {
  leftFromHeroCenter: number;
  rightFromHeroCenter: number;
  top: number;
  width: number;
  height: number;
};

function createRuntimeInitialState(): GameState {
  const initial = createInitialState();
  const params = new URLSearchParams(window.location.search);
  const debugScore = readNumberQueryParam(params, "score", undefined, 0);

  if (params.get("mode") === "car") {
    return {
      ...initial,
      mode: "car",
      score: debugScore ?? 245500,
      fuel: readNumberQueryParam(params, "fuel", 38, 1, BALANCE.maxFuel) ?? 38,
      carParts: { wheels: 4, engine: true, body: true },
    };
  }
  return debugScore === undefined ? initial : { ...initial, score: debugScore };
}

function readNumberQueryParam(params: URLSearchParams, name: string, fallback: number | undefined, min = 0, max = Number.MAX_SAFE_INTEGER): number | undefined {
  const rawValue = params.get(name);
  if (rawValue === null) {
    return fallback;
  }

  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

export function GameApp() {
  const [gameState, setGameState] = useState<GameState>(createRuntimeInitialState);
  const [resumeMode, setResumeMode] = useState<GameMode>("playing");
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [currentProfile, setCurrentProfile] = useState<PlayerProfile>(() => getCurrentPlayerProfile());
  const [playerName, setPlayerName] = useState(() => currentProfile.name);
  const [leaderboardScores, setLeaderboardScores] = useState<LeaderboardEntry[]>(() => readLocalScores());
  const [scoreSaveMessage, setScoreSaveMessage] = useState("");
  const [assetsReady, setAssetsReady] = useState(false);
  const [assetLoadProgress, setAssetLoadProgress] = useState(0);
  const [leaderboardReturnMode, setLeaderboardReturnMode] = useState<GameMode | null>(null);

  const stageRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const walletTargetRef = useRef<HTMLSpanElement | null>(null);

  const gameStateRef = useRef(gameState);
  const renderedGameStateRef = useRef(gameState);
  const resumeModeRef = useRef(resumeMode);
  const heroPositionRef = useRef(0.5);
  const fallingItemsRef = useRef(fallingItems);
  const floatingTextsRef = useRef(floatingTexts);
  const fallingItemRefs = useRef(new Map<string, HTMLImageElement>());
  const stageMetricsRef = useRef<StageMetrics | null>(null);
  const walletMetricsRef = useRef<WalletMetrics | null>(null);
  const pressedKeysRef = useRef(new Set<string>());
  const draggingRef = useRef(false);
  const elapsedMsRef = useRef(0);
  const spawnTimerMsRef = useRef(0);
  const lastContractElapsedMsRef = useRef(-30_000);
  const lastFuelElapsedMsRef = useRef(0);
  const lastCarPartElapsedMsRef = useRef(-BALANCE.carParts.minSpawnGapMs);
  const damageCooldownUntilMsRef = useRef(0);

  const commitGameState = useCallback((nextState: GameState) => {
    const previousRenderedState = renderedGameStateRef.current;
    gameStateRef.current = nextState;
    if (shouldRenderGameState(previousRenderedState, nextState)) {
      renderedGameStateRef.current = nextState;
      setGameState(nextState);
    }
  }, []);

  const paintHeroPosition = useCallback((nextPosition: number) => {
    heroRef.current?.style.setProperty("--hero-center-x", `${nextPosition * 100}cqw`);
  }, []);

  const commitHeroPosition = useCallback((nextPosition: number) => {
    heroPositionRef.current = nextPosition;
    paintHeroPosition(nextPosition);
  }, [paintHeroPosition]);

  const paintFallingItems = useCallback((nextItems: FallingItem[]) => {
    for (const item of nextItems) {
      const element = fallingItemRefs.current.get(item.uid);
      if (element) {
        applyFallingItemElementStyle(element, item);
      }
    }
  }, []);

  const commitFallingItems = useCallback((nextItems: FallingItem[]) => {
    const previousItems = fallingItemsRef.current;
    fallingItemsRef.current = nextItems;
    hideRemovedFallingItems(previousItems, nextItems, fallingItemRefs.current);
    paintFallingItems(nextItems);
    if (fallingItemMembershipChanged(previousItems, nextItems)) {
      setFallingItems(nextItems);
    }
  }, [paintFallingItems]);

  const commitFloatingTexts = useCallback((nextTexts: FloatingText[]) => {
    const previousTexts = floatingTextsRef.current;
    floatingTextsRef.current = nextTexts;
    if (previousTexts.length === 0 && nextTexts.length === 0) {
      return;
    }
    setFloatingTexts(nextTexts);
  }, []);

  const commitResumeMode = useCallback((nextMode: GameMode) => {
    resumeModeRef.current = nextMode;
    setResumeMode(nextMode);
  }, []);

  const measureStageMetrics = useCallback((): StageMetrics | null => {
    const stageRect = stageRef.current?.getBoundingClientRect();
    if (!stageRect || stageRect.width <= 0 || stageRect.height <= 0) {
      stageMetricsRef.current = null;
      return null;
    }

    const metrics = {
      left: stageRect.left,
      top: stageRect.top,
      width: stageRect.width,
      height: stageRect.height,
    };
    stageMetricsRef.current = metrics;
    return metrics;
  }, []);

  const measureWalletMetrics = useCallback((): WalletMetrics | null => {
    const metrics = stageMetricsRef.current ?? measureStageMetrics();
    const walletRect = walletTargetRef.current?.getBoundingClientRect();
    if (!metrics || !walletRect) {
      walletMetricsRef.current = null;
      return null;
    }

    const walletX = walletRect.left - metrics.left;
    const heroCenterX = heroPositionRef.current * metrics.width;
    const walletMetrics = {
      leftFromHeroCenter: walletX - heroCenterX,
      rightFromHeroCenter: walletX + walletRect.width - heroCenterX,
      top: walletRect.top - metrics.top,
      width: walletRect.width,
      height: walletRect.height,
    };
    walletMetricsRef.current = walletMetrics;
    return walletMetrics;
  }, [measureStageMetrics]);

  const refreshScores = useCallback(async () => {
    try {
      setLeaderboardScores(await fetchScores(currentProfile.playerId));
    } catch {
      setLeaderboardScores(readLocalScores());
    }
  }, [currentProfile.playerId]);

  const retryPendingScore = useCallback(async () => {
    const pendingScore = readPendingScore();
    if (!pendingScore) {
      return;
    }

    const localResult = submitLocalScore(pendingScore);
    setLeaderboardScores(localResult.scores);
    try {
      const remoteResult = await submitScore(pendingScore);
      setLeaderboardScores(remoteResult.scores);
    } catch {
      // The pending score remains in localStorage and will be retried later.
    }
  }, []);

  const resetRun = useCallback(
    (nextState = createInitialState()) => {
      elapsedMsRef.current = 0;
      spawnTimerMsRef.current = 0;
      lastContractElapsedMsRef.current = -30_000;
      lastFuelElapsedMsRef.current = 0;
      lastCarPartElapsedMsRef.current = -BALANCE.carParts.minSpawnGapMs;
      damageCooldownUntilMsRef.current = 0;
      commitHeroPosition(0.5);
      commitFallingItems([]);
      commitFloatingTexts([]);
      commitGameState(nextState);
      setScoreSaveMessage("");
    },
    [commitFallingItems, commitFloatingTexts, commitGameState, commitHeroPosition],
  );

  useEffect(() => {
    void (async () => {
      await retryPendingScore();
      await refreshScores();
    })();
  }, [refreshScores, retryPendingScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    renderStartupScene(canvas, window.devicePixelRatio || 1);
  }, [gameState.mode]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const updateMetrics = () => {
      measureStageMetrics();
      window.requestAnimationFrame(() => measureWalletMetrics());
    };

    updateMetrics();
    const resizeObserver = new ResizeObserver(updateMetrics);
    resizeObserver.observe(stage);
    window.addEventListener("resize", updateMetrics);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateMetrics);
    };
  }, [measureStageMetrics, measureWalletMetrics]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        if (!event.repeat) {
          handleSpaceAction();
        }
        return;
      }

      if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(event.key)) {
        event.preventDefault();
        pressedKeysRef.current.add(event.key);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeysRef.current.delete(event.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [commitGameState, commitResumeMode, resetRun]);

  useEffect(() => {
    let frameId = 0;
    let lastFrameTime = 0;

    const tick = (time: number) => {
      const deltaMs = lastFrameTime ? Math.min(50, time - lastFrameTime) : 0;
      lastFrameTime = time;
      if (deltaMs > 0) {
        updateGame(deltaMs);
      }
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const updateGame = (deltaMs: number) => {
    const stageMetrics = stageMetricsRef.current ?? measureStageMetrics();
    if (!stageMetrics) {
      return;
    }

    let state = gameStateRef.current;
    if (state.mode !== "playing" && state.mode !== "car") {
      return;
    }

    elapsedMsRef.current += deltaMs;
    state = consumeFuel(state, deltaMs);

    const level = difficultyLevel(elapsedMsRef.current / 1000, state.score);
    moveHeroByInput(deltaMs, stageMetrics, state.mode === "car", level);

    spawnTimerMsRef.current += deltaMs;
    const interval = spawnIntervalMs(level);
    const spawnedItems: FallingItem[] = [];
    while (spawnTimerMsRef.current >= interval && spawnedItems.length < 2) {
      const spawnedItem = createFallingItem({
        state,
        level,
        stageWidth: stageMetrics.width,
        stageHeight: stageMetrics.height,
        lastContractElapsedMs: lastContractElapsedMsRef.current,
        lastFuelElapsedMs: lastFuelElapsedMsRef.current,
        lastCarPartElapsedMs: lastCarPartElapsedMsRef.current,
        elapsedMs: elapsedMsRef.current,
        activeItems: [...fallingItemsRef.current, ...spawnedItems],
      });
      spawnedItems.push(spawnedItem);
      if (spawnedItem.item.id === "contract") {
        lastContractElapsedMsRef.current = elapsedMsRef.current;
      }
      if (spawnedItem.item.id === "fuelCan") {
        lastFuelElapsedMsRef.current = elapsedMsRef.current;
      }
      if (spawnedItem.item.kind === "carPart") {
        lastCarPartElapsedMsRef.current = elapsedMsRef.current;
      }
      spawnTimerMsRef.current -= interval;
    }

    const walletRect = getWalletRect(stageMetrics);
    const nextItems: FallingItem[] = [];
    let nextTexts = floatingTextsRef.current
      .map((text) => ({ ...text, ageMs: text.ageMs + deltaMs, y: text.y - deltaMs * 0.025 }))
      .filter((text) => text.ageMs < 900);

    for (const item of [...fallingItemsRef.current, ...spawnedItems].map((fallingItem) => moveFallingItem(fallingItem, deltaMs))) {
      const itemRect = rectForFallingItem(item);
      if (walletRect && intersects(itemRect, walletRect)) {
        if (item.item.id === "fine" && elapsedMsRef.current < damageCooldownUntilMsRef.current) {
          continue;
        }

        const livesBefore = state.lives;
        const result = applyCaughtItem(state, item.item);
        state = result.state;
        if (state.lives < livesBefore) {
          damageCooldownUntilMsRef.current = elapsedMsRef.current + DAMAGE_COOLDOWN_MS;
        }
        nextTexts = [...nextTexts, createFloatingText(result.text, item.x + item.size / 2, item.y, result.textKind)];
        if (state.mode === "gameOver") {
          break;
        }
        continue;
      }

      if (missedBottom(itemRect, stageMetrics.height)) {
        if (missWouldCostLife(state, item.item) && elapsedMsRef.current < damageCooldownUntilMsRef.current) {
          continue;
        }

        const livesBefore = state.lives;
        const result = applyMissedItem(state, item.item);
        state = result.state;
        if (state.lives < livesBefore) {
          damageCooldownUntilMsRef.current = elapsedMsRef.current + DAMAGE_COOLDOWN_MS;
        }
        if (result.text) {
          nextTexts = [...nextTexts, createFloatingText(result.text, item.x + item.size / 2, stageMetrics.height - 72, result.textKind ?? "life")];
        }
        if (state.mode === "gameOver") {
          break;
        }
        continue;
      }

      nextItems.push(item);
    }

    commitFloatingTexts(nextTexts);
    commitFallingItems(state.mode === "gameOver" ? [] : nextItems);
    commitGameState(state);
  };

  const moveHeroByInput = (deltaMs: number, stageMetrics: StageMetrics, carMode: boolean, level: number) => {
    const direction = directionFromKeys(pressedKeysRef.current);
    if (direction === 0) {
      return;
    }
    const { min, max } = heroPositionBounds(stageMetrics);
    const speed =
      ((carMode ? BALANCE.movement.carSpeedPxPerSecond : BALANCE.movement.heroSpeedPxPerSecond) *
        movementSpeedMultiplier(level)) /
      stageMetrics.width;
    const nextPosition = clamp(heroPositionRef.current + direction * speed * (deltaMs / 1000), min, max);
    commitHeroPosition(nextPosition);
  };

  const moveHeroToClientX = (clientX: number) => {
    const stageMetrics = stageMetricsRef.current ?? measureStageMetrics();
    if (!stageMetrics) {
      return;
    }
    const { min, max } = heroPositionBounds(stageMetrics);
    const nextPosition = clamp((clientX - stageMetrics.left) / stageMetrics.width, min, max);
    commitHeroPosition(nextPosition);
  };

  const handleSpaceAction = () => {
    const currentMode = gameStateRef.current.mode;

    if (currentMode === "idle" || currentMode === "gameOver") {
      resetRun({ ...createInitialState(), mode: "playing" });
      return;
    }

    if (currentMode === "paused") {
      commitGameState({ ...gameStateRef.current, mode: resumeModeRef.current });
      return;
    }

    if (currentMode === "playing" || currentMode === "car") {
      commitResumeMode(currentMode);
      commitGameState({ ...gameStateRef.current, mode: "paused" });
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    moveHeroToClientX(event.clientX);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (draggingRef.current) {
      moveHeroToClientX(event.clientX);
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    draggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleStart = () => {
    if (!assetsReady) {
      return;
    }

    resetRun({ ...createInitialState(), mode: "playing" });
  };

  const handlePause = () => {
    const currentMode = gameStateRef.current.mode;
    if (currentMode === "paused") {
      commitGameState({ ...gameStateRef.current, mode: resumeModeRef.current });
      return;
    }
    if (currentMode === "playing" || currentMode === "car") {
      commitResumeMode(currentMode);
      commitGameState({ ...gameStateRef.current, mode: "paused" });
    }
  };

  const handleRestart = () => {
    const currentMode = gameStateRef.current.mode;
    if (currentMode === "playing" || currentMode === "car") {
      commitResumeMode(currentMode);
      commitGameState({ ...gameStateRef.current, mode: "paused" });
      return;
    }

    if (currentMode === "paused" && (resumeModeRef.current === "playing" || resumeModeRef.current === "car")) {
      return;
    }

    resetRun();
  };

  const handlePanelRestart = () => {
    resetRun();
  };

  const handleLeaderboard = () => {
    const currentMode = gameStateRef.current.mode;
    if (currentMode === "leaderboard") {
      closeLeaderboard();
      return;
    }
    if (currentMode === "playing" || currentMode === "car" || currentMode === "idle" || currentMode === "paused") {
      setLeaderboardScores(readLocalScores());
      void refreshScores();
      if (currentMode === "playing" || currentMode === "car") {
        commitResumeMode(currentMode);
      }
      setLeaderboardReturnMode(currentMode);
      commitGameState({ ...gameStateRef.current, mode: "leaderboard" });
    }
  };

  const closeLeaderboard = () => {
    const returnMode = leaderboardReturnMode ?? resumeModeRef.current;
    setLeaderboardReturnMode(null);
    commitGameState({ ...gameStateRef.current, mode: returnMode });
  };

  const handleSaveScore = async () => {
    const validation = validatePlayerName(playerName);
    if (!validation.valid) {
      setScoreSaveMessage(validation.message);
      return;
    }

    const profile = getOrCreatePlayerProfile(validation.name);
    const now = new Date().toISOString();
    const scoreEntry: ScoreEntry = {
      playerId: profile.playerId,
      name: profile.name,
      score: Math.max(0, Math.round(gameStateRef.current.score)),
      createdAt: now,
      updatedAt: now,
    };
    const localResult = submitLocalScore(scoreEntry, window.localStorage);

    setCurrentProfile(profile);
    setPlayerName(profile.name);
    setLeaderboardScores(localResult.scores);
    setScoreSaveMessage(scoreResultMessage(localResult));

    try {
      const remoteResult = await submitScore(scoreEntry);
      setLeaderboardScores(remoteResult.scores);
      setScoreSaveMessage(scoreResultMessage(remoteResult));
    } catch {
      setScoreSaveMessage(`${scoreResultMessage(localResult)}. Рекорд временно не сохранен на сервере, сохранено локально`);
    }
  };

  const isPaused = gameState.mode === "paused";
  const isOverlayMode = gameState.mode === "paused" || gameState.mode === "leaderboard";
  const showCarMode = gameState.mode === "car" || (isOverlayMode && resumeMode === "car");
  const showGameTitle = gameState.mode === "idle" || isPaused;
  const showDebugHitbox = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debugHitbox") === "1";

  useEffect(() => {
    let isActive = true;

    void preloadGameAssets((progress) => {
      if (isActive) {
        setAssetLoadProgress(progress);
      }
    }).finally(() => {
      if (isActive) {
        setAssetLoadProgress(100);
        setAssetsReady(true);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    paintHeroPosition(heroPositionRef.current);
    const frameId = window.requestAnimationFrame(() => {
      measureStageMetrics();
      measureWalletMetrics();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [measureStageMetrics, measureWalletMetrics, paintHeroPosition, showCarMode]);

  return (
    <main className="game-app">
      <section
        ref={stageRef}
        className={`game-stage ${showCarMode ? "is-car-mode" : ""} ${isPaused ? "is-paused" : ""} ${showDebugHitbox ? "show-wallet-hitbox" : ""}`}
        aria-label="Игровой экран"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <canvas ref={canvasRef} className="game-canvas" aria-hidden="true" />

        {showGameTitle ? <img className="game-title-image" src={ASSETS.ui.gameTitle} alt="" aria-hidden="true" /> : null}

        <Hud
          score={gameState.score}
          lives={gameState.lives}
          fuel={fuelForHud(showCarMode ? gameState.fuel : gameState.fuel)}
          missedCatchableItems={gameState.missedCatchableItems}
          carMode={showCarMode}
          parts={gameState.carParts}
          paused={isPaused}
          onPause={handlePause}
          onRestart={handleRestart}
          onLeaderboard={handleLeaderboard}
        />

        <div className="falling-items" aria-hidden="true">
          {fallingItems.map((item) => (
            <img
              key={item.uid}
              ref={(node) => {
                if (node) {
                  fallingItemRefs.current.set(item.uid, node);
                  applyFallingItemElementStyle(node, item);
                } else {
                  fallingItemRefs.current.delete(item.uid);
                }
              }}
              className={`falling-item ${item.item.id}`}
              src={item.item.asset}
              alt=""
              style={fallingItemStyle(item)}
            />
          ))}
        </div>

        <div ref={heroRef} className={`hero ${showCarMode ? "hero-car" : "hero-walk"}`}>
          <img src={showCarMode ? ASSETS.characters.heroineCar : ASSETS.characters.heroine} alt="Героиня" />
          <span ref={walletTargetRef} className="wallet-target" aria-hidden="true" />
        </div>

        <div className="floating-texts" aria-hidden="true">
          {floatingTexts.map((text) => (
            <span key={text.uid} className={`floating-text ${text.kind}`} style={{ left: text.x, top: text.y }}>
              {text.text}
            </span>
          ))}
        </div>

        {gameState.mode === "idle" ? (
          <div className="modal-layer" onPointerDown={(event) => event.stopPropagation()}>
            <PromoActionPanel
              label="Старт"
              disabled={!assetsReady}
              loadingProgress={assetsReady ? undefined : assetLoadProgress}
              onAction={handleStart}
              tooltipId="start-car-tooltip"
            />
          </div>
        ) : null}

        {isPaused ? (
          <div className="modal-layer" onPointerDown={(event) => event.stopPropagation()}>
            <PauseRestartPanel onPause={handlePause} onRestart={handlePanelRestart} />
          </div>
        ) : null}
        {gameState.mode === "leaderboard" ? (
          <div className="modal-layer" onPointerDown={(event) => event.stopPropagation()}>
            <LeaderboardModal scores={leaderboardScores} currentPlayerId={currentProfile.playerId} onClose={closeLeaderboard} />
          </div>
        ) : null}
        {gameState.mode === "gameOver" ? (
          <div className="modal-layer" onPointerDown={(event) => event.stopPropagation()}>
            <GameOverModal
              score={gameState.score}
              playerName={playerName}
              scores={leaderboardScores}
              currentPlayerId={currentProfile.playerId}
              saveMessage={scoreSaveMessage}
              onNameChange={setPlayerName}
              onSaveScore={handleSaveScore}
              onRestart={handleRestart}
            />
          </div>
        ) : null}
      </section>
    </main>
  );

  function getWalletRect(stageMetrics: StageMetrics): Rect | null {
    const walletMetrics = walletMetricsRef.current ?? measureWalletMetrics();
    if (!walletMetrics) {
      return null;
    }

    const heroCenterX = heroPositionRef.current * stageMetrics.width;
    return {
      x: heroCenterX + walletMetrics.leftFromHeroCenter,
      y: walletMetrics.top,
      width: walletMetrics.width,
      height: walletMetrics.height,
    };
  }

  function heroPositionBounds(stageMetrics: StageMetrics): { min: number; max: number } {
    const walletMetrics = walletMetricsRef.current ?? measureWalletMetrics();
    if (!walletMetrics || stageMetrics.width <= 0) {
      return { min: 0, max: 1 };
    }

    const min = clamp(-walletMetrics.leftFromHeroCenter / stageMetrics.width, 0, 1);
    const max = clamp((stageMetrics.width - walletMetrics.rightFromHeroCenter) / stageMetrics.width, 0, 1);

    if (min > max) {
      return { min: 0.5, max: 0.5 };
    }

    return { min, max };
  }
}

type ScoreSaveResult = {
  personalBestUpdated: boolean;
  nameUpdated: boolean;
  inTop10: boolean;
  rank: number | null;
};

function scoreResultMessage(result: ScoreSaveResult): string {
  if (result.personalBestUpdated) {
    return result.inTop10 && result.rank ? `Новый рекорд! Место ${result.rank}` : "Новый личный рекорд сохранен";
  }
  if (result.nameUpdated) {
    return "Имя обновлено, лучший результат сохранен";
  }
  return "Результат ниже личного рекорда";
}

function shouldRenderGameState(previousState: GameState, nextState: GameState): boolean {
  return (
    previousState.mode !== nextState.mode ||
    previousState.score !== nextState.score ||
    previousState.lives !== nextState.lives ||
    fuelForHud(previousState.fuel) !== fuelForHud(nextState.fuel) ||
    previousState.missedCatchableItems !== nextState.missedCatchableItems ||
    previousState.carParts.wheels !== nextState.carParts.wheels ||
    previousState.carParts.engine !== nextState.carParts.engine ||
    previousState.carParts.body !== nextState.carParts.body
  );
}

function fallingItemStyle(item: FallingItem): CSSProperties {
  return {
    left: 0,
    top: 0,
    width: item.size,
    height: item.size,
    transform: fallingItemTransform(item),
  };
}

function applyFallingItemElementStyle(element: HTMLElement, item: FallingItem): void {
  element.style.width = `${item.size}px`;
  element.style.height = `${item.size}px`;
  element.style.transform = fallingItemTransform(item);
  element.style.opacity = "1";
  element.style.visibility = "visible";
}

function fallingItemTransform(item: FallingItem): string {
  return `translate3d(${item.x}px, ${item.y}px, 0) rotate(${item.rotation}deg)`;
}

function hideRemovedFallingItems(previousItems: FallingItem[], nextItems: FallingItem[], elements: Map<string, HTMLElement>): void {
  if (previousItems.length === 0) {
    return;
  }

  const nextIds = new Set(nextItems.map((item) => item.uid));
  for (const item of previousItems) {
    if (!nextIds.has(item.uid)) {
      const element = elements.get(item.uid);
      if (element) {
        element.style.opacity = "0";
        element.style.visibility = "hidden";
      }
    }
  }
}

function fallingItemMembershipChanged(previousItems: FallingItem[], nextItems: FallingItem[]): boolean {
  if (previousItems.length !== nextItems.length) {
    return true;
  }

  return previousItems.some((item, index) => item.uid !== nextItems[index]?.uid);
}

function rectForFallingItem(item: FallingItem): Rect {
  const inset = item.item.id === "kitchen" || item.item.id === "hallway" || item.item.id === "carBody" ? item.size * 0.12 : -item.size * 0.04;
  return {
    x: item.x + inset,
    y: item.y + inset,
    width: item.size - inset * 2,
    height: item.size - inset * 2,
  };
}

function missWouldCostLife(state: GameState, item: FallingItem["item"]): boolean {
  if (item.kind === "hazard") {
    return false;
  }
  if (item.id === "contract") {
    return true;
  }
  if (!countsTowardMissPenalty(item)) {
    return false;
  }
  return state.missedCatchableItems + 1 >= BALANCE.scoring.missedCatchableBeforeLifePenalty;
}

function createFloatingText(text: string, x: number, y: number, kind: FloatingText["kind"]): FloatingText {
  return {
    uid: `${kind}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`,
    text,
    x,
    y,
    ageMs: 0,
    kind,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

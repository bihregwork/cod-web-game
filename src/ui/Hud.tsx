import type { LucideIcon } from "lucide-react";
import { RotateCcw, Trophy } from "lucide-react";

import { BALANCE } from "../game/data/balance";
import { ASSETS } from "../game/data/assets";

type HudProps = {
  score: number;
  lives: number;
  fuel: number;
  missedCatchableItems: number;
  carMode: boolean;
  paused: boolean;
  parts: {
    wheels: number;
    engine: boolean;
    body: boolean;
  };
  onPause: () => void;
  onRestart: () => void;
  onLeaderboard: () => void;
};

export function Hud({ score, lives, fuel, missedCatchableItems, carMode, paused, parts, onPause, onRestart, onLeaderboard }: HudProps) {
  const assembled = parts.wheels >= 4 && parts.engine && parts.body;
  const machineStatus = carMode ? "Car Mode" : assembled && fuel === 0 ? "Нужен бензин" : "Собери машину";
  const machineStatusClass = carMode ? "active" : assembled && fuel === 0 ? "needs-fuel" : "collecting";

  return (
    <div className="hud-layer" onPointerDown={(event) => event.stopPropagation()}>
      <div className="hud-panel score-panel">
        <strong className="score-value">{score.toLocaleString("ru-RU")}</strong>
        <div className="hearts" aria-label={`Жизни: ${lives}`}>
          {Array.from({ length: lives }).map((_, index) => (
            <span key={index} aria-hidden="true">
              ♥
            </span>
          ))}
        </div>
        <div className="hud-controls" aria-label="Управление игрой">
          <button type="button" className="hud-button pause-button" onClick={onPause} aria-label={paused ? "Продолжить" : "Пауза"} title={paused ? "Продолжить" : "Пауза"}>
            <span className="pause-symbol" aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
          <button type="button" className="hud-button" onClick={onRestart} aria-label="Рестарт" title="Рестарт">
            <OutlinedIcon Icon={RotateCcw} />
          </button>
          <button type="button" className="hud-button" onClick={onLeaderboard} aria-label="Рекорды" title="Рекорды">
            <OutlinedIcon Icon={Trophy} size={27} />
          </button>
        </div>
        <div className="miss-counter" aria-label={`Пропуски: ${missedCatchableItems} из ${BALANCE.scoring.missedCatchableBeforeLifePenalty}`}>
          <span>Пропуски</span>
          <strong>
            {missedCatchableItems}/{BALANCE.scoring.missedCatchableBeforeLifePenalty}
          </strong>
        </div>
      </div>

      <div className={`hud-panel machine-panel ${machineStatusClass}`}>
        <strong className="machine-title">Машина</strong>
        <span className="machine-status">{machineStatus}</span>
        <div className="fuel-readout">
          <img src={ASSETS.items.fuelCan} alt="" />
          <b>{fuel}/60 л</b>
        </div>
        <div className="machine-slots" aria-label="Сборка машины">
          {Array.from({ length: 4 }).map((_, index) => (
            <Slot key={index} asset={index < parts.wheels ? ASSETS.items.wheel : undefined} />
          ))}
          <Slot asset={parts.engine ? ASSETS.items.engine : undefined} />
          <Slot wide asset={parts.body ? ASSETS.items.carBody : undefined} />
        </div>
      </div>
    </div>
  );
}

function OutlinedIcon({ Icon, size = 28 }: { Icon: LucideIcon; size?: number }) {
  return (
    <span className="outlined-icon" aria-hidden="true">
      <Icon className="outlined-icon-back" size={size} strokeWidth={5} />
      <Icon className="outlined-icon-front" size={size} strokeWidth={3} />
    </span>
  );
}

function Slot({ asset, wide = false }: { asset?: string; wide?: boolean }) {
  return <div className={`part-slot ${wide ? "wide" : ""}`}>{asset ? <img src={asset} alt="" /> : null}</div>;
}

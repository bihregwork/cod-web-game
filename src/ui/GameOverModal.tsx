import type { FormEvent } from "react";

import type { LeaderboardEntry } from "../game/types";
import { GameOverlay } from "./GameOverlay";
import { LeaderboardList } from "./LeaderboardList";

type GameOverModalProps = {
  score: number;
  playerName: string;
  scores: LeaderboardEntry[];
  currentPlayerId: string;
  saveMessage: string;
  onNameChange: (name: string) => void;
  onSaveScore: () => void;
  onRestart: () => void;
};

export function GameOverModal({
  score,
  playerName,
  scores,
  currentPlayerId,
  saveMessage,
  onNameChange,
  onSaveScore,
  onRestart,
}: GameOverModalProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSaveScore();
  };

  return (
    <GameOverlay title="Игра окончена">
      <p className="game-over-score">
        Очки: <strong>{score.toLocaleString("ru-RU")}</strong>
      </p>
      <form className="score-form" onSubmit={handleSubmit}>
        <label className="score-name-label" htmlFor="score-player-name">
          Имя
        </label>
        <input
          id="score-player-name"
          className="score-name-input"
          value={playerName}
          maxLength={20}
          onChange={(event) => onNameChange(event.target.value)}
        />
        <button type="submit" className="modal-button primary">
          Сохранить результат
        </button>
      </form>
      {saveMessage ? <p className="score-save-message">{saveMessage}</p> : null}
      <div className="game-over-leaderboard">
        <h3>Топ-10</h3>
        <LeaderboardList scores={scores} currentPlayerId={currentPlayerId} />
      </div>
      <div className="modal-actions">
        <button type="button" className="modal-button" onClick={onRestart}>
          Играть снова
        </button>
      </div>
    </GameOverlay>
  );
}

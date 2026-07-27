import type { LeaderboardEntry } from "../game/types";
import { GameOverlay } from "./GameOverlay";
import { LeaderboardList } from "./LeaderboardList";

type LeaderboardModalProps = {
  scores: LeaderboardEntry[];
  currentPlayerId: string;
  onClose: () => void;
};

export function LeaderboardModal({ scores, currentPlayerId, onClose }: LeaderboardModalProps) {
  return (
    <GameOverlay title="Рекорды">
      <LeaderboardList scores={scores} currentPlayerId={currentPlayerId} />
      <button type="button" className="modal-button" onClick={onClose}>
        Закрыть
      </button>
    </GameOverlay>
  );
}

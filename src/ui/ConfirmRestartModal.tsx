import { GameOverlay } from "./GameOverlay";
import { PromoCarLink } from "./PromoCarLink";

type ConfirmRestartModalProps = {
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmRestartModal({ onConfirm, onCancel }: ConfirmRestartModalProps) {
  return (
    <GameOverlay title="Рестарт?" className="restart-confirm-panel">
      <div className="restart-confirm-content">
        <div className="restart-confirm-copy">
          <div className="modal-actions">
            <button type="button" className="modal-button primary" onClick={onConfirm}>
              Да
            </button>
            <button type="button" className="modal-button" onClick={onCancel}>
              Нет
            </button>
          </div>
        </div>
        <PromoCarLink tooltipId="restart-confirm-car-tooltip" label="Закажи классную мебель" lines={["Закажи", "классную", "мебель!"]} />
      </div>
    </GameOverlay>
  );
}

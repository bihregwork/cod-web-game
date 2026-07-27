import { GameOverlay } from "./GameOverlay";
import { ASSETS } from "../game/data/assets";

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
        <a
          href="https://tomsk-mebel70.ru/"
          target="_blank"
          rel="noopener noreferrer"
          className="restart-confirm-car-button"
          aria-label="Закажи классную мебель"
          aria-describedby="restart-confirm-car-tooltip"
          onPointerUp={(event) => event.currentTarget.blur()}
          onClick={(event) => window.setTimeout(() => event.currentTarget.blur(), 0)}
        >
          <img className="restart-confirm-car" src={ASSETS.characters.heroineCar} alt="" aria-hidden="true" />
        </a>
        <span id="restart-confirm-car-tooltip" className="restart-confirm-tooltip" role="tooltip">
          <span className="restart-confirm-tooltip-text">
            Закажи
            <br />
            классную
            <br />
            мебель!)
          </span>
        </span>
      </div>
    </GameOverlay>
  );
}

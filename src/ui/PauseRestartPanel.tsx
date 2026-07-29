import { PromoCarLink } from "./PromoCarLink";

type PauseRestartPanelProps = {
  onPause: () => void;
  onRestart: () => void;
};

export function PauseRestartPanel({ onPause, onRestart }: PauseRestartPanelProps) {
  return (
    <div className="overlay-panel promo-action-panel pause-restart-panel" role="dialog" aria-modal="true">
      <PromoCarLink tooltipId="pause-restart-car-tooltip" label="Закажи классную мебель" lines={["Закажи", "классную", "мебель!"]} />
      <div className="promo-action-content pause-restart-actions">
        <button type="button" className="modal-button primary promo-action-button" onClick={onPause}>
          Пауза
        </button>
        <button type="button" className="modal-button promo-action-button" onClick={onRestart}>
          Рестарт
        </button>
      </div>
    </div>
  );
}

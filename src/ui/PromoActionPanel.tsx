import { PromoCarLink } from "./PromoCarLink";

type PromoActionPanelProps = {
  label: string;
  disabled?: boolean;
  loadingProgress?: number;
  onAction: () => void;
  tooltipId: string;
};

export function PromoActionPanel({ label, disabled = false, loadingProgress, onAction, tooltipId }: PromoActionPanelProps) {
  const progress = loadingProgress === undefined ? undefined : Math.min(100, Math.max(0, Math.round(loadingProgress)));

  return (
    <div className="overlay-panel promo-action-panel" role="dialog" aria-modal="true">
      <PromoCarLink tooltipId={tooltipId} label="Закажи классную мебель" lines={["Закажи", "классную", "мебель!"]} />
      <div className="promo-action-content">
        {progress === undefined ? (
          <button type="button" className="modal-button primary promo-action-button" onClick={onAction} disabled={disabled}>
            {label}
          </button>
        ) : (
          <div className="promo-loading" aria-label={`Загрузка ${progress}%`}>
            <span className="promo-loading-label">Загрузка {progress}%</span>
            <span className="promo-loading-bar" aria-hidden="true">
              <span className="promo-loading-fill" style={{ width: `${progress}%` }} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

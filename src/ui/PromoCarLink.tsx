import { ASSETS } from "../game/data/assets";

type PromoCarLinkProps = {
  tooltipId: string;
  label: string;
  lines: string[];
};

export function PromoCarLink({ tooltipId, label, lines }: PromoCarLinkProps) {
  return (
    <>
      <a
        href="https://tomsk-mebel70.ru/"
        target="_blank"
        rel="noopener noreferrer"
        className="restart-confirm-car-button"
        aria-label={label}
        aria-describedby={tooltipId}
        onPointerUp={(event) => event.currentTarget.blur()}
        onClick={(event) => window.setTimeout(() => event.currentTarget.blur(), 0)}
      >
        <img className="restart-confirm-car" src={ASSETS.characters.heroineCar} alt="" aria-hidden="true" />
      </a>
      <span id={tooltipId} className="restart-confirm-tooltip" role="tooltip">
        <span className="restart-confirm-tooltip-text">
          {lines.map((line, index) => (
            <span key={line}>
              {line}
              {index < lines.length - 1 ? <br /> : null}
            </span>
          ))}
        </span>
      </span>
    </>
  );
}

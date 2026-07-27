type GameOverlayProps = {
  title: string;
  className?: string;
  children?: React.ReactNode;
};

export function GameOverlay({ title, className = "", children }: GameOverlayProps) {
  return (
    <div className={`overlay-panel ${className}`} role="dialog" aria-modal="true">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

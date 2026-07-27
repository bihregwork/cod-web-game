import type { LeaderboardEntry } from "../game/types";

type LeaderboardListProps = {
  scores: LeaderboardEntry[];
  currentPlayerId: string;
};

export function LeaderboardList({ scores, currentPlayerId }: LeaderboardListProps) {
  if (scores.length === 0) {
    return <p className="leaderboard-empty">Рекордов пока нет</p>;
  }

  return (
    <ol className="leaderboard-list">
      {scores.map((score, index) => (
        <li
          key={score.playerId ?? `${score.rank ?? index + 1}-${score.name}-${score.updatedAt}`}
          className={score.isCurrentPlayer || score.playerId === currentPlayerId ? "current-player" : undefined}
        >
          <span>{score.rank ?? index + 1}. {score.name}</span>
          <strong>{score.score.toLocaleString("ru-RU")}</strong>
        </li>
      ))}
    </ol>
  );
}

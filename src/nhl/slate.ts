import type { ScoreResponse } from "./types";

export function selectSlateDate(score: ScoreResponse): string {
  const started = score.games.some(
    (game) => game.gameState !== "FUT",
  );

  if (started) {
    return score.currentDate;
  }

  return score.prevDate;
}
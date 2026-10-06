import type { BoxscorePlayer, RosterPlayer } from "./types";

export function playedFinnIds(
  roster: RosterPlayer[],
  boxscore: BoxscorePlayer[],
): number[] {
  const finnishIds = new Set(
    roster
      .filter((player) => player.birthCountry === "FIN")
      .map((player) => player.id),
  );

  return boxscore
    .filter(
      (player) => finnishIds.has(player.playerId) && player.toi !== "00:00",
    )
    .map((player) => player.playerId);
}
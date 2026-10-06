export type GameState = "FUT" | "LIVE" | "CRIT" | "OFF";

export type ScoreGame = {
  gameState: GameState;
};

export type ScoreResponse = {
  currentDate: string;
  prevDate: string;
  games: ScoreGame[];
};
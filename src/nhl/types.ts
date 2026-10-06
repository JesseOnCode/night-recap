export type GameState = "FUT" | "LIVE" | "CRIT" | "OFF";

export type ScoreGame = {
  gameState: GameState;
};

export type ScoreResponse = {
  currentDate: string;
  prevDate: string;
  games: ScoreGame[];
};

export type RosterPlayer = {
  id: number;
  birthCountry: string;
};

export type BoxscorePlayer = {
  playerId: number;
  position: string;
  toi: string;
};
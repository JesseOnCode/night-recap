import { formatSavePct } from "./stats";

export type SkaterStat = {
  playerId: number;
  name: string;
  lastName: string;
  team: string;
  games: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  pim: number;
  shots: number;
  shootingPct: number;
  toiSeconds: number;
};

export type GoalieStat = {
  playerId: number;
  name: string;
  lastName: string;
  team: string;
  games: number;
  wins: number;
  losses: number;
  otLosses: number;
  gaa: number;
  savePct: number;
  shotsAgainst: number;
  saves: number;
  goalsAgainst: number;
  shutouts: number;
};

export type SkaterRow = {
  playerId: number;
  team: string;
  player: string;
  games: string;
  goals: string;
  assists: string;
  points: string;
  plusMinus: string;
  pim: string;
  shots: string;
  shooting: string;
  toi: string;
};

export type GoalieRow = {
  playerId: number;
  team: string;
  player: string;
  games: string;
  wins: string;
  losses: string;
  otLosses: string;
  gaa: string;
  savePct: string;
  saves: string;
  goalsAgainst: string;
  shutouts: string;
};

function plusMinus(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function clock(seconds: number): string {
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function decimal(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export function buildSkaterRows(players: SkaterStat[]): SkaterRow[] {
  return [...players]
    .sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      if (b.goals !== a.goals) {
        return b.goals - a.goals;
      }
      return a.lastName.localeCompare(b.lastName, "fi");
    })
    .map((player) => ({
      playerId: player.playerId,
      team: player.team,
      player: `${player.name}, ${player.team}`,
      games: String(player.games),
      goals: String(player.goals),
      assists: String(player.assists),
      points: String(player.points),
      plusMinus: plusMinus(player.plusMinus),
      pim: String(player.pim),
      shots: String(player.shots),
      shooting: player.shots === 0 ? "–" : formatSavePct(player.shootingPct),
      toi: clock(player.toiSeconds),
    }));
}

export function buildGoalieRows(players: GoalieStat[]): GoalieRow[] {
  return [...players]
    .sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      if (b.savePct !== a.savePct) {
        return b.savePct - a.savePct;
      }
      return a.lastName.localeCompare(b.lastName, "fi");
    })
    .map((player) => ({
      playerId: player.playerId,
      team: player.team,
      player: `${player.name}, ${player.team}`,
      games: String(player.games),
      wins: String(player.wins),
      losses: String(player.losses),
      otLosses: String(player.otLosses),
      gaa: decimal(player.gaa),
      savePct: player.shotsAgainst === 0 ? "–" : formatSavePct(player.savePct),
      saves: String(player.saves),
      goalsAgainst: String(player.goalsAgainst),
      shutouts: String(player.shutouts),
    }));
}

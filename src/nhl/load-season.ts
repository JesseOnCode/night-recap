import { mapPool, nhlJson } from "./client";
import { loadFinns } from "./load-finns";
import {
  buildGoalieRows,
  buildSkaterRows,
  type GoalieRow,
  type GoalieStat,
  type SkaterRow,
  type SkaterStat,
} from "./season";

type SkaterRaw = {
  playerId: number;
  gamesPlayed?: number;
  goals?: number;
  assists?: number;
  points?: number;
  plusMinus?: number;
  penaltyMinutes?: number;
  shots?: number;
  shootingPctg?: number;
  avgTimeOnIcePerGame?: number;
};

type GoalieRaw = {
  playerId: number;
  gamesPlayed?: number;
  wins?: number;
  losses?: number;
  overtimeLosses?: number;
  goalsAgainstAverage?: number;
  savePercentage?: number;
  shotsAgainst?: number;
  saves?: number;
  goalsAgainst?: number;
  shutouts?: number;
};

type ClubStats = {
  skaters?: SkaterRaw[];
  goalies?: GoalieRaw[];
};

export type SeasonPage = {
  skaters: SkaterRow[];
  goalies: GoalieRow[];
};

const ttlMs = 20 * 60 * 1000;

let cache: { at: number; page: SeasonPage } | null = null;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loadSeason(): Promise<SeasonPage> {
  if (cache && Date.now() - cache.at < ttlMs) {
    return cache.page;
  }

  const finns = await loadFinns();
  const byId = new Map(finns.map((player) => [player.playerId, player]));
  const teams = [...new Set(finns.map((player) => player.team))];
  const clubs = new Map<string, ClubStats>();
  let pending = teams;

  for (let pass = 0; pass < 3 && pending.length > 0; pass++) {
    if (pass > 0) {
      await wait(1200);
    }

    const rows = await mapPool(pending, 2, async (team) => ({
      team,
      stats: await nhlJson<ClubStats>(`/v1/club-stats/${team}/now`, ttlMs),
    }));

    for (const row of rows) {
      clubs.set(row.team, row.stats);
    }

    const done = new Set(rows.map((row) => row.team));
    pending = pending.filter((team) => !done.has(team));
  }

  if (pending.length > 0) {
    throw new Error("club-stats");
  }

  const skaters = new Map<number, SkaterStat>();
  const goalies = new Map<number, GoalieStat>();

  for (const club of clubs.values()) {
    for (const raw of club.skaters ?? []) {
      const finn = byId.get(raw.playerId);
      if (!finn) {
        continue;
      }
      const next: SkaterStat = {
        playerId: raw.playerId,
        name: finn.name,
        lastName: finn.lastName,
        team: finn.team,
        games: raw.gamesPlayed ?? 0,
        goals: raw.goals ?? 0,
        assists: raw.assists ?? 0,
        points: raw.points ?? 0,
        plusMinus: raw.plusMinus ?? 0,
        pim: raw.penaltyMinutes ?? 0,
        shots: raw.shots ?? 0,
        shootingPct: raw.shootingPctg ?? 0,
        toiSeconds: raw.avgTimeOnIcePerGame ?? 0,
      };
      const previous = skaters.get(raw.playerId);
      if (!previous || next.games >= previous.games) {
        skaters.set(raw.playerId, next);
      }
    }

    for (const raw of club.goalies ?? []) {
      const finn = byId.get(raw.playerId);
      if (!finn) {
        continue;
      }
      const next: GoalieStat = {
        playerId: raw.playerId,
        name: finn.name,
        lastName: finn.lastName,
        team: finn.team,
        games: raw.gamesPlayed ?? 0,
        wins: raw.wins ?? 0,
        losses: raw.losses ?? 0,
        otLosses: raw.overtimeLosses ?? 0,
        gaa: raw.goalsAgainstAverage ?? 0,
        savePct: raw.savePercentage ?? 0,
        shotsAgainst: raw.shotsAgainst ?? 0,
        saves: raw.saves ?? 0,
        goalsAgainst: raw.goalsAgainst ?? 0,
        shutouts: raw.shutouts ?? 0,
      };
      const previous = goalies.get(raw.playerId);
      if (!previous || next.games >= previous.games) {
        goalies.set(raw.playerId, next);
      }
    }
  }

  const page = {
    skaters: buildSkaterRows([...skaters.values()].filter((player) => player.games > 0)),
    goalies: buildGoalieRows([...goalies.values()].filter((player) => player.games > 0)),
  };

  if (page.skaters.length === 0 && page.goalies.length === 0) {
    throw new Error("season");
  }

  cache = { at: Date.now(), page };
  return page;
}

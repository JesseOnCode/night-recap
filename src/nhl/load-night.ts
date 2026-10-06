import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { nhlJson } from "./client";
import { finnishHighlights, type RawGoal } from "./goals";
import { playedFinnIds } from "./finns";
import { buildTableRows, type NightPlayer, type TableRow } from "./stats";
import { selectSlateDate } from "./slate";
import type { GameState, RosterPlayer } from "./types";

type Named = { default?: string };

type NhlTeam = { abbrev: string; score?: number; name?: Named };

type NhlGoal = {
  playerId: number;
  period: number;
  timeInPeriod: string;
  teamAbbrev?: string;
  highlightClip?: number;
  highlightClipSharingUrl?: string;
  assists?: { playerId?: number; name?: Named }[];
  name?: Named;
  awayScore?: number;
  homeScore?: number;
};

type NhlGame = {
  id: number;
  gameState: GameState;
  awayTeam: NhlTeam;
  homeTeam: NhlTeam;
  periodDescriptor?: {
    number?: number;
    periodType?: string;
    maxRegulationPeriods?: number;
  };
  goals?: NhlGoal[];
};

type StandingRow = {
  teamAbbrev?: Named;
  teamName?: Named;
  wins?: number;
  losses?: number;
  otLosses?: number;
};

type ScorePayload = {
  currentDate: string;
  prevDate: string;
  games: NhlGame[];
};

type SidePlayer = {
  playerId: number;
  name?: Named;
  position?: string;
  goals?: number;
  assists?: number;
  points?: number;
  plusMinus?: number;
  pim?: number;
  sog?: number;
  hits?: number;
  blockedShots?: number;
  toi?: string;
  shifts?: number;
  giveaways?: number;
  takeaways?: number;
  powerPlayGoals?: number;
  faceoffWinningPctg?: number;
  saves?: number;
  savePctg?: number;
  goalsAgainst?: number;
  shotsAgainst?: number;
  evenStrengthShotsAgainst?: string;
  powerPlayShotsAgainst?: string;
  shorthandedShotsAgainst?: string;
  decision?: string;
  team: string;
};

type RosterEntry = RosterPlayer & {
  firstName?: Named;
  lastName?: Named;
};

type GoalCard = {
  playerId: number;
  name: string;
  team: string;
  period: number;
  time: string;
  kind: "goal" | "assist";
  assists: string[];
  scorerName: string;
  score: string;
  videoUrl: string | null;
  pageUrl: string | null;
};

type GameResult = {
  id: number;
  home: string;
  away: string;
  homeName: string;
  awayName: string;
  homeRecord: string | null;
  awayRecord: string | null;
  homeScore: number;
  awayScore: number;
  periods: string[];
  homePeriods: number[];
  awayPeriods: number[];
};

export type NightPage = {
  slateDate: string;
  updatedAt: string;
  gamesInProgress: boolean;
  players: TableRow[];
  results: GameResult[];
  goals: GoalCard[];
};

export const nightCacheVersion = 2;
const rosterTtlMs = 6 * 60 * 60 * 1000;
const liveTtlMs = 20_000;
const cacheFile = path.join(process.cwd(), ".cache", "night.json");

let memory: { at: number; version: number; page: NightPage } | null = null;
let diskRead: Promise<{ at: number; version: number; page: NightPage } | null> | null = null;
let pending: Promise<NightPage> | null = null;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function text(value: Named | undefined): string {
  return value?.default ?? "";
}

export function nightCacheUsable(
  stored: {
    at: number;
    version?: number;
    page: Pick<NightPage, "slateDate" | "gamesInProgress">;
  },
  now: number,
  latest: { currentDate: string; games: { gameState: string }[] },
  slateDate: string,
): boolean {
  if (stored.version !== nightCacheVersion) {
    return false;
  }
  if (stored.page.slateDate !== slateDate) {
    return false;
  }

  const unfinished =
    latest.currentDate === slateDate
      ? latest.games.some((game) => game.gameState !== "OFF")
      : stored.page.gamesInProgress;

  if (!unfinished) {
    return true;
  }

  return now - stored.at < liveTtlMs;
}

async function readDisk(): Promise<{
  at: number;
  version: number;
  page: NightPage;
} | null> {
  try {
    const parsed = JSON.parse(await readFile(cacheFile, "utf8")) as {
      at?: number;
      version?: number;
      page?: NightPage;
    };

    if (!parsed.page?.slateDate || !Array.isArray(parsed.page.players)) {
      return null;
    }

    return { at: parsed.at ?? 0, version: parsed.version ?? 0, page: parsed.page };
  } catch {
    return null;
  }
}

async function rememberDisk(): Promise<void> {
  if (memory) {
    return;
  }

  diskRead ??= readDisk();
  const stored = await diskRead;

  if (!memory && stored) {
    memory = stored;
  }
}

async function writeDisk(stored: {
  at: number;
  version: number;
  page: NightPage;
}): Promise<void> {
  await mkdir(path.dirname(cacheFile), { recursive: true });
  await writeFile(cacheFile, JSON.stringify(stored));
}

async function collect<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let left = items.map((item, index) => ({ item, index }));

  for (let pass = 0; pass < 3 && left.length > 0; pass++) {
    if (pass > 0) {
      await wait(1200);
    }

    const failed: typeof left = [];

    for (let index = 0; index < left.length; index += size) {
      const slice = left.slice(index, index + size);
      const part = await Promise.all(
        slice.map(async (entry) => {
          try {
            return {
              ok: true as const,
              index: entry.index,
              value: await fn(entry.item),
            };
          } catch {
            return { ok: false as const, entry };
          }
        }),
      );

      for (const row of part) {
        if (row.ok) {
          results[row.index] = row.value;
        } else {
          failed.push(row.entry);
        }
      }
    }

    left = failed;
  }

  if (left.length > 0) {
    throw new Error("night");
  }

  return results;
}

function teamTitle(team: NhlTeam, row: StandingRow | undefined): string {
  return text(row?.teamName) || text(team.name) || team.abbrev;
}

function teamRecord(row: StandingRow | undefined): string | null {
  if (
    row?.wins === undefined ||
    row.losses === undefined ||
    row.otLosses === undefined
  ) {
    return null;
  }

  return `(${row.wins} - ${row.losses} - ${row.otLosses})`;
}

function periodLabels(game: NhlGame): string[] {
  const regulation = game.periodDescriptor?.maxRegulationPeriods ?? 3;
  const played = Math.max(1, game.periodDescriptor?.number ?? regulation);
  const type = game.periodDescriptor?.periodType ?? "REG";
  const labels = Array.from(
    { length: Math.min(played, regulation) },
    (_, index) => String(index + 1),
  );

  if (type === "OT" || type === "SO" || played > regulation) {
    labels.push("JA");
  }

  if (type === "SO") {
    labels.push("RL");
  }

  return labels;
}

function goalsInPeriod(
  game: NhlGame,
  abbrev: string,
  label: string,
  index: number,
): number {
  const regulation = game.periodDescriptor?.maxRegulationPeriods ?? 3;
  const period =
    label === "JA" ? regulation + 1 : label === "RL" ? regulation + 2 : index + 1;

  return (game.goals ?? []).filter(
    (goal) => goal.teamAbbrev === abbrev && goal.period === period,
  ).length;
}

function gameLabel(team: string, away: NhlTeam, home: NhlTeam): string {
  const own = team === home.abbrev ? home : away;
  const other = team === home.abbrev ? away : home;
  return `${own.abbrev}–${other.abbrev}`;
}

function sidePlayers(
  side:
    | {
        forwards?: Omit<SidePlayer, "team">[];
        defense?: Omit<SidePlayer, "team">[];
        goalies?: Omit<SidePlayer, "team">[];
      }
    | undefined,
  team: string,
): SidePlayer[] {
  return [
    ...(side?.forwards ?? []),
    ...(side?.defense ?? []),
    ...(side?.goalies ?? []),
  ].map((player) => ({ ...player, team }));
}

async function buildNight(latest: ScorePayload): Promise<NightPage> {
  const slateDate = selectSlateDate(latest);
  const score =
    latest.currentDate === slateDate
      ? latest
      : await nhlJson<ScorePayload>(`/v1/score/${slateDate}`, 30_000);

  let standings: StandingRow[] = [];

  try {
    const table = await nhlJson<{ standings?: StandingRow[] }>(
      `/v1/standings/${slateDate}`,
      30_000,
    );
    standings = table.standings ?? [];
  } catch (error) {
    console.error(error);
  }

  const byAbbrev = new Map(
    standings.map((row) => [text(row.teamAbbrev), row]),
  );
  const started = score.games.filter((game) => game.gameState !== "FUT");
  const teams = [
    ...new Set(
      started.flatMap((game) => [game.awayTeam.abbrev, game.homeTeam.abbrev]),
    ),
  ];

  const [rosterLists, boxLists] = await Promise.all([
    collect(teams, 3, (team) =>
      nhlJson<{
        forwards?: RosterEntry[];
        defensemen?: RosterEntry[];
        goalies?: RosterEntry[];
      }>(`/v1/roster/${team}/current`, rosterTtlMs),
    ),
    collect(started, 2, async (game) => {
      const box = await nhlJson<{
        playerByGameStats?: {
          awayTeam?: {
            forwards?: Omit<SidePlayer, "team">[];
            defense?: Omit<SidePlayer, "team">[];
            goalies?: Omit<SidePlayer, "team">[];
          };
          homeTeam?: {
            forwards?: Omit<SidePlayer, "team">[];
            defense?: Omit<SidePlayer, "team">[];
            goalies?: Omit<SidePlayer, "team">[];
          };
        };
      }>(`/v1/gamecenter/${game.id}/boxscore`);

      return [
        ...sidePlayers(box.playerByGameStats?.awayTeam, game.awayTeam.abbrev),
        ...sidePlayers(box.playerByGameStats?.homeTeam, game.homeTeam.abbrev),
      ].map((player) => ({ player, game }));
    }),
  ]);

  const rosters = rosterLists.flatMap((roster) => [
    ...(roster.forwards ?? []),
    ...(roster.defensemen ?? []),
    ...(roster.goalies ?? []),
  ]);
  const entries = boxLists.flat();
  const finnIds = playedFinnIds(
    rosters,
    entries.map(({ player }) => ({
      playerId: player.playerId,
      position: player.position ?? "",
      toi: player.toi ?? "00:00",
    })),
  );
  const finnSet = new Set(finnIds);
  const byId = new Map(rosters.map((player) => [player.id, player]));

  const nightPlayers: NightPlayer[] = entries
    .filter(({ player }) => finnSet.has(player.playerId))
    .map(({ player, game }) => {
      const roster = byId.get(player.playerId);
      const goalie = player.position === "G";
      const fullName =
        `${text(roster?.firstName)} ${text(roster?.lastName)}`.trim();

      return {
        playerId: player.playerId,
        name: fullName || text(player.name),
        lastName: text(roster?.lastName) || text(player.name),
        team: player.team,
        game: gameLabel(player.team, game.awayTeam, game.homeTeam),
        position: player.position ?? "",
        goals: player.goals ?? 0,
        assists: player.assists ?? 0,
        points: player.points ?? 0,
        plusMinus: player.plusMinus ?? 0,
        pim: player.pim ?? 0,
        sog: player.sog ?? 0,
        hits: player.hits ?? 0,
        blockedShots: player.blockedShots ?? 0,
        toi: player.toi ?? "00:00",
        shifts: player.shifts ?? 0,
        giveaways: player.giveaways ?? 0,
        takeaways: player.takeaways ?? 0,
        powerPlayGoals: player.powerPlayGoals ?? 0,
        faceoffWinningPctg: player.faceoffWinningPctg ?? 0,
        saves: goalie ? (player.saves ?? 0) : null,
        savePctg: goalie ? (player.savePctg ?? null) : null,
        goalsAgainst: goalie ? (player.goalsAgainst ?? 0) : null,
        shotsAgainst: goalie ? (player.shotsAgainst ?? 0) : null,
        evenStrengthAgainst: goalie ? (player.evenStrengthShotsAgainst ?? null) : null,
        powerPlayAgainst: goalie ? (player.powerPlayShotsAgainst ?? null) : null,
        shorthandedAgainst: goalie ? (player.shorthandedShotsAgainst ?? null) : null,
        decision: goalie ? (player.decision ?? null) : null,
      };
    });

  const finnGames = new Map<number, (typeof score.games)[number]>();
  for (const { player, game } of entries) {
    if (finnSet.has(player.playerId)) {
      finnGames.set(game.id, game);
    }
  }

  const results = [...finnGames.values()].map((game) => {
    const homeRow = byAbbrev.get(game.homeTeam.abbrev);
    const awayRow = byAbbrev.get(game.awayTeam.abbrev);
    const periods = periodLabels(game);

    return {
      id: game.id,
      home: game.homeTeam.abbrev,
      away: game.awayTeam.abbrev,
      homeName: teamTitle(game.homeTeam, homeRow),
      awayName: teamTitle(game.awayTeam, awayRow),
      homeRecord: teamRecord(homeRow),
      awayRecord: teamRecord(awayRow),
      homeScore: game.homeTeam.score ?? 0,
      awayScore: game.awayTeam.score ?? 0,
      periods,
      homePeriods: periods.map((label, index) =>
        goalsInPeriod(game, game.homeTeam.abbrev, label, index),
      ),
      awayPeriods: periods.map((label, index) =>
        goalsInPeriod(game, game.awayTeam.abbrev, label, index),
      ),
    };
  });

  const rawGoals: RawGoal[] = score.games.flatMap((game) =>
    (game.goals ?? []).map((goal) => ({
      scorerId: goal.playerId,
      period: goal.period,
      time: goal.timeInPeriod,
      highlightClip: goal.highlightClip ?? null,
      sharingUrl: goal.highlightClipSharingUrl ?? null,
      assistIds: (goal.assists ?? [])
        .map((assist) => assist.playerId)
        .filter((id): id is number => typeof id === "number"),
    })),
  );

  const goalByKey = new Map(
    score.games.flatMap((game) =>
      (game.goals ?? []).map((goal) => [
        `${goal.playerId}-${goal.period}-${goal.timeInPeriod}`,
        { goal, game },
      ]),
    ),
  );

  const goals = finnishHighlights(finnIds, rawGoals).map((clip) => {
    const found = goalByKey.get(
      `${clip.scorerId}-${clip.period}-${clip.time}`,
    );
    const roster = byId.get(clip.playerId);

    return {
      playerId: clip.playerId,
      name: `${text(roster?.firstName)} ${text(roster?.lastName)}`.trim(),
      team: found?.goal.teamAbbrev ?? "",
      period: clip.period,
      time: clip.time,
      kind: clip.kind,
      assists:
        clip.kind === "goal"
          ? (found?.goal.assists ?? [])
              .map((assist) => text(assist.name))
              .filter((name) => name.length > 0)
          : [],
      scorerName: text(found?.goal.name),
      score: found
        ? `${found.game.awayTeam.abbrev}–${found.game.homeTeam.abbrev} ${found.goal.awayScore ?? 0}–${found.goal.homeScore ?? 0}`
        : "",
      videoUrl: clip.videoUrl,
      pageUrl: clip.pageUrl,
    };
  });

  return {
    slateDate: score.currentDate,
    updatedAt: new Date().toISOString(),
    gamesInProgress: score.games.some(
      (game) => game.gameState === "LIVE" || game.gameState === "CRIT",
    ),
    players: buildTableRows(nightPlayers),
    results,
    goals,
  };
}

async function refresh(slateDate: string, latest: ScorePayload): Promise<NightPage> {
  if (pending) {
    return pending;
  }

  pending = buildNight(latest)
    .then(async (page) => {
      memory = { at: Date.now(), version: nightCacheVersion, page };
      await writeDisk(memory);
      return page;
    })
    .catch((error: unknown) => {
      if (memory?.page.slateDate === slateDate) {
        return memory.page;
      }

      throw error;
    })
    .finally(() => {
      pending = null;
    });

  return pending;
}

export async function loadNight(): Promise<NightPage> {
  await rememberDisk();
  const latest = await nhlJson<ScorePayload>("/v1/score/now", 15_000);
  const slateDate = selectSlateDate(latest);

  if (memory && nightCacheUsable(memory, Date.now(), latest, slateDate)) {
    return memory.page;
  }

  return refresh(slateDate, latest);
}

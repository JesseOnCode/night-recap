import { finnishGoals, type RawGoal } from "@/src/nhl/goals";
import { playedFinnIds } from "@/src/nhl/finns";
import { buildTableRows, type NightPlayer } from "@/src/nhl/stats";
import { selectSlateDate } from "@/src/nhl/slate";
import type { GameState, RosterPlayer } from "@/src/nhl/types";

type Named = { default?: string };

type NhlTeam = { abbrev: string; score?: number };

type NhlGoal = {
  playerId: number;
  period: number;
  timeInPeriod: string;
  teamAbbrev?: string;
  highlightClip?: number;
  highlightClipSharingUrl?: string;
  assists?: { name?: Named }[];
  awayScore?: number;
  homeScore?: number;
};

type NhlGame = {
  id: number;
  gameState: GameState;
  awayTeam: NhlTeam;
  homeTeam: NhlTeam;
  goals?: NhlGoal[];
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
  decision?: string;
  team: string;
};

type RosterEntry = RosterPlayer & {
  firstName?: Named;
  lastName?: Named;
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function nhl<T>(path: string): Promise<T> {
  let url = path.startsWith("http") ? path : `https://api-web.nhle.com${path}`;

  for (let attempt = 0; attempt < 4; attempt++) {
    let response = await fetch(url, {
      cache: "no-store",
      redirect: "manual",
    });

    for (
      let hop = 0;
      hop < 3 && response.status >= 300 && response.status < 400;
      hop++
    ) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error(path);
      }
      url = new URL(location, url).href;
      response = await fetch(url, {
        cache: "no-store",
        redirect: "manual",
      });
    }

    if (response.status === 429 || response.status >= 500) {
      await wait(700 * (attempt + 1));
      continue;
    }

    if (!response.ok) {
      throw new Error(`${path} ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  throw new Error(path);
}

function text(value: Named | undefined): string {
  return value?.default ?? "";
}

function gameLabel(team: string, away: NhlTeam, home: NhlTeam): string {
  const own = team === home.abbrev ? home : away;
  const other = team === home.abbrev ? away : home;
  return `${own.abbrev}–${other.abbrev} ${own.score ?? 0}–${other.score ?? 0}`;
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

export async function GET() {
  try {
    const latest = await nhl<ScorePayload>("/v1/score/now");
    const slateDate = selectSlateDate(latest);
    const score =
      latest.currentDate === slateDate
        ? latest
        : await nhl<ScorePayload>(`/v1/score/${slateDate}`);

    const started = score.games.filter((game) => game.gameState !== "FUT");
    const teams = [
      ...new Set(
        started.flatMap((game) => [game.awayTeam.abbrev, game.homeTeam.abbrev]),
      ),
    ];

    const rosters = (
      await Promise.all(
        teams.map((team) =>
          nhl<{
            forwards?: RosterEntry[];
            defensemen?: RosterEntry[];
            goalies?: RosterEntry[];
          }>(`/v1/roster/${team}/current`),
        ),
      )
    ).flatMap((roster) => [
      ...(roster.forwards ?? []),
      ...(roster.defensemen ?? []),
      ...(roster.goalies ?? []),
    ]);

    const boxes = await Promise.all(
      started.map(async (game) => {
        const box = await nhl<{
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
    );

    const entries = boxes.flat();
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
          decision: goalie ? (player.decision ?? null) : null,
        };
      });

    const rawGoals: RawGoal[] = score.games.flatMap((game) =>
      (game.goals ?? []).map((goal) => ({
        scorerId: goal.playerId,
        period: goal.period,
        time: goal.timeInPeriod,
        highlightClip: goal.highlightClip ?? null,
        sharingUrl: goal.highlightClipSharingUrl ?? null,
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

    const goals = finnishGoals(finnIds, rawGoals).map((clip) => {
      const found = goalByKey.get(
        `${clip.playerId}-${clip.period}-${clip.time}`,
      );
      const roster = byId.get(clip.playerId);

      return {
        ...clip,
        name: `${text(roster?.firstName)} ${text(roster?.lastName)}`.trim(),
        team: found?.goal.teamAbbrev ?? "",
        assists: (found?.goal.assists ?? [])
          .map((assist) => text(assist.name))
          .filter((name) => name.length > 0),
        score: found
          ? `${found.game.awayTeam.abbrev}–${found.game.homeTeam.abbrev} ${found.goal.awayScore ?? 0}–${found.goal.homeScore ?? 0}`
          : "",
      };
    });

    return Response.json({
      slateDate: score.currentDate,
      updatedAt: new Date().toISOString(),
      gamesInProgress: score.games.some(
        (game) => game.gameState === "LIVE" || game.gameState === "CRIT",
      ),
      players: buildTableRows(nightPlayers),
      goals,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "NHL-tietoja ei saatu haettua." },
      { status: 502 },
    );
  }
}

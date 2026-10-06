import { mapPool, nhlJson } from "./client";

type Named = { default?: string };

type RosterPlayer = {
  id: number;
  firstName?: Named;
  lastName?: Named;
  birthCountry?: string;
};

type Roster = {
  forwards?: RosterPlayer[];
  defensemen?: RosterPlayer[];
  goalies?: RosterPlayer[];
};

export type Finn = {
  playerId: number;
  name: string;
  lastName: string;
  team: string;
};

const ttlMs = 20 * 60 * 1000;

let cache: { at: number; finns: Finn[] } | null = null;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function finnsByTeam(teams: string[]): Promise<Finn[]> {
  const found = new Map<string, Finn[]>();
  let pending = teams;

  for (let pass = 0; pass < 3 && pending.length > 0; pass++) {
    if (pass > 0) {
      await wait(1200);
    }

    const rows = await mapPool(pending, 2, async (team) => {
      const roster = await nhlJson<Roster>(`/v1/roster/${team}/current`, ttlMs);
      const players = [
        ...(roster.forwards ?? []),
        ...(roster.defensemen ?? []),
        ...(roster.goalies ?? []),
      ];

      return {
        team,
        players: players
          .filter((player) => player.birthCountry === "FIN")
          .map((player) => ({
            playerId: player.id,
            name: `${player.firstName?.default ?? ""} ${player.lastName?.default ?? ""}`.trim(),
            lastName: player.lastName?.default ?? "",
            team,
          })),
      };
    });

    for (const row of rows) {
      found.set(row.team, row.players);
    }

    const done = new Set(rows.map((row) => row.team));
    pending = pending.filter((team) => !done.has(team));
  }

  if (pending.length > 0) {
    throw new Error("rosters");
  }

  return [...found.values()].flat();
}

export async function loadFinns(): Promise<Finn[]> {
  if (cache && Date.now() - cache.at < ttlMs) {
    return cache.finns;
  }

  const table = await nhlJson<{ standings?: { teamAbbrev?: Named }[] }>(
    "/v1/standings/now",
    ttlMs,
  );
  const teams = [
    ...new Set(
      (table.standings ?? [])
        .map((row) => row.teamAbbrev?.default ?? "")
        .filter((abbrev) => abbrev.length > 0),
    ),
  ];

  if (teams.length === 0) {
    throw new Error("standings");
  }

  const finns = await finnsByTeam(teams);
  if (finns.length === 0) {
    throw new Error("finns");
  }

  cache = { at: Date.now(), finns };
  return finns;
}

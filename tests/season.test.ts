import { describe, expect, it } from "vitest";
import { buildGoalieRows, buildSkaterRows, type GoalieStat, type SkaterStat } from "../src/nhl/season";

const hintz: SkaterStat = {
  playerId: 1,
  name: "Roope Hintz",
  lastName: "Hintz",
  team: "DAL",
  games: 3,
  goals: 0,
  assists: 2,
  points: 2,
  plusMinus: 3,
  pim: 0,
  shots: 6,
  shootingPct: 0,
  toiSeconds: 751.6667,
};

const heiskanen: SkaterStat = {
  ...hintz,
  playerId: 2,
  name: "Miro Heiskanen",
  lastName: "Heiskanen",
  goals: 1,
  assists: 0,
  points: 1,
  plusMinus: -1,
  shots: 0,
  toiSeconds: 1200,
};

const goalie: GoalieStat = {
  playerId: 3,
  name: "Ukko-Pekka Luukkonen",
  lastName: "Luukkonen",
  team: "BUF",
  games: 2,
  wins: 1,
  losses: 1,
  otLosses: 0,
  gaa: 2.054795,
  savePct: 0.923077,
  shotsAgainst: 26,
  saves: 24,
  goalsAgainst: 2,
  shutouts: 0,
};

describe("buildSkaterRows", () => {
  it("järjestää pisteiden mukaan ja muotoilee rivin", () => {
    const rows = buildSkaterRows([heiskanen, hintz]);

    expect(rows.map((row) => row.player)).toEqual([
      "Roope Hintz, DAL",
      "Miro Heiskanen, DAL",
    ]);
    expect(rows[0].team).toBe("DAL");
    expect(rows[0].plusMinus).toBe("+3");
    expect(rows[0].toi).toBe("12:32");
    expect(rows[0].shooting).toBe("0,0");
    expect(rows[1].plusMinus).toBe("-1");
    expect(rows[1].shooting).toBe("–");
  });
});

describe("buildGoalieRows", () => {
  it("muotoilee torjuntaprosentin ja päästettyjen keskiarvon", () => {
    const [row] = buildGoalieRows([goalie]);

    expect(row.player).toBe("Ukko-Pekka Luukkonen, BUF");
    expect(row.team).toBe("BUF");
    expect(row.savePct).toBe("92,3");
    expect(row.gaa).toBe("2,05");
  });

  it("näyttää viivan, jos torjuntoja ei ole", () => {
    const [row] = buildGoalieRows([{ ...goalie, shotsAgainst: 0, savePct: 0 }]);

    expect(row.savePct).toBe("–");
  });
});

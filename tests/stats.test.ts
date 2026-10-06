import { describe, expect, it } from "vitest";
import { buildTableRows, type NightPlayer } from "../src/nhl/stats";

const hintz: NightPlayer = {
  playerId: 1,
  name: "Roope Hintz",
  lastName: "Hintz",
  team: "DAL",
  game: "DAL–SJS 5–0",
  position: "C",
  goals: 0,
  assists: 2,
  points: 2,
  plusMinus: 3,
  pim: 0,
  sog: 1,
  hits: 1,
  blockedShots: 0,
  toi: "15:31",
  shifts: 19,
  giveaways: 0,
  takeaways: 0,
  powerPlayGoals: 0,
  faceoffWinningPctg: 0.727273,
  saves: null,
  savePctg: null,
  goalsAgainst: null,
  shotsAgainst: null,
  evenStrengthAgainst: null,
  powerPlayAgainst: null,
  shorthandedAgainst: null,
  decision: null,
};

const goalie: NightPlayer = {
  playerId: 2,
  name: "Esimerkki Maalivahti",
  lastName: "Maalivahti",
  team: "DAL",
  game: "DAL–SJS 5–0",
  position: "G",
  goals: 0,
  assists: 0,
  points: 0,
  plusMinus: 0,
  pim: 0,
  sog: 0,
  hits: 0,
  blockedShots: 0,
  toi: "60:00",
  shifts: 0,
  giveaways: 0,
  takeaways: 0,
  powerPlayGoals: 0,
  faceoffWinningPctg: 0,
  saves: 21,
  savePctg: 1,
  goalsAgainst: 0,
  shotsAgainst: 21,
  evenStrengthAgainst: "18/18",
  powerPlayAgainst: "3/3",
  shorthandedAgainst: "0/0",
  decision: "W",
};

describe("buildTableRows", () => {
  it("järjestää Hintzin maalivahdin edelle ja muotoilee prosentit", () => {
    const rows = buildTableRows([goalie, hintz]);

    expect(rows[0].player).toBe("Roope Hintz, DAL");
    expect(rows[0].goalie).toBe(false);
    expect(rows[0].faceoffPct).toBe("72,7");
    expect(rows[0].saves).toBe("–");

    expect(rows[0].shotsAgainst).toBe("–");
    expect(rows[0].evenStrength).toBe("–");

    expect(rows[1].goals).toBe("–");
    expect(rows[1].goalie).toBe(true);
    expect(rows[1].savePct).toBe("100,0");
    expect(rows[1].shotsAgainst).toBe("21");
    expect(rows[1].evenStrength).toBe("18/18");
    expect(rows[1].powerPlayAgainst).toBe("3/3");
    expect(rows[1].shorthandedAgainst).toBe("0/0");
    expect(rows[1].pim).toBe("0");
  });
});
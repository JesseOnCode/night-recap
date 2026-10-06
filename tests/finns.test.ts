import { describe, expect, it } from "vitest";
import { playedFinnIds } from "../src/nhl/finns";

describe("playedFinnIds", () => {
  const roster = [
    { id: 1, birthCountry: "FIN" },
    { id: 2, birthCountry: "FIN" },
    { id: 3, birthCountry: "FIN" },
    { id: 4, birthCountry: "SWE" },
  ];

  it("ottaa mukaan pelanneet suomalaiset", () => {
    const ids = playedFinnIds(roster, [
      { playerId: 1, position: "C", toi: "12:04" },
      { playerId: 2, position: "G", toi: "60:00" },
    ]);

    expect(ids).toEqual([1, 2]);
  });

  it("jättää pois muut ja pelaamatta jääneet", () => {
    const ids = playedFinnIds(roster, [
      { playerId: 3, position: "G", toi: "00:00" },
      { playerId: 4, position: "C", toi: "18:11" },
    ]);

    expect(ids).toEqual([]);
  });
});
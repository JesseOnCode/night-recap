import { describe, expect, it } from "vitest";
import { columnValue, compareCells, nextSort, sortByColumn } from "../src/nhl/sort-table";

describe("nextSort", () => {
  it("avaa tilastosarakkeen suurimmasta pienimpään", () => {
    expect(nextSort(null, "goals")).toEqual({ key: "goals", dir: "desc" });
  });

  it("kääntää saman sarakkeen", () => {
    expect(nextSort({ key: "goals", dir: "desc" }, "goals")).toEqual({
      key: "goals",
      dir: "asc",
    });
  });

  it("avaa nimen aakkosjärjestyksessä", () => {
    expect(nextSort({ key: "goals", dir: "desc" }, "player")).toEqual({
      key: "player",
      dir: "asc",
    });
  });
});

describe("compareCells", () => {
  it("vertaa maaleja numeroina", () => {
    expect(compareCells("10", "3", "desc")).toBeLessThan(0);
    expect(compareCells("3", "10", "asc")).toBeLessThan(0);
  });

  it("vertaa plus-miinusta ja pilkkulukua", () => {
    expect(compareCells("+2", "-1", "desc")).toBeLessThan(0);
    expect(compareCells("92,3", "9,1", "desc")).toBeLessThan(0);
  });

  it("vertaa jääajan minuutteina", () => {
    expect(compareCells("22:01", "9:05", "desc")).toBeLessThan(0);
  });

  it("jättää viivan viimeiseksi", () => {
    expect(compareCells("–", "1", "desc")).toBeGreaterThan(0);
    expect(compareCells("–", "1", "asc")).toBeGreaterThan(0);
  });
});

describe("sortByColumn", () => {
  const rows = [
    { player: "Miro Heiskanen, DAL", goals: "1" },
    { player: "Roope Hintz, DAL", goals: "0" },
    { player: "Aatu Räty, BUF", goals: "1" },
  ];

  it("nostaa eniten maaleja tehneet ylös ja pitää tasatilanteen järjestyksen", () => {
    const sorted = sortByColumn(rows, (row) => row.goals, "desc");

    expect(sorted.map((row) => row.player)).toEqual([
      "Miro Heiskanen, DAL",
      "Aatu Räty, BUF",
      "Roope Hintz, DAL",
    ]);
  });

  it("järjestää sukunimen mukaan", () => {
    const sorted = sortByColumn(rows, (row) => columnValue(row, "player"), "asc");

    expect(sorted.map((row) => row.player)).toEqual([
      "Miro Heiskanen, DAL",
      "Roope Hintz, DAL",
      "Aatu Räty, BUF",
    ]);
  });
});

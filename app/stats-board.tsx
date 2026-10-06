"use client";

import { useState, type CSSProperties } from "react";
import type { GoalieRow, SkaterRow } from "@/src/nhl/season";
import { columnValue, nextSort, sortByColumn, type SortState } from "@/src/nhl/sort-table";
import { ColumnLegend } from "./column-legend";
import { SortHeader } from "./sort-header";
import { TeamLogo } from "./team-logo";

const skaterColumns: { key: keyof Omit<SkaterRow, "playerId" | "team">; label: string; meaning?: string }[] = [
  { key: "player", label: "Pelaaja" },
  { key: "games", label: "O", meaning: "ottelut" },
  { key: "goals", label: "M", meaning: "maalit" },
  { key: "assists", label: "S", meaning: "syötöt" },
  { key: "points", label: "P", meaning: "pisteet" },
  { key: "plusMinus", label: "+/−", meaning: "plus-miinus" },
  { key: "pim", label: "RM", meaning: "rangaistusminuutit" },
  { key: "shots", label: "Lauk", meaning: "laukaukset" },
  { key: "shooting", label: "L%", meaning: "laukaisuprosentti" },
  { key: "toi", label: "JA", meaning: "jääaika / ottelu" },
];

const goalieColumns: { key: keyof Omit<GoalieRow, "playerId" | "team">; label: string; meaning?: string }[] = [
  { key: "player", label: "Pelaaja" },
  { key: "games", label: "O", meaning: "ottelut" },
  { key: "wins", label: "V", meaning: "voitot" },
  { key: "losses", label: "H", meaning: "häviöt" },
  { key: "otLosses", label: "JH", meaning: "jatkoaikahäviöt" },
  { key: "gaa", label: "PMK", meaning: "päästettyjen keskiarvo" },
  { key: "savePct", label: "T%", meaning: "torjuntaprosentti" },
  { key: "saves", label: "Torj", meaning: "torjunnat" },
  { key: "goalsAgainst", label: "Pääst", meaning: "päästetyt maalit" },
  { key: "shutouts", label: "Nollat", meaning: "nollapelit" },
];

function useSorted<T extends { player: string }>(rows: T[], initial: SortState) {
  const [sort, setSort] = useState(initial);
  const sorted = sortByColumn(rows, (row) => columnValue(row, sort.key), sort.dir);

  return {
    sort,
    sorted,
    toggle: (key: string) => setSort((current) => nextSort(current, key)),
  };
}

function StatsTable<T extends { playerId: number; player: string; team: string }>({
  columns,
  rows,
  initial,
}: {
  columns: { key: keyof T & string; label: string; meaning?: string }[];
  rows: T[];
  initial: SortState;
}) {
  const { sort, sorted, toggle } = useSorted(rows, initial);

  return (
    <div className="table-scroll">
      <table
        className="stats"
        style={{ "--stat-cols": Math.ceil((columns.length - 1) / 2) } as CSSProperties}
      >
        <thead>
          <tr>
            {columns.map((column) => (
              <SortHeader
                key={column.key}
                label={column.label}
                meaning={column.meaning}
                active={sort.key === column.key}
                dir={sort.dir}
                onSort={() => toggle(column.key)}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((player) => (
            <tr key={player.playerId}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.key === "player" ? (
                    <span className="player-name">
                      <TeamLogo team={player.team} />
                      {player.player}
                    </span>
                  ) : (
                    <>
                      <span className="stat-label">{column.label}</span>
                      {String(player[column.key])}
                    </>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatsBoard({
  skaters,
  goalies,
}: {
  skaters: SkaterRow[];
  goalies: GoalieRow[];
}) {
  return (
    <>
      <section className="panel">
        <h2 className="section-title">Kenttäpelaajat</h2>
        <StatsTable columns={skaterColumns} rows={skaters} initial={{ key: "points", dir: "desc" }} />
        <ColumnLegend columns={skaterColumns} />
      </section>
      {goalies.length > 0 ? (
        <section className="panel">
          <h2 className="section-title">Maalivahdit</h2>
          <StatsTable columns={goalieColumns} rows={goalies} initial={{ key: "wins", dir: "desc" }} />
          <ColumnLegend columns={goalieColumns} />
        </section>
      ) : null}
    </>
  );
}

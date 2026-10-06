"use client";

import type { SortDir } from "@/src/nhl/sort-table";

export function SortHeader({
  label,
  meaning,
  active,
  dir,
  onSort,
}: {
  label: string;
  meaning?: string;
  active: boolean;
  dir: SortDir;
  onSort: () => void;
}) {
  const name = meaning ?? label.toLowerCase();

  return (
    <th aria-sort={active ? (dir === "desc" ? "descending" : "ascending") : "none"}>
      <button
        type="button"
        className="sort-button"
        aria-label={`Järjestä: ${name}`}
        onClick={onSort}
      >
        <span className="sort-label">{label}</span>
        <span className={active ? "sort-arrow" : "sort-arrow is-reserved"} aria-hidden="true">
          {dir === "desc" ? "↓" : "↑"}
        </span>
      </button>
    </th>
  );
}

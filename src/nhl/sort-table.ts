export type SortDir = "asc" | "desc";

export type SortState = {
  key: string;
  dir: SortDir;
};

const textFirst = new Set(["player", "game", "decision"]);

export function nextSort(current: SortState | null, key: string): SortState {
  if (current?.key === key) {
    return { key, dir: current.dir === "desc" ? "asc" : "desc" };
  }

  return { key, dir: textFirst.has(key) ? "asc" : "desc" };
}

export function lastNameKey(player: string): string {
  const name = player.split(",")[0]?.trim() ?? player;
  const parts = name.split(/\s+/).filter(Boolean);
  return parts.at(-1) ?? name;
}

export function columnValue(row: { player: string }, key: string): string {
  if (key === "player") {
    return lastNameKey(row.player);
  }

  const value = (row as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function rank(value: string): { kind: "empty" } | { kind: "num"; n: number } | { kind: "text"; t: string } {
  const text = value.trim();

  if (text === "" || text === "–" || text === "-") {
    return { kind: "empty" };
  }

  const time = text.match(/^(\d+):(\d{2})$/);
  if (time) {
    return { kind: "num", n: Number(time[1]) * 60 + Number(time[2]) };
  }

  const shots = text.match(/^(\d+)\/(\d+)$/);
  if (shots) {
    return { kind: "num", n: Number(shots[2]) };
  }

  if (/^[+-]?\d+(?:[.,]\d+)?$/.test(text)) {
    return { kind: "num", n: Number(text.replace(",", ".")) };
  }

  return { kind: "text", t: text };
}

export function compareCells(a: string, b: string, dir: SortDir): number {
  const left = rank(a);
  const right = rank(b);

  if (left.kind === "empty" && right.kind === "empty") {
    return 0;
  }

  if (left.kind === "empty") {
    return 1;
  }

  if (right.kind === "empty") {
    return -1;
  }

  if (left.kind === "num" && right.kind === "num") {
    const diff = left.n - right.n;
    return dir === "desc" ? -diff : diff;
  }

  const leftText = left.kind === "text" ? left.t : String(left.n);
  const rightText = right.kind === "text" ? right.t : String(right.n);
  const cmp = leftText.localeCompare(rightText, "fi");
  return dir === "desc" ? -cmp : cmp;
}

export function sortByColumn<T>(
  rows: readonly T[],
  value: (row: T) => string,
  dir: SortDir,
): T[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const cmp = compareCells(value(a.row), value(b.row), dir);
      return cmp !== 0 ? cmp : a.index - b.index;
    })
    .map((item) => item.row);
}

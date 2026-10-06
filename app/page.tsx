"use client";

import { useEffect, useState } from "react";
import type { TableRow } from "@/src/nhl/stats";

type GoalCard = {
  playerId: number;
  name: string;
  team: string;
  period: number;
  time: string;
  assists: string[];
  score: string;
  videoUrl: string | null;
  pageUrl: string | null;
};

type NightResponse = {
  slateDate: string;
  gamesInProgress: boolean;
  players: TableRow[];
  goals: GoalCard[];
};

const columns: { key: keyof Omit<TableRow, "playerId">; label: string }[] = [
  { key: "player", label: "Pelaaja" },
  { key: "game", label: "Ottelu" },
  { key: "goals", label: "M" },
  { key: "assists", label: "S" },
  { key: "points", label: "P" },
  { key: "plusMinus", label: "+/−" },
  { key: "pim", label: "RM" },
  { key: "shots", label: "Lauk" },
  { key: "hits", label: "Takl" },
  { key: "blocks", label: "Blok" },
  { key: "toi", label: "JA" },
  { key: "shifts", label: "Vaih" },
  { key: "giveaways", label: "Men" },
  { key: "takeaways", label: "Riis" },
  { key: "powerPlayGoals", label: "YV" },
  { key: "faceoffPct", label: "Al%" },
  { key: "saves", label: "Torj" },
  { key: "savePct", label: "Torj%" },
  { key: "goalsAgainst", label: "Pääst" },
  { key: "decision", label: "Ratk" },
];

function formatSlateDate(slateDate: string): string {
  return new Date(`${slateDate}T12:00:00`).toLocaleDateString("fi-FI", {
    timeZone: "Europe/Helsinki",
  });
}

export default function Home() {
  const [night, setNight] = useState<NightResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    let gamesInProgress = false;
    let failed = false;

    async function load() {
      try {
        const response = await fetch("api/night");
        const body = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          failed = true;
          setError(body.message ?? "NHL-tietoja ei saatu haettua.");
        } else {
          failed = false;
          gamesInProgress = body.gamesInProgress;
          setNight(body);
          setError(null);
        }
      } catch {
        failed = true;
        if (!cancelled) {
          setError("NHL-tietoja ei saatu haettua.");
        }
      }

      if (!cancelled) {
        const wait = failed ? 15_000 : gamesInProgress ? 60_000 : 600_000;
        timer = window.setTimeout(load, wait);
      }
    }

    load();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <main>
      <h1>Viime yö</h1>
      {night ? (
        <p>{formatSlateDate(night.slateDate)}</p>
      ) : (
        <p>Haetaan yön tietoja.</p>
      )}
      {error ? <p>{error}</p> : null}
      {night ? (
        <>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {night.players.map((player) => (
                  <tr key={player.playerId}>
                    {columns.map((column) => (
                      <td key={column.key}>{player[column.key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h2>Maalit</h2>
          {night.goals.length === 0 ? <p>Ei suomalaisia maaleja.</p> : null}
          {night.goals.map((goal) => (
            <article key={`${goal.playerId}-${goal.period}-${goal.time}`}>
              <h3>
                {goal.name}, {goal.team}
              </h3>
              <p>
                {goal.period}. erä {goal.time}
                {goal.score ? ` · ${goal.score}` : ""}
              </p>
              {goal.assists.length > 0 ? (
                <p>Syötöt: {goal.assists.join(", ")}</p>
              ) : null}
              {goal.videoUrl ? (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: "40rem",
                    aspectRatio: "16 / 9",
                  }}
                >
                  <iframe
                    src={goal.videoUrl}
                    title={`${goal.name}, ${goal.period}. erä`}
                    allow="encrypted-media; fullscreen"
                    allowFullScreen
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      border: 0,
                    }}
                  />
                </div>
              ) : null}
              {goal.pageUrl ? (
                <p>
                  <a href={goal.pageUrl}>Maali NHL:n sivulla</a>
                </p>
              ) : null}
            </article>
          ))}
        </>
      ) : null}
    </main>
  );
}

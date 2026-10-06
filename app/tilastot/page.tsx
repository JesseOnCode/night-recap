import { loadSeason } from "@/src/nhl/load-season";
import type { Metadata } from "next";
import { StatsBoard } from "../stats-board";

export const metadata: Metadata = {
  title: "Tilastot",
};

export default async function StatsPage() {
  let season: Awaited<ReturnType<typeof loadSeason>> | null = null;
  let failed = false;

  try {
    season = await loadSeason();
  } catch (error) {
    console.error(error);
    failed = true;
  }

  return (
    <main>
      <header className="page-head">
        <h1>Tilastot</h1>
        <p className="page-lead">Suomalaispelaajien kauden tilastot.</p>
      </header>
      {failed || !season ? (
        <p className="error">Kauden tilastoja ei saatu haettua.</p>
      ) : (
        <StatsBoard skaters={season.skaters} goalies={season.goalies} />
      )}
    </main>
  );
}

import { loadNight } from "@/src/nhl/load-night";
import { FinnishFlag } from "./finnish-flag";
import { NightBoard } from "./night-board";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const night = await loadNight();
    return <NightBoard initial={night} />;
  } catch (error) {
    console.error(error);
    return (
      <main>
        <header className="page-head">
          <h1>
            NHL:ssä viime yönä pelanneet suomalaiset
            <FinnishFlag />
          </h1>
          <p className="error">NHL-tietoja ei saatu haettua.</p>
        </header>
      </main>
    );
  }
}

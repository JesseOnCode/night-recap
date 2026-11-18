import { loadNews } from "@/src/nhl/load-news";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Uutiset",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("fi-FI", { timeZone: "Europe/Helsinki" });
}

export default async function NewsPage() {
  const cards = await loadNews();

  return (
    <main>
      <header className="page-head">
        <h1>Uutiset</h1>
        <p className="page-lead">Suomalaispelaajien NHL-uutiset.</p>
      </header>
      {cards.length === 0 ? <p className="slate-date">Ei uutisia juuri nyt.</p> : null}
      <div className="news-list">
        {cards.map((card) => (
          <article className="news-card" key={card.slug}>
            <img src={card.imageUrl} alt="" />
            <h2>{card.headline}</h2>
            <p className="news-meta">
              {card.player}, {card.team}
              {card.published ? ` · ${formatDate(card.published)}` : ""}
            </p>
            {card.summary ? <p className="news-summary">{card.summary}</p> : null}
            <a href={card.pageUrl}>Juttu NHL:n sivulla</a>
          </article>
        ))}
      </div>
    </main>
  );
}

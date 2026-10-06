import { loadNews } from "@/src/nhl/load-news";
import Link from "next/link";

const shown = 12;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("fi-FI", { timeZone: "Europe/Helsinki" });
}

export async function NewsTicker() {
  let headlines: { slug: string; headline: string; pageUrl: string; published: string }[] = [];

  try {
    const cards = await loadNews();
    headlines = cards.slice(0, shown);
  } catch (error) {
    console.error(error);
  }

  if (headlines.length === 0) {
    return null;
  }

  const loop = [headlines, headlines];

  return (
    <div className="news-ticker">
      <Link href="/uutiset" className="news-ticker-label">
        Uutiset
      </Link>
      <div className="news-ticker-window" aria-label="Uusimmat uutiset">
      <div className="news-ticker-track">
        {loop.map((group, groupIndex) => (
          <div
            className="news-ticker-group"
            key={groupIndex}
            aria-hidden={groupIndex === 1 ? true : undefined}
          >
            {group.map((card) => {
              const date = formatDate(card.published);

              return (
              <span className="news-ticker-item" key={`${groupIndex}-${card.slug}`}>
                <a href={card.pageUrl}>
                  {card.headline}
                  {date ? <span className="news-ticker-date">{date}</span> : null}
                </a>
                <span className="news-ticker-dot" aria-hidden="true">
                  ·
                </span>
              </span>
              );
            })}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

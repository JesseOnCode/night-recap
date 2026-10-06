"use client";

import { Fragment, useEffect, useState } from "react";
import type { TableRow } from "@/src/nhl/stats";
import { columnValue, nextSort, sortByColumn, type SortState } from "@/src/nhl/sort-table";
import { ColumnLegend } from "./column-legend";
import { SortHeader } from "./sort-header";
import { FinnishFlag } from "./finnish-flag";
import { TeamLogo } from "./team-logo";

type GoalCard = {
  playerId: number;
  name: string;
  team: string;
  period: number;
  time: string;
  kind: "goal" | "assist";
  assists: string[];
  scorerName: string;
  score: string;
  videoUrl: string | null;
  pageUrl: string | null;
};

type GameResult = {
  id: number;
  home: string;
  away: string;
  homeName: string;
  awayName: string;
  homeRecord: string | null;
  awayRecord: string | null;
  homeScore: number;
  awayScore: number;
  periods: string[];
  homePeriods: number[];
  awayPeriods: number[];
};

type NightResponse = {
  slateDate: string;
  gamesInProgress: boolean;
  players: TableRow[];
  results: GameResult[];
  goals: GoalCard[];
};

type NightColumn = {
  key: keyof Omit<TableRow, "playerId" | "team" | "goalie">;
  label: string;
  meaning?: string;
};

const skaterColumns: NightColumn[] = [
  { key: "player", label: "Pelaaja" },
  { key: "game", label: "Ottelu" },
  { key: "goals", label: "M", meaning: "maalit" },
  { key: "assists", label: "S", meaning: "syötöt" },
  { key: "points", label: "P", meaning: "pisteet" },
  { key: "plusMinus", label: "+/−", meaning: "plus-miinus" },
  { key: "pim", label: "RM", meaning: "rangaistusminuutit" },
  { key: "shots", label: "Lauk", meaning: "laukaukset" },
  { key: "hits", label: "Takl", meaning: "taklaukset" },
  { key: "blocks", label: "Blok", meaning: "blokit" },
  { key: "toi", label: "JA", meaning: "jääaika" },
  { key: "shifts", label: "Vaih", meaning: "vaihdot" },
  { key: "giveaways", label: "Men", meaning: "menetykset" },
  { key: "takeaways", label: "Riis", meaning: "riistot" },
  { key: "powerPlayGoals", label: "YV", meaning: "ylivoimamaalit" },
  { key: "faceoffPct", label: "Al%", meaning: "aloitusprosentti" },
];

const goalieColumns: NightColumn[] = [
  { key: "player", label: "Pelaaja" },
  { key: "game", label: "Ottelu" },
  { key: "toi", label: "JA", meaning: "jääaika" },
  { key: "shotsAgainst", label: "LV", meaning: "laukaukset vastaan" },
  { key: "saves", label: "Torj", meaning: "torjunnat" },
  { key: "savePct", label: "Torj%", meaning: "torjuntaprosentti" },
  { key: "goalsAgainst", label: "Pääst", meaning: "päästetyt maalit" },
  { key: "evenStrength", label: "TK", meaning: "tasakentälliset, torjunnat/laukaukset" },
  { key: "powerPlayAgainst", label: "YV", meaning: "ylivoimalla vastaan, torjunnat/laukaukset" },
  { key: "shorthandedAgainst", label: "AV", meaning: "alivoimalla vastaan, torjunnat/laukaukset" },
  { key: "pim", label: "RM", meaning: "rangaistusminuutit" },
  { key: "decision", label: "Ratk", meaning: "ratkaisu (W, L, O)" },
];

function Matchup({ game }: { game: string }) {
  const [own, other] = game.split("–");

  return (
    <span className="matchup">
      <TeamLogo team={own ?? ""} label />
      <span className="vs">vs</span>
      <TeamLogo team={other ?? ""} label />
    </span>
  );
}

function ScoreSide({
  team,
  name,
  record,
  side,
}: {
  team: string;
  name: string;
  record: string | null;
  side: "home" | "away";
}) {
  return (
    <div className={`scorebug-side scorebug-${side}`}>
      <div className="scorebug-logo">
        <TeamLogo team={team} label />
      </div>
      <div className="scorebug-meta">
        <span className="scorebug-name">{name}</span>
        {record ? <span className="scorebug-record">{record}</span> : null}
      </div>
    </div>
  );
}

function ScoreLine({ game }: { game: GameResult }) {
  return (
    <article className="scorecard">
      <div className="scorebug">
        <ScoreSide
          team={game.home}
          name={game.homeName}
          record={game.homeRecord}
          side="home"
        />
        <div className="scorebug-score">
          <span className="scorebug-num">{game.homeScore}</span>
          <span className="scorebug-dash">–</span>
          <span className="scorebug-num">{game.awayScore}</span>
        </div>
        <ScoreSide
          team={game.away}
          name={game.awayName}
          record={game.awayRecord}
          side="away"
        />
      </div>
      <table className="linescore">
        <thead>
          <tr>
            <th>Joukkue</th>
            {game.periods.map((period) => (
              <th key={period}>{period}</th>
            ))}
            <th>YHT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{game.homeName}</td>
            {game.homePeriods.map((goals, index) => (
              <td key={game.periods[index]}>{goals}</td>
            ))}
            <td>{game.homeScore}</td>
          </tr>
          <tr>
            <td>{game.awayName}</td>
            {game.awayPeriods.map((goals, index) => (
              <td key={game.periods[index]}>{goals}</td>
            ))}
            <td>{game.awayScore}</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}

function formatSlateDate(slateDate: string): string {
  return new Date(`${slateDate}T12:00:00`).toLocaleDateString("fi-FI", {
    timeZone: "Europe/Helsinki",
  });
}

function clipId(clip: NightResponse["goals"][number]): string {
  return `${clip.kind}-${clip.period}-${clip.time}`;
}

function clipLine(clip: NightResponse["goals"][number]): string {
  const parts = [
    clip.kind === "assist" ? "Syöttö" : "Maali",
    `${clip.period}. erä ${clip.time}`,
  ];

  if (clip.score) {
    parts.push(clip.score);
  }

  if (clip.kind === "assist" && clip.scorerName) {
    parts.push(clip.scorerName);
  } else if (clip.kind === "goal" && clip.assists.length > 0) {
    parts.push(clip.assists.join(", "));
  }

  return parts.join(" · ");
}

function ClipRow({
  colSpan,
  group,
  selected,
  onSelect,
}: {
  colSpan: number;
  group: {
    playerId: number;
    clips: NightResponse["goals"];
  };
  selected: NightResponse["goals"][number] | null;
  onSelect: (id: string) => void;
}) {
  return (
    <tr className="clip-row">
      <td colSpan={colSpan}>
        <div className="clips" id={`pisteet-${group.playerId}`}>
          <div className="clip-list">
            {group.clips.map((clip) => {
              const id = clipId(clip);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={selected ? clipId(selected) === id : false}
                  onClick={() => onSelect(id)}
                >
                  {clipLine(clip)}
                </button>
              );
            })}
          </div>
          {selected?.videoUrl ? (
            <div className="video">
              <iframe
                src={selected.videoUrl}
                title={`${selected.name}, ${selected.period}. erä`}
                allow="encrypted-media; fullscreen"
                allowFullScreen
              />
            </div>
          ) : null}
          {selected?.pageUrl ? (
            <p>
              <a href={selected.pageUrl}>NHL:n sivu</a>
            </p>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function PlayerRow({
  columns,
  player,
  open,
  onGoal,
}: {
  columns: NightColumn[];
  player: TableRow;
  open?: boolean;
  onGoal?: () => void;
}) {
  return (
    <tr>
      {columns.map((column) => (
        <td key={column.key}>
          {column.key === "player" ? (
            <span className="player-name">
              <TeamLogo team={player.team} />
              {onGoal ? (
                <button
                  type="button"
                  className={open ? "player-goal is-open" : "player-goal"}
                  aria-expanded={open}
                  onClick={onGoal}
                >
                  <span className="player-label">{player.player}</span>
                  <span className="watch-hint">
                    <span className="watch-label">Katso</span>
                    <svg className="watch-play" viewBox="0 0 24 24" aria-hidden="true">
                      <circle
                        cx="12"
                        cy="12"
                        r="10.25"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path d="M10 8 L16.4 12 L10 16 Z" fill="currentColor" />
                    </svg>
                  </span>
                </button>
              ) : (
                <span className="player-label">{player.player}</span>
              )}
            </span>
          ) : column.key === "game" ? (
            <Matchup game={player.game} />
          ) : (
            player[column.key]
          )}
        </td>
      ))}
    </tr>
  );
}

function NightTable({
  columns,
  players,
  openPlayer,
  openGroup,
  selected,
  withVideo,
  onOpen,
  onSelect,
  initialSort,
}: {
  columns: NightColumn[];
  players: TableRow[];
  openPlayer: number | null;
  openGroup: { playerId: number; clips: NightResponse["goals"] } | null;
  selected: NightResponse["goals"][number] | null;
  withVideo: Set<number>;
  onOpen: (playerId: number) => void;
  onSelect: (id: string) => void;
  initialSort: SortState | null;
}) {
  const [sort, setSort] = useState(initialSort);
  const rows = sort
    ? sortByColumn(players, (player) => columnValue(player, sort.key), sort.dir)
    : players;

  return (
    <div className="table-scroll night">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <SortHeader
                key={column.key}
                label={column.label}
                meaning={column.meaning}
                active={sort?.key === column.key}
                dir={sort?.dir ?? "desc"}
                onSort={() => setSort((current) => nextSort(current, column.key))}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((player) => (
            <Fragment key={player.playerId}>
              <PlayerRow
                columns={columns}
                player={player}
                open={openPlayer === player.playerId}
                onGoal={
                  withVideo.has(player.playerId)
                    ? () => onOpen(player.playerId)
                    : undefined
                }
              />
              {openGroup?.playerId === player.playerId ? (
                <ClipRow
                  colSpan={columns.length}
                  group={openGroup}
                  selected={selected}
                  onSelect={onSelect}
                />
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NightBoard({ initial }: { initial: NightResponse }) {
  const [night, setNight] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [openPlayer, setOpenPlayer] = useState<number | null>(null);
  const [clipKey, setClipKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    let gamesInProgress = initial.gamesInProgress;
    let failed = false;

    async function load() {
      try {
        const response = await fetch("api/night");
        const body = (await response.json()) as NightResponse & { message?: string };

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
        const wait = failed ? 15_000 : gamesInProgress ? 20_000 : 600_000;
        timer = window.setTimeout(load, wait);
      }
    }

    load();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [initial.gamesInProgress]);

  const groups: {
    playerId: number;
    name: string;
    team: string;
    clips: NightResponse["goals"];
  }[] = [];

  for (const goal of night.goals) {
    const group = groups.find((item) => item.playerId === goal.playerId);
    if (group) {
      group.clips.push(goal);
    } else {
      groups.push({
        playerId: goal.playerId,
        name: goal.name,
        team: goal.team,
        clips: [goal],
      });
    }
  }

  const withVideo = new Set(
    groups
      .filter((group) => group.clips.some((clip) => clip.videoUrl))
      .map((group) => group.playerId),
  );

  function showPlayer(playerId: number) {
    if (openPlayer === playerId) {
      setOpenPlayer(null);
      return;
    }

    const group = groups.find((item) => item.playerId === playerId);
    const first = group?.clips.find((clip) => clip.videoUrl) ?? group?.clips[0];
    setOpenPlayer(playerId);
    setClipKey(first ? clipId(first) : null);
    requestAnimationFrame(() => {
      document.getElementById(`pisteet-${playerId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }

  const openGroup = groups.find((item) => item.playerId === openPlayer) ?? null;
  const selected =
    openGroup?.clips.find((clip) => clipId(clip) === clipKey) ??
    openGroup?.clips.find((clip) => clip.videoUrl) ??
    null;

  return (
    <main>
      <header className="page-head">
        <div className="page-title-row">
          <h1>
            NHL:ssä viime yönä pelanneet suomalaiset
            <FinnishFlag />
          </h1>
          <p className="slate-date">{formatSlateDate(night.slateDate)}</p>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </header>
      <div className="layout">
        <div className="night-tables">
          <section className="panel">
            <h2 className="section-title">Kenttäpelaajat</h2>
            <NightTable
              columns={skaterColumns}
              players={night.players.filter((player) => !player.goalie)}
              openPlayer={openPlayer}
              openGroup={openGroup}
              selected={selected}
              withVideo={withVideo}
              onOpen={showPlayer}
              onSelect={setClipKey}
              initialSort={{ key: "points", dir: "desc" }}
            />
            <ColumnLegend columns={skaterColumns} />
          </section>
          {night.players.some((player) => player.goalie) ? (
            <section className="panel">
              <h2 className="section-title">Maalivahdit</h2>
              <NightTable
                columns={goalieColumns}
                players={night.players.filter((player) => player.goalie)}
                openPlayer={openPlayer}
                openGroup={openGroup}
                selected={selected}
                withVideo={withVideo}
                onOpen={showPlayer}
                onSelect={setClipKey}
                initialSort={null}
              />
              <ColumnLegend columns={goalieColumns} />
            </section>
          ) : null}
        </div>
        <section className="results">
          <div className="results-head">
            <h2>Lopputulokset</h2>
            <p className="page-lead">Peleistä, joissa on pelannut suomalaisia pelaajia.</p>
          </div>
          {night.results.map((game) => (
            <ScoreLine key={game.id} game={game} />
          ))}
        </section>
      </div>
    </main>
  );
}

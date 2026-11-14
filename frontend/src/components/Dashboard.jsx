import { useMemo, useState } from "react";
import { IconArrowLeft, IconDatabase } from "@tabler/icons-react";
import { TEXT } from "../config/texts.js";
import { SPECIALTY_GROUPS, getCategory } from "../config/placeTypes.js";
import { useDashboard } from "../services/analytics.js";
import { CategoryIcon, GroupIcon } from "./MedIcon.jsx";
import "./Dashboard.css";

// =============================================================
//  DEMAND DASHBOARD ("Statistici în timp real")
//  Data: /api/analytics/dashboard (real clicks stored in Tiger Data).
//  Channel colours: one fixed hue per channel, checked for colour-blind
//  readers; every chart also has a legend or labels, plus a table view.
// =============================================================
export const CHANNELS = [
  { id: "call", color: "#2a78d6" },
  { id: "whatsapp", color: "#1baf7a" },
  { id: "email", color: "#eb6834" },
];
const RANGES = [1, 7, 30];
const TZ = "Europe/Bucharest";
const nf = new Intl.NumberFormat("ro-RO");

// Local (Timișoara) date key, e.g. "2026-11-14"
const dayKey = (ms) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(ms));

export default function Dashboard({ places, onBack, onOpenPlace }) {
  const [days, setDays] = useState(7);
  const { loading, data, error } = useDashboard(days);

  return (
    <div className="stats">
      <header className="stats-hero">
        <div className="stats-hero-inner">
          <button type="button" className="stats-back" onClick={onBack}>
            <IconArrowLeft size={18} stroke={1.8} aria-hidden="true" /> {TEXT.statsBack}
          </button>
          <h1>{TEXT.statsTitle}</h1>
          <p>{TEXT.statsSubtitle}</p>
          <div className="stats-controls">
            <div className="stats-range" role="group" aria-label={TEXT.statsTime}>
              {RANGES.map((r) => (
                <button key={r} type="button" className={r === days ? "active" : ""} onClick={() => setDays(r)}>
                  {TEXT.statsRange[r]}
                </button>
              ))}
            </div>
            {data && (
              <span className={"stats-source " + data.source}>
                <IconDatabase size={14} stroke={1.8} aria-hidden="true" />
                {TEXT.dataTiger}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="stats-body">
        {!data && loading && <p className="stats-msg">{TEXT.statsLoading}</p>}
        {!data && error === "no-api" && <p className="stats-msg">{TEXT.statsNoApi}</p>}
        {!data && error === "off" && <p className="stats-msg">{TEXT.statsOff}</p>}
        {!data && error === "failed" && <p className="stats-msg">{TEXT.statsError}</p>}
        {data && <DashboardContent data={data} places={places} onOpenPlace={onOpenPlace} />}
      </main>
    </div>
  );
}

function DashboardContent({ data, places, onOpenPlace }) {
  const byCode = useMemo(() => Object.fromEntries(places.map((p) => [p.id, p])), [places]);
  const total = CHANNELS.reduce((sum, c) => sum + data.totals[c.id], 0);
  const previous = CHANNELS.reduce((sum, c) => sum + data.previous[c.id], 0);
  const trend = data.hasPrevious && previous ? Math.round(((total - previous) / previous) * 100) : null;

  const views = data.views ?? { total: 0, byPlace: {} };
  const favs = data.favorites; // null when the accounts database isn't connected

  // Visits and favourites: shown even before the first contact
  const popularity = (
    <div className="stats-grid">
      <section className="stats-card">
        <h2>{TEXT.statsViewed}</h2>
        <p className="stats-caption">{TEXT.statsViewedNote(views.total)}</p>
        {views.total > 0 ? (
          <TopPlaces byPlace={views.byPlace} byCode={byCode} onOpenPlace={onOpenPlace} />
        ) : (
          <p className="stats-storage">{TEXT.statsNone}</p>
        )}
      </section>
      <section className="stats-card">
        <h2>{TEXT.statsFavorites}</h2>
        {favs == null ? (
          <p className="stats-storage">{TEXT.statsFavoritesOff}</p>
        ) : (
          <>
            <p className="stats-caption">{TEXT.statsFavoritesNote(favs.total)}</p>
            {favs.total > 0 ? (
              <TopPlaces byPlace={favs.byPlace} byCode={byCode} onOpenPlace={onOpenPlace} />
            ) : (
              <p className="stats-storage">{TEXT.statsNone}</p>
            )}
          </>
        )}
      </section>
    </div>
  );

  if (total === 0) {
    return (
      <>
        <p className="stats-note">{TEXT.statsEmpty}</p>
        {popularity}
      </>
    );
  }

  return (
    <>
      {/* ---------- Headline numbers ---------- */}
      <section className="stats-kpis">
        <div className="kpi main">
          <span className="kpi-label">{TEXT.statsTotal}</span>
          <span className="kpi-value">{nf.format(total)}</span>
          <span className="kpi-trend">{trend != null ? TEXT.statsVsPrevious(trend) : TEXT.statsNoTrend}</span>
        </div>
        {CHANNELS.map((c) => (
          <div key={c.id} className="kpi">
            <span className="kpi-label">
              <i className="swatch" style={{ background: c.color }} />
              {TEXT.statsChannels[c.id]}
            </span>
            <span className="kpi-value">{nf.format(data.totals[c.id])}</span>
            <span className="kpi-trend">{total ? Math.round((data.totals[c.id] / total) * 100) : 0}%</span>
          </div>
        ))}
      </section>

      <section className="stats-card wide">
        <h2>{TEXT.statsTimeline}</h2>
        <Timeline data={data} />
      </section>

      <section className="stats-card wide">
        <h2>{TEXT.statsHeat}</h2>
        <Heatmap heat={data.heat} />
      </section>

      {popularity}

      <div className="stats-grid">
        <section className="stats-card">
          <h2>{TEXT.statsTopPlaces}</h2>
          <TopPlaces byPlace={data.byPlace} byCode={byCode} onOpenPlace={onOpenPlace} />
        </section>
        <section className="stats-card">
          <h2>{TEXT.statsDomains}</h2>
          <Domains byPlace={data.byPlace} places={places} />
        </section>
      </div>

      <div className="stats-grid">
        <section className="stats-card">
          <h2>{TEXT.statsRecent}</h2>
          <Recent recent={data.recent} byCode={byCode} now={data.generatedAt} />
        </section>
        {data.storage && (
          <section className="stats-card">
            <h2>{TEXT.statsStorage}</h2>
            <p className="stats-storage">
              {TEXT.statsStorageText(data.storage.chunks, data.storage.compressedChunks, data.storage.savedPercent)}
            </p>
          </section>
        )}
      </div>
    </>
  );
}

// ---------- Stacked bars per hour/day, with hover tooltip and table ----------
function Timeline({ data }) {
  const [hover, setHover] = useState(null);

  // One slot per hour (24 h) or per day, including empty ones
  const slots = useMemo(() => {
    const HOUR = 3600 * 1000;
    const now = data.generatedAt;
    const list = [];
    if (data.step === "hour") {
      const byHour = new Map(data.timeline.map((s) => [Math.floor(s.t / HOUR), s]));
      for (let i = 23; i >= 0; i--) {
        const h = Math.floor(now / HOUR) - i;
        list.push({ t: h * HOUR, ...(byHour.get(h) ?? { call: 0, whatsapp: 0, email: 0 }) });
      }
    } else {
      const byDay = new Map(data.timeline.map((s) => [dayKey(s.t + 6 * HOUR), s]));
      for (let i = data.days - 1; i >= 0; i--) {
        const t = now - i * 24 * HOUR;
        list.push({ t, ...(byDay.get(dayKey(t)) ?? { call: 0, whatsapp: 0, email: 0 }) });
      }
    }
    return list.map((s) => ({ ...s, total: s.call + s.whatsapp + s.email }));
  }, [data]);

  const max = Math.max(1, ...slots.map((s) => s.total));
  const label = (t) =>
    data.step === "hour"
      ? new Intl.DateTimeFormat("ro-RO", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(t))
      : new Intl.DateTimeFormat("ro-RO", { timeZone: TZ, weekday: "short", day: "numeric" }).format(new Date(t));
  const every = Math.ceil(slots.length / 8); // ~8 axis labels

  return (
    <>
      <Legend />
      <div className="tl" onMouseLeave={() => setHover(null)}>
        {slots.map((s, i) => (
          <div key={s.t} className="tl-slot" onMouseEnter={() => setHover(i)}>
            <div className="tl-stack" style={{ height: `${(s.total / max) * 100}%` }}>
              {CHANNELS.map((c) =>
                s[c.id] > 0 ? (
                  <span key={c.id} style={{ flexGrow: s[c.id], background: c.color }} />
                ) : null
              )}
            </div>
            <span className="tl-label">{i % every === 0 ? label(s.t) : ""}</span>
            {hover === i && (
              <div className={"tip" + (i > slots.length / 2 ? " left" : "")} role="tooltip">
                <strong>{label(s.t)}</strong>
                {CHANNELS.map((c) => (
                  <span key={c.id}>
                    <i className="swatch" style={{ background: c.color }} />
                    {TEXT.statsChannels[c.id]}: {nf.format(s[c.id])}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <details className="stats-table">
        <summary>{TEXT.statsTable}</summary>
        <table>
          <thead>
            <tr>
              <th>{TEXT.statsTime}</th>
              {CHANNELS.map((c) => (
                <th key={c.id}>{TEXT.statsChannels[c.id]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((s) => (
              <tr key={s.t}>
                <td>{label(s.t)}</td>
                {CHANNELS.map((c) => (
                  <td key={c.id}>{nf.format(s[c.id])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}

function Legend() {
  return (
    <div className="legend">
      {CHANNELS.map((c) => (
        <span key={c.id}>
          <i className="swatch" style={{ background: c.color }} />
          {TEXT.statsChannels[c.id]}
        </span>
      ))}
    </div>
  );
}

// ---------- Day x hour heatmap (one green hue, light -> dark) ----------
const HEAT_STEPS = ["#f1f5f2", "#d3e6dc", "#a6cdb9", "#6fae91", "#3a8a69", "#1d6b4e", "#0f4c3a"];

function Heatmap({ heat }) {
  const max = Math.max(1, ...heat.flat());
  let peak = { d: 0, h: 0, v: -1 };
  heat.forEach((row, d) => row.forEach((v, h) => v > peak.v && (peak = { d, h, v })));
  const step = (v) => (v === 0 ? "#fbfaf7" : HEAT_STEPS[Math.min(HEAT_STEPS.length - 1, Math.floor((v / max) * HEAT_STEPS.length))]);

  return (
    <>
      <p className="stats-caption">{TEXT.statsHeatPeak(TEXT.days[peak.d], peak.h)}</p>
      <div className="heat">
        <span />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h} className="heat-hour">
            {h % 3 === 0 ? h : ""}
          </span>
        ))}
        {heat.map((row, d) => (
          <Row key={d} label={TEXT.daysShort[d]} row={row} color={step} day={TEXT.days[d]} />
        ))}
      </div>
      <div className="heat-scale" aria-hidden="true">
        <span>0</span>
        {HEAT_STEPS.map((c) => (
          <i key={c} style={{ background: c }} />
        ))}
        <span>{nf.format(max)}</span>
      </div>
    </>
  );
}

function Row({ label, row, color, day }) {
  return (
    <>
      <span className="heat-day">{label}</span>
      {row.map((v, h) => (
        <span key={h} className="heat-cell" style={{ background: color(v) }} title={`${day}, ${h}:00 · ${nf.format(v)}`} />
      ))}
    </>
  );
}

// ---------- Horizontal bar lists ----------
function BarList({ items }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ol className="bars">
      {items.map((item) => (
        <li key={item.key}>
          <button type="button" className="bars-row" onClick={item.onClick} disabled={!item.onClick}>
            <span className="bars-icon" style={{ color: item.color }}>
              {item.icon}
            </span>
            <span className="bars-text">
              <span className="bars-name">{item.label}</span>
              <span className="bars-track">
                <span style={{ width: `${(item.value / max) * 100}%` }} />
              </span>
            </span>
            <span className="bars-value">{nf.format(item.value)}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function TopPlaces({ byPlace, byCode, onOpenPlace }) {
  const items = Object.entries(byPlace)
    .filter(([code]) => byCode[code])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([code, value]) => {
      const place = byCode[code];
      const category = getCategory(place.category);
      return {
        key: code,
        label: place.name,
        value,
        color: category.color,
        icon: <CategoryIcon id={category.id} size={18} />,
        onClick: () => onOpenPlace(place),
      };
    });
  return <BarList items={items} />;
}

function Domains({ byPlace, places }) {
  const items = SPECIALTY_GROUPS.map((g) => {
    const value = places
      .filter((p) => p.specialties.some((s) => g.items.includes(s)))
      .reduce((sum, p) => sum + (byPlace[p.id] ?? 0), 0);
    return { key: g.id, label: g.label, value, color: g.color, icon: <GroupIcon id={g.id} size={18} /> };
  }).sort((a, b) => b.value - a.value);
  return <BarList items={items} />;
}

// ---------- Latest clicks ----------
function Recent({ recent, byCode, now }) {
  return (
    <ul className="recent">
      {recent.map((e, i) => {
        const place = byCode[e.placeCode];
        const channel = CHANNELS.find((c) => c.id === e.kind);
        return (
          <li key={`${e.t}-${i}`}>
            <i className="swatch" style={{ background: channel?.color }} />
            <span className="recent-what">
              {TEXT.statsChannels[e.kind]} · {place?.name ?? e.placeCode}
            </span>
            <span className="recent-when">{TEXT.statsAgo(Math.floor((now - e.t) / 60000))}</span>
          </li>
        );
      })}
    </ul>
  );
}

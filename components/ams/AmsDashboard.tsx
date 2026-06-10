"use client";

import Image from "next/image";
import { type CSSProperties, useEffect, useState } from "react";
import {
  type AmsSection,
  dataSources,
  integrationCards,
  metricDefinitions,
  navItems,
  players,
  sampleGpsRows,
} from "@/lib/ams/content";
import { compactNumber, type GpsDailyRow, loadJson, numberValue } from "@/lib/ams/data";

type CleanGpsRow = GpsDailyRow & {
  amsId?: string;
  cleanPlayerName?: string;
  sourcePlayerName?: string;
  totalDistance?: string;
  hsrAbsDistance?: string;
  hsrRelDistance?: string;
  sprintDistance?: string;
  sprintCount?: string;
  maxSpeedKmh?: string;
  rollupSourceTask?: string;
  isMatch?: string;
};

type InjuryRow = {
  injuryId?: string;
  amsId?: string;
  playerName?: string;
  injuryType?: string;
  injury?: string;
  bodyRegion?: string;
  cause?: string;
  startDate?: string;
  endDate?: string;
  totalDaysLost?: number;
};

type BodyCompRow = {
  playerName?: string;
  category?: string;
  testDate?: string;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  muscleKg?: number;
  adiposeKg?: number;
  skinfold6?: number;
};

type FmsAssessmentRow = {
  assessmentId?: string;
  amsId?: string;
  matchedAthleteName?: string;
  dateIso?: string;
  totalScore?: number;
  scoreBand?: string;
  riskFlag?: string;
  primaryFinding1?: string;
  primaryFinding2?: string;
};

type YBalanceAssessmentRow = {
  assessmentId?: string;
  amsId?: string;
  matchedAthleteName?: string;
  dateIso?: string;
  testType?: string;
  compositeScore?: number;
  riskFlag?: string;
};

type LoadSummary = {
  rows: CleanGpsRow[];
  totalDistance: number;
  highIntensity: number;
  maxSpeed: number;
  sessions: number;
  status: string;
};

type SourceData = {
  injuries: InjuryRow[];
  bodyComp: BodyCompRow[];
  fms: FmsAssessmentRow[];
  yBalance: YBalanceAssessmentRow[];
  status: string;
};

const sectionMap: Record<AmsSection, string> = Object.fromEntries(
  navItems.map((item) => [item.id, item.label]),
) as Record<AmsSection, string>;

export default function AmsDashboard() {
  const [activeSection, setActiveSection] = useState<AmsSection>("overview");
  const [selectedPlayerId, setSelectedPlayerId] = useState("gustavo-ferrareis");
  const [loadSummary, setLoadSummary] = useState<LoadSummary>({
    rows: [],
    totalDistance: 0,
    highIntensity: 0,
    maxSpeed: 0,
    sessions: 0,
    status: "Loading WIMU/GPS feed...",
  });
  const [sourceData, setSourceData] = useState<SourceData>({
    injuries: [],
    bodyComp: [],
    fms: [],
    yBalance: [],
    status: "Loading clean AMS modules...",
  });

  const selectedPlayer = players.find((player) => player.id === selectedPlayerId) ?? players[0];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        let rows = await loadJson<CleanGpsRow>("/ams/data/clean/gps/gps_player_daily_current_roster.json");
        let sourceLabel = "current-roster WIMU/GPS daily records";

        if (!rows.length) {
          rows = sampleGpsRows;
          sourceLabel = "sample WIMU/GPS records";
        }

        if (cancelled) return;

        const totalDistance = rows.reduce(
          (total, row) => total + numberValue(row.totalDistance ?? row.total_distance_m),
          0,
        );
        const highIntensity = rows.reduce(
          (total, row) =>
            total +
            numberValue(row.high_intensity_m ?? row.highIntensityDistance ?? row.hsrAbsDistance),
          0,
        );
        const maxSpeed = rows.reduce(
          (peak, row) => Math.max(peak, numberValue(row.maxSpeedKmh ?? row.max_speed_kmh ?? row.maxSpeed)),
          0,
        );

        setLoadSummary({
          rows,
          totalDistance,
          highIntensity,
          maxSpeed,
          sessions: rows.length,
          status: `Loaded ${compactNumber(rows.length)} ${sourceLabel}.`,
        });
      } catch (error) {
        const rows: CleanGpsRow[] = sampleGpsRows;
        const totalDistance = rows.reduce(
          (total, row) => total + numberValue(row.total_distance_m ?? row.totalDistance),
          0,
        );
        const highIntensity = rows.reduce(
          (total, row) => total + numberValue(row.high_intensity_m ?? row.highIntensityDistance),
          0,
        );
        const maxSpeed = rows.reduce(
          (peak, row) => Math.max(peak, numberValue(row.max_speed_kmh ?? row.maxSpeed)),
          0,
        );

        setLoadSummary((current) => ({
          ...current,
          rows,
          totalDistance,
          highIntensity,
          maxSpeed,
          sessions: rows.length,
          status:
            error instanceof Error
              ? `Using sample WIMU/GPS records. Data feed unavailable: ${error.message}`
              : "Using sample WIMU/GPS records.",
        }));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadModules() {
      const [injuries, bodyComp, fms, yBalance] = await Promise.all([
        loadJson<InjuryRow>("/ams/data/clean/injuries/injury_history_clean.json").catch(() => []),
        loadJson<BodyCompRow>("/ams/data/clean/body_comp/body_comp_clean.json").catch(() => []),
        loadJson<FmsAssessmentRow>("/ams/data/clean/tests/fms_assessments_clean.json").catch(() => []),
        loadJson<YBalanceAssessmentRow>("/ams/data/clean/tests/y_balance_assessments_clean.json").catch(() => []),
      ]);

      if (cancelled) return;

      setSourceData({
        injuries,
        bodyComp,
        fms,
        yBalance,
        status: `Loaded ${compactNumber(injuries.length + bodyComp.length + fms.length + yBalance.length)} clean module records.`,
      });
    }

    loadModules();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="ams-app">
      <AppHeader activeLabel={sectionMap[activeSection]} onOpenCalendar={() => setActiveSection("calendar")} />
      <div className="ams-shell">
        <Sidebar activeSection={activeSection} onSelect={setActiveSection} />
        <section className="ams-stage">
          <PlayerStrip selectedPlayerId={selectedPlayerId} onSelect={setSelectedPlayerId} />
          {activeSection === "overview" && (
            <OverviewPanel
              loadSummary={loadSummary}
              sourceData={sourceData}
              selectedPlayer={selectedPlayer}
              onSelectSection={setActiveSection}
            />
          )}
          {activeSection === "load" && <LoadPanel loadSummary={loadSummary} />}
          {activeSection === "injury" && <InjuryPanel injuries={sourceData.injuries} />}
          {activeSection === "development" && (
            <DevelopmentPanel fms={sourceData.fms} yBalance={sourceData.yBalance} />
          )}
          {activeSection === "bodyComp" && <BodyCompositionPanel rows={sourceData.bodyComp} />}
          {activeSection === "recovery" && <RecoveryPanel />}
          {activeSection === "biography" && <BiographyPanel selectedPlayer={selectedPlayer} />}
          {activeSection === "external" && <ExternalFactorsPanel />}
          {activeSection === "calendar" && <CalendarPanel />}
          {activeSection === "resources" && <ResourcesPanel />}
          {activeSection === "settings" && <SettingsPanel />}
        </section>
      </div>
    </main>
  );
}

function AppHeader({
  activeLabel,
  onOpenCalendar,
}: {
  activeLabel: string;
  onOpenCalendar: () => void;
}) {
  return (
    <header className="ams-header">
      <div className="ams-brand">
        <Image
          src="/ams/assets/hp-ams-logo.svg"
          alt="Hache Performance"
          width={48}
          height={48}
          priority
        />
        <div>
          <p>Atlas FC Performance Operations</p>
          <h1>Athlete Monitoring System</h1>
        </div>
      </div>
      <div className="ams-header-actions">
        <span>{activeLabel}</span>
        <button type="button" onClick={onOpenCalendar} aria-label="Open calendar">
          <Image src="/ams/assets/calendar-clock.png" alt="" width={22} height={22} />
        </button>
        <button type="button">Export CSV</button>
      </div>
    </header>
  );
}

function Sidebar({
  activeSection,
  onSelect,
}: {
  activeSection: AmsSection;
  onSelect: (section: AmsSection) => void;
}) {
  return (
    <nav className="ams-sidebar" aria-label="AMS sections">
      {navItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className={item.id === activeSection ? "is-active" : ""}
          onClick={() => onSelect(item.id)}
        >
          <small>{item.eyebrow}</small>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

function PlayerStrip({
  selectedPlayerId,
  onSelect,
}: {
  selectedPlayerId: string;
  onSelect: (playerId: string) => void;
}) {
  const carouselPlayers = [...players, ...players];

  return (
    <section className="player-strip" aria-label="Players currently in view">
      <div className="player-strip-track">
        {carouselPlayers.map((player, index) => (
          <button
            key={`${player.id}-${index}`}
            type="button"
            className={player.id === selectedPlayerId ? "player-pill is-active" : "player-pill"}
            onClick={() => onSelect(player.id)}
            tabIndex={index >= players.length ? -1 : 0}
            aria-hidden={index >= players.length}
          >
            <span className="player-photo">
              <Image src={player.photo} alt="" width={72} height={72} />
            </span>
            <span>
              <strong>{player.name}</strong>
              <small>
                #{player.number} · {player.position}
              </small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function OverviewPanel({
  loadSummary,
  sourceData,
  selectedPlayer,
  onSelectSection,
}: {
  loadSummary: LoadSummary;
  sourceData: SourceData;
  selectedPlayer: (typeof players)[number];
  onSelectSection: (section: AmsSection) => void;
}) {
  return (
    <div className="panel-stack">
      <section className="hero-panel">
        <div>
          <span className="section-kicker">Private Performance Assistant</span>
          <h2>How can H help you?</h2>
          <p>
            RAG-ready command center for daily load, medical risk, development testing,
            recovery, biography, and off-field context.
          </p>
          <div className="assistant-row">
            <input readOnly value={`Show ${selectedPlayer.name}'s hamstring RTP risk this week.`} />
            <button type="button">Stage Query</button>
          </div>
        </div>
        <article>
          <span>Current roster</span>
          <strong>{players.length}</strong>
          <small>Players in first-pass migration</small>
        </article>
      </section>

      <section className="quick-grid">
        <QuickCard label="Load Demand" value={`${compactNumber(loadSummary.sessions)} records`} onClick={() => onSelectSection("load")} />
        <QuickCard label="Injury History" value={`${compactNumber(sourceData.injuries.length)} injuries`} onClick={() => onSelectSection("injury")} />
        <QuickCard label="Physical Development" value={`${compactNumber(sourceData.fms.length + sourceData.yBalance.length)} tests`} onClick={() => onSelectSection("development")} />
        <QuickCard label="Calendar" value="RTP planning" onClick={() => onSelectSection("calendar")} />
      </section>

      <section className="integration-grid">
        {integrationCards.map((item) => (
          <article key={item.label}>
            <Image src={item.asset} alt="" width={42} height={42} />
            <div>
              <strong>{item.label}</strong>
              <span>{item.status}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function QuickCard({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button type="button" className="quick-card" onClick={onClick}>
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}

function LoadPanel({ loadSummary }: { loadSummary: LoadSummary }) {
  const recentRows = [...loadSummary.rows]
    .filter((row) => row.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(-10);

  return (
    <div className="panel-stack">
      <PanelIntro
        kicker="WIMU/GPS Physical Load"
        title="Load Demand"
        copy="Daily physical movement and workload metrics from the cleaned WIMU/GPS feed."
      />
      <section className="metric-grid">
        <MetricCard label="Total Distance" value={`${compactNumber(loadSummary.totalDistance)} m`} detail={`${compactNumber(loadSummary.sessions)} sessions`} />
        <MetricCard label="High Intensity" value={`${compactNumber(loadSummary.highIntensity)} m`} detail="Absolute + relative exposure" />
        <MetricCard label="Max Speed" value={`${compactNumber(loadSummary.maxSpeed, 1)} km/h`} detail="Peak recorded value" />
        <MetricCard label="Data Status" value={loadSummary.status} detail="Served from public/ams/data" />
      </section>
      <section className="chart-panel">
        <div className="panel-heading">
          <h3>Recent Load Trend</h3>
          <span>Last 10 rows from GPS daily feed</span>
        </div>
        <div className="bar-chart">
          {recentRows.map((row, index) => {
            const distance = numberValue(row.totalDistance ?? row.total_distance_m);
            const height = Math.max(8, Math.min(100, distance / 120));
            return (
              <div key={`${row.date}-${index}`} style={{ "--bar-height": `${height}%` } as CSSProperties}>
                <span />
                <small>{row.date?.slice(5) || index + 1}</small>
              </div>
            );
          })}
        </div>
      </section>
      <section className="definition-grid">
        {metricDefinitions.map(([label, copy, unit]) => (
          <article key={label}>
            <strong>{label}</strong>
            <p>{copy}</p>
            <span>{unit}</span>
          </article>
        ))}
      </section>
    </div>
  );
}

function InjuryPanel({ injuries }: { injuries: InjuryRow[] }) {
  const totalDaysLost = injuries.reduce((total, injury) => total + numberValue(injury.totalDaysLost), 0);
  const latestInjuries = [...injuries]
    .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)))
    .slice(0, 8);
  const topRegion = mostCommon(injuries.map((injury) => injury.bodyRegion).filter(Boolean));

  return (
    <div className="panel-stack">
      <PanelIntro
        kicker="Medical"
        title="Injury History"
        copy="Cleaned injury history rendered from the same source files used by the static prototype."
      />
      <section className="metric-grid">
        <MetricCard label="Injury events" value={compactNumber(injuries.length)} detail="Clean injury records" />
        <MetricCard label="Days lost" value={compactNumber(totalDaysLost)} detail="Total unavailable days" />
        <MetricCard label="Top region" value={topRegion || "Pending"} detail="Most frequent body region" />
        <MetricCard label="Latest record" value={latestInjuries[0]?.startDate || "No data"} detail={latestInjuries[0]?.playerName || "Waiting for source"} />
      </section>
      <DataList
        title="Latest Injury Records"
        subtitle="Recent cleaned medical events"
        rows={latestInjuries.map((injury) => [
          injury.playerName || "Unknown player",
          injury.injuryType || "Unclassified",
          injury.bodyRegion || "No region",
          injury.startDate || "No date",
        ])}
      />
    </div>
  );
}

function DevelopmentPanel({
  fms,
  yBalance,
}: {
  fms: FmsAssessmentRow[];
  yBalance: YBalanceAssessmentRow[];
}) {
  const latestFms = [...fms].sort((a, b) => String(b.dateIso).localeCompare(String(a.dateIso))).slice(0, 6);

  return (
    <div className="panel-stack">
      <PanelIntro
        kicker="Physical Development"
        title="VALD Testing Battery"
        copy="Next-native rendering for FMS, Y Balance, VALD/NordBord, and future ForceFrame panels."
      />
      <section className="metric-grid">
        <MetricCard label="FMS assessments" value={compactNumber(fms.length)} detail="Movement screen records" />
        <MetricCard label="Y Balance tests" value={compactNumber(yBalance.length)} detail="Reach and asymmetry records" />
        <MetricCard label="Latest FMS score" value={String(latestFms[0]?.totalScore ?? "No data")} detail={latestFms[0]?.matchedAthleteName || "Waiting for source"} />
        <MetricCard label="Source status" value="Clean JSON" detail="/ams/data/clean/tests" />
      </section>
      <section className="testing-grid">
        <TestingCard image="/ams/assets/testing/vald-logo.png" title="VALD Devices" copy="Mapped NordBord tests and profile IDs." />
        <TestingCard image="/ams/assets/testing/nordbord-logo.png" title="NordBord" copy="Force, impulse, asymmetry, and time-to-peak views." />
        <TestingCard image="/ams/assets/testing/fms-logo.jpeg" title="FMS" copy="Movement score cards and component images." />
        <TestingCard image="/ams/assets/testing/ybt-logo.svg" title="Y Balance Test" copy="Composite reach scores and asymmetry flags." />
      </section>
      <DataList
        title="Latest FMS Assessments"
        subtitle="Cleaned movement screen results"
        rows={latestFms.map((row) => [
          row.matchedAthleteName || "Unknown player",
          row.dateIso || "No date",
          String(row.totalScore ?? "No score"),
          row.scoreBand || row.riskFlag || "No flag",
        ])}
      />
    </div>
  );
}

function BodyCompositionPanel({ rows }: { rows: BodyCompRow[] }) {
  const latestRows = [...rows]
    .sort((a, b) => String(b.testDate).localeCompare(String(a.testDate)))
    .slice(0, 8);
  const avgWeight = average(rows.map((row) => row.weightKg));
  const avgMuscle = average(rows.map((row) => row.muscleKg));
  const avgSkinfold = average(rows.map((row) => row.skinfold6));

  return (
    <div className="panel-stack">
      <PanelIntro
        kicker="ISAK / Body Composition"
        title="Body Composition Dashboard"
        copy="Anthropometry and composition records loaded from the cleaned body composition source."
      />
      <section className="metric-grid">
        <MetricCard label="Records" value={compactNumber(rows.length)} detail="Clean body comp rows" />
        <MetricCard label="Avg weight" value={`${compactNumber(avgWeight, 1)} kg`} detail="Across loaded records" />
        <MetricCard label="Avg muscle" value={`${compactNumber(avgMuscle, 1)} kg`} detail="Muscle mass estimate" />
        <MetricCard label="Avg 6-site skinfold" value={`${compactNumber(avgSkinfold, 1)} mm`} detail="ISAK skinfold sum" />
      </section>
      <DataList
        title="Latest Body Composition Records"
        subtitle="Most recent test dates"
        rows={latestRows.map((row) => [
          row.playerName || "Unknown player",
          row.category || "No group",
          row.testDate || "No date",
          `${compactNumber(numberValue(row.weightKg), 1)} kg`,
        ])}
      />
    </div>
  );
}

function RecoveryPanel() {
  return (
    <SectionPlaceholder
      kicker="Recovery"
      title="Recovery Services"
      copy="Cleaned rehab-services data has been moved into the Next public data tree and can now be rendered as a proper panel."
      items={["Daily services", "Monthly summary", "Player usage", "Sync audit"]}
    />
  );
}

function BiographyPanel({ selectedPlayer }: { selectedPlayer: (typeof players)[number] }) {
  return (
    <div className="profile-layout">
      <section className="profile-hero">
        <Image src={selectedPlayer.photo} alt="" width={260} height={260} />
        <div>
          <span className="section-kicker">Player Biography</span>
          <h2>{selectedPlayer.name}</h2>
          <p>
            #{selectedPlayer.number} · {selectedPlayer.position} · {selectedPlayer.nationality}
          </p>
        </div>
      </section>
      <section className="profile-details-grid">
        <MetricCard label="AMS ID" value={selectedPlayer.amsId} detail="Primary app identity" />
        <MetricCard label="Age" value={selectedPlayer.age} detail="Profile data" />
        <MetricCard label="Height / Weight" value={`${selectedPlayer.height} / ${selectedPlayer.weight}`} detail="Biography source" />
        <MetricCard label="Preferred foot" value={selectedPlayer.foot} detail="Pending source merge where needed" />
      </section>
    </div>
  );
}

function ExternalFactorsPanel() {
  return (
    <SectionPlaceholder
      kicker="External Context"
      title="External Factors"
      copy="Holding area for match context, travel, off-field availability, and future Opta/PlayerData integrations."
      items={["Match context", "Travel", "Availability", "Off-field notes"]}
    />
  );
}

function CalendarPanel() {
  return (
    <SectionPlaceholder
      kicker="Planning"
      title="Schedule / Calendar"
      copy="The standalone calendar used localStorage for RTP and planning events; this panel is ready to become a typed React calendar."
      items={["Event editor", "RTP timeline", "Month detail", "Local storage migration"]}
    />
  );
}

function ResourcesPanel() {
  return (
    <SectionPlaceholder
      kicker="Library"
      title="Resources"
      copy="Resources, PDFs, folders, and links should move from localStorage into an authenticated backend in the next pass."
      items={["Folders", "PDF preview", "Links", "File metadata"]}
    />
  );
}

function SettingsPanel() {
  return (
    <div className="panel-stack">
      <PanelIntro
        kicker="Identity Map"
        title="Player Registry"
        copy="Source registry for API, CSV, WIMU/GPS, VALD, and manual data sync."
      />
      <section className="source-table">
        {dataSources.map((source) => (
          <div key={source.path}>
            <strong>{source.label}</strong>
            <code>{source.path}</code>
          </div>
        ))}
      </section>
    </div>
  );
}

function DataList({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: string[][];
}) {
  return (
    <section className="data-list">
      <div className="panel-heading">
        <h3>{title}</h3>
        <span>{subtitle}</span>
      </div>
      <div>
        {rows.length ? (
          rows.map((row, index) => (
            <article key={`${row.join("-")}-${index}`}>
              {row.map((cell, cellIndex) => (
                <span key={`${cell}-${cellIndex}`}>{cell}</span>
              ))}
            </article>
          ))
        ) : (
          <article>
            <span>No records loaded yet</span>
          </article>
        )}
      </div>
    </section>
  );
}

function PanelIntro({ kicker, title, copy }: { kicker: string; title: string; copy: string }) {
  return (
    <section className="panel-intro">
      <span className="section-kicker">{kicker}</span>
      <h2>{title}</h2>
      <p>{copy}</p>
    </section>
  );
}

function average(values: unknown[]) {
  const numericValues = values.map(numberValue).filter((value) => Number.isFinite(value) && value > 0);
  if (!numericValues.length) return 0;
  return numericValues.reduce((total, value) => total + value, 0) / numericValues.length;
}

function mostCommon(values: unknown[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => {
    const key = String(value || "").trim();
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function TestingCard({ image, title, copy }: { image: string; title: string; copy: string }) {
  return (
    <article className="testing-card">
      <Image src={image} alt="" width={72} height={72} />
      <strong>{title}</strong>
      <p>{copy}</p>
    </article>
  );
}

function SectionPlaceholder({
  kicker,
  title,
  copy,
  items,
}: {
  kicker: string;
  title: string;
  copy: string;
  items: string[];
}) {
  return (
    <div className="panel-stack">
      <PanelIntro kicker={kicker} title={title} copy={copy} />
      <section className="placeholder-grid">
        {items.map((item) => (
          <article key={item}>
            <span>{item}</span>
            <strong>Ready for component extraction</strong>
          </article>
        ))}
      </section>
    </div>
  );
}

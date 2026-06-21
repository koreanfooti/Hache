import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";
import { compactNumber, numberValue } from "@/lib/ams/data";
import { injuryGoogleSheetHtmlUrl } from "@/lib/ams/sources/injury-config";
import type { InjuryRow } from "@/lib/ams/types";
import {
  MetricCard,
  localizedValue,
  type AmsLanguage,
} from "@/components/ams/ui/AmsUi";
import type { DataPanelCopy } from "@/components/ams/panels/panelTypes";

type InjuryCauseFilter = "all" | "direct" | "indirect";

type InjuryMapDot = {
  bodyRegion?: string;
  count: number;
  days: number;
  key: string;
  laterality?: string;
  mapX: number;
  mapY: number;
};

const gustavoFerrareisTestPlayer = "Gustavo Ferrareis";

export function InjuryPanel({
  copy,
  language,
  injuries,
}: {
  copy: DataPanelCopy;
  language: AmsLanguage;
  injuries: InjuryRow[];
}) {
  const [selectedPlayer, setSelectedPlayer] = useState(gustavoFerrareisTestPlayer);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedCause, setSelectedCause] = useState<InjuryCauseFilter>("all");
  const allLabel = copy.injury.all ?? "All";
  const playerOptions = useMemo(
    () => {
      const injuryPlayers = unique(injuries.map((injury) => injury.playerName).filter(Boolean));
      const orderedPlayers = injuryPlayers.includes(gustavoFerrareisTestPlayer)
        ? injuryPlayers
        : [gustavoFerrareisTestPlayer, ...injuryPlayers];

      return ["all", ...orderedPlayers];
    },
    [injuries],
  );
  const typeOptions = useMemo(
    () => ["all", ...unique(injuries.map((injury) => injury.injuryType).filter(Boolean))],
    [injuries],
  );
  const yearOptions = useMemo(
    () => [
      "all",
      ...unique(injuries.map((injury) => String(injury.startDate || "").slice(0, 4)).filter((year) => year.length === 4))
        .sort((a, b) => b.localeCompare(a)),
    ],
    [injuries],
  );
  const filteredInjuries = useMemo(
    () => injuries
      .filter((injury) => {
        const year = String(injury.startDate || "").slice(0, 4);
        return (selectedPlayer === "all" || injury.playerName === selectedPlayer)
          && (selectedType === "all" || injury.injuryType === selectedType)
          && (selectedYear === "all" || year === selectedYear)
          && (selectedCause === "all" || injuryCauseKind(injury.cause) === selectedCause);
      })
      .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate))),
    [injuries, selectedCause, selectedPlayer, selectedType, selectedYear],
  );
  const totalDaysLost = filteredInjuries.reduce((total, injury) => total + numberValue(injury.totalDaysLost), 0);
  const topRegion = mostCommon(filteredInjuries.map((injury) => injury.bodyRegion).filter(Boolean));
  const latestInjury = filteredInjuries[0];
  const injuryDots = useMemo(() => buildInjuryMapDots(filteredInjuries), [filteredInjuries]);

  return (
    <div className="panel-stack injury-history-panel">
      <section className="injury-history-hero">
        <div>
          <span className="section-kicker">{copy.injury.sourceKicker ?? copy.injury.kicker}</span>
          <h2>{copy.injury.title}</h2>
          <p>{copy.injury.copy}</p>
        </div>
        <a className="source-open-button" href={injuryGoogleSheetHtmlUrl} target="_blank" rel="noopener noreferrer">
          {copy.injury.openSource ?? "Open Source"}
        </a>
      </section>

      <section className="injury-filter-panel" aria-label={copy.injury.filters ?? "Injury filters"}>
        <label>
          <span>{copy.injury.athlete ?? "Athlete"}</span>
          <select value={selectedPlayer} onChange={(event) => setSelectedPlayer(event.target.value)}>
            {playerOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? allLabel : option}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{copy.injury.injuryType ?? "Injury Type"}</span>
          <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? allLabel : localizedValue(option, language)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{copy.injury.year ?? "Year"}</span>
          <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? allLabel : option}
              </option>
            ))}
          </select>
        </label>
        <div className="injury-cause-filter">
          <span>{copy.injury.cause ?? "Cause"}</span>
          <div className="injury-cause-toggle" role="group" aria-label={copy.injury.cause ?? "Cause"}>
            {(["all", "direct", "indirect"] as InjuryCauseFilter[]).map((cause) => (
              <button
                className={selectedCause === cause ? "is-active" : ""}
                key={cause}
                type="button"
                onClick={() => setSelectedCause(cause)}
              >
                {injuryCauseFilterLabel(cause, copy)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="metric-grid injury-kpi-grid">
        <MetricCard label={copy.injury.injuryEvents} value={compactNumber(filteredInjuries.length)} detail={copy.injury.filteredRows ?? copy.injury.cleanInjuryRecords} />
        <MetricCard label={copy.injury.daysLost} value={compactNumber(totalDaysLost)} detail={copy.injury.totalDays ?? copy.injury.totalUnavailableDays} />
        <MetricCard label={copy.injury.topRegion} value={topRegion ? displayInjuryRegion(topRegion, language) : copy.common.pending} detail={copy.injury.mappedLocation ?? copy.injury.mostFrequentRegion} />
        <MetricCard label={copy.injury.latestRecord} value={latestInjury?.startDate || copy.common.noData} detail={latestInjury?.playerName || copy.common.waitingForSource} />
      </section>

      <section className="injury-history-layout">
        <article className="injury-map-card">
          <div className="panel-heading">
            <h3>{copy.injury.bodyMap ?? "Body Map"}</h3>
            <span>{copy.injury.bodyMapSub ?? "Dots represent filtered injury locations"}</span>
          </div>
          <div className="injury-body-map-wrap">
            <Image src="/ams/assets/injuries/body-map.png" alt="" width={400} height={350} priority={false} />
            <div className="injury-map-dots" aria-label={copy.injury.bodyMap ?? "Body Map"}>
              {injuryDots.map((dot) => {
                const size = 15 + (dot.count / Math.max(1, injuryDots[0]?.count ?? 1)) * 9;
                const title = `${dot.count} - ${displayInjuryRegion(dot.bodyRegion, language)} - ${displayInjurySide(dot.laterality, language)} - ${compactNumber(dot.days)} ${copy.injury.daysLabel ?? "days"}`;

                return (
                  <button
                    aria-label={title}
                    className="injury-dot"
                    key={dot.key}
                    style={{
                      "--dot-left": `${dot.mapX}%`,
                      "--dot-size": `${size}px`,
                      "--dot-top": `${dot.mapY}%`,
                    } as CSSProperties}
                    title={title}
                    type="button"
                  >
                    <span>{dot.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </article>

        <article className="injury-table-card">
          <div className="panel-heading">
            <h3>{copy.injury.historyView ?? copy.injury.latestRecords}</h3>
            <span>{copy.injury.tableSub ?? copy.injury.recentMedicalEvents}</span>
          </div>
          {filteredInjuries.length ? (
            <div className="injury-table-wrap">
              <table className="injury-table">
                <thead>
                  <tr>
                    <th>{copy.injury.athlete ?? "Athlete"}</th>
                    <th>{copy.injury.injuryDescription ?? "Injury Description"}</th>
                    <th>{copy.injury.injuryType ?? "Injury Type"}</th>
                    <th>{copy.injury.bodyRegion ?? "Body Region"}</th>
                    <th>{copy.injury.laterality ?? "Laterality"}</th>
                    <th>{copy.injury.cause ?? "Cause"}</th>
                    <th>{copy.injury.startDate ?? "Start Date"}</th>
                    <th>{copy.injury.endDate ?? "End Date"}</th>
                    <th>{copy.injury.daysLost ?? "Days Lost"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInjuries.map((injury) => (
                    <tr key={injury.injuryId ?? `${injury.playerName}-${injury.startDate}-${injury.injury}`}>
                      <td><strong>{injury.playerName || copy.common.unknownPlayer}</strong></td>
                      <td>{injury.injury || copy.common.unclassified}</td>
                      <td>{injury.injuryType || copy.common.unclassified}</td>
                      <td>{displayInjuryRegion(injury.bodyRegion, language)}</td>
                      <td>{displayInjurySide(injury.laterality, language)}</td>
                      <td>{displayInjuryCause(injury.cause, language)}</td>
                      <td>{injury.startDate || copy.common.noDate}</td>
                      <td>{injury.endDate || copy.common.noDate}</td>
                      <td>{compactNumber(numberValue(injury.totalDaysLost))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="injury-empty-state">{copy.common.noRecords}</div>
          )}
        </article>
      </section>
    </div>
  );
}

function injuryCauseFilterLabel(cause: InjuryCauseFilter, copy: DataPanelCopy) {
  if (cause === "direct") return copy.injury.directCause ?? "Direct";
  if (cause === "indirect") return copy.injury.indirectCause ?? "Indirect";
  return copy.injury.all ?? "All";
}

function injuryCauseKind(cause: string | undefined) {
  const normalized = normalizeIdentityText(cause);
  if (normalized.includes("indirecta")) return "indirect";
  if (normalized.includes("directa")) return "direct";
  return "other";
}

function buildInjuryMapDots(rows: InjuryRow[]) {
  const groups = new Map<string, InjuryMapDot>();

  rows.forEach((row) => {
    const mapX = numberValue(row.mapX);
    const mapY = numberValue(row.mapY);
    if (!mapX || !mapY) return;

    const key = `${Math.round(mapX)}-${Math.round(mapY)}-${row.bodyRegion ?? ""}-${row.laterality ?? ""}`;
    const currentDot = groups.get(key) ?? {
      bodyRegion: row.bodyRegion,
      count: 0,
      days: 0,
      key,
      laterality: row.laterality,
      mapX,
      mapY,
    };

    currentDot.count += 1;
    currentDot.days += numberValue(row.totalDaysLost);
    groups.set(key, currentDot);
  });

  return [...groups.values()].sort((a, b) => b.count - a.count);
}

function displayInjuryRegion(region: string | undefined, language: AmsLanguage) {
  const regionLabels: Record<AmsLanguage, Record<string, string>> = {
    en: {
      abdomen: "Abdomen",
      ankle: "Ankle",
      back: "Back",
      calf: "Calf",
      chest: "Chest",
      elbow: "Elbow",
      foot: "Foot",
      glute: "Glute",
      hamstring: "Hamstring",
      head: "Head",
      hip_groin: "Hip/Groin",
      knee: "Knee",
      lumbar: "Lumbar",
      neck: "Neck",
      other: "Other",
      quad_thigh: "Quad/Thigh",
      shoulder: "Shoulder",
      upper_arm: "Upper Arm",
      wrist_hand: "Wrist/Hand",
    },
    es: {
      abdomen: "Abdomen",
      ankle: "Tobillo",
      back: "Espalda",
      calf: "Pantorrilla",
      chest: "Pecho",
      elbow: "Codo",
      foot: "Pie",
      glute: "Gluteo",
      hamstring: "Isquiosurales",
      head: "Cabeza",
      hip_groin: "Cadera/Ingle",
      knee: "Rodilla",
      lumbar: "Lumbar",
      neck: "Cuello",
      other: "Otro",
      quad_thigh: "Cuadriceps/Muslo",
      shoulder: "Hombro",
      upper_arm: "Brazo",
      wrist_hand: "Muneca/Mano",
    },
  };

  const key = String(region || "").trim();
  return regionLabels[language][key] ?? humanizeInjuryValue(key || "-");
}

function displayInjurySide(laterality: string | undefined, language: AmsLanguage) {
  const normalized = normalizeIdentityText(laterality);
  if (normalized.includes("izquierda")) return language === "es" ? "Izquierda" : "Left";
  if (normalized.includes("derecha")) return language === "es" ? "Derecha" : "Right";
  if (normalized.includes("bilateral")) return "Bilateral";
  return laterality || "-";
}

function displayInjuryCause(cause: string | undefined, language: AmsLanguage) {
  const kind = injuryCauseKind(cause);
  if (kind === "indirect") return language === "es" ? "Indirecta" : "Indirect";
  if (kind === "direct") return language === "es" ? "Directa" : "Direct";
  return cause || "-";
}

function humanizeInjuryValue(value: string) {
  return String(value || "-").replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeIdentityText(value: string | undefined) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function unique(values: unknown[]) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function mostCommon(values: unknown[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => {
    const key = String(value || "").trim();
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

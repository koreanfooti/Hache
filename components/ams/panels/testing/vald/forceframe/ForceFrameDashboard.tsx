import Image from "next/image";
import { useMemo, useState } from "react";
import { players } from "@/lib/ams/content";
import { getForceFrameHipAdAbReference } from "@/lib/ams/valdReferences";
import { DateSlicerField } from "@/components/ams/ui/DateSlicerField";
import { ForceFrameAsymmetryChart, ForceFrameSplitForceChart } from "@/components/ams/panels/testing/vald/forceframe/ForceFrameCharts";
import { ForceFrameFilterDrawer } from "@/components/ams/panels/testing/vald/forceframe/ForceFrameFilterDrawer";
import { forceFrameLabels } from "@/components/ams/panels/testing/vald/forceframe/forceframeLabels";
import { ForceFramePlayerPanel } from "@/components/ams/panels/testing/vald/forceframe/ForceFramePlayerPanel";
import { ForceFrameReferenceDock } from "@/components/ams/panels/testing/vald/forceframe/ForceFrameReferenceDock";
import type { ForceFrameDashboardProps, ForceFrameDirection, ForceFrameRefreshPayload } from "@/components/ams/panels/testing/vald/forceframe/forceframeTypes";
import {
  average,
  changeTone,
  fallbackPlayer,
  forceFrameDateInput,
  forceFramePoint,
  forceFrameReferenceDisplayLabel,
  forceFrameTestKey,
  forceLabel,
  formatDisplayDate,
  isForceFrameHipAdAbTestType,
  maxValue,
  percentChange,
  percentLabel,
  positionLabel,
  sortForceFrameRows,
  unique,
} from "@/components/ams/panels/testing/vald/forceframe/forceframeUtils";
import { NordbordKpi } from "@/components/ams/panels/testing/vald/nordbord/NordbordKpi";

const forceFrameLogo = "/ams/assets/testing/forceframe-logo.webp";

export function ForceFrameDashboard({ copy, language, onRefreshData, payload }: ForceFrameDashboardProps) {
  const labels = forceFrameLabels(language);
  const tests = payload?.tests;
  const orderedTests = useMemo(() => sortForceFrameRows(tests ?? []), [tests]);
  const playerIds = useMemo(() => unique(orderedTests.map((row) => row.amsId)), [orderedTests]);
  const playerById = useMemo(() => new Map(players.map((player) => [player.amsId, player])), []);
  const [selectedPosition, setSelectedPosition] = useState("all");
  const [selectedPlayerId, setSelectedPlayerId] = useState(playerIds[0] ?? "");
  const [selectedTestType, setSelectedTestType] = useState("all");
  const [selectedDirection, setSelectedDirection] = useState<ForceFrameDirection>("pull");
  const [hiddenTestIds, setHiddenTestIds] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<"idle" | "refreshing" | "success" | "error">("idle");
  const [refreshMessage, setRefreshMessage] = useState("");
  const [lastSynced, setLastSynced] = useState(payload?.meta?.lastSynced ?? "");
  const allDates = useMemo(() => unique(orderedTests.map((row) => forceFrameDateInput(row.testDateUtc))).sort(), [orderedTests]);
  const [fromDate, setFromDate] = useState(allDates[0] ?? "");
  const [toDate, setToDate] = useState(allDates.at(-1) ?? "");
  const positionOptions = useMemo(() => {
    const positions = playerIds
      .map((id) => playerById.get(id)?.position)
      .filter(Boolean);

    return ["all", ...unique(positions)];
  }, [playerById, playerIds]);
  const filteredPlayerIds = useMemo(
    () => playerIds.filter((id) => selectedPosition === "all" || (playerById.get(id)?.position ?? labels.unassigned) === selectedPosition),
    [labels.unassigned, playerById, playerIds, selectedPosition],
  );
  const activePlayerId = filteredPlayerIds.includes(selectedPlayerId) ? selectedPlayerId : filteredPlayerIds[0] ?? playerIds[0] ?? "";
  const activePlayer = playerById.get(activePlayerId) ?? fallbackPlayer(activePlayerId, copy.common.unknownPlayer);
  const activePlayerRows = useMemo(
    () => orderedTests.filter((row) => row.amsId === activePlayerId),
    [activePlayerId, orderedTests],
  );
  const testTypeOptions = useMemo(() => ["all", ...unique(activePlayerRows.map((row) => row.testTypeName))], [activePlayerRows]);
  const rowsBeforeTestFilter = useMemo(
    () => activePlayerRows.filter((row) => {
      const date = forceFrameDateInput(row.testDateUtc);
      const isAfterFrom = !fromDate || !date || date >= fromDate;
      const isBeforeTo = !toDate || !date || date <= toDate;
      const isType = selectedTestType === "all" || row.testTypeName === selectedTestType;

      return isAfterFrom && isBeforeTo && isType;
    }),
    [activePlayerRows, fromDate, selectedTestType, toDate],
  );
  const testFilterOptions = useMemo(
    () => rowsBeforeTestFilter.map((row) => ({
      id: forceFrameTestKey(row),
      label: formatDisplayDate(row.testDateUtc),
      type: row.testTypeName ?? labels.title,
    })),
    [labels.title, rowsBeforeTestFilter],
  );
  const filteredRows = useMemo(
    () => rowsBeforeTestFilter.filter((row) => !hiddenTestIds.includes(forceFrameTestKey(row))),
    [hiddenTestIds, rowsBeforeTestFilter],
  );
  const series = useMemo(() => filteredRows.map((row) => forceFramePoint(row, selectedDirection)), [filteredRows, selectedDirection]);
  const latestPoint = series.at(-1);
  const previousPoint = series.length > 1 ? series.at(-2) : undefined;
  const latestTest = filteredRows.at(-1);
  const leftMaxReference = maxValue(series.map((point) => point.left));
  const rightMaxReference = maxValue(series.map((point) => point.right));
  const leftCurrent = latestPoint?.left ?? 0;
  const rightCurrent = latestPoint?.right ?? 0;
  const leftPreviousChange = percentChange(leftCurrent, previousPoint?.left ?? 0);
  const rightPreviousChange = percentChange(rightCurrent, previousPoint?.right ?? 0);
  const leftMaxChange = percentChange(leftCurrent, leftMaxReference);
  const rightMaxChange = percentChange(rightCurrent, rightMaxReference);
  const asymmetryValues = series.map((point) => point.asymmetry);
  const averageAsymmetry = average(asymmetryValues);
  const maximumAsymmetry = Math.max(0, ...asymmetryValues.map((value) => Math.abs(value)));
  const forceFrameReferenceCandidate = getForceFrameHipAdAbReference(activePlayer.position);
  const shouldShowForceFrameReference = series.length > 0 && series.every((point) => isForceFrameHipAdAbTestType(point.type));
  const forceFrameReference = shouldShowForceFrameReference ? forceFrameReferenceCandidate : undefined;
  const forceFrameReferenceLabel = forceFrameReference
    ? forceFrameReferenceDisplayLabel(forceFrameReference, language, labels.referenceAvg)
    : "";
  const forceFrameReferenceMetric = selectedDirection === "pull" ? "abd" : "add";

  async function refreshForceFrameData() {
    setRefreshStatus("refreshing");
    setRefreshMessage("");

    try {
      const response = await fetch("/api/vald/forceframe", {
        cache: "no-store",
        method: "POST",
      });
      const refreshedPayload = await response.json() as ForceFrameRefreshPayload & { error?: string };

      if (!response.ok) {
        throw new Error(refreshedPayload.error || labels.refreshFailed);
      }

      onRefreshData?.(refreshedPayload);

      const refreshedDates = unique((refreshedPayload.tests ?? []).map((row) => forceFrameDateInput(row.testDateUtc))).sort();
      setFromDate(refreshedDates[0] ?? "");
      setToDate(refreshedDates.at(-1) ?? "");
      setSelectedTestType("all");
      setSelectedDirection("pull");
      setHiddenTestIds([]);
      setLastSynced(refreshedPayload.meta?.lastSynced ?? new Date().toISOString());
      setRefreshStatus("success");
      setRefreshMessage(`${labels.refreshed}: ${refreshedPayload.meta?.testCount ?? refreshedPayload.tests?.length ?? 0} ${copy.common.tests}`);
    } catch (error) {
      setRefreshStatus("error");
      setRefreshMessage(error instanceof Error ? error.message : labels.refreshFailed);
    }
  }

  return (
    <article className="nordbord-powerbi-dashboard forceframe-dashboard">
      <ForceFrameReferenceDock
        isOpen={isReferenceOpen}
        labels={labels}
        language={language}
        onToggle={() => setIsReferenceOpen((isOpen) => !isOpen)}
      />
      <header className="nordbord-report-header forceframe-report-header">
        <div className="nordbord-date-slicer" aria-label={labels.dateSlicer}>
          <DateSlicerField
            emptyLabel={copy.common.noDate}
            label={labels.from}
            language={language}
            max={toDate || allDates.at(-1) || undefined}
            min={allDates[0] ?? undefined}
            value={fromDate}
            onChange={setFromDate}
          />
          <DateSlicerField
            emptyLabel={copy.common.noDate}
            label={labels.to}
            language={language}
            max={allDates.at(-1) || undefined}
            min={fromDate || allDates[0] || undefined}
            value={toDate}
            onChange={setToDate}
          />
          <label>
            <span>{labels.testType}</span>
            <select value={selectedTestType} onChange={(event) => setSelectedTestType(event.target.value)}>
              {testTypeOptions.map((type) => (
                <option key={type} value={type}>{type === "all" ? labels.all : type}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="nordbord-title-lockup forceframe-title-lockup">
          <h3>{labels.title}</h3>
          <Image src={forceFrameLogo} alt="VALD ForceFrame logo" width={82} height={82} />
        </div>
        <div className="nordbord-atlas-lockup">
          <span>Atlas FC {language === "es" ? "Rendimiento" : "Performance"}</span>
          <button
            className="nordbord-refresh-button"
            type="button"
            disabled={refreshStatus === "refreshing"}
            onClick={refreshForceFrameData}
          >
            {refreshStatus === "refreshing" ? labels.refreshing : labels.refresh}
          </button>
          <button className="nordbord-filter-toggle" type="button" onClick={() => setIsFilterOpen((isOpen) => !isOpen)}>
            {labels.filters}
          </button>
        </div>
      </header>

      {(refreshMessage || lastSynced) ? (
        <div className={`nordbord-sync-banner ${refreshStatus === "error" ? "is-error" : ""}`}>
          <span>{refreshMessage || labels.refreshed}</span>
          {lastSynced ? (
            <small>
              {new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(lastSynced))}
            </small>
          ) : null}
        </div>
      ) : null}

      <ForceFrameFilterDrawer
        hiddenTestIds={hiddenTestIds}
        isOpen={isFilterOpen}
        labels={labels}
        setHiddenTestIds={setHiddenTestIds}
        testFilterOptions={testFilterOptions}
        onClose={() => setIsFilterOpen(false)}
      />

      {orderedTests.length ? (
        <section className="nordbord-layout forceframe-layout">
          <ForceFramePlayerPanel
            activePlayer={activePlayer}
            activePlayerId={activePlayerId}
            copy={copy}
            filteredPlayerIds={filteredPlayerIds}
            language={language}
            labels={labels}
            latestTest={latestTest}
            playerById={playerById}
            onSelectPlayer={setSelectedPlayerId}
          />

          <main className="nordbord-report-main">
            <div className="nordbord-position-row">
              <span>{labels.position}</span>
              <div role="group" aria-label={labels.position}>
                {positionOptions.map((position) => (
                  <button
                    className={(selectedPosition === position ? "is-active " : "") + "nordbord-position-button"}
                    key={position}
                    type="button"
                    onClick={() => setSelectedPosition(position)}
                  >
                    {position === "all" ? labels.all : positionLabel(position, language)}
                  </button>
                ))}
              </div>
            </div>

            <section className="nordbord-kpi-row forceframe-kpi-row">
              <NordbordKpi label={labels.leftMaxForce} value={forceLabel(leftMaxReference)} />
              <NordbordKpi label={labels.rightMaxForce} value={forceLabel(rightMaxReference)} />
              <NordbordKpi label={labels.avgAsymmetry} value={percentLabel(averageAsymmetry)} />
              <NordbordKpi label={labels.maxAsymmetry} value={percentLabel(maximumAsymmetry)} />
              <NordbordKpi label={labels.leftChangeFromPrevious} value={percentLabel(leftPreviousChange)} tone={changeTone(leftPreviousChange)} />
              <NordbordKpi label={labels.rightChangeFromPrevious} value={percentLabel(rightPreviousChange)} tone={changeTone(rightPreviousChange)} />
              <NordbordKpi label={labels.leftChangeFromMax} value={percentLabel(leftMaxChange)} tone={changeTone(leftMaxChange)} />
              <NordbordKpi label={labels.rightChangeFromMax} value={percentLabel(rightMaxChange)} tone={changeTone(rightMaxChange)} />
            </section>

            <section className="forceframe-control-row" aria-label={`${labels.direction} ${labels.testType}`}>
              <div className="forceframe-toggle-box">
                <span>{labels.direction}</span>
                <button className={selectedDirection === "pull" ? "is-active" : ""} type="button" onClick={() => setSelectedDirection("pull")}>{labels.pull}</button>
                <button className={selectedDirection === "squeeze" ? "is-active" : ""} type="button" onClick={() => setSelectedDirection("squeeze")}>{labels.squeeze}</button>
              </div>
              <div className="forceframe-toggle-box is-wide">
                <span>{labels.testType}</span>
                {testTypeOptions.map((type) => (
                  <button
                    className={selectedTestType === type ? "is-active" : ""}
                    key={type}
                    type="button"
                    onClick={() => setSelectedTestType(type)}
                  >
                    {type === "all" ? labels.all : type}
                  </button>
                ))}
              </div>
            </section>

            {series.length ? (
              <section className="forceframe-chart-grid">
                <ForceFrameAsymmetryChart labels={labels} playerName={activePlayer.name} points={series} />
                <ForceFrameSplitForceChart
                  labels={labels}
                  playerName={activePlayer.name}
                  points={series}
                  reference={forceFrameReference}
                  referenceLabel={forceFrameReferenceLabel}
                  referenceMetric={forceFrameReferenceMetric}
                />
              </section>
            ) : (
              <div className="nordbord-empty-state">{copy.common.noRecords}</div>
            )}
          </main>
        </section>
      ) : (
        <div className="nordbord-empty-state forceframe-empty-state">
          <strong>{labels.empty}</strong>
          <span>{language === "es" ? "Usa el botón Actualizar para conectar la API externa." : "Use Refresh to connect the external API feed."}</span>
          <button
            className="nordbord-refresh-button"
            type="button"
            disabled={refreshStatus === "refreshing"}
            onClick={refreshForceFrameData}
          >
            {refreshStatus === "refreshing" ? labels.refreshing : labels.refresh}
          </button>
        </div>
      )}
    </article>
  );
}

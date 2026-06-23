import Image from "next/image";
import { useMemo, useState } from "react";
import { players } from "@/lib/ams/content";
import { numberValue } from "@/lib/ams/data";
import { getNordbordIsopronoReference } from "@/lib/ams/valdReferences";
import { AsymmetryLineChart, ForceBarChart } from "@/components/ams/panels/testing/vald/nordbord/NordbordCharts";
import { NordbordFilterDrawer } from "@/components/ams/panels/testing/vald/nordbord/NordbordFilterDrawer";
import { NordbordKpi } from "@/components/ams/panels/testing/vald/nordbord/NordbordKpi";
import { NordbordPlayerPanel } from "@/components/ams/panels/testing/vald/nordbord/NordbordPlayerPanel";
import { nordbordLabels } from "@/components/ams/panels/testing/vald/nordbord/nordbordLabels";
import { DateSlicerField } from "@/components/ams/ui/DateSlicerField";
import type { NordbordDashboardProps } from "@/components/ams/panels/testing/vald/nordbord/nordbordTypes";
import {
  average,
  changeFromMax,
  changeTone,
  dateInputValue,
  fallbackPlayer,
  forceLabel,
  forcePerKgLabel,
  formatDisplayDate,
  maxValue,
  nordbordTestKey,
  percentLabel,
  positionLabel,
  referenceDisplayLabel,
  rowToSeriesPoint,
  secondsLabel,
  sortNordbordRows,
  unique,
} from "@/components/ams/panels/testing/vald/nordbord/nordbordUtils";

const nordbordLogo = "/ams/assets/testing/nordbord-logo.png";

export function NordbordDashboard({ copy, language, metrics, tests }: NordbordDashboardProps) {
  const labels = nordbordLabels(language);
  const orderedTests = useMemo(() => sortNordbordRows(tests), [tests]);
  const playerIds = useMemo(() => unique(orderedTests.map((row) => row.amsId)), [orderedTests]);
  const playerById = useMemo(() => new Map(players.map((player) => [player.amsId, player])), []);
  const [selectedPosition, setSelectedPosition] = useState("all");
  const [selectedPlayerId, setSelectedPlayerId] = useState(playerIds[0] ?? "");
  const [selectedTestType, setSelectedTestType] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hiddenTestIds, setHiddenTestIds] = useState<string[]>([]);
  const allDates = useMemo(() => unique(orderedTests.map((row) => dateInputValue(row.testDateUtc))).sort(), [orderedTests]);
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
      const date = dateInputValue(row.testDateUtc);
      const isAfterFrom = !fromDate || !date || date >= fromDate;
      const isBeforeTo = !toDate || !date || date <= toDate;
      const isType = selectedTestType === "all" || row.testTypeName === selectedTestType;

      return isAfterFrom && isBeforeTo && isType;
    }),
    [activePlayerRows, fromDate, selectedTestType, toDate],
  );
  const testFilterOptions = useMemo(
    () => rowsBeforeTestFilter.map((row) => ({
      id: nordbordTestKey(row),
      label: formatDisplayDate(row.testDateUtc),
      type: row.testTypeName ?? "NordBord",
    })),
    [rowsBeforeTestFilter],
  );
  const filteredRows = useMemo(
    () => rowsBeforeTestFilter.filter((row) => !hiddenTestIds.includes(nordbordTestKey(row))),
    [hiddenTestIds, rowsBeforeTestFilter],
  );
  const series = useMemo(() => filteredRows.map(rowToSeriesPoint), [filteredRows]);
  const latestTest = filteredRows.at(-1);
  const leftMaxReference = maxValue(filteredRows.map((row) => row.leftMaxForce));
  const rightMaxReference = maxValue(filteredRows.map((row) => row.rightMaxForce));
  const leftMax = numberValue(latestTest?.leftMaxForce);
  const rightMax = numberValue(latestTest?.rightMaxForce);
  const leftChange = changeFromMax(leftMax, leftMaxReference);
  const rightChange = changeFromMax(rightMax, rightMaxReference);
  const asymmetryValues = series.map((point) => point.asymmetry);
  const averageAsymmetry = average(asymmetryValues);
  const maximumAsymmetry = Math.max(0, ...asymmetryValues.map((value) => Math.abs(value)));
  const selectedMetric = metrics.find((row) => row.testId === latestTest?.testId);
  const isopronoReference = getNordbordIsopronoReference(activePlayer.position);
  const isopronoReferenceLabel = isopronoReference ? referenceDisplayLabel(isopronoReference, language) : "";

  return (
    <article className="nordbord-powerbi-dashboard">
      <header className="nordbord-report-header">
        <div className="nordbord-date-slicer" aria-label={labels.dateSlicer}>
          <DateSlicerField
            emptyLabel={copy.common.noDate}
            label={labels.from}
            language={language}
            max={toDate || allDates.at(-1) || undefined}
            min={allDates[0] ?? undefined}
            tooltipDetail={language === "es" ? "Inicio del rango NordBord visible." : "Start of the visible NordBord range."}
            tooltipTitle={labels.dateSlicer}
            value={fromDate}
            onChange={setFromDate}
          />
          <DateSlicerField
            emptyLabel={copy.common.noDate}
            label={labels.to}
            language={language}
            max={allDates.at(-1) || undefined}
            min={fromDate || allDates[0] || undefined}
            tooltipDetail={language === "es" ? "Fin del rango NordBord visible." : "End of the visible NordBord range."}
            tooltipTitle={labels.dateSlicer}
            value={toDate}
            onChange={setToDate}
          />
          <label>
            <span>{labels.category}</span>
            <select value={selectedTestType} onChange={(event) => setSelectedTestType(event.target.value)}>
              {testTypeOptions.map((type) => (
                <option key={type} value={type}>{type === "all" ? labels.all : type}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="nordbord-title-lockup">
          <h3>{labels.title}</h3>
          <Image src={nordbordLogo} alt="NordBord logo" width={134} height={64} />
        </div>
        <div className="nordbord-atlas-lockup">
          <span>Atlas FC {language === "es" ? "Rendimiento" : "Performance"}</span>
          <button className="nordbord-filter-toggle" type="button" onClick={() => setIsFilterOpen((isOpen) => !isOpen)}>
            {labels.filters}
          </button>
        </div>
      </header>

      <NordbordFilterDrawer
        hiddenTestIds={hiddenTestIds}
        isOpen={isFilterOpen}
        labels={labels}
        setHiddenTestIds={setHiddenTestIds}
        testFilterOptions={testFilterOptions}
        onClose={() => setIsFilterOpen(false)}
      />

      <section className="nordbord-layout">
        <NordbordPlayerPanel
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

          <section className="nordbord-kpi-row">
            <NordbordKpi label={labels.leftMaxForce} value={forceLabel(leftMax)} />
            <NordbordKpi label={labels.rightMaxForce} value={forceLabel(rightMax)} />
            <NordbordKpi label={labels.leftChange} value={percentLabel(leftChange)} tone={changeTone(leftChange)} />
            <NordbordKpi label={labels.rightChange} value={percentLabel(rightChange)} tone={changeTone(rightChange)} />
            <NordbordKpi label={labels.avgAsymmetry} value={percentLabel(averageAsymmetry)} />
            <NordbordKpi label={labels.maxAsymmetry} value={percentLabel(maximumAsymmetry)} />
          </section>

          {series.length ? (
            <>
              <ForceBarChart labels={labels} points={series} reference={isopronoReference} referenceLabel={isopronoReferenceLabel} />
              <AsymmetryLineChart labels={labels} points={series} />
            </>
          ) : (
            <div className="nordbord-empty-state">{copy.common.noRecords}</div>
          )}

          {selectedMetric ? (
            <section className="nordbord-metric-ribbon">
              <span>{labels.forcePerKg}: {forcePerKgLabel(selectedMetric.leftMaxForcePerKg)} / {forcePerKgLabel(selectedMetric.rightMaxForcePerKg)}</span>
              <span>{labels.timeToMax}: {secondsLabel(selectedMetric.leftAvgTimeToMaxForceSeconds)} / {secondsLabel(selectedMetric.rightAvgTimeToMaxForceSeconds)}</span>
            </section>
          ) : null}
        </main>
      </section>
    </article>
  );
}

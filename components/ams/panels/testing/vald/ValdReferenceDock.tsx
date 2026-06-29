import { useState } from "react";
import Image from "next/image";
import { compactNumber } from "@/lib/ams/data";
import { mlsValdReferenceRows, mlsValdReferenceSource } from "@/lib/ams/mlsValdReferences";
import { valdPerformanceReferenceRows } from "@/lib/ams/valdReferences";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";

const mlsLogo = "/ams/assets/testing/mls-logo.png";
const orlegiLogo = "/ams/assets/testing/orlegi-sports.jpeg";

type ReferencePanel = "orlegi" | "mls";

export function ValdReferenceDock({ language }: { language: AmsLanguage }) {
  const [openPanel, setOpenPanel] = useState<ReferencePanel | null>(null);
  const copy = referenceCopy(language);

  const togglePanel = (panel: ReferencePanel) => {
    setOpenPanel((currentPanel) => (currentPanel === panel ? null : panel));
  };

  return (
    <div className="vald-reference-dock">
      <button
        aria-expanded={openPanel === "orlegi"}
        aria-label={copy.orlegiPanelLabel}
        className={openPanel === "orlegi" ? "vald-orlegi-tab is-open" : "vald-orlegi-tab"}
        type="button"
        onClick={() => togglePanel("orlegi")}
      >
        <Image src={orlegiLogo} alt="Orlegi Sports" width={74} height={74} />
        <span>{copy.orlegiTab}</span>
      </button>

      <button
        aria-expanded={openPanel === "mls"}
        aria-label={copy.mlsPanelLabel}
        className={openPanel === "mls" ? "vald-orlegi-tab is-mls is-open" : "vald-orlegi-tab is-mls"}
        type="button"
        onClick={() => togglePanel("mls")}
      >
        <Image src={mlsLogo} alt="MLS" width={74} height={74} />
        <span>{copy.mlsTab}</span>
      </button>

      {openPanel === "orlegi" ? renderOrlegiTable(copy, language, () => setOpenPanel(null)) : null}
      {openPanel === "mls" ? renderMlsTable(copy, () => setOpenPanel(null)) : null}
    </div>
  );
}

function renderOrlegiTable(copy: ReturnType<typeof referenceCopy>, language: AmsLanguage, onClose: () => void) {
  return (
    <aside className="vald-reference-table-panel" aria-label={copy.orlegiPanelLabel}>
      <header>
        <div>
          <span>{copy.orlegiKicker}</span>
          <strong>{copy.orlegiTitle}</strong>
          <p>{copy.orlegiSubtitle}</p>
        </div>
        <button type="button" onClick={onClose}>{copy.close}</button>
      </header>
      <div className="vald-reference-table-wrap">
        <table>
          <thead>
            <tr>
              <th>{copy.position}</th>
              <th>{copy.percentile}</th>
              <th>SJ<br /><small>cm</small></th>
              <th>CMJ<br /><small>cm</small></th>
              <th>ABK<br /><small>cm</small></th>
              <th>Isoprono<br /><small>N</small></th>
              <th>ABD<br /><small>N</small></th>
              <th>ADD<br /><small>N</small></th>
            </tr>
          </thead>
          <tbody>
            {valdPerformanceReferenceRows.map((row) => (
              <tr key={row.key}>
                <td>{language === "es" ? row.esLabel : row.enLabel}</td>
                <td><span className={`vald-percentile-pill is-p${row.percentile}`}>P{row.percentile}</span></td>
                <td>{formatReferenceValue(row.sjCm)}</td>
                <td>{formatReferenceValue(row.cmjCm)}</td>
                <td>{formatReferenceValue(row.abkCm)}</td>
                <td>{formatReferenceValue(row.isopronoN)}</td>
                <td>{formatReferenceValue(row.abdN)}</td>
                <td>{formatReferenceValue(row.addN)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer>{copy.orlegiSource}</footer>
    </aside>
  );
}

function renderMlsTable(copy: ReturnType<typeof referenceCopy>, onClose: () => void) {
  return (
    <aside className="vald-reference-table-panel is-mls" aria-label={copy.mlsPanelLabel}>
      <header>
        <div>
          <span>{copy.mlsKicker}</span>
          <strong>{copy.mlsTitle}</strong>
          <p>{copy.mlsSubtitle}</p>
        </div>
        <button type="button" onClick={onClose}>{copy.close}</button>
      </header>
      <div className="vald-reference-table-wrap">
        <table>
          <thead>
            <tr>
              <th>{copy.test}</th>
              <th>{copy.metric}</th>
              <th>{copy.unit}</th>
              <th>P1</th>
              <th>P25</th>
              <th>P50</th>
              <th>P75</th>
              <th>P99</th>
            </tr>
          </thead>
          <tbody>
            {mlsValdReferenceRows.map((row) => (
              <tr key={row.key}>
                <td>{row.test}</td>
                <td>{row.metric}</td>
                <td>{row.unit || "-"}</td>
                <td>{row.p1}</td>
                <td>{row.p25}</td>
                <td>{row.p50}</td>
                <td>{row.p75}</td>
                <td>{row.p99}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer>{copy.mlsSource}</footer>
    </aside>
  );
}

function formatReferenceValue(value: number) {
  return compactNumber(value, Number.isInteger(value) ? 0 : 1);
}

function referenceCopy(language: AmsLanguage) {
  if (language === "es") {
    return {
      close: "Cerrar",
      metric: "Métrica",
      mlsKicker: "MLS 2024",
      mlsPanelLabel: "Tabla de referencias percentiles MLS 2024",
      mlsSource: `Fuente: ${mlsValdReferenceSource}.`,
      mlsSubtitle: "Benchmarks de liga extraídos del reporte VALD MLS 2024 para todas las pruebas publicadas.",
      mlsTab: "MLS 2024",
      mlsTitle: "Referencias Percentiles MLS 2024",
      orlegiKicker: "Orlegi Sports",
      orlegiPanelLabel: "Tabla de referencias percentiles VALD",
      orlegiSource: "Fuente: Referencias VALD, página 8, Tabla 6, Primera varonil.",
      orlegiSubtitle: "Valores por posición del primer equipo para fuerza, potencia y ForceFrame Hip AD/AB.",
      orlegiTab: "Refs",
      orlegiTitle: "Referencias Percentiles VALD",
      percentile: "Percentil",
      position: "Posición",
      test: "Prueba",
      unit: "Unidad",
    };
  }

  return {
    close: "Close",
    metric: "Metric",
    mlsKicker: "MLS 2024",
    mlsPanelLabel: "MLS 2024 percentile reference table",
    mlsSource: `Source: ${mlsValdReferenceSource}.`,
    mlsSubtitle: "League benchmarks extracted from the VALD 2024 MLS report for every published test.",
    mlsTab: "MLS 2024",
    mlsTitle: "MLS 2024 Percentile References",
    orlegiKicker: "Orlegi Sports",
    orlegiPanelLabel: "VALD percentile reference table",
    orlegiSource: "Source: Referencias VALD, page 8, Table 6, Primera varonil.",
    orlegiSubtitle: "First-team position references for power, strength, and ForceFrame Hip AD/AB.",
    orlegiTab: "Refs",
    orlegiTitle: "VALD Percentile References",
    percentile: "Percentile",
    position: "Position",
    test: "Test",
    unit: "Unit",
  };
}

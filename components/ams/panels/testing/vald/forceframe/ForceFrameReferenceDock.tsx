import Image from "next/image";
import { compactNumber } from "@/lib/ams/data";
import { valdPerformanceReferenceRows } from "@/lib/ams/valdReferences";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";
import type { ForceFrameLabels } from "@/components/ams/panels/testing/vald/forceframe/forceframeLabels";

const orlegiLogo = "/ams/assets/testing/orlegi-sports.jpeg";

export function ForceFrameReferenceDock({
  isOpen,
  labels,
  language,
  onToggle,
}: {
  isOpen: boolean;
  labels: ForceFrameLabels;
  language: AmsLanguage;
  onToggle: () => void;
}) {
  const copy = referenceCopy(language);

  return (
    <div className="forceframe-reference-dock">
      <button
        aria-expanded={isOpen}
        className={isOpen ? "forceframe-orlegi-tab is-open" : "forceframe-orlegi-tab"}
        type="button"
        onClick={onToggle}
      >
        <Image src={orlegiLogo} alt="Orlegi Sports" width={74} height={74} />
        <span>{copy.tab}</span>
      </button>

      {isOpen ? (
        <aside className="forceframe-reference-table-panel" aria-label={copy.panelLabel}>
          <header>
            <div>
              <span>{copy.kicker}</span>
              <strong>{copy.title}</strong>
              <p>{copy.subtitle}</p>
            </div>
            <button type="button" onClick={onToggle}>{labels.close}</button>
          </header>
          <div className="forceframe-reference-table-wrap">
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
                    <td><span className={`forceframe-percentile-pill is-p${row.percentile}`}>P{row.percentile}</span></td>
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
          <footer>{copy.source}</footer>
        </aside>
      ) : null}
    </div>
  );
}

function formatReferenceValue(value: number) {
  return compactNumber(value, Number.isInteger(value) ? 0 : 1);
}

function referenceCopy(language: AmsLanguage) {
  if (language === "es") {
    return {
      kicker: "Orlegi Sports",
      panelLabel: "Tabla de referencias percentiles VALD",
      percentile: "Percentil",
      position: "Posición",
      source: "Fuente: Referencias VALD, página 8, Tabla 6, Primera varonil.",
      subtitle: "Valores por posición del primer equipo para fuerza, potencia y ForceFrame Hip AD/AB.",
      tab: "Refs",
      title: "Referencias Percentiles VALD",
    };
  }

  return {
    kicker: "Orlegi Sports",
    panelLabel: "VALD percentile reference table",
    percentile: "Percentile",
    position: "Position",
    source: "Source: Referencias VALD, page 8, Table 6, Primera varonil.",
    subtitle: "First-team position references for power, strength, and ForceFrame Hip AD/AB.",
    tab: "Refs",
    title: "VALD Percentile References",
  };
}

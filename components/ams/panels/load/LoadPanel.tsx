import { metricDefinitions } from "@/lib/ams/content";
import { compactNumber } from "@/lib/ams/data";
import type { LoadSummary } from "@/lib/ams/types";
import type { DataPanelCopy } from "@/components/ams/panels/panelTypes";
import { LoadVisualDashboard } from "@/components/ams/panels/load/LoadVisuals";
import {
  MetricCard,
  PanelIntro,
  localizedValue,
  type AmsLanguage,
} from "@/components/ams/ui/AmsUi";

export function LoadPanel({
  copy,
  language,
  loadSummary,
}: {
  copy: DataPanelCopy;
  language: AmsLanguage;
  loadSummary: LoadSummary;
}) {
  return (
    <div className="panel-stack">
      <PanelIntro
        kicker={copy.load.kicker}
        title={copy.load.title}
        copy={copy.load.copy}
      />
      <section className="metric-grid">
        <MetricCard label={copy.load.totalDistance} value={`${compactNumber(loadSummary.totalDistance)} m`} detail={`${compactNumber(loadSummary.sessions)} ${copy.common.sessions}`} />
        <MetricCard label={copy.load.highIntensity} value={`${compactNumber(loadSummary.highIntensity)} m`} detail={copy.load.absoluteRelativeExposure} />
        <MetricCard label={copy.load.maxSpeed} value={`${compactNumber(loadSummary.maxSpeed, 1)} km/h`} detail={copy.load.peakRecordedValue} />
        <MetricCard label={copy.load.dataStatus} value={localizedLoadStatus(loadSummary.status, language)} detail={copy.load.servedFromPublicData} />
      </section>
      <LoadVisualDashboard language={language} rows={loadSummary.rows} />
      <section className="definition-grid">
        {metricDefinitions.map(([label, description, unit]) => {
          const metric = localizedMetricDefinition(label, description, unit, language);

          return (
            <article key={label}>
              <strong>{metric.label}</strong>
              <p>{metric.description}</p>
              <span>{metric.unit}</span>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function localizedLoadStatus(status: string, language: AmsLanguage) {
  if (language === "en") return status;
  if (status.startsWith("Loaded")) {
    return status
      .replace("Loaded", "Cargados")
      .replace("current-roster WIMU/GPS daily records", "registros diarios WIMU/GPS de plantilla actual")
      .replace("sample WIMU/GPS records", "registros de muestra WIMU/GPS")
      .replace("clean module records", "registros limpios de módulos");
  }
  return localizedValue(status, language)
    .replace("Using sample WIMU/GPS records.", "Usando registros de muestra WIMU/GPS.")
    .replace("Data feed unavailable", "Feed de datos no disponible");
}

function localizedMetricDefinition(label: string, description: string, unit: string, language: AmsLanguage) {
  if (language === "en") return { label, description, unit };

  const definitions: Record<string, [string, string, string]> = {
    "Total distance": ["Distancia total", "Distancia total cubierta durante la sesión o ventana de fechas seleccionada.", "m"],
    "HSR absolute": ["HSR absoluto", "Distancia cubierta por encima del umbral absoluto HSR, por defecto 21 km/h.", "m"],
    "HSR relative": ["HSR relativo", "Distancia cubierta por encima del 75.5% de la velocidad máxima del jugador.", "m"],
    "Sprint absolute": ["Sprint absoluto", "Distancia cubierta por encima del umbral absoluto de sprint, por defecto 24 km/h.", "m"],
    "Sprint relative": ["Sprint relativo", "Distancia cubierta por encima del 95% de la velocidad máxima del jugador.", "m"],
    "High acceleration": ["Alta aceleración", "Conteo de aceleraciones de alta intensidad por encima de +3 m/s².", "conteo"],
    "High deceleration": ["Alta desaceleración", "Conteo de desaceleraciones de alta intensidad por debajo de -3 m/s².", "conteo"],
  };
  const translated = definitions[label];
  return translated ? { label: translated[0], description: translated[1], unit: translated[2] } : { label, description, unit };
}

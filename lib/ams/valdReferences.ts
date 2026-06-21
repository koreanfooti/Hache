export type ValdReferenceLine = {
  key: "p25" | "p50" | "p75";
  percentile: 25 | 50 | 75;
  value: number;
};

export type NordbordIsopronoReference = {
  enLabel: string;
  esLabel: string;
  isAggregate: boolean;
  lines: ValdReferenceLine[];
  metric: "Isoprono (N)";
  source: string;
};

type DetailedReference = {
  enLabel: string;
  esLabel: string;
  p25: number;
  p50: number;
  p75: number;
};

const source = "Referencias VALD, page 8, Tabla 6, Primera varonil";

const detailedIsopronoReferences = {
  centralDefender: { enLabel: "Central defender", esLabel: "Defensa central", p25: 276.3, p50: 370.7, p75: 438.4 },
  fullback: { enLabel: "Fullback", esLabel: "Defensa lateral", p25: 244.3, p50: 290.8, p75: 326.8 },
  striker: { enLabel: "Forward", esLabel: "Delantero", p25: 305, p50: 342.4, p75: 386.5 },
  winger: { enLabel: "Winger", esLabel: "Extremo", p25: 254.5, p50: 297.3, p75: 349.5 },
  defensiveMidfielder: { enLabel: "Defensive midfielder", esLabel: "Medio defensivo", p25: 266, p50: 326, p75: 403.4 },
  attackingMidfielder: { enLabel: "Attacking midfielder", esLabel: "Medio ofensivo", p25: 277.6, p50: 306.4, p75: 336.9 },
  goalkeeper: { enLabel: "Goalkeeper", esLabel: "Portero", p25: 292, p50: 313.1, p75: 309 },
} satisfies Record<string, DetailedReference>;

const broadIsopronoReferences = {
  defender: averageReferences("Defender", "Defensa", [detailedIsopronoReferences.centralDefender, detailedIsopronoReferences.fullback]),
  forward: averageReferences("Forward", "Delantero", [detailedIsopronoReferences.striker, detailedIsopronoReferences.winger]),
  midfielder: averageReferences("Midfielder", "Mediocampista", [detailedIsopronoReferences.defensiveMidfielder, detailedIsopronoReferences.attackingMidfielder]),
  goalkeeper: referenceFromDetailed(detailedIsopronoReferences.goalkeeper),
};

const positionReferenceAliases: Record<string, NordbordIsopronoReference> = {
  centraldefender: referenceFromDetailed(detailedIsopronoReferences.centralDefender),
  defensacentral: referenceFromDetailed(detailedIsopronoReferences.centralDefender),
  defendercentral: referenceFromDetailed(detailedIsopronoReferences.centralDefender),
  centreback: referenceFromDetailed(detailedIsopronoReferences.centralDefender),
  centerback: referenceFromDetailed(detailedIsopronoReferences.centralDefender),

  fullback: referenceFromDetailed(detailedIsopronoReferences.fullback),
  lateral: referenceFromDetailed(detailedIsopronoReferences.fullback),
  defensalateral: referenceFromDetailed(detailedIsopronoReferences.fullback),
  sidedefender: referenceFromDetailed(detailedIsopronoReferences.fullback),

  striker: referenceFromDetailed(detailedIsopronoReferences.striker),
  delantero: referenceFromDetailed(detailedIsopronoReferences.striker),
  centreforward: referenceFromDetailed(detailedIsopronoReferences.striker),
  centerforward: referenceFromDetailed(detailedIsopronoReferences.striker),

  winger: referenceFromDetailed(detailedIsopronoReferences.winger),
  extremo: referenceFromDetailed(detailedIsopronoReferences.winger),

  defensivemidfielder: referenceFromDetailed(detailedIsopronoReferences.defensiveMidfielder),
  mediodefensivo: referenceFromDetailed(detailedIsopronoReferences.defensiveMidfielder),

  attackingmidfielder: referenceFromDetailed(detailedIsopronoReferences.attackingMidfielder),
  medioofensivo: referenceFromDetailed(detailedIsopronoReferences.attackingMidfielder),

  defender: broadIsopronoReferences.defender,
  defensa: broadIsopronoReferences.defender,
  forward: broadIsopronoReferences.forward,
  midfielder: broadIsopronoReferences.midfielder,
  mediocampista: broadIsopronoReferences.midfielder,
  midfieldercentral: broadIsopronoReferences.midfielder,
  goalkeeper: broadIsopronoReferences.goalkeeper,
  portero: broadIsopronoReferences.goalkeeper,
};

export function getNordbordIsopronoReference(position: string | undefined) {
  return positionReferenceAliases[normalizePosition(position)];
}

function averageReferences(enLabel: string, esLabel: string, references: DetailedReference[]): NordbordIsopronoReference {
  return {
    enLabel,
    esLabel,
    isAggregate: true,
    lines: [
      { key: "p25", percentile: 25, value: average(references.map((reference) => reference.p25)) },
      { key: "p50", percentile: 50, value: average(references.map((reference) => reference.p50)) },
      { key: "p75", percentile: 75, value: average(references.map((reference) => reference.p75)) },
    ],
    metric: "Isoprono (N)",
    source,
  };
}

function referenceFromDetailed(reference: DetailedReference): NordbordIsopronoReference {
  return {
    enLabel: reference.enLabel,
    esLabel: reference.esLabel,
    isAggregate: false,
    lines: [
      { key: "p25", percentile: 25, value: reference.p25 },
      { key: "p50", percentile: 50, value: reference.p50 },
      { key: "p75", percentile: 75, value: reference.p75 },
    ],
    metric: "Isoprono (N)",
    source,
  };
}

function average(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / Math.max(1, values.length);
}

function normalizePosition(position: string | undefined) {
  return String(position ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();
}

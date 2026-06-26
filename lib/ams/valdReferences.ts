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

export type ForceFrameHipAdAbReference = {
  abdLines: ValdReferenceLine[];
  addLines: ValdReferenceLine[];
  enLabel: string;
  esLabel: string;
  isAggregate: boolean;
  source: string;
};

export type ValdPerformanceReferenceRow = {
  abkCm: number;
  abdN: number;
  addN: number;
  cmjCm: number;
  enLabel: string;
  esLabel: string;
  isopronoN: number;
  key: string;
  percentile: 25 | 50 | 75;
  sjCm: number;
  source: string;
};

type DetailedValdPerformanceReference = {
  enLabel: string;
  esLabel: string;
  rows: Array<{
    abkCm: number;
    abdN: number;
    addN: number;
    cmjCm: number;
    isopronoN: number;
    percentile: 25 | 50 | 75;
    sjCm: number;
  }>;
};

const source = "Referencias VALD, page 8, Tabla 6, Primera varonil";

const detailedValdPerformanceReferences = {
  centralDefender: {
    enLabel: "Central defender",
    esLabel: "Defensa central",
    rows: [
      { percentile: 25, sjCm: 35.3, cmjCm: 35, abkCm: 39.1, isopronoN: 276.3, abdN: 407.3, addN: 412.8 },
      { percentile: 50, sjCm: 40.2, cmjCm: 39.1, abkCm: 44.6, isopronoN: 370.7, abdN: 449.2, addN: 458.4 },
      { percentile: 75, sjCm: 45, cmjCm: 41.6, abkCm: 53, isopronoN: 438.4, abdN: 495.7, addN: 492.9 },
    ],
  },
  fullback: {
    enLabel: "Fullback",
    esLabel: "Defensa lateral",
    rows: [
      { percentile: 25, sjCm: 36, cmjCm: 36.9, abkCm: 39.7, isopronoN: 244.3, abdN: 345, addN: 343.5 },
      { percentile: 50, sjCm: 38.1, cmjCm: 39.3, abkCm: 42.9, isopronoN: 290.8, abdN: 384.8, addN: 373.9 },
      { percentile: 75, sjCm: 40, cmjCm: 42, abkCm: 46, isopronoN: 326.8, abdN: 413, addN: 407.5 },
    ],
  },
  striker: {
    enLabel: "Forward",
    esLabel: "Delantero",
    rows: [
      { percentile: 25, sjCm: 35.7, cmjCm: 38.5, abkCm: 42.3, isopronoN: 305, abdN: 386.9, addN: 408.4 },
      { percentile: 50, sjCm: 38.5, cmjCm: 40.5, abkCm: 44.7, isopronoN: 342.4, abdN: 439.6, addN: 450.4 },
      { percentile: 75, sjCm: 40.8, cmjCm: 43.2, abkCm: 45.7, isopronoN: 386.5, abdN: 495.9, addN: 497.6 },
    ],
  },
  winger: {
    enLabel: "Winger",
    esLabel: "Extremo",
    rows: [
      { percentile: 25, sjCm: 35.5, cmjCm: 37.2, abkCm: 40, isopronoN: 254.5, abdN: 369.3, addN: 349.9 },
      { percentile: 50, sjCm: 38.2, cmjCm: 38.9, abkCm: 44.9, isopronoN: 297.3, abdN: 436.8, addN: 433.7 },
      { percentile: 75, sjCm: 41.1, cmjCm: 40.3, abkCm: 47.5, isopronoN: 349.5, abdN: 494.6, addN: 530.6 },
    ],
  },
  defensiveMidfielder: {
    enLabel: "Defensive midfielder",
    esLabel: "Medio defensivo",
    rows: [
      { percentile: 25, sjCm: 32.8, cmjCm: 35, abkCm: 40.1, isopronoN: 266, abdN: 358.5, addN: 328.5 },
      { percentile: 50, sjCm: 36.2, cmjCm: 37.6, abkCm: 44.5, isopronoN: 326, abdN: 398.7, addN: 418.2 },
      { percentile: 75, sjCm: 39.6, cmjCm: 40.6, abkCm: 47, isopronoN: 403.4, abdN: 439.8, addN: 484.9 },
    ],
  },
  attackingMidfielder: {
    enLabel: "Attacking midfielder",
    esLabel: "Medio ofensivo",
    rows: [
      { percentile: 25, sjCm: 31.3, cmjCm: 33, abkCm: 36.8, isopronoN: 277.6, abdN: 328.1, addN: 393.5 },
      { percentile: 50, sjCm: 35.7, cmjCm: 36.6, abkCm: 41.4, isopronoN: 306.4, abdN: 387.3, addN: 428 },
      { percentile: 75, sjCm: 38.2, cmjCm: 40, abkCm: 45.7, isopronoN: 336.9, abdN: 437.5, addN: 488.9 },
    ],
  },
  goalkeeper: {
    enLabel: "Goalkeeper",
    esLabel: "Portero",
    rows: [
      { percentile: 25, sjCm: 37.2, cmjCm: 39.3, abkCm: 42.3, isopronoN: 292, abdN: 371.6, addN: 335.5 },
      { percentile: 50, sjCm: 41.3, cmjCm: 43.1, abkCm: 49, isopronoN: 313.1, abdN: 442.5, addN: 418.8 },
      { percentile: 75, sjCm: 44.9, cmjCm: 48.1, abkCm: 50.6, isopronoN: 309, abdN: 501.4, addN: 487.6 },
    ],
  },
} satisfies Record<string, DetailedValdPerformanceReference>;

export const valdPerformanceReferenceRows: ValdPerformanceReferenceRow[] = Object.entries(detailedValdPerformanceReferences).flatMap(([key, reference]) => (
  reference.rows.map((row) => ({
    ...row,
    enLabel: reference.enLabel,
    esLabel: reference.esLabel,
    key: `${key}-p${row.percentile}`,
    source,
  }))
));

const broadIsopronoReferences = {
  defender: averageIsopronoReferences("Defender", "Defensa", [detailedValdPerformanceReferences.centralDefender, detailedValdPerformanceReferences.fullback]),
  forward: averageIsopronoReferences("Forward", "Delantero", [detailedValdPerformanceReferences.striker, detailedValdPerformanceReferences.winger]),
  midfielder: averageIsopronoReferences("Midfielder", "Mediocampista", [detailedValdPerformanceReferences.defensiveMidfielder, detailedValdPerformanceReferences.attackingMidfielder]),
  goalkeeper: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.goalkeeper),
};

const broadForceFrameReferences = {
  defender: averageForceFrameReferences("Defender", "Defensa", [detailedValdPerformanceReferences.centralDefender, detailedValdPerformanceReferences.fullback]),
  forward: averageForceFrameReferences("Forward", "Delantero", [detailedValdPerformanceReferences.striker, detailedValdPerformanceReferences.winger]),
  midfielder: averageForceFrameReferences("Midfielder", "Mediocampista", [detailedValdPerformanceReferences.defensiveMidfielder, detailedValdPerformanceReferences.attackingMidfielder]),
  goalkeeper: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.goalkeeper),
};

const nordbordPositionReferenceAliases: Record<string, NordbordIsopronoReference> = {
  centraldefender: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.centralDefender),
  defensacentral: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.centralDefender),
  defendercentral: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.centralDefender),
  centreback: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.centralDefender),
  centerback: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.centralDefender),

  fullback: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.fullback),
  lateral: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.fullback),
  defensalateral: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.fullback),
  sidedefender: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.fullback),

  striker: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.striker),
  delantero: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.striker),
  centreforward: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.striker),
  centerforward: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.striker),

  winger: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.winger),
  extremo: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.winger),

  defensivemidfielder: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.defensiveMidfielder),
  mediodefensivo: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.defensiveMidfielder),

  attackingmidfielder: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.attackingMidfielder),
  medioofensivo: isopronoReferenceFromDetailed(detailedValdPerformanceReferences.attackingMidfielder),

  defender: broadIsopronoReferences.defender,
  defensa: broadIsopronoReferences.defender,
  forward: broadIsopronoReferences.forward,
  midfielder: broadIsopronoReferences.midfielder,
  mediocampista: broadIsopronoReferences.midfielder,
  midfieldercentral: broadIsopronoReferences.midfielder,
  goalkeeper: broadIsopronoReferences.goalkeeper,
  portero: broadIsopronoReferences.goalkeeper,
};

const forceFramePositionReferenceAliases: Record<string, ForceFrameHipAdAbReference> = {
  centraldefender: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.centralDefender),
  defensacentral: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.centralDefender),
  defendercentral: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.centralDefender),
  centreback: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.centralDefender),
  centerback: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.centralDefender),

  fullback: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.fullback),
  lateral: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.fullback),
  defensalateral: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.fullback),
  sidedefender: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.fullback),

  striker: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.striker),
  delantero: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.striker),
  centreforward: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.striker),
  centerforward: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.striker),

  winger: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.winger),
  extremo: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.winger),

  defensivemidfielder: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.defensiveMidfielder),
  mediodefensivo: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.defensiveMidfielder),

  attackingmidfielder: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.attackingMidfielder),
  medioofensivo: forceFrameReferenceFromDetailed(detailedValdPerformanceReferences.attackingMidfielder),

  defender: broadForceFrameReferences.defender,
  defensa: broadForceFrameReferences.defender,
  forward: broadForceFrameReferences.forward,
  midfielder: broadForceFrameReferences.midfielder,
  mediocampista: broadForceFrameReferences.midfielder,
  midfieldercentral: broadForceFrameReferences.midfielder,
  goalkeeper: broadForceFrameReferences.goalkeeper,
  portero: broadForceFrameReferences.goalkeeper,
};

export function getNordbordIsopronoReference(position: string | undefined) {
  return nordbordPositionReferenceAliases[normalizePosition(position)];
}

export function getForceFrameHipAdAbReference(position: string | undefined) {
  return forceFramePositionReferenceAliases[normalizePosition(position)];
}

function averageIsopronoReferences(enLabel: string, esLabel: string, references: DetailedValdPerformanceReference[]): NordbordIsopronoReference {
  return {
    enLabel,
    esLabel,
    isAggregate: true,
    lines: referenceLinesFromValues([0, 1, 2].map((index) => average(references.map((reference) => reference.rows[index].isopronoN)))),
    metric: "Isoprono (N)",
    source,
  };
}

function isopronoReferenceFromDetailed(reference: DetailedValdPerformanceReference): NordbordIsopronoReference {
  return {
    enLabel: reference.enLabel,
    esLabel: reference.esLabel,
    isAggregate: false,
    lines: referenceLinesFromValues(reference.rows.map((row) => row.isopronoN)),
    metric: "Isoprono (N)",
    source,
  };
}

function averageForceFrameReferences(enLabel: string, esLabel: string, references: DetailedValdPerformanceReference[]): ForceFrameHipAdAbReference {
  return {
    abdLines: referenceLinesFromValues([0, 1, 2].map((index) => average(references.map((reference) => reference.rows[index].abdN)))),
    addLines: referenceLinesFromValues([0, 1, 2].map((index) => average(references.map((reference) => reference.rows[index].addN)))),
    enLabel,
    esLabel,
    isAggregate: true,
    source,
  };
}

function forceFrameReferenceFromDetailed(reference: DetailedValdPerformanceReference): ForceFrameHipAdAbReference {
  return {
    abdLines: referenceLinesFromValues(reference.rows.map((row) => row.abdN)),
    addLines: referenceLinesFromValues(reference.rows.map((row) => row.addN)),
    enLabel: reference.enLabel,
    esLabel: reference.esLabel,
    isAggregate: false,
    source,
  };
}

function referenceLinesFromValues(values: number[]): ValdReferenceLine[] {
  return [
    { key: "p25", percentile: 25, value: values[0] },
    { key: "p50", percentile: 50, value: values[1] },
    { key: "p75", percentile: 75, value: values[2] },
  ];
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

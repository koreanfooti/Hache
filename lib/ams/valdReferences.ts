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

type DetailedIsopronoReference = {
  enLabel: string;
  esLabel: string;
  p25: number;
  p50: number;
  p75: number;
};

type DetailedForceFrameReference = {
  abd: [number, number, number];
  add: [number, number, number];
  enLabel: string;
  esLabel: string;
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
} satisfies Record<string, DetailedIsopronoReference>;

const detailedForceFrameReferences = {
  centralDefender: { enLabel: "Central defender", esLabel: "Defensa central", abd: [407.3, 449.2, 495.7], add: [412.8, 458.4, 492.9] },
  fullback: { enLabel: "Fullback", esLabel: "Defensa lateral", abd: [345, 384.8, 413], add: [343.5, 373.9, 407.5] },
  striker: { enLabel: "Forward", esLabel: "Delantero", abd: [386.9, 439.6, 495.9], add: [408.4, 450.4, 497.6] },
  winger: { enLabel: "Winger", esLabel: "Extremo", abd: [369.3, 436.8, 494.6], add: [349.9, 433.7, 530.6] },
  defensiveMidfielder: { enLabel: "Defensive midfielder", esLabel: "Medio defensivo", abd: [358.5, 398.7, 439.8], add: [328.5, 418.2, 484.9] },
  attackingMidfielder: { enLabel: "Attacking midfielder", esLabel: "Medio ofensivo", abd: [328.1, 387.3, 437.5], add: [393.5, 428, 488.9] },
  goalkeeper: { enLabel: "Goalkeeper", esLabel: "Portero", abd: [371.6, 442.5, 501.4], add: [335.5, 418.8, 487.6] },
} satisfies Record<string, DetailedForceFrameReference>;

const broadIsopronoReferences = {
  defender: averageIsopronoReferences("Defender", "Defensa", [detailedIsopronoReferences.centralDefender, detailedIsopronoReferences.fullback]),
  forward: averageIsopronoReferences("Forward", "Delantero", [detailedIsopronoReferences.striker, detailedIsopronoReferences.winger]),
  midfielder: averageIsopronoReferences("Midfielder", "Mediocampista", [detailedIsopronoReferences.defensiveMidfielder, detailedIsopronoReferences.attackingMidfielder]),
  goalkeeper: isopronoReferenceFromDetailed(detailedIsopronoReferences.goalkeeper),
};

const broadForceFrameReferences = {
  defender: averageForceFrameReferences("Defender", "Defensa", [detailedForceFrameReferences.centralDefender, detailedForceFrameReferences.fullback]),
  forward: averageForceFrameReferences("Forward", "Delantero", [detailedForceFrameReferences.striker, detailedForceFrameReferences.winger]),
  midfielder: averageForceFrameReferences("Midfielder", "Mediocampista", [detailedForceFrameReferences.defensiveMidfielder, detailedForceFrameReferences.attackingMidfielder]),
  goalkeeper: forceFrameReferenceFromDetailed(detailedForceFrameReferences.goalkeeper),
};

const nordbordPositionReferenceAliases: Record<string, NordbordIsopronoReference> = {
  centraldefender: isopronoReferenceFromDetailed(detailedIsopronoReferences.centralDefender),
  defensacentral: isopronoReferenceFromDetailed(detailedIsopronoReferences.centralDefender),
  defendercentral: isopronoReferenceFromDetailed(detailedIsopronoReferences.centralDefender),
  centreback: isopronoReferenceFromDetailed(detailedIsopronoReferences.centralDefender),
  centerback: isopronoReferenceFromDetailed(detailedIsopronoReferences.centralDefender),

  fullback: isopronoReferenceFromDetailed(detailedIsopronoReferences.fullback),
  lateral: isopronoReferenceFromDetailed(detailedIsopronoReferences.fullback),
  defensalateral: isopronoReferenceFromDetailed(detailedIsopronoReferences.fullback),
  sidedefender: isopronoReferenceFromDetailed(detailedIsopronoReferences.fullback),

  striker: isopronoReferenceFromDetailed(detailedIsopronoReferences.striker),
  delantero: isopronoReferenceFromDetailed(detailedIsopronoReferences.striker),
  centreforward: isopronoReferenceFromDetailed(detailedIsopronoReferences.striker),
  centerforward: isopronoReferenceFromDetailed(detailedIsopronoReferences.striker),

  winger: isopronoReferenceFromDetailed(detailedIsopronoReferences.winger),
  extremo: isopronoReferenceFromDetailed(detailedIsopronoReferences.winger),

  defensivemidfielder: isopronoReferenceFromDetailed(detailedIsopronoReferences.defensiveMidfielder),
  mediodefensivo: isopronoReferenceFromDetailed(detailedIsopronoReferences.defensiveMidfielder),

  attackingmidfielder: isopronoReferenceFromDetailed(detailedIsopronoReferences.attackingMidfielder),
  medioofensivo: isopronoReferenceFromDetailed(detailedIsopronoReferences.attackingMidfielder),

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
  centraldefender: forceFrameReferenceFromDetailed(detailedForceFrameReferences.centralDefender),
  defensacentral: forceFrameReferenceFromDetailed(detailedForceFrameReferences.centralDefender),
  defendercentral: forceFrameReferenceFromDetailed(detailedForceFrameReferences.centralDefender),
  centreback: forceFrameReferenceFromDetailed(detailedForceFrameReferences.centralDefender),
  centerback: forceFrameReferenceFromDetailed(detailedForceFrameReferences.centralDefender),

  fullback: forceFrameReferenceFromDetailed(detailedForceFrameReferences.fullback),
  lateral: forceFrameReferenceFromDetailed(detailedForceFrameReferences.fullback),
  defensalateral: forceFrameReferenceFromDetailed(detailedForceFrameReferences.fullback),
  sidedefender: forceFrameReferenceFromDetailed(detailedForceFrameReferences.fullback),

  striker: forceFrameReferenceFromDetailed(detailedForceFrameReferences.striker),
  delantero: forceFrameReferenceFromDetailed(detailedForceFrameReferences.striker),
  centreforward: forceFrameReferenceFromDetailed(detailedForceFrameReferences.striker),
  centerforward: forceFrameReferenceFromDetailed(detailedForceFrameReferences.striker),

  winger: forceFrameReferenceFromDetailed(detailedForceFrameReferences.winger),
  extremo: forceFrameReferenceFromDetailed(detailedForceFrameReferences.winger),

  defensivemidfielder: forceFrameReferenceFromDetailed(detailedForceFrameReferences.defensiveMidfielder),
  mediodefensivo: forceFrameReferenceFromDetailed(detailedForceFrameReferences.defensiveMidfielder),

  attackingmidfielder: forceFrameReferenceFromDetailed(detailedForceFrameReferences.attackingMidfielder),
  medioofensivo: forceFrameReferenceFromDetailed(detailedForceFrameReferences.attackingMidfielder),

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

function averageIsopronoReferences(enLabel: string, esLabel: string, references: DetailedIsopronoReference[]): NordbordIsopronoReference {
  return {
    enLabel,
    esLabel,
    isAggregate: true,
    lines: referenceLinesFromValues([
      average(references.map((reference) => reference.p25)),
      average(references.map((reference) => reference.p50)),
      average(references.map((reference) => reference.p75)),
    ]),
    metric: "Isoprono (N)",
    source,
  };
}

function isopronoReferenceFromDetailed(reference: DetailedIsopronoReference): NordbordIsopronoReference {
  return {
    enLabel: reference.enLabel,
    esLabel: reference.esLabel,
    isAggregate: false,
    lines: referenceLinesFromValues([reference.p25, reference.p50, reference.p75]),
    metric: "Isoprono (N)",
    source,
  };
}

function averageForceFrameReferences(enLabel: string, esLabel: string, references: DetailedForceFrameReference[]): ForceFrameHipAdAbReference {
  return {
    abdLines: referenceLinesFromValues([0, 1, 2].map((index) => average(references.map((reference) => reference.abd[index])))),
    addLines: referenceLinesFromValues([0, 1, 2].map((index) => average(references.map((reference) => reference.add[index])))),
    enLabel,
    esLabel,
    isAggregate: true,
    source,
  };
}

function forceFrameReferenceFromDetailed(reference: DetailedForceFrameReference): ForceFrameHipAdAbReference {
  return {
    abdLines: referenceLinesFromValues(reference.abd),
    addLines: referenceLinesFromValues(reference.add),
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

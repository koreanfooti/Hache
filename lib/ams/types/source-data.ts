import type { GpsDailyRow } from "@/lib/ams/data";

export type CleanGpsRow = GpsDailyRow & {
  accelerations?: string;
  amsId?: string;
  cleanPlayerName?: string;
  decelerations?: string;
  sourcePlayerName?: string;
  totalDistance?: string;
  hsrAbsDistance?: string;
  hsrRelDistance?: string;
  highIntensityAccelerations?: string;
  highIntensityDecelerations?: string;
  isMatch?: string;
  matchDay?: string;
  playerLoad?: string;
  rpeCentral?: string;
  rpePeripheral?: string;
  sprintDistance?: string;
  sprintCount?: string;
  maxSpeedKmh?: string;
  rollupSourceTask?: string;
  sessionDuration?: string;
  playerPosition?: string;
  position?: string;
  session_name?: string;
  shirtNumber?: string | number;
  sourceSessionId?: string;
  wellnessDoms?: string;
  wellnessFatigue?: string;
  wellnessMood?: string;
  wellnessSleep?: string;
  wellnessStress?: string;
  weekMatchDay?: string;
  wimuPosition?: string;
  wimuShirtNumber?: string | number;
};

export type InjuryRow = {
  injuryId?: string;
  amsId?: string;
  playerName?: string;
  injuryType?: string;
  injury?: string;
  bodyRegion?: string;
  laterality?: string;
  cause?: string;
  biomechanicalProcess?: string;
  startDate?: string;
  endDate?: string;
  startDateRaw?: string;
  endDateRaw?: string;
  rehabDays?: number;
  excludedDays?: number;
  readaptationDays?: number;
  totalDaysLost?: number;
  mapX?: number;
  mapY?: number;
};

export type BodyCompRow = {
  sourceCategory?: string;
  playerId?: string;
  playerName?: string;
  player_name?: string;
  category?: string;
  date?: string;
  testDate?: string;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  muscleKg?: number;
  adiposeKg?: number;
  residualKg?: number;
  boneKg?: number;
  skinfold6?: number;
  basalKcal?: number;
  restKcal?: number;
  lightKcal?: number;
  moderateKcal?: number;
  matchKcal?: number;
  waistCm?: number;
  hipCm?: number;
  chestCm?: number;
  armCm?: number;
  thighCm?: number;
  calfCm?: number;
};

export type FmsAssessmentRow = {
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

export type YBalanceAssessmentRow = {
  assessmentId?: string;
  amsId?: string;
  matchedAthleteName?: string;
  dateIso?: string;
  testType?: string;
  compositeScore?: number;
  riskFlag?: string;
};

export type FmsExerciseScoreRow = {
  assessmentId?: string;
  amsId?: string;
  sourceAthleteName?: string;
  dateIso?: string;
  exerciseName?: string;
  pointScore?: number;
  asymmetryRaw?: string;
  correctionPriorityRank?: number;
};

export type YBalanceMetricRow = {
  assessmentId?: string;
  amsId?: string;
  sourceAthleteName?: string;
  dateIso?: string;
  testType?: string;
  side?: string;
  metric?: string;
  value?: number;
  unit?: string;
};

export type ValdNordbordTestRow = {
  amsId?: string;
  tenantId?: string;
  valdProfileId?: string;
  testId?: string;
  modifiedDateUtc?: string;
  testDateUtc?: string;
  testTypeId?: string;
  testTypeName?: string;
  notes?: string | null;
  device?: string;
  leftMaxForce?: number;
  rightMaxForce?: number;
  leftAvgForce?: number;
  rightAvgForce?: number;
} & Record<string, unknown>;

export type ValdNordbordMetricRow = {
  amsId?: string;
  tenantId?: string;
  valdProfileId?: string;
  athleteId?: string;
  testId?: string;
  leftMaxForcePerKg?: number | null;
  rightMaxForcePerKg?: number | null;
  leftAvgForcePerKg?: number | null;
  rightAvgForcePerKg?: number | null;
  leftAvgTimeToMaxForceSeconds?: number | null;
  rightAvgTimeToMaxForceSeconds?: number | null;
} & Record<string, unknown>;

export type ValdForceFrameTestRow = {
  amsId?: string;
  tenantId?: string;
  valdProfileId?: string;
  testId?: string;
  modifiedDateUtc?: string;
  testDateUtc?: string;
  testTypeId?: string;
  testTypeName?: string;
  testPositionId?: string;
  testPositionName?: string;
  notes?: string | null;
  device?: string;
} & Record<string, unknown>;

export type ValdForceFrameMetricRow = {
  amsId?: string;
  tenantId?: string;
  valdProfileId?: string;
  athleteId?: string;
  testId?: string;
} & Record<string, unknown>;

export type ValdForceFrameRepetitionRow = {
  amsId?: string;
  tenantId?: string;
  valdProfileId?: string;
  id?: string;
  testId?: string;
  sensorType?: string | number;
  repNumber?: number;
} & Record<string, unknown>;

export type RehabServiceRow = {
  dateIso?: string;
  serviceCode?: string;
  serviceName?: string;
  count?: number;
  isOffDay?: boolean;
  source?: string;
  sourceUrl?: string;
};

export type SyncAuditRow = {
  amsId?: string;
  source?: string;
  hasData?: string;
  lastUpdated?: string;
  recordCount?: string;
  notes?: string;
};

export type PlayerMasterRow = {
  amsId?: string;
  slug?: string;
  fullName?: string;
  displayName?: string;
  shirtNumber?: number | string | null;
  position?: string | null;
  nationality?: string | null;
  birthDate?: string | null;
  height?: string | null;
  weight?: string | null;
  preferredFoot?: string | null;
  ligaMxId?: number | string | null;
  ligaMxNui?: number | string | null;
  sofascoreId?: number | string | null;
  sofascoreUrl?: string | null;
  fbrefId?: string | null;
  gpsProviderId?: string | null;
  activeStatus?: string | null;
};

export type PlayerSeasonHistoryRow = {
  amsId?: string;
  source?: string;
  season?: string;
  tournament?: string;
  phase?: string;
  division?: string;
  club?: string;
  clubId?: number;
  gamesPlayed?: number;
  minutesPlayed?: number;
  starts?: number;
  goals?: number;
  ownGoals?: number;
  yellowCards?: number;
  redCards?: number;
};

export type PlayerMatchHistoryRow = {
  amsId?: string;
  source?: string;
  sourcePlayerId?: number | string;
  season?: string;
  tournament?: string;
  phase?: string;
  jornada?: string;
  dateRaw?: string;
  dateIso?: string;
  dateDisplay?: string;
  localTeam?: string;
  localClubId?: number;
  localGoals?: number;
  visitorTeam?: string;
  visitorClubId?: number;
  visitorGoals?: number;
  venue?: string;
  status?: string;
  minutes?: number;
  starter?: string;
};

export type LoadSummary = {
  rows: CleanGpsRow[];
  totalDistance: number;
  highIntensity: number;
  maxSpeed: number;
  sessions: number;
  status: string;
};

export type SourceData = {
  injuries: InjuryRow[];
  injuryLastSynced?: string;
  injurySourceLabel?: string;
  bodyComp: BodyCompRow[];
  fms: FmsAssessmentRow[];
  fmsExerciseScores: FmsExerciseScoreRow[];
  yBalance: YBalanceAssessmentRow[];
  yBalanceMetrics: YBalanceMetricRow[];
  valdNordbordTests: ValdNordbordTestRow[];
  valdNordbordMetrics: ValdNordbordMetricRow[];
  rehabServices: RehabServiceRow[];
  syncAudit: SyncAuditRow[];
  playerMaster: PlayerMasterRow[];
  playerSeasonHistory: PlayerSeasonHistoryRow[];
  playerMatchHistory: PlayerMatchHistoryRow[];
  status: string;
};

export type RawSourcePreview = {
  label: string;
  path: string;
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  totalRows?: number;
  truncated: boolean;
  error?: string;
};

export type InjuryApiPayload = {
  rows?: InjuryRow[];
  meta?: {
    sourceLabel?: string;
    lastSynced?: string;
    rowCount?: number;
    cacheSeconds?: number;
  };
  error?: string;
};

export type BodyCompApiPayload = {
  rows?: BodyCompRow[];
  meta?: {
    sourceLabel?: string;
    lastSynced?: string;
    rowCount?: number;
    cacheSeconds?: number;
  };
  error?: string;
};

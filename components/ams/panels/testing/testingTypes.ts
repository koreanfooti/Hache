import type { AmsLanguage } from "@/components/ams/ui/AmsUi";
import type {
  FmsAssessmentRow,
  FmsExerciseScoreRow,
  ValdNordbordMetricRow,
  ValdNordbordTestRow,
  YBalanceAssessmentRow,
  YBalanceMetricRow,
} from "@/lib/ams/types";

export type TestingCategory = "vald" | "fms" | "yBalance";
export type ValdDevice = "forceframe" | "nordbord";

export type TestingBatteryCopy = {
  common: Record<string, string>;
  development: Record<string, string>;
};

export type TestingBatteryPanelProps = {
  copy: TestingBatteryCopy;
  language: AmsLanguage;
  fms: FmsAssessmentRow[];
  fmsExerciseScores: FmsExerciseScoreRow[];
  yBalance: YBalanceAssessmentRow[];
  yBalanceMetrics: YBalanceMetricRow[];
  valdNordbordTests: ValdNordbordTestRow[];
  valdNordbordMetrics: ValdNordbordMetricRow[];
};

export type TestingCategoryCardData = {
  copy: string;
  eyebrow: string;
  id: TestingCategory;
  image?: string;
  label?: string;
  stat: string;
  title: string;
};

export type ValdDeviceCardData = {
  copy: string;
  id: ValdDevice;
  image?: string;
  label?: string;
  stat: string;
  title: string;
};

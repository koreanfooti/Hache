import type { AmsLanguage } from "@/components/ams/ui/AmsUi";
import type { ValdNordbordMetricRow, ValdNordbordTestRow } from "@/lib/ams/types";

export type NordbordDashboardProps = {
  copy: {
    common: Record<string, string>;
    development: Record<string, string>;
  };
  language: AmsLanguage;
  metrics: ValdNordbordMetricRow[];
  tests: ValdNordbordTestRow[];
};

export type ForceSeriesPoint = {
  asymmetry: number;
  date: string;
  displayDate: string;
  left: number;
  right: number;
  testId: string;
  type: string;
};

export type NordbordTestFilterOption = {
  id: string;
  label: string;
  type: string;
};

import type { AmsLanguage } from "@/components/ams/ui/AmsUi";
import type {
  ValdForceFrameMetricRow,
  ValdForceFrameRepetitionRow,
  ValdForceFrameTestRow,
} from "@/lib/ams/types";

export type ForceFrameDirection = "pull" | "squeeze";

export type ForceFrameRefreshPayload = {
  tests: ValdForceFrameTestRow[];
  metrics: ValdForceFrameMetricRow[];
  repetitions: ValdForceFrameRepetitionRow[];
  meta?: {
    lastSynced?: string;
    modifiedFromUtc?: string;
    sourceLabel?: string;
    profileCount?: number;
    testCount?: number;
    metricCount?: number;
    repetitionCount?: number;
    unmappedCount?: number;
  };
};

export type ForceFrameDashboardProps = {
  copy: {
    common: Record<string, string>;
    development: Record<string, string>;
  };
  language: AmsLanguage;
  onRefreshData?: (payload: ForceFrameRefreshPayload) => void;
  payload: ForceFrameRefreshPayload | null;
};

export type ForceFrameSeriesPoint = {
  asymmetry: number;
  date: string;
  direction: ForceFrameDirection;
  displayDate: string;
  left: number;
  position: string;
  right: number;
  testId: string;
  type: string;
};

type RecoveryCopy = Record<string, string | readonly string[]> & {
  kicker: string;
  title: string;
  copy: string;
};

export type DataPanelCopy = {
  common: Record<string, string>;
  load: Record<string, string>;
  injury: Record<string, string>;
  development: Record<string, string>;
  bodyComp: Record<string, string>;
  recovery: RecoveryCopy;
};

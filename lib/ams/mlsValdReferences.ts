export type MlsValdReferenceRow = {
  key: string;
  test: string;
  metric: string;
  unit: string;
  p1: string;
  p25: string;
  p50: string;
  p75: string;
  p99: string;
};

export const mlsValdReferenceSource = "VALD 2024 MLS End of Season Report, MLS 2024 percentile tables";

export const mlsValdReferenceRows: MlsValdReferenceRow[] = [
  { key: "nordic-nordic-force", test: "Nordic", metric: "Nordic Force", unit: "N", p1: "220 N", p25: "352 N", p50: "408 N", p75: "461 N", p99: "597 N" },
  { key: "nordic-nordic-imbalance", test: "Nordic", metric: "Nordic Imbalance", unit: "%", p1: "25%", p25: "12%", p50: "7%", p75: "3%", p99: "0%" },
  { key: "iso-30-max-force", test: "ISO 30", metric: "Max Force", unit: "N", p1: "200 N", p25: "367 N", p50: "445 N", p75: "528 N", p99: "688 N" },
  { key: "iso-30-max-imbalance", test: "ISO 30", metric: "Max Imbalance", unit: "%", p1: "24%", p25: "11%", p50: "6%", p75: "3%", p99: "0%" },
  { key: "hip-add-abd-45-adduction-force", test: "Hip Add/Abd - 45", metric: "Adduction Force", unit: "N", p1: "161 N", p25: "317 N", p50: "399 N", p75: "481 N", p99: "632 N" },
  { key: "hip-add-abd-45-abduction-force", test: "Hip Add/Abd - 45", metric: "Abduction Force", unit: "N", p1: "194 N", p25: "345 N", p50: "404 N", p75: "458 N", p99: "600 N" },
  { key: "hip-add-abd-45-adduction-imbalance", test: "Hip Add/Abd - 45", metric: "Adduction Imbalance", unit: "%", p1: "14%", p25: "6%", p50: "4%", p75: "1%", p99: "0%" },
  { key: "hip-add-abd-45-abduction-imbalance", test: "Hip Add/Abd - 45", metric: "Abduction Imbalance", unit: "%", p1: "13%", p25: "7%", p50: "4%", p75: "2%", p99: "0%" },
  { key: "hip-add-abd-45-add-abd-ratio", test: "Hip Add/Abd - 45", metric: "Add/Abd Ratio", unit: "", p1: "0.57", p25: "0.86", p50: "0.99", p75: "1.12", p99: "1.43" },
  { key: "hip-add-abd-60-adduction-force", test: "Hip Add/Abd - 60", metric: "Adduction Force", unit: "N", p1: "174 N", p25: "347 N", p50: "425 N", p75: "491 N", p99: "668 N" },
  { key: "hip-add-abd-60-abduction-force", test: "Hip Add/Abd - 60", metric: "Abduction Force", unit: "N", p1: "208 N", p25: "348 N", p50: "405 N", p75: "457 N", p99: "596 N" },
  { key: "hip-add-abd-60-adduction-imbalance", test: "Hip Add/Abd - 60", metric: "Adduction Imbalance", unit: "%", p1: "14%", p25: "6%", p50: "4%", p75: "2%", p99: "0%" },
  { key: "hip-add-abd-60-abduction-imbalance", test: "Hip Add/Abd - 60", metric: "Abduction Imbalance", unit: "%", p1: "14%", p25: "7%", p50: "4%", p75: "2%", p99: "0%" },
  { key: "hip-add-abd-60-add-abd-ratio", test: "Hip Add/Abd - 60", metric: "Add/Abd Ratio", unit: "", p1: "0.64", p25: "0.92", p50: "1.05", p75: "1.18", p99: "1.52" },
  { key: "hip-add-abd-supine-ankle-adduction-force", test: "Hip Add/Abd - Supine (Ankle)", metric: "Adduction Force", unit: "N", p1: "106 N", p25: "162 N", p50: "190 N", p75: "224 N", p99: "301 N" },
  { key: "hip-add-abd-supine-ankle-abduction-force", test: "Hip Add/Abd - Supine (Ankle)", metric: "Abduction Force", unit: "N", p1: "108 N", p25: "152 N", p50: "177 N", p75: "204 N", p99: "262 N" },
  { key: "hip-add-abd-supine-ankle-adduction-imbalance", test: "Hip Add/Abd - Supine (Ankle)", metric: "Adduction Imbalance", unit: "%", p1: "17%", p25: "8%", p50: "4%", p75: "2%", p99: "0%" },
  { key: "hip-add-abd-supine-ankle-abduction-imbalance", test: "Hip Add/Abd - Supine (Ankle)", metric: "Abduction Imbalance", unit: "%", p1: "16%", p25: "7%", p50: "4%", p75: "2%", p99: "0%" },
  { key: "hip-add-abd-supine-ankle-add-abd-ratio", test: "Hip Add/Abd - Supine (Ankle)", metric: "Add/Abd Ratio", unit: "", p1: "0.68", p25: "0.96", p50: "1.09", p75: "1.23", p99: "1.57" },
  { key: "cmj-relative-concentric-peak-power", test: "CMJ", metric: "Relative Concentric Peak Power", unit: "W/kg", p1: "41 W/kg", p25: "51 W/kg", p50: "55 W/kg", p75: "59 W/kg", p99: "70 W/kg" },
  { key: "cmj-relative-eccentric-peak-power", test: "CMJ", metric: "Relative Eccentric Peak Power", unit: "W/kg", p1: "7 W/kg", p25: "17 W/kg", p50: "21 W/kg", p75: "26 W/kg", p99: "38 W/kg" },
  { key: "cmj-modified-rsi", test: "CMJ", metric: "Modified RSI", unit: "m/s", p1: "0.29 m/s", p25: "0.47 m/s", p50: "0.54 m/s", p75: "0.62 m/s", p99: "0.8 m/s" },
  { key: "cmj-ft-ct-ratio", test: "CMJ", metric: "FT:CT Ratio", unit: "", p1: "0.49", p25: "0.69", p50: "0.78", p75: "0.86", p99: "1.06" },
  { key: "cmj-jump-height", test: "CMJ", metric: "Jump Height", unit: "cm", p1: "25.5 cm", p25: "34.3 cm", p50: "37.7 cm", p75: "41.3 cm", p99: "50.1 cm" },
  { key: "slj-relative-concentric-peak-power", test: "SLJ", metric: "Relative Concentric Peak Power", unit: "W/kg", p1: "26 W/kg", p25: "34 W/kg", p50: "37 W/kg", p75: "41 W/kg", p99: "51 W/kg" },
  { key: "slj-relative-eccentric-peak-power", test: "SLJ", metric: "Relative Eccentric Peak Power", unit: "W/kg", p1: "3 W/kg", p25: "9 W/kg", p50: "12 W/kg", p75: "15 W/kg", p99: "22 W/kg" },
  { key: "slj-modified-rsi", test: "SLJ", metric: "Modified RSI", unit: "m/s", p1: "0.14 m/s", p25: "0.25 m/s", p50: "0.3 m/s", p75: "0.35 m/s", p99: "0.51 m/s" },
  { key: "slj-ft-ct-ratio", test: "SLJ", metric: "FT:CT Ratio", unit: "", p1: "0.33", p25: "0.49", p50: "0.56", p75: "0.64", p99: "0.86" },
  { key: "slj-jump-height", test: "SLJ", metric: "Jump Height", unit: "cm", p1: "12 cm", p25: "18.8 cm", p50: "21.5 cm", p75: "24.6 cm", p99: "33.2 cm" },
  { key: "imtp-peak-vertical-force", test: "IMTP", metric: "Peak Vertical Force", unit: "N", p1: "1138 N", p25: "2000 N", p50: "2297 N", p75: "2605 N", p99: "3531 N" },
  { key: "imtp-peak-vertical-force-bm", test: "IMTP", metric: "Peak Vertical Force / BM", unit: "N/kg", p1: "21.8 N/kg", p25: "27.8 N/kg", p50: "30.6 N/kg", p75: "33.4 N/kg", p99: "42.4 N/kg" },
  { key: "imtp-rfd-250ms", test: "IMTP", metric: "RFD @ 250ms", unit: "Ns", p1: "530 Ns", p25: "2004 Ns", p50: "3043 Ns", p75: "4156 Ns", p99: "6809 Ns" },
];

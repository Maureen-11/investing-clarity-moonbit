export type Frequency = "daily" | "monthly" | "yearly";
export type Market = "US" | "CN" | "HK";
export type InstrumentKind = "etf" | "index";
export type MarketFilter = "ALL" | Market;
export type UnitMode = "fractional" | "whole";
export type FxMode = "historical" | "fixed";
export type InflationMode = "historical" | "scenario";

export type Security = {
  id: string;
  symbol: string;
  name: string;
  market: Market;
  exchange: string;
  assetType: string;
  aliases: string;
  source: string;
  updated: string;
  instrumentKind?: InstrumentKind | "stock";
};

export type FundDetail = {
  fee: number;
  feeAsOf: string;
  inception: string;
  benchmark: string;
  officialUrl: string;
  issuer: string;
  quoteCurrency: "USD" | "CNY" | "HKD";
  holdings?: number;
  holdingsAsOf?: string;
  spread?: number;
  spreadAsOf?: string;
  yield?: number;
  yieldAsOf?: string;
  turnover?: number;
  turnoverAsOf?: string;
};

export type HistorySeries = {
  source: string;
  retrieved: string;
  firstDate: string;
  lastDate: string;
  points: [string, number][];
  /** Optional provenance fields populated by licensed providers in later phases. */
  seriesType?: "etf-total-return" | "index-total-return" | "price-only" | "vendor-adjusted-price" | "vendor-cumulative-nav";
  licenseStatus?: "verified" | "pending" | "not-confirmed";
  sourceUrl?: string;
  provider?: string;
  providerSymbol?: string;
  adjustment?: "forward-adjusted" | "back-adjusted" | "cumulative-net-value-including-distributions" | "none";
  proxyUntil?: string;
  proxyLabel?: string;
  instrumentKind?: InstrumentKind;
  lastAttempt?: string;
  updateWarning?: string;
};
export type HistoryLibrary = Record<string, HistorySeries>;

export type EtfPackEntry = {
  id: string;
  symbol: string;
  name: string;
  market: Market;
  instrumentKind: InstrumentKind;
  category: string;
  benchmark: string | null;
  trackingIndex?: string | null;
  issuer: string | null;
  fee: number | null;
  feeAsOf: string | null;
  inception: string | null;
  listingDate?: string | null;
  managementFee?: number | null;
  custodianFee?: number | null;
  feeLabel?: string | null;
  distributionPolicy?: string | null;
  quoteCurrency?: "USD" | "CNY" | "HKD";
  metadataStatus?: "verified-official-detail" | "secondary-detail-with-official-listing" | "official-listing-only";
  metadataAsOf?: string;
  officialListingUrl?: string;
  officialProductUrl?: string | null;
  detailSourceUrl?: string | null;
  detailSourceType?: "official" | "secondary" | null;
  firstDate: string | null;
  lastDate: string | null;
  retrieved: string | null;
  sourceUrl: string | null;
  historyPath: string | null;
  seriesType: HistorySeries["seriesType"] | null;
  adjustment?: HistorySeries["adjustment"] | null;
  provider?: string | null;
  providerSymbol?: string | null;
  dataStatus: "verified-history" | "history-available" | "metadata-only";
  licenseStatus: "verified" | "pending" | "not-confirmed";
  publicHistoryEligible: boolean;
};

export type IndexPackEntry = Omit<EtfPackEntry, "issuer" | "benchmark" | "fee" | "feeAsOf" | "inception" | "publicHistoryEligible"> & {
  instrumentKind: "index";
  sourceUrl: string;
  relatedEtfIds?: string[];
  publicHistoryEligible: boolean;
};

export type EtfPackManifest = {
  version: number;
  generated: string;
  scope: "curated-100" | "curated-300-plus-15-indices";
  counts: { total: number; CN: number; US: number; HK: number };
  indexCounts?: { total: number; CN: number; US: number; HK: number };
  notes: string;
  entries: EtfPackEntry[];
  indices?: IndexPackEntry[];
};

export type MacroSeries = {
  source: string;
  sourceUrl: string;
  definition: string;
  firstDate: string;
  lastDate: string;
  points: [string, number][];
};

export type MacroHistory = {
  retrieved: string;
  fx: { USD_CNY?: MacroSeries; HKD_CNY?: MacroSeries };
  cpiCny?: MacroSeries;
};

export type PathPoint = { date: string; value: number; principal: number; realValue: number; realPrincipal: number };
export type Replay = {
  anchorDate: string;
  start: string;
  end: string;
  startIndex: number;
  endIndex: number;
  endValue: number;
  realEndValue: number;
  principal: number;
  contributions: number;
  multiple: number;
  productMaxDrawdown: number;
  accountWorstReturn: number;
  recoveryDays: number;
  estimatedDirectFee: number | null;
  feeDrag: number | null;
  feeRateKnown: boolean;
  inflationFactor: number;
  startFx: number;
  endFx: number;
  path?: PathPoint[];
};

export type RollingReplay = {
  samples: number;
  requestedYears: number;
  firstDate: string;
  lastDate: string;
  worst: Replay;
  median: Replay;
  best: Replay;
  lossShare: number;
  limited: boolean;
};

export type ReplayOptions = {
  frequency: Frequency;
  payment: number;
  initial: number;
  inflation: number;
  contributionGrowth: boolean;
  fxRate: number;
  fxMode?: FxMode;
  fxPoints?: [string, number][];
  inflationMode?: InflationMode;
  cpiPoints?: [string, number][];
  scheduleDay?: number;
  unitMode: UnitMode;
  lotSize: number;
  feeRate: number;
};

export type CalendarAnalysis = {
  start: Date;
  end: Date;
  totalDays: number;
  weekends: number;
  exactHolidays: number;
  estimatedHolidays: number;
  tradingDays: number;
  contributions: number;
  nonContribution: number;
  tradableNonContribution: number;
  exact: boolean;
  estimatedYears: number[];
  previewDates: string[];
  contributionCountsByYear: number[];
};

export type ProductMetrics = {
  cagr: number | null;
  volatility: number | null;
  maxDrawdown: number;
  drawdownWindow: string;
  recoveryDays: number;
  worstYear: { year: string; value: number } | null;
  bestYear: { year: string; value: number } | null;
  positiveOneYear: number | null;
  recovered: boolean;
  annualReturns: { year: string; value: number }[];
  growth: { date: string; value: number }[];
  drawdowns: { date: string; value: number }[];
};

export const MARKET_META: Record<Market, { short: string; name: string; days: number; source: string; currency: "USD" | "CNY" | "HKD"; defaultFx: number; lotSize: number }> = {
  US: { short: "美股", name: "美股（NYSE / Nasdaq）", days: 252, source: "NYSE 已公布交易日历", currency: "USD", defaultFx: 7.2, lotSize: 1 },
  CN: { short: "A股", name: "A股（上交所 / 深交所）", days: 242, source: "沪深交易所已公布交易日历", currency: "CNY", defaultFx: 1, lotSize: 100 },
  HK: { short: "港股", name: "港股（香港交易所）", days: 250, source: "港交所已公布交易日历", currency: "HKD", defaultFx: .93, lotSize: 100 },
};


// Calendar span for presentation only. Financial calculations run in MoonBit.
export function dayDistance(a:string,b:string){return Math.max(0,Math.round((Date.parse(b)-Date.parse(a))/86400000))}

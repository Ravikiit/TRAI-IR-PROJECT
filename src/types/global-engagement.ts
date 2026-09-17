export type EngagementCategory = "MoU/LoI" | "Other Regulator / Engagement";

export type GlobalEngagementActivity = {
  country: string;
  counterpart: string | null;
  engagement: string;
  /** Human-readable source value. Never replace this with the machine date in the UI. */
  dateDisplay: string | null;
  /** ISO source date used only for ordering and filtering. */
  startDate: string | null;
  /** ISO source date used only for ordering and filtering. */
  endDate: string | null;
  remarks: string | null;
  category: EngagementCategory;
};

export type CountryMasterRecord = {
  country: string;
  category: EngagementCategory;
  hasMouLoi: boolean;
  /** Retained from Country Master; activity totals in the UI are calculated from source records. */
  sourceTotalActivities: number;
  firstEngagement: string | null;
  latestEngagement: string | null;
};

/** Longitude and latitude in decimal degrees. */
export type MapCoordinate = { x: number; y: number };

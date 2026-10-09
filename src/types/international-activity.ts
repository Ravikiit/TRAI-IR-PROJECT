export type VerificationStatus =
  | "Confirmed"
  | "Confirmed; exact date to verify"
  | "User submitted";

export type InternationalActivity = {
  /** Stable UI key. The source workbook's Activity ID is retained separately. */
  key: string;
  activityId: string;
  date: string;
  /** Used only to place records chronologically; it never replaces the source date. */
  dateSort: string;
  location: string;
  region: string;
  counterpart: string;
  activityType: string;
  title: string;
  description: string;
  participants: string;
  theme: string;
  outcome: string;
  source: string;
  sourceUrl: string | null;
  sourceAuthority: string;
  verificationStatus: VerificationStatus;
  documentUrl?: string;
};

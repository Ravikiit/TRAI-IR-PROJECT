import { countryMasterRecords, mouLoiActivityRecords, otherRegulatorActivityRecords } from "@/content/global-engagement-data";
import type { CountryMasterRecord, GlobalEngagementActivity, MapCoordinate } from "@/types/global-engagement";

/**
 * This module is the sole browser-facing projection of the authoritative workbook.
 * The two activity sheets deliberately remain separate; country summaries are derived
 * from them at render time so the records are never stored twice.
 */
export const mouLoiActivities = mouLoiActivityRecords as readonly GlobalEngagementActivity[];
export const otherRegulatorActivities = otherRegulatorActivityRecords as readonly GlobalEngagementActivity[];
export const globalEngagementCountryMaster = countryMasterRecords as readonly CountryMasterRecord[];

const sourceCountryAliases: Record<string, string> = {
  "European Union": "Europian Union (EU)",
  "European Union (EU)": "Europian Union (EU)",
  "Sri Lanka": "Sri Lanka/ Colombo",
  "Turkey": "Turkey",
  "Türkiye": "Turkey",
  "United Arab Emirates": "United Arab Emirates (UAE)",
  "United Arab Emirates (UAE)": "United Arab Emirates (UAE)",
  "Viet Nam": "Vietnam",
  "Vanuatu": "Vanuatu",
};

export function countryKey(country: string) {
  return sourceCountryAliases[country] ?? country;
}

export function allEngagementActivities() {
  return [...mouLoiActivities, ...otherRegulatorActivities];
}

export function activitiesForCountry(country: string) {
  const key = countryKey(country);
  return allEngagementActivities().filter((activity) => countryKey(activity.country) === key);
}

/** Geographic marker centroids used only to place the source-backed country records. */
export const countryMapCoordinates: Record<string, MapCoordinate> = {
  Afghanistan: { x: 66, y: 34 }, Algeria: { x: 3, y: 28 }, Australia: { x: 134, y: -25 }, Bangladesh: { x: 90, y: 24 },
  Bhutan: { x: 90, y: 28 }, Botswana: { x: 25, y: -22 }, Brazil: { x: -52, y: -10 }, Cambodia: { x: 105, y: 13 },
  Chad: { x: 19, y: 15 }, Egypt: { x: 30, y: 27 }, "Europian Union (EU)": { x: 10, y: 51 }, France: { x: 2, y: 46 },
  Georgia: { x: 44, y: 42 }, Greece: { x: 22, y: 39 }, Japan: { x: 138, y: 37 }, Malaysia: { x: 102, y: 4 },
  Mauritius: { x: 58, y: -20 }, "Saudi Arabia": { x: 45, y: 24 }, Singapore: { x: 104, y: 1 }, "South Africa": { x: 24, y: -29 },
  "Sri Lanka/ Colombo": { x: 81, y: 7 }, Sudan: { x: 30, y: 13 }, Sweden: { x: 15, y: 62 }, Tanzania: { x: 35, y: -6 },
  Thailand: { x: 101, y: 15 }, Turkey: { x: 35, y: 39 }, Uganda: { x: 32, y: 1 }, "United Arab Emirates (UAE)": { x: 54, y: 24 },
  "United Kingdom": { x: -3, y: 55 }, "United States of America": { x: -98, y: 39 }, Vanuatu: { x: 167, y: -16 }, Vietnam: { x: 108, y: 16 },
};

const locationCountryCodes: Record<string, string> = {
  India: "in",
  Switzerland: "ch",
  "Geneva, Switzerland": "ch",
  Uzbekistan: "uz",
  Greece: "gr",
  Philippines: "ph",
  Norway: "no",
  "Saudi Arabia": "sa",
  Mexico: "mx",
  Qatar: "qa",
  "Doha, Qatar": "qa",
  "Bhubaneswar, India": "in",
  "New Delhi, India": "in",
  "London, UK": "gb",
  "Kampala, Uganda": "ug",
  "Chiang Mai, Thailand": "th",
  "Seoul, Republic of Korea": "kr",
  "Riyadh, Saudi Arabia": "sa",
};

/** A deliberate mapping for source-location labels. Mixed locations remain unflagged. */
export function CountryFlag({ location }: { location: string }) {
  const countryCode = locationCountryCodes[location];
  if (!countryCode) return null;

  return <span className={`fi fi-${countryCode} country-flag`} aria-hidden="true" />;
}

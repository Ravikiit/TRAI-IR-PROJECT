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
};

/** A deliberate mapping for source-location labels. Mixed locations remain unflagged. */
export function CountryFlag({ location }: { location: string }) {
  const countryCode = locationCountryCodes[location];
  if (!countryCode) return null;

  return <span className={`fi fi-${countryCode} country-flag`} aria-hidden="true" />;
}

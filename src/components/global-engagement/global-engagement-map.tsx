"use client";

import { useEffect, useMemo, useState } from "react";
import { countryKey, countryMapCoordinates } from "@/content/global-engagement";
import type { CountryMasterRecord, GlobalEngagementActivity } from "@/types/global-engagement";
import styles from "./global-engagement-map.module.css";

type Props = { countryMaster: readonly CountryMasterRecord[]; mouLoiActivities: readonly GlobalEngagementActivity[]; otherRegulatorActivities: readonly GlobalEngagementActivity[] };
type CountrySummary = CountryMasterRecord & { activities: GlobalEngagementActivity[] };
type Point = [number, number];
type Geography = { type: "Polygon" | "MultiPolygon"; coordinates: Point[][] | Point[][][] };
type FeatureCollection = { features: { geometry: Geography | null }[] };

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const RECENT_ACTIVITY_LIMIT = 5;
const countryFlagCodes: Record<string, string> = {
  Afghanistan: "af", Algeria: "dz", Australia: "au", Bangladesh: "bd", Bhutan: "bt", Botswana: "bw", Brazil: "br", Cambodia: "kh", Chad: "td", Egypt: "eg", "Europian Union (EU)": "eu", France: "fr", Georgia: "ge", Greece: "gr", Japan: "jp", Malaysia: "my", Mauritius: "mu", "Saudi Arabia": "sa", Singapore: "sg", "South Africa": "za", "Sri Lanka/ Colombo": "lk", Sudan: "sd", Sweden: "se", Tanzania: "tz", Thailand: "th", Turkey: "tr", Uganda: "ug", "United Arab Emirates (UAE)": "ae", "United Kingdom": "gb", "United States of America": "us", Vanuatu: "vu", Vietnam: "vn",
};

function project([longitude, latitude]: Point): Point { return [((longitude + 180) / 360) * MAP_WIDTH, ((90 - latitude) / 180) * MAP_HEIGHT]; }
function ringPath(ring: Point[]) { return ring.map((point, index) => { const [x, y] = project(point); return `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`; }).join("") + "Z"; }
function geographyPath(geometry: Geography) { const polygons = geometry.type === "Polygon" ? [geometry.coordinates as Point[][]] : geometry.coordinates as Point[][][]; return polygons.flatMap((polygon) => polygon.map(ringPath)).join(""); }
function geographicMarkerPosition({ x: longitude, y: latitude }: { x: number; y: number }) { return { left: `${((longitude + 180) / 360) * 100}%`, top: `${((90 - latitude) / 180) * 100}%` }; }
function sortActivities(activities: readonly GlobalEngagementActivity[]) { return [...activities].sort((a, b) => (b.startDate ?? b.endDate ?? "").localeCompare(a.startDate ?? a.endDate ?? "")); }

export function GlobalEngagementMap({ countryMaster, mouLoiActivities, otherRegulatorActivities }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [year, setYear] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [worldPaths, setWorldPaths] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const allActivities = useMemo(() => [...mouLoiActivities, ...otherRegulatorActivities], [mouLoiActivities, otherRegulatorActivities]);
  const years = useMemo(() => [...new Set(allActivities.flatMap((activity) => activity.startDate ? [activity.startDate.slice(0, 4)] : []))].sort((a, b) => b.localeCompare(a)), [allActivities]);
  const summaries = useMemo<CountrySummary[]>(() => countryMaster.map((record) => ({ ...record, activities: allActivities.filter((activity) => countryKey(activity.country) === record.country) })), [allActivities, countryMaster]);
  const visibleCountries = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return summaries.filter((country) => {
      const hasMatchingActivity = country.activities.some((activity) => year === "all" || activity.startDate?.startsWith(year));
      return hasMatchingActivity && (status === "all" || (status === "mou" ? country.hasMouLoi : !country.hasMouLoi)) && (!term || country.country.toLocaleLowerCase().includes(term));
    });
  }, [query, status, summaries, year]);
  const visibleCountryNames = useMemo(() => new Set(visibleCountries.map((country) => country.country)), [visibleCountries]);
  const visibleActivities = useMemo(() => allActivities.filter((activity) => visibleCountryNames.has(countryKey(activity.country)) && (year === "all" || activity.startDate?.startsWith(year))), [allActivities, visibleCountryNames, year]);
  const selected = selectedCountry && visibleCountryNames.has(selectedCountry) ? summaries.find((country) => country.country === selectedCountry) ?? null : null;
  const selectedActivities = useMemo(() => sortActivities(selected?.activities.filter((activity) => year === "all" || activity.startDate?.startsWith(year)) ?? []), [selected, year]);
  const displayedActivities = showAllActivities ? selectedActivities : selectedActivities.slice(0, RECENT_ACTIVITY_LIMIT);

  useEffect(() => {
    let active = true;
    fetch("/world-countries.geojson").then((response) => response.ok ? response.json() : Promise.reject(new Error("World map unavailable"))).then((world: FeatureCollection) => { if (active) setWorldPaths(world.features.flatMap((feature) => feature.geometry ? [geographyPath(feature.geometry)] : [])); }).catch(() => { if (active) setWorldPaths([]); });
    return () => { active = false; };
  }, []);

  function chooseCountry(country: string) { setSelectedCountry(country); setShowAllActivities(false); }

  return <>
    <div className={styles.stats} aria-label="Filtered engagement statistics"><Stat value={visibleCountries.length} label="Countries / locations" /><Stat value={visibleCountries.filter((country) => country.hasMouLoi).length} label="MoU/LoI countries" /><Stat value={visibleCountries.filter((country) => !country.hasMouLoi).length} label="Other engagement countries" /><Stat value={visibleActivities.length} label="Total engagements" /></div>
    <div className={styles.toolbar}><label className={styles.search}><span className="sr-only">Search country</span><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search country" /></label><label>MoU/LoI status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="mou">MoU/LoI</option><option value="other">Other regulator / engagement</option></select></label><label>Year<select value={year} onChange={(event) => setYear(event.target.value)}><option value="all">All years</option>{years.map((item) => <option value={item} key={item}>{item}</option>)}</select></label></div>
    <div className={styles.legend} aria-label="Map legend"><span><i className={styles.mouDot} />MoU/LoI</span><span><i className={styles.otherDot} />Other International Engagement</span><p>{visibleCountries.length} country markers shown</p></div>
    <div className={styles.mapLayout}>
      <CountryProfile country={selected} activities={selectedActivities} onViewAll={() => setShowAllActivities(true)} />
      <div className={styles.mapFrame}><div className={styles.mapStage} style={{ transform: `scale(${zoom})` }}><svg className={styles.map} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="img" aria-label="Geographic world map showing TRAI international engagement markers"><rect width={MAP_WIDTH} height={MAP_HEIGHT} rx="12" className={styles.ocean} /><g className={styles.graticule} aria-hidden="true"><path d="M0 125h1000M0 250h1000M0 375h1000M250 0v500M500 0v500M750 0v500" /></g><g className={styles.geography} aria-hidden="true">{worldPaths.map((path, index) => <path d={path} key={index} />)}</g></svg>{visibleCountries.map((country) => { const position = countryMapCoordinates[country.country]; if (!position) return null; return <button key={country.country} className={`${styles.marker} ${country.hasMouLoi ? styles.markerMou : styles.markerOther} ${selected?.country === country.country ? styles.markerSelected : ""}`} style={geographicMarkerPosition(position)} onClick={() => chooseCountry(country.country)} title={`Open ${country.country}`} aria-label={`Open ${country.country}: ${country.hasMouLoi ? "MoU/LoI" : "other international engagement"}`} aria-pressed={selected?.country === country.country}><span className="sr-only">{country.country}</span></button>; })}</div><div className={styles.mapControls} aria-label="Map zoom controls"><button type="button" onClick={() => setZoom((value) => Math.min(2.25, value + 0.25))} aria-label="Zoom in" title="Zoom in">+</button><button type="button" onClick={() => setZoom((value) => Math.max(1, value - 0.25))} aria-label="Zoom out" title="Zoom out" disabled={zoom === 1}>−</button><button type="button" onClick={() => setZoom(1)} aria-label="Fit world view" title="Fit world view" disabled={zoom === 1}>⌂</button></div><p className={styles.zoomStatus} aria-live="polite">Map zoom {Math.round(zoom * 100)}%</p></div>
    </div>
    <RecentActivities country={selected} activities={displayedActivities} totalActivities={selectedActivities.length} showAll={showAllActivities} onViewAll={() => setShowAllActivities((value) => !value)} />
  </>;
}

function Stat({ value, label }: { value: number; label: string }) { return <div><strong>{value}</strong><span>{label}</span></div>; }
function CountryProfile({ country, activities, onViewAll }: { country: CountrySummary | null; activities: GlobalEngagementActivity[]; onViewAll: () => void }) {
  if (!country) return <aside className={`${styles.profile} ${styles.profileEmpty}`} aria-live="polite"><p className="page-kicker">COUNTRY PROFILE</p><h2>Select a country</h2><p>Choose a marker on the map to view its workbook-backed engagement record.</p></aside>;
  const counterparts = [...new Set(activities.flatMap((activity) => activity.counterpart ? [activity.counterpart] : []))];
  const flagCode = countryFlagCodes[country.country];
  return <aside className={styles.profile} aria-labelledby="country-profile-title" aria-live="polite"><p className="page-kicker">COUNTRY PROFILE</p><div className={styles.profileTitle}>{flagCode ? <span className={`fi fi-${flagCode} country-flag`} aria-hidden="true" /> : null}<h2 id="country-profile-title">{country.country}</h2></div><dl className={styles.profileFields}><ProfileField label="MoU/LoI status" value={country.hasMouLoi ? "MoU/LoI" : "Other International Engagement"} /><ProfileField label="Organisation / Counterpart" value={counterparts.join(" · ") || null} /><ProfileField label="First engagement" value={country.firstEngagement} /><ProfileField label="Latest engagement" value={country.latestEngagement} /></dl><button type="button" className={styles.viewAll} onClick={onViewAll}>View all activities with {country.country} <span aria-hidden="true">→</span></button></aside>;
}
function ProfileField({ label, value }: { label: string; value: string | null }) { return value ? <div><dt>{label}</dt><dd>{value}</dd></div> : null; }
function RecentActivities({ country, activities, totalActivities, showAll, onViewAll }: { country: CountrySummary | null; activities: GlobalEngagementActivity[]; totalActivities: number; showAll: boolean; onViewAll: () => void }) {
  const heading = country ? `Recent Activities (${country.country})` : "Recent Activities";
  return <section className={styles.activities} aria-live="polite" aria-labelledby="recent-activities-title"><div className={styles.activityHeading}><div><h2 id="recent-activities-title">{heading}</h2>{country ? <p>{totalActivities} {totalActivities === 1 ? "engagement" : "engagements"} in the authoritative workbook</p> : <p>Select a country marker to view its activities.</p>}</div>{country ? <button type="button" className={styles.viewAll} onClick={onViewAll}>{showAll && totalActivities > RECENT_ACTIVITY_LIMIT ? "Show recent activities" : <>View all activities <span aria-hidden="true">→</span></>}</button> : null}</div>{country && activities.length ? <div className={styles.tableWrap}><table><thead><tr><th scope="col">Date</th><th scope="col">Activity / Engagement</th><th scope="col">Type</th><th scope="col">Organisation / Counterpart</th></tr></thead><tbody>{activities.map((activity, index) => <tr key={`${activity.country}-${activity.engagement}-${activity.startDate ?? "undated"}-${index}`}><td>{activity.dateDisplay ?? ""}</td><td>{activity.engagement}</td><td>{activity.category}</td><td>{activity.counterpart ?? ""}</td></tr>)}</tbody></table></div> : country ? <p className={styles.empty}>No activities match the selected filters.</p> : null}</section>;
}

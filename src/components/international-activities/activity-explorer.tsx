"use client";

import { useMemo, useState } from "react";
import { CountryFlag } from "@/components/international-activities/country-flag";
import type { InternationalActivity } from "@/types/international-activity";

type View = "activities" | "timeline" | "locations" | "counterparts";

export function ActivityExplorer({ activities }: { activities: InternationalActivity[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All activity types");
  const [region, setRegion] = useState("All regions");
  const [view, setView] = useState<View>("activities");
  const [selected, setSelected] = useState<InternationalActivity | null>(null);
  const types = useMemo(() => [...new Set(activities.map((activity) => activity.activityType))].sort(), [activities]);
  const regions = useMemo(() => [...new Set(activities.map((activity) => activity.region))].sort(), [activities]);
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return activities.filter((activity) => {
      const matchText = !term || [activity.title, activity.description, activity.location, activity.counterpart, activity.theme].some((value) => value.toLocaleLowerCase().includes(term));
      return matchText && (type === "All activity types" || activity.activityType === type) && (region === "All regions" || activity.region === region);
    });
  }, [activities, query, type, region]);

  return <>
    <div className="activity-toolbar">
      <div className="activity-search-wrap"><label className="sr-only" htmlFor="activity-search">Search 2025 activities</label><span aria-hidden="true">⌕</span><input id="activity-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search engagements, locations, counterparts or themes" /></div>
      <div className="activity-filters">
        <label><span>Activity type</span><select value={type} onChange={(event) => setType(event.target.value)}><option>All activity types</option>{types.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Region</span><select value={region} onChange={(event) => setRegion(event.target.value)}><option>All regions</option>{regions.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
    </div>
    <div className="activity-view-bar" aria-label="Activity view">
      {([['activities', 'Activities'], ['timeline', 'Timeline'], ['locations', 'Locations'], ['counterparts', 'Counterparts']] as [View, string][]).map(([value, label]) => <button key={value} type="button" className={view === value ? "is-selected" : ""} onClick={() => setView(value)}>{label}</button>)}
      <p aria-live="polite">{filtered.length} of {activities.length} activities</p>
    </div>
    {view === "activities" && <div className="activity-grid">{filtered.map((activity) => <ActivityCard key={activity.key} activity={activity} onSelect={setSelected} />)}</div>}
    {view === "timeline" && <Timeline activities={filtered} onSelect={setSelected} />}
    {view === "locations" && <GroupedActivities activities={filtered} field="location" onSelect={setSelected} />}
    {view === "counterparts" && <GroupedActivities activities={filtered} field="counterpart" onSelect={setSelected} />}
    {!filtered.length && <p className="no-results" role="status">No activities match these filters.</p>}
    {selected && <ActivityDetail activity={selected} onClose={() => setSelected(null)} />}
  </>;
}

function ActivityCard({ activity, onSelect }: { activity: InternationalActivity; onSelect: (activity: InternationalActivity) => void }) {
  const needsDateCheck = activity.verificationStatus.includes("date to verify");
  return <article className="activity-card"><div className="activity-card-top"><span className="activity-date">{activity.date}</span><span className={needsDateCheck ? "verification-dot needs-review" : "verification-dot"} title={activity.verificationStatus}>{needsDateCheck ? "Date to verify" : "Confirmed"}</span></div><p className="activity-location"><CountryFlag location={activity.location} />{activity.location} <span>·</span> {activity.region}</p><h3>{activity.title}</h3><p className="activity-description">{activity.description}</p><dl><div><dt>Activity type</dt><dd>{activity.activityType}</dd></div><div><dt>International counterpart</dt><dd>{activity.counterpart}</dd></div></dl><button className="text-action" type="button" onClick={() => onSelect(activity)}>View activity record <span aria-hidden="true">→</span></button></article>;
}

function Timeline({ activities, onSelect }: { activities: InternationalActivity[]; onSelect: (activity: InternationalActivity) => void }) {
  return <ol className="timeline-list">{[...activities].sort((a, b) => a.dateSort.localeCompare(b.dateSort)).map((activity) => <li key={activity.key}><div><time>{activity.date}</time><span /></div><button type="button" onClick={() => onSelect(activity)}><strong>{activity.title}</strong><small className="flagged-location"><CountryFlag location={activity.location} />{activity.location} · {activity.counterpart}</small></button></li>)}</ol>;
}

function GroupedActivities({ activities, field, onSelect }: { activities: InternationalActivity[]; field: "location" | "counterpart"; onSelect: (activity: InternationalActivity) => void }) {
  const groups = Object.entries(activities.reduce<Record<string, InternationalActivity[]>>((result, activity) => { (result[activity[field]] ??= []).push(activity); return result; }, {})).sort(([a], [b]) => a.localeCompare(b));
  return <div className="grouped-activities">{groups.map(([name, group]) => <section key={name}><div className="group-heading"><h3>{field === "location" ? <><CountryFlag location={name} />{name}</> : name}</h3><span>{group.length} {group.length === 1 ? "activity" : "activities"}</span></div>{group.map((activity) => <button type="button" key={activity.key} onClick={() => onSelect(activity)}><span>{activity.date}</span><strong>{activity.title}</strong><small>{activity.activityType}</small></button>)}</section>)}</div>;
}

function ActivityDetail({ activity, onClose }: { activity: InternationalActivity; onClose: () => void }) {
  return <div className="detail-overlay" role="presentation" onMouseDown={onClose}><article className="activity-detail" role="dialog" aria-modal="true" aria-labelledby="activity-record-title" onMouseDown={(event) => event.stopPropagation()}><button className="detail-close" type="button" onClick={onClose} aria-label="Close activity record">×</button><p className="page-kicker">{activity.activityId} · {activity.verificationStatus}</p><h2 id="activity-record-title">{activity.title}</h2><div className="detail-meta"><span>{activity.date}</span><span className="flagged-location"><CountryFlag location={activity.location} />{activity.location}</span><span>{activity.region}</span></div><DetailField label="International counterpart" value={activity.counterpart} /><DetailField label="TRAI participants" value={activity.participants} /><DetailField label="Description" value={activity.description} /><DetailField label="Theme / focus" value={activity.theme} /><DetailField label="Key outcome / purpose" value={activity.outcome} /><DetailField label="Source / evidence" value={activity.source} /><p className="detail-source"><a href={activity.sourceUrl} target="_blank" rel="noreferrer">Open supporting source ↗</a><span>{activity.sourceAuthority}</span></p></article></div>;
}

function DetailField({ label, value }: { label: string; value: string }) { return <section className="detail-field"><h3>{label}</h3><p>{value}</p></section>; }

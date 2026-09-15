"use client";

import { useMemo, useState } from "react";
import type { ChairmanSpeech, EngagementType } from "@/types/chairman-speech";
import { SpeechCard } from "./speech-card";
import styles from "./speech-repository.module.css";

type Filters = { search: string; year: string; chairman: string; type: "" | EngagementType; location: string; organisation: string; topic: string };
const emptyFilters: Filters = { search: "", year: "", chairman: "", type: "", location: "", organisation: "", topic: "" };

function unique(values: string[]) { return [...new Set(values.filter(Boolean))].sort((first, second) => first.localeCompare(second)); }

export function SpeechRepository({ speeches }: { speeches: ChairmanSpeech[] }) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const options = useMemo(() => ({
    years: unique(speeches.map((speech) => speech.year)).sort((first, second) => second.localeCompare(first)),
    chairmen: unique(speeches.map((speech) => speech.chairman)),
    locations: unique(speeches.map((speech) => [speech.country, speech.location].filter(Boolean).join(" · "))),
    organisations: unique(speeches.map((speech) => speech.organisation)),
    topics: unique(speeches.flatMap((speech) => speech.topics)),
  }), [speeches]);
  const filteredSpeeches = useMemo(() => speeches.filter((speech) => {
    const searchable = [speech.title, speech.event, speech.organisation, speech.location, speech.country, speech.description, ...speech.topics].join(" ").toLowerCase();
    const location = [speech.country, speech.location].filter(Boolean).join(" · ");
    return (!filters.search || searchable.includes(filters.search.toLowerCase())) && (!filters.year || speech.year === filters.year) && (!filters.chairman || speech.chairman === filters.chairman) && (!filters.type || speech.type === filters.type) && (!filters.location || location === filters.location) && (!filters.organisation || speech.organisation === filters.organisation) && (!filters.topic || speech.topics.includes(filters.topic));
  }), [filters, speeches]);
  const speechesByYear = useMemo(() => filteredSpeeches.reduce<Record<string, ChairmanSpeech[]>>((groups, speech) => { (groups[speech.year] ??= []).push(speech); return groups; }, {}), [filteredSpeeches]);
  const updateFilter = <Key extends keyof Filters>(key: Key, value: Filters[Key]) => setFilters((current) => ({ ...current, [key]: value }));

  return <div className={styles.repository}>
    <div className={styles.toolbar} aria-label="Speech repository filters">
      <label className={styles.searchWrap}><span className="sr-only">Search speeches</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 4.2 4.2" /></svg><input value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} type="search" placeholder="Search speeches, events, organisations or topics…" /></label>
      <div className={styles.filters}>
        <FilterSelect label="Year" value={filters.year} onChange={(value) => updateFilter("year", value)} allLabel="All years" options={options.years} />
        <FilterSelect label="Chairman" value={filters.chairman} onChange={(value) => updateFilter("chairman", value)} allLabel="All chairmen" options={options.chairmen} />
        <FilterSelect label="Engagement Type" value={filters.type} onChange={(value) => updateFilter("type", value as Filters["type"])} allLabel="All" options={["International", "Domestic"]} optionValues={["international", "domestic"]} />
        <FilterSelect label="Country / Location" value={filters.location} onChange={(value) => updateFilter("location", value)} allLabel="All locations" options={options.locations} />
        <FilterSelect label="Organisation / Forum" value={filters.organisation} onChange={(value) => updateFilter("organisation", value)} allLabel="All organisations / forums" options={options.organisations} />
        <FilterSelect label="Topic" value={filters.topic} onChange={(value) => updateFilter("topic", value)} allLabel="All topics" options={options.topics} />
      </div>
      <button className={styles.clearFilters} type="button" onClick={() => setFilters(emptyFilters)}>Clear Filters</button>
    </div>
    {speeches.length === 0 ? <section className={styles.emptyState} aria-live="polite"><div aria-hidden="true" className={styles.emptyIcon}><svg viewBox="0 0 24 24"><path d="M6 4h9l3 3v13H6zM15 4v4h4M9 12h6M9 16h6" /></svg></div><h3>No speeches have been added to the repository yet.</h3><p>Speech records will appear here once the repository is populated.</p></section> : Object.entries(speechesByYear).sort(([first], [second]) => second.localeCompare(first)).map(([year, yearSpeeches]) => <section className={styles.yearGroup} key={year} aria-labelledby={`speech-year-${year}`}><h3 id={`speech-year-${year}`}>{year}</h3><div className={styles.grid}>{yearSpeeches.map((speech) => <SpeechCard key={speech.id} speech={speech} />)}</div></section>)}
  </div>;
}

function FilterSelect({ label, value, onChange, allLabel, options, optionValues }: { label: string; value: string; onChange: (value: string) => void; allLabel: string; options: string[]; optionValues?: string[] }) {
  return <label><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">{allLabel}</option>{options.map((option, index) => <option key={option} value={optionValues?.[index] ?? option}>{option}</option>)}</select></label>;
}

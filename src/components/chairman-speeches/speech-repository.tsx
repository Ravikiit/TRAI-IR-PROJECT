"use client";

import { useMemo, useState } from "react";
import type { ChairmanSpeech } from "@/types/chairman-speech";
import { SpeechCard } from "./speech-card";
import styles from "./speech-repository.module.css";

type Filters = {
  search: string;
  year: string;
  category: string;
  documentType: string;
  theme: string;
};

const emptyFilters: Filters = { search: "", year: "", category: "", documentType: "", theme: "" };

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((first, second) => first.localeCompare(second));
}

function dateValue(date: string) {
  const value = Date.parse(date);
  return Number.isNaN(value) ? 0 : value;
}

export function SpeechRepository({ speeches }: { speeches: ChairmanSpeech[] }) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const options = useMemo(() => ({
    years: unique(speeches.map((speech) => String(speech.Year))).sort((a, b) => b.localeCompare(a)),
    categories: unique(speeches.map((speech) => speech["Broad Category"])),
    documentTypes: unique(speeches.map((speech) => speech["Document Type"])),
    themes: unique(speeches.map((speech) => speech["Standardised Theme"])),
  }), [speeches]);
  const filteredSpeeches = useMemo(() => speeches
    .filter((speech) => {
      const searchable = [
        speech.Title,
        speech.Event,
        speech["Broad Category"],
        speech["Standardised Theme"],
        speech["Short Description"],
      ].join(" ").toLowerCase();
      return (!filters.search || searchable.includes(filters.search.toLowerCase()))
        && (!filters.year || String(speech.Year) === filters.year)
        && (!filters.category || speech["Broad Category"] === filters.category)
        && (!filters.documentType || speech["Document Type"] === filters.documentType)
        && (!filters.theme || speech["Standardised Theme"] === filters.theme);
    })
    .sort((first, second) => dateValue(second.Date) - dateValue(first.Date)), [filters, speeches]);
  const updateFilter = <Key extends keyof Filters>(key: Key, value: Filters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className={styles.repository}>
      <div className={styles.toolbar} aria-label="Authority speeches filters">
        <label className={styles.searchWrap}>
          <span className="sr-only">Search speeches</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 4.2 4.2" /></svg>
          <input value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} type="search" placeholder="Search speeches, events or topics..." />
        </label>
        <div className={styles.filters}>
          <FilterSelect label="Year" value={filters.year} onChange={(value) => updateFilter("year", value)} allLabel="All years" options={options.years} />
          <FilterSelect label="Broad Category" value={filters.category} onChange={(value) => updateFilter("category", value)} allLabel="All categories" options={options.categories} />
          <FilterSelect label="Document Type" value={filters.documentType} onChange={(value) => updateFilter("documentType", value)} allLabel="All document types" options={options.documentTypes} />
          <FilterSelect label="Standardised Theme" value={filters.theme} onChange={(value) => updateFilter("theme", value)} allLabel="All themes" options={options.themes} />
        </div>
      </div>
      <div className={styles.resultsHeader}>
        <h2>{filteredSpeeches.length} Documents</h2>
        <button type="button" onClick={() => setFilters(emptyFilters)}>Clear Filters</button>
      </div>
      {filteredSpeeches.length === 0 ? (
        <section className={styles.emptyState} aria-live="polite">
          <h3>No documents found</h3>
          <button type="button" onClick={() => setFilters(emptyFilters)}>Clear Filters</button>
        </section>
      ) : (
        <div className={styles.grid}>{filteredSpeeches.map((speech) => <SpeechCard key={speech.ID} speech={speech} />)}</div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, allLabel, options }: { label: string; value: string; onChange: (value: string) => void; allLabel: string; options: string[] }) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{allLabel}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

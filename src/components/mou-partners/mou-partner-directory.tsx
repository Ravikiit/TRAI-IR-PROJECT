"use client";

import { useMemo, useState } from "react";
import type { MouPartner } from "@/types/mou-partner";

export function MouPartnerDirectory({ partners }: { partners: MouPartner[] }) {
  const [query, setQuery] = useState("");
  const filteredPartners = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return partners;
    return partners.filter((partner) => [partner.country, partner.organisation, partner.contactHead].some((value) => value.toLocaleLowerCase().includes(term)));
  }, [partners, query]);

  return (
    <>
      <div className="partner-search-wrap">
        <label className="sr-only" htmlFor="partner-search">Search MoU partners</label>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 4.2 4.2" /></svg>
        <input id="partner-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search partners..." />
      </div>
      {filteredPartners.length ? <div className="partner-grid">{filteredPartners.map((partner) => <PartnerCard key={partner.organisation} partner={partner} />)}</div> : <p className="no-results" role="status">No partners found.</p>}
    </>
  );
}

function PartnerCard({ partner }: { partner: MouPartner }) {
  const hasContact = partner.contactHead !== "Not provided";
  return (
    <article className="partner-card">
      <p className="partner-country"><span className={`fi fi-${partner.countryCode} partner-country-flag`} aria-hidden="true" /><span>{partner.country}</span></p>
      <h2>{partner.organisation}</h2>
      <p className="partner-detail">{partner.organisationDetail}</p>
      {partner.keyAreas.length > 0 ? <section className="partner-expertise" aria-label="Research-identified key expertise">
        <h3>RESEARCH-IDENTIFIED KEY EXPERTISE</h3>
        <ul>{partner.keyAreas.map((area) => <li key={area}>{area}</li>)}</ul>
      </section> : null}
      <div className="partner-meta">
        <div>
          <h3>Contact Head</h3>
          <p>{partner.contactHead}</p>
          {hasContact ? <span>{partner.contactDesignation}</span> : null}
        </div>
        <div>
          <h3>MoU Date</h3>
          <p>{partner.mouDate}</p>
        </div>
      </div>
      <a className="official-link" href={partner.officialWebsite} target="_blank" rel="noreferrer">↗ Go to Official Website<span className="sr-only">: {partner.organisation}</span></a>
    </article>
  );
}

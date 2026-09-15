import { SpeechRepository } from "@/components/chairman-speeches/speech-repository";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import type { ChairmanSpeech } from "@/types/chairman-speech";

const speeches: ChairmanSpeech[] = [];

function displayCount(count: number) {
  return count === 0 ? "—" : String(count);
}

export default function ChairmanSpeechesPage() {
  const years = new Set(speeches.map((speech) => speech.year));
  const overview = [
    { label: "Total Speeches", value: displayCount(speeches.length) },
    { label: "International Addresses", value: displayCount(speeches.filter((speech) => speech.type === "international").length) },
    { label: "Domestic Addresses", value: displayCount(speeches.filter((speech) => speech.type === "domestic").length) },
    { label: "Years Covered", value: displayCount(years.size) },
  ];

  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="activity-hero" aria-labelledby="chairman-speeches-title">
          <div className="container">
            <p className="internal-badge">Strictly for Internal Use</p>
            <p className="page-kicker">TRAI IR · KNOWLEDGE REPOSITORY</p>
            <h1 id="chairman-speeches-title">Chairman’s Speeches</h1>
            <p>A repository of speeches, keynote addresses, statements and remarks delivered by the Chairman of TRAI at national and international forums.</p>
            <div className="activity-stats speech-stats">
              {overview.map((item) => <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}
            </div>
          </div>
        </section>
        <section className="speeches-section" aria-labelledby="speech-repository-title">
          <div className="container">
            <div className="section-heading">
              <span aria-hidden="true" />
              <h2 id="speech-repository-title">Speech Repository</h2>
            </div>
            <p className="speech-introduction">Browse speeches and addresses delivered by the Chairman of TRAI across national and international forums.</p>
            <SpeechRepository speeches={speeches} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

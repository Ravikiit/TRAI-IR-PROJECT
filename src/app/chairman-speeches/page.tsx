import { chairmanSpeeches } from "@/content/chairman-speeches";
import { SpeechRepository } from "@/components/chairman-speeches/speech-repository";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function ChairmanSpeechesPage() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="activity-hero" aria-labelledby="chairman-speeches-title">
          <div className="container">
            <p className="page-kicker">TRAI IR · KNOWLEDGE REPOSITORY</p>
            <h1 id="chairman-speeches-title">AUTHORITY SPEECHES &amp; ADDRESSES</h1>
            <p>A curated repository of speeches, keynote addresses, talking points and official messages reflecting TRAI’s regulatory priorities and engagements.</p>
          </div>
        </section>
        <section className="speeches-section" aria-labelledby="speech-repository-title">
          <div className="container">
            <h2 id="speech-repository-title" className="sr-only">Authority speeches repository</h2>
            <SpeechRepository speeches={chairmanSpeeches} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

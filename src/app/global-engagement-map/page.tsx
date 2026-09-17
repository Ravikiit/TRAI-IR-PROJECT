import { GlobalEngagementMap } from "@/components/global-engagement/global-engagement-map";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { globalEngagementCountryMaster, mouLoiActivities, otherRegulatorActivities } from "@/content/global-engagement";

export default function GlobalEngagementMapPage() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="page-introduction" aria-labelledby="global-engagement-map-title">
          <div className="container">
            <p className="page-kicker">TRAI IR · INTERNATIONAL RELATIONS</p>
            <h1 id="global-engagement-map-title">Global Engagement Map</h1>
            <p>TRAI’s country-level record of MoU/LoI partnerships and other international regulatory engagements.</p>
          </div>
        </section>
        <section className="global-map-section" aria-label="Global engagement map and records">
          <div className="container">
            <GlobalEngagementMap countryMaster={globalEngagementCountryMaster} mouLoiActivities={mouLoiActivities} otherRegulatorActivities={otherRegulatorActivities} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

import { MouPartnerDirectory } from "@/components/mou-partners/mou-partner-directory";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { mouPartners } from "@/content/mou-partners";

export default function MouPartnersPage() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="page-introduction" aria-labelledby="mou-partners-title">
          <div className="container">
            <p className="page-kicker">TRAI IR</p>
            <h1 id="mou-partners-title">MoU Partners</h1>
            <p>International partnerships and institutional relationships</p>
          </div>
        </section>
        <section className="partner-directory-section" aria-label="MoU partners directory">
          <div className="container">
            <MouPartnerDirectory partners={mouPartners} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

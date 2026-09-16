import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { internationalActivities2023 } from "@/content/international-activities/2023";
import { internationalActivities2024 } from "@/content/international-activities/2024";
import { internationalActivities2025 } from "@/content/international-activities/2025";

export default function PastActivitiesPage() {
  return <div className="site-shell"><SiteHeader /><main><section className="page-introduction"><div className="container"><p className="page-kicker">INTERNATIONAL ACTIVITIES</p><h1>Yearly activity records</h1><p>A searchable internal record of TRAI’s international engagements, organised by completed year.</p></div></section><section className="year-landing-section"><div className="container"><Link className="year-landing-card" href="/past-activities/2025"><p>Completed year</p><strong>2025</strong><span>{internationalActivities2025.length} documented international activities <b>Explore year →</b></span></Link><Link className="year-landing-card" href="/past-activities/2024"><p>Completed year</p><strong>2024</strong><span>{internationalActivities2024.length} documented international activities <b>Explore year →</b></span></Link><Link className="year-landing-card" href="/past-activities/2023"><p>Completed year</p><strong>2023</strong><span>{internationalActivities2023.length} documented international activities <b>Explore year →</b></span></Link></div></section></main><SiteFooter /></div>;
}

import { ActivityExplorer } from "@/components/international-activities/activity-explorer";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { internationalActivities2023 } from "@/content/international-activities/2023";

export default function Activities2023Page() {
  const locations = new Set(internationalActivities2023.map((activity) => activity.location)).size;
  const counterparts = new Set(internationalActivities2023.map((activity) => activity.counterpart)).size;
  const types = new Set(internationalActivities2023.map((activity) => activity.activityType)).size;
  return <div className="site-shell"><SiteHeader /><main><section className="activity-hero" aria-labelledby="activities-2023-title"><div className="container"><p className="internal-badge">Strictly for Internal Use</p><p className="page-kicker">INTERNATIONAL ACTIVITIES · COMPLETED YEAR</p><h1 id="activities-2023-title">2023 International Activities</h1><p>TRAI’s documented international engagements, meetings and knowledge-exchange activities for 2023.</p><div className="activity-stats"><Stat number={internationalActivities2023.length} label="Total activities" /><Stat number={locations} label="Countries / locations" /><Stat number={counterparts} label="International counterparts" /><Stat number={types} label="Activity types" /></div></div></section><section className="activities-section"><div className="container"><div className="section-heading"><span aria-hidden="true" /><h2>Engagement record</h2></div><ActivityExplorer activities={internationalActivities2023} /></div></section></main><SiteFooter /></div>;
}
function Stat({ number, label }: { number: number; label: string }) { return <div><strong>{number}</strong><span>{label}</span></div>; }

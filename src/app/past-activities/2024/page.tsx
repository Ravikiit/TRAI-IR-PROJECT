import { ActivityExplorer } from "@/components/international-activities/activity-explorer";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { internationalActivities2024 } from "@/content/international-activities/2024";

export default function Activities2024Page() {
  const locations = new Set(internationalActivities2024.map((activity) => activity.location)).size;
  const counterparts = new Set(internationalActivities2024.map((activity) => activity.counterpart)).size;
  const types = new Set(internationalActivities2024.map((activity) => activity.activityType)).size;
  return <div className="site-shell"><SiteHeader /><main><section className="activity-hero" aria-labelledby="activities-2024-title"><div className="container"><p className="internal-badge">Strictly for Internal Use</p><p className="page-kicker">INTERNATIONAL ACTIVITIES · COMPLETED YEAR</p><h1 id="activities-2024-title">2024 International Activities</h1><p>TRAI’s documented international engagements, meetings and knowledge-exchange activities for 2024.</p><div className="activity-stats"><Stat number={internationalActivities2024.length} label="Total activities" /><Stat number={locations} label="Countries / locations" /><Stat number={counterparts} label="International counterparts" /><Stat number={types} label="Activity types" /></div></div></section><section className="activities-section"><div className="container"><div className="section-heading"><span aria-hidden="true" /><h2>Engagement record</h2></div><ActivityExplorer activities={internationalActivities2024} /></div></section></main><SiteFooter /></div>;
}
function Stat({ number, label }: { number: number; label: string }) { return <div><strong>{number}</strong><span>{label}</span></div>; }

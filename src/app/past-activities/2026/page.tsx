import { ActivityYearContent } from "@/components/international-activities/activity-year-content";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import type { InternationalActivity } from "@/types/international-activity";

const internationalActivities2026: InternationalActivity[] = [];

export default function Activities2026Page() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <ActivityYearContent year={2026} activities={internationalActivities2026} />
      </main>
      <SiteFooter />
    </div>
  );
}

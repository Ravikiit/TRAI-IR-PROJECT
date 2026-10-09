import { ActivityYearContent } from "@/components/international-activities/activity-year-content";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { internationalActivities2025 } from "@/content/international-activities/2025";

export default function Activities2025Page() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <ActivityYearContent year={2025} activities={internationalActivities2025} />
      </main>
      <SiteFooter />
    </div>
  );
}

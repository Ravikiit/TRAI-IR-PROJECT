import { ActivityYearContent } from "@/components/international-activities/activity-year-content";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { internationalActivities2024 } from "@/content/international-activities/2024";

export default function Activities2024Page() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <ActivityYearContent year={2024} activities={internationalActivities2024} />
      </main>
      <SiteFooter />
    </div>
  );
}

import { ActivityYearContent } from "@/components/international-activities/activity-year-content";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { internationalActivities2023 } from "@/content/international-activities/2023";

export default function Activities2023Page() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <ActivityYearContent year={2023} activities={internationalActivities2023} />
      </main>
      <SiteFooter />
    </div>
  );
}

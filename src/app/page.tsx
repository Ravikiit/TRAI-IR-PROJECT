import { ExploreCard } from "@/components/home/explore-card";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

const exploreItems = [
  {
    title: "MoU Partners",
    description: "Countries and organisations with which TRAI has established MoUs.",
    action: "Explore Partners",
    href: "/mou-partners",
    icon: "globe" as const,
  },
  {
    title: "Past Activities",
    description: "International engagements and activities recorded for 2025 and 2024.",
    action: "View Activities",
    href: "/past-activities",
    icon: "calendar" as const,
  },
  {
    title: "Ongoing Engagements",
    description: "Current international engagements and ongoing collaborations.",
    action: "View Ongoing Engagements",
    href: "/ongoing-engagements",
    icon: "connection" as const,
    status: "Future version",
  },
  {
    title: "Joint Study Groups",
    description: "Joint study groups and collaborative initiatives with international partners.",
    action: "View Study Groups",
    href: "/joint-study-groups",
    icon: "groups" as const,
    status: "Future version",
  },
];

export default function HomePage() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="hero" aria-labelledby="home-title">
          <div className="hero-map" aria-hidden="true" />
          <div className="container hero-content">
            <p className="internal-badge">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" /></svg>
              Strictly for Internal Use
            </p>
            <h1 id="home-title">TRAI IR</h1>
            <p className="hero-subtitle">International Relations</p>
            <p className="hero-copy">
              To maintain and track TRAI’s international partnerships and engagements, while providing other Divisions across TRAI with an easy way to understand and stay connected with the work of the IR Division.
            </p>
          </div>
        </section>

        <section className="explore-section" aria-labelledby="explore-title">
          <div className="container">
            <div className="section-heading">
              <span aria-hidden="true" />
              <h2 id="explore-title">Explore IR Information</h2>
            </div>
            <div className="explore-grid">
              {exploreItems.map((item) => <ExploreCard key={item.title} {...item} />)}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

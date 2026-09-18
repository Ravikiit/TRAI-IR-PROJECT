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
    title: "Chairman’s Speeches",
    description: "Speeches, keynote addresses and remarks delivered by the Chairman of TRAI at national and international forums.",
    action: "View Speeches",
    href: "/chairman-speeches",
    icon: "podium" as const,
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

const platformOffers = [
  {
    title: "MoU Partners",
    description: "Information on TRAI’s international regulatory partners and organisations with MoUs/LoIs, including key details and official links.",
    icon: "globe",
  },
  {
    title: "International Activities",
    description: "A record of international meetings, visits, conferences, bilateral engagements and other activities.",
    icon: "calendar",
  },
  {
    title: "Ongoing Engagements",
    description: "An overview of current discussions, initiatives and follow-ups with international regulators and partner organisations.",
    icon: "trend",
  },
  {
    title: "Joint Study Groups",
    description: "Details of collaborative studies and initiatives supporting regulatory cooperation and knowledge exchange.",
    icon: "collaboration",
  },
  {
    title: "Knowledge & Resources",
    description: "Reports, presentations and reference material on international regulatory developments and TRAI’s global engagements.",
    icon: "document",
  },
] as const;

function PlatformIcon({ name }: { name: (typeof platformOffers)[number]["icon"] }) {
  if (name === "globe") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2.3 2.2 3.2 5 3.2 8s-.9 5.8-3.2 8c-2.3-2.2-3.2-5-3.2-8s.9-5.8 3.2-8Z" /></svg>;
  if (name === "calendar") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M8 14h3M13 14h3M8 17h3" /></svg>;
  if (name === "trend") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16 9 11l3 3 7-8M15 6h4v4" /></svg>;
  if (name === "collaboration") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3" /><circle cx="16" cy="8" r="3" /><path d="M3 19c.5-3 2.1-4.5 5-4.5s4.5 1.5 5 4.5M11 19c.5-3 2.1-4.5 5-4.5s4.5 1.5 5 4.5M11 8h2" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6zM15 3v4h4M9 12h6M9 16h6" /></svg>;
}

export default function HomePage() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="hero" aria-labelledby="home-title">
          <div className="hero-map" aria-hidden="true" />
          <div className="container hero-content">
            <div className="hero-grid">
              <div className="hero-intro">
                <p className="internal-badge">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" /></svg>
                  STRICTLY FOR INTERNAL USE
                </p>
                <h1 id="home-title">TRAI IR CENTRAL</h1>
                <p className="hero-subtitle">Internal International Relations Platform</p>
                <p className="hero-copy">A central platform for tracking and understanding TRAI’s international partnerships, engagements and regulatory cooperation, while providing other Divisions across TRAI with an easy way to discover, follow and stay connected with the work of the International Relations Division.</p>
                <p className="hero-tagline">CONNECT <span>·</span> COLLABORATE <span>·</span> SHARE <span>·</span> GROW</p>
              </div>
              <aside className="hero-info-panel" aria-labelledby="hero-panel-title">
                <h2 id="hero-panel-title">ABOUT TRAI IR CENTRAL</h2>
                <p>TRAI IR Central is an internal platform for tracking and understanding TRAI’s international partnerships, engagements and regulatory cooperation. It brings key information relating to the work of the International Relations Division together in one place, making it easier for TRAI Divisions to discover, follow and stay connected with international activities.</p>
                <div className="hero-panel-divider" />
                <h3>WHAT THIS PLATFORM OFFERS</h3>
                <div className="hero-offers">
                  {platformOffers.map((offer) => <div className="hero-offer" key={offer.title}><span className={`hero-offer-icon hero-offer-icon-${offer.icon}`}><PlatformIcon name={offer.icon} /></span><div><h4>{offer.title}</h4><p>{offer.description}</p></div></div>)}
                </div>
              </aside>
            </div>
          </div>
          <div className="hero-disclaimer" role="note"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 10v6M12 7.5v.1" /></svg><span>Information Disclaimer: This platform contains only information available in the public domain. No sensitive, confidential or non-public information is displayed on this platform.</span></div>
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

import { ExploreCard } from "@/components/home/explore-card";
import { DocumentContributionBanner } from "@/components/home/document-contribution-banner";
import { SiteHeader } from "@/components/layout/site-header";
import { worldMapFeatures } from "@/content/world-map-geometries";

const mapWidth = 700;
const mapHeight = 370;
const indiaMapPath = worldMapFeatures.find((feature) => feature.name === "India")?.path;

function projectMapPoint([longitude, latitude]: [number, number]): [number, number] {
  return [((longitude + 180) / 360) * mapWidth, ((90 - latitude) / 180) * mapHeight];
}

function mapPoint([longitude, latitude]: [number, number]): [number, number] {
  return projectMapPoint([longitude, latitude]);
}

function GlobalNetworkIllustration() {
  const india = mapPoint([78.96, 20.59]);
  const routes: { endpoint: [number, number]; control: [number, number] }[] = [
    { endpoint: [-3, 52], control: [-5, 70] },
    { endpoint: [45, 25], control: [53, 45] },
    { endpoint: [151, -33], control: [124, -7] },
    { endpoint: [-100, 40], control: [-20, 75] },
    { endpoint: [20, -10], control: [48, 8] },
    { endpoint: [-60, -15], control: [7, 18] },
    { endpoint: [135, 35], control: [124, 58] },
  ];

  return (
    <svg
      className="home-world-map"
      viewBox={`0 0 ${mapWidth} ${mapHeight}`}
      role="img"
      aria-label="Digital world map with India highlighted and illustrative global connection lines"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern id="world-dots" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.35" fill="#64c4ff" />
        </pattern>
        <filter id="india-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="map-light">
          <stop offset="0" stopColor="#2b87ff" stopOpacity=".3" />
          <stop offset="1" stopColor="#2b87ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx={india[0]} cy={india[1]} rx="205" ry="178" fill="url(#map-light)" />
      <g fill="url(#world-dots)" fillRule="evenodd" stroke="#56baff" strokeOpacity=".32" strokeWidth=".45">
        {worldMapFeatures.filter((feature) => feature.name !== "India").map((feature) => (
          <path d={feature.path} key={feature.name} />
        ))}
      </g>
      {indiaMapPath && (
        <path
          d={indiaMapPath}
          fill="#27baff"
          fillOpacity=".3"
          fillRule="evenodd"
          stroke="#e8fbff"
          strokeLinejoin="round"
          strokeWidth="1.8"
          filter="url(#india-glow)"
        />
      )}

      <g fill="none" stroke="#8bd7ff" strokeLinecap="round">
        {routes.map(({ endpoint, control }, index) => {
          const [endX, endY] = mapPoint(endpoint);
          const [controlX, controlY] = mapPoint(control);
          return (
            <path
              d={`M${india[0]} ${india[1]} Q${controlX} ${controlY} ${endX} ${endY}`}
              key={index}
              strokeOpacity=".65"
              strokeWidth="1.2"
            />
          );
        })}
      </g>
      <g fill="#d7f5ff" filter="url(#india-glow)">
        {routes.map(({ endpoint }, index) => {
          const [x, y] = mapPoint(endpoint);
          return <circle cx={x} cy={y} key={index} r="3" />;
        })}
      </g>
      <circle cx={india[0]} cy={india[1]} r="4" fill="#fff" filter="url(#india-glow)" />
    </svg>
  );
}

function StoryIllustration({ variant }: { variant: "files" | "network" | "repository" | "future" }) {
  if (variant === "files") {
    return (
      <svg viewBox="0 0 220 142" aria-hidden="true">
        <g fill="#eaf3ff" stroke="#7fb0ff" strokeWidth="2">
          <rect x="30" y="26" width="43" height="57" rx="5" transform="rotate(-12 30 26)" />
          <rect x="79" y="18" width="43" height="57" rx="5" transform="rotate(8 79 18)" />
          <rect x="137" y="28" width="43" height="57" rx="5" transform="rotate(14 137 28)" />
        </g>
        <g fill="none" stroke="#387bea" strokeLinecap="round" strokeWidth="3">
          <path d="m43 47 18-4m-16 13 18-4m-16 13 12-3M91 38l18 3m-17 9 18 3m-17 9 12 2m34-15 17 5m-19 8 17 5" />
        </g>
        <path d="M54 91h39l9 9h59v30H54z" fill="#1e5bc2" />
        <path d="M54 91h39l9 9h59" fill="none" stroke="#79adff" strokeLinecap="round" strokeWidth="3" />
        <circle cx="41" cy="101" r="4" fill="#7854e8" />
        <path d="M24 104h12m-1-8 8 5-8 5" fill="none" stroke="#3478ed" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
      </svg>
    );
  }
  if (variant === "network") {
    return (
      <svg viewBox="0 0 220 142" aria-hidden="true">
        <g fill="none" stroke="#4588f5" strokeDasharray="3 5" strokeWidth="1.8">
          <ellipse cx="111" cy="72" rx="75" ry="43" transform="rotate(-21 111 72)" />
          <ellipse cx="111" cy="72" rx="75" ry="43" transform="rotate(28 111 72)" />
        </g>
        <circle cx="111" cy="72" r="37" fill="#dcecff" stroke="#9bc5ff" strokeWidth="2" />
        <path d="M74 72h74M111 35c10 10 15 22 15 37s-5 27-15 37c-10-10-15-22-15-37s5-27 15-37Zm-27 20c8 5 17 7 27 7s19-2 27-7m-54 34c8-5 17-7 27-7s19 2 27 7" fill="none" stroke="#4d8beb" strokeLinecap="round" strokeWidth="2" />
        <g fill="#145fe0" stroke="#fff" strokeWidth="2">
          <circle cx="48" cy="58" r="6" /><circle cx="75" cy="26" r="6" /><circle cx="145" cy="29" r="6" />
          <circle cx="177" cy="70" r="6" /><circle cx="150" cy="115" r="6" /><circle cx="59" cy="107" r="6" />
        </g>
        <circle cx="173" cy="43" r="5" fill="#22b4d4" />
        <circle cx="95" cy="15" r="5" fill="#7854e8" />
      </svg>
    );
  }
  if (variant === "repository") {
    return (
      <svg viewBox="0 0 220 142" aria-hidden="true">
        <g fill="#eaf3ff" stroke="#8bb8f2" strokeWidth="2">
          <rect x="22" y="47" width="42" height="39" rx="5" />
          <rect x="38" y="24" width="42" height="39" rx="5" />
          <rect x="83" y="38" width="42" height="39" rx="5" />
        </g>
        <g fill="none" stroke="#3981ed" strokeLinecap="round" strokeWidth="2.5">
          <path d="M32 59h20m-20 9h15M48 36h21m-21 9h14M93 50h21m-21 9h14" />
          <path d="M72 82c26 14 40 14 65 0m-8-7 9 7-10 4" strokeDasharray="3 4" />
          <path d="M91 92h37" strokeDasharray="3 4" />
        </g>
        <path d="M136 48h35l9 9h20v55h-64z" fill="#185dcc" />
        <path d="M136 48h35l9 9h20" fill="none" stroke="#7bb1ff" strokeLinejoin="round" strokeWidth="3" />
        <path d="M147 70h39m-39 10h31m-31 10h34" stroke="#cfe4ff" strokeLinecap="round" strokeWidth="3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 220 142" aria-hidden="true">
      <defs>
        <linearGradient id="future-city" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#42b9ff" />
          <stop offset="1" stopColor="#1658c6" />
        </linearGradient>
      </defs>
      <circle cx="157" cy="54" r="45" fill="none" stroke="#54adff" strokeOpacity=".4" />
      <circle cx="157" cy="54" r="35" fill="none" stroke="#8bd3ff" strokeOpacity=".45" />
      <path d="M26 108h169" stroke="#74c9ff" strokeLinecap="round" strokeWidth="3" />
      <path d="M39 107V72h24v35m8 0V51h30v56m8 0V68h23v39m8 0V40h30v67" fill="url(#future-city)" opacity=".9" />
      <path d="M45 80h8m-8 10h8m24-29h8m10 0h8m-26 11h8m10 0h8m-26 11h8m10 0h8m34-16h8m8 0h8m-24 11h8m8 0h8" stroke="#d6f1ff" strokeLinecap="round" strokeWidth="2" />
      <path d="M21 117c35-16 63-16 87-5s51 14 88-4" fill="none" stroke="#81d4ff" strokeLinecap="round" strokeWidth="2.5" />
      <circle cx="111" cy="111" r="4" fill="#fff" />
      <path d="M183 32V17m-6 6 6-6 6 6" fill="none" stroke="#79d1ff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
    </svg>
  );
}

const storyCards = [
  {
    number: "01",
    title: "WHY THIS PLATFORM?",
    hook: "Because international affairs shouldn’t live in scattered files.",
    detail: "One place to capture, connect and discover TRAI’s global engagements.",
    illustration: "files" as const,
    accent: "blue",
  },
  {
    number: "02",
    title: "WHY NOW?",
    hook: "More engagement. More knowledge. More to preserve.",
    detail: "As TRAI’s international engagement grows, so does the need for a shared institutional memory.",
    illustration: "network" as const,
    accent: "cyan",
  },
  {
    number: "03",
    title: "WHAT DOES IT SOLVE?",
    hook: "From scattered information to one connected repository.",
    detail: "Information was previously spread across reports, newsletters, files, folders and other records. This platform brings it together in one place, making it easier to find and reference.",
    illustration: "repository" as const,
    accent: "blue",
  },
  {
    number: "04",
    title: "WHERE DOES IT GO?",
    hook: "Start small. Learn. Improve. Evolve.",
    illustration: "future" as const,
    accent: "purple",
  },
];

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
    title: "Authority’s Speeches",
    description: "Speeches, keynote addresses and remarks delivered by the Authority of TRAI at national and international forums.",
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

const informationSources = [
  { name: "Reports", icon: "document" as const, position: "record-report" },
  { name: "Newsletters", icon: "newsletter" as const, position: "record-newsletter" },
  { name: "Files", icon: "folder" as const, position: "record-file" },
  { name: "Folders", icon: "folder" as const, position: "record-folders" },
  { name: "Other Records", icon: "other" as const, position: "record-other" },
];

function RecordIcon({ type }: { type: "document" | "newsletter" | "folder" | "other" }) {
  if (type === "folder") {
    return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4.5 9.5a2 2 0 0 1 2-2h7l3 3h9a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-19a2 2 0 0 1-2-2z" /><path d="M5 13h22" /></svg>;
  }
  if (type === "newsletter") {
    return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 5.5h15a2 2 0 0 1 2 2v17H8a3 3 0 0 1-3-3v-13a3 3 0 0 1 3-3Z" /><path d="M10 11h9M10 15h12M10 19h7M20 10v2m0 2v3" /><path d="M8 24.5a3 3 0 0 1 0-6" /></svg>;
  }
  if (type === "other") {
    return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="7" cy="16" r="2.2" fill="currentColor" stroke="none" /><circle cx="16" cy="16" r="2.2" fill="currentColor" stroke="none" /><circle cx="25" cy="16" r="2.2" fill="currentColor" stroke="none" /></svg>;
  }
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 4.5h11l6 6v17H8z" /><path d="M19 4.5v6h6M12 16h9M12 20h9M12 24h6" /></svg>;
}

function RepositoryIllustration() {
  return (
    <svg className="repository-art" viewBox="0 0 300 220" role="img" aria-label="Documents and global information organized in a searchable digital repository">
      <defs>
        <linearGradient id="repo-cylinder" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#38a8ff" />
          <stop offset="1" stopColor="#1452d5" />
        </linearGradient>
        <filter id="repo-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g fill="none" stroke="#66bbff" strokeDasharray="4 6" strokeWidth="1.5">
        <ellipse cx="150" cy="108" rx="106" ry="70" />
        <ellipse cx="150" cy="108" rx="88" ry="53" transform="rotate(-25 150 108)" />
      </g>
      <g fill="#fff" stroke="#3e8df4" strokeWidth="2">
        <circle cx="48" cy="108" r="20" /><circle cx="99" cy="43" r="20" />
        <circle cx="202" cy="43" r="20" /><circle cx="252" cy="108" r="20" />
      </g>
      <g fill="none" stroke="#1763de" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="M42 100h12v16H42zM45 104h6m-6 4h6m-6 4h4" />
        <circle cx="99" cy="43" r="7" /><path d="m104 48 6 6" />
        <path d="M194 40h9l3 3h7v11h-19z" />
        <circle cx="252" cy="108" r="9" /><path d="M243 108h18m-9-9c4 5 4 13 0 18m-5-16c-2 5-2 9 0 14" />
      </g>
      <ellipse cx="150" cy="171" rx="67" ry="15" fill="#64bfff" fillOpacity=".18" stroke="#71c8ff" strokeDasharray="4 5" />
      <path d="M109 78c0-12 18-22 41-22s41 10 41 22v68c0 12-18 22-41 22s-41-10-41-22z" fill="url(#repo-cylinder)" stroke="#91d9ff" strokeWidth="2" />
      <ellipse cx="150" cy="78" rx="41" ry="19" fill="#3da6ff" stroke="#b5e9ff" strokeWidth="2" />
      <path d="M109 103c0 11 18 20 41 20s41-9 41-20m-82 23c0 11 18 20 41 20s41-9 41-20" fill="none" stroke="#8cd6ff" strokeWidth="2" />
      <circle cx="122" cy="102" r="2.4" fill="#c8f3ff" /><circle cx="122" cy="126" r="2.4" fill="#c8f3ff" />
      <path d="M162 117h27l14 14v35h-41z" fill="#fff" stroke="#bedaff" strokeWidth="2" />
      <path d="M189 117v14h14m-31 9h18m-18 7h18m-18 7h13" fill="none" stroke="#3475df" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <circle cx="150" cy="78" r="4" fill="#fff" filter="url(#repo-glow)" />
    </svg>
  );
}

function EvolutionIcon({ type }: { type: "today" | "tomorrow" | "mvp" | "learn" | "improve" | "evolve" | "institution" | "shield" }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.8 };
  const paths = {
    today: <><rect x="5" y="7" width="14" height="13" rx="2" /><path d="M8 4v5m8-5v5M5 11h14M9 14h2m3 0h2m-7 3h2" /></>,
    tomorrow: <><path d="M5 19V12h4v7m2 0V8h4v11m2 0V4h4v15" /><path d="m5 9 5-4 4 1 6-4" /></>,
    mvp: <><path d="M12 20s-7-4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 6-7 10-7 10Z" /><path d="m9 12 2 2 4-5" /></>,
    learn: <><path d="M3.5 6.5c3-1.5 5.8-1 8.5 1.3v11c-2.7-2.3-5.5-2.8-8.5-1.3zM20.5 6.5c-3-1.5-5.8-1-8.5 1.3v11c2.7-2.3 5.5-2.8 8.5-1.3z" /><path d="M6.5 10h2m-2 3h2m7-3h2m-2 3h2" /></>,
    improve: <><circle cx="12" cy="12" r="8.5" /><path d="m12 7 1.2 3.1L16 11l-2.8 1.2L12 15l-1.2-2.8L8 11l2.8-.9zM17.5 16.5l1 1" /></>,
    evolve: <><path d="M4 17 10 11l3 3 7-8" /><path d="M15 6h5v5M4 20h16" /></>,
    institution: <><path d="m3 9 9-5 9 5M5 10h14M6 10v8m4-8v8m4-8v8m4-8v8M4 19h16M3 22h18" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /><rect x="9" y="10" width="6" height="5" rx="1" /><path d="M10.5 10V8.5a1.5 1.5 0 0 1 3 0V10" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>{paths[type]}</svg>;
}

export default function HomePage() {
  return (
    <div className="site-shell home-page">
      <SiteHeader />
      <main>
        <section className="home-hero" aria-label="TRAI IR Central international affairs repository">
          <div className="home-hero-content">
            <div className="home-hero-copy">
              <p className="home-hero-badge">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
                </svg>
                STRICTLY FOR INTERNAL USE
              </p>
              <h1>TRAI IR CENTRAL</h1>
              <p className="home-hero-subtitle">International Affairs Repository</p>
              <p className="home-hero-tagline">Connecting engagements. Preserving institutional knowledge.</p>
            </div>
            <div className="home-hero-map" aria-hidden="true">
              <GlobalNetworkIllustration />
            </div>
          </div>
        </section>

        <section className="platform-story-section" aria-labelledby="platform-story-title">
          <div className="platform-story-container">
            <header className="platform-story-heading">
              <span aria-hidden="true" />
              <h2 id="platform-story-title">WHY THIS PLATFORM?</h2>
              <p>From a growing need to a connected institutional resource.</p>
            </header>
            <div className="platform-story-grid">
              {storyCards.map((card) => (
                <article
                  className={`platform-story-card platform-story-card--${card.accent}`}
                  key={card.number}
                >
                  <div className="platform-story-card-top">
                    <span className="platform-story-number">{card.number}</span>
                    <StoryIllustration variant={card.illustration} />
                  </div>
                  <h3>{card.title}</h3>
                  <p className="platform-story-hook">{card.hook}</p>
                  {card.detail && <p className="platform-story-detail">{card.detail}</p>}
                  {card.number === "04" && (
                    <ul className="platform-story-points">
                      <li>
                        We aim to continuously improve this platform to better support the IR team’s{" "}
                        <strong>day-to-day work.</strong>
                      </li>
                      <li>
                        Over time, if the need arises, this{" "}
                        <strong>
                          MVP can also serve as a working reference and prototype for the IT Division to develop a more comprehensive, integrated TRAI IR platform.
                        </strong>
                      </li>
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="repository-visual-section" aria-labelledby="repository-title">
          <div className="repository-infographic">
            <header className="repository-heading">
              <span aria-hidden="true" />
              <h2 id="repository-title">
                <span>FROM SCATTERED RECORDS</span>
                <span className="repository-heading-arrow" aria-hidden="true">→</span>
                <span className="repository-heading-accent">ONE CENTRAL REPOSITORY</span>
              </h2>
              <p>Bringing TRAI IR’s international affairs information together in one place.</p>
            </header>

            <div className="repository-transformation">
              <div className="repository-before">
                <div className="repository-phase-label">BEFORE</div>
                <p className="repository-phase-copy">Scattered across reports, newsletters, files and folders.</p>
                <div className="scattered-records">
                  <svg className="records-paths" viewBox="0 0 520 280" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M30 65C150 25 290 95 500 145M40 205C170 250 295 80 500 145M150 135C280 130 355 130 500 145M250 40C335 50 410 105 500 145" />
                    <path d="M30 65C150 25 290 95 500 145M40 205C170 250 295 80 500 145M150 135C280 130 355 130 500 145M250 40C335 50 410 105 500 145" />
                  </svg>
                  {informationSources.map((record) => (
                    <div className={`scattered-record ${record.position}`} key={record.name}>
                      <span className={`scattered-record-icon scattered-record-icon--${record.icon}`}>
                        <RecordIcon type={record.icon} />
                      </span>
                      <span>{record.name}</span>
                    </div>
                  ))}
                  <span className="records-node records-node-one" aria-hidden="true" />
                  <span className="records-node records-node-two" aria-hidden="true" />
                  <span className="records-node records-node-three" aria-hidden="true" />
                  <span className="records-node records-node-four" aria-hidden="true" />
                </div>
              </div>

              <div className="repository-transition" aria-label="Centralise scattered information">
                <span className="transition-line" aria-hidden="true" />
                <span className="transition-arrow" aria-hidden="true">➜</span>
                <span className="transition-label">CENTRALISE</span>
              </div>

              <div className="repository-after">
                <div className="repository-phase-label repository-phase-label--after">AFTER</div>
                <p className="repository-phase-copy">One connected repository for TRAI IR.</p>
                <div className="repository-destination">
                  <div className="repository-art-wrap">
                    <RepositoryIllustration />
                  </div>
                  <div className="repository-destination-copy">
                    <h3>TRAI IR CENTRAL</h3>
                    <p className="repository-destination-subtitle">International Affairs Repository</p>
                    <span className="repository-accent-line" aria-hidden="true" />
                    <p className="repository-destination-description">All in one place. Easy to find. Ready to reference.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <DocumentContributionBanner />

        <section className="explore-section" aria-labelledby="explore-title">
          <div className="container">
            <div className="section-heading">
              <span aria-hidden="true" />
              <h2 id="explore-title">Explore IR Information</h2>
            </div>
            <div className="explore-grid">
              {exploreItems.map((item) => (
                <ExploreCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>

        <section className="future-journey" aria-labelledby="future-journey-title">
          <svg className="future-wave-lines" viewBox="0 0 1440 300" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 240C180 205 300 285 485 240s285-18 440-28 260 42 515-35" />
            <path d="M0 266c190-40 300 25 510-8s288-45 455-25 290 20 475-48" />
          </svg>
          <div className="future-journey-inner">
            <div className="future-main">
              <div className="future-copy">
                <p className="future-eyebrow">FROM TODAY TO TOMORROW</p>
                <span className="future-eyebrow-rule" aria-hidden="true" />
                <h2 id="future-journey-title">START SMALL. LEARN. IMPROVE. <span>EVOLVE.</span></h2>
                <div className="future-context">
                  <article className="future-context-item">
                    <span className="future-context-icon"><EvolutionIcon type="today" /></span>
                    <div>
                      <h3>TODAY</h3>
                      <p>We aim to continuously improve this platform to better support the IR team’s day-to-day work and make international affairs information easier to access and reference.</p>
                    </div>
                  </article>
                  <article className="future-context-item future-context-item--tomorrow">
                    <span className="future-context-icon"><EvolutionIcon type="tomorrow" /></span>
                    <div>
                      <h3>TOMORROW</h3>
                      <p>As the platform evolves, it can also serve as a working reference and MVP for the IT Division to develop a more comprehensive, integrated TRAI IR platform, if the need arises.</p>
                    </div>
                  </article>
                </div>
              </div>

              <div className="future-roadmap" aria-label="Future roadmap: MVP, Learn, Improve, Evolve">
                <svg className="roadmap-path" viewBox="0 0 520 160" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <filter id="roadmap-glow" x="-20%" y="-100%" width="140%" height="300%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  <path className="roadmap-path-glow" d="M26 118C104 118 113 96 166 92S254 66 306 65s86-31 123-39 49-3 69-15" />
                  <path className="roadmap-path-dots" d="M26 118C104 118 113 96 166 92S254 66 306 65s86-31 123-39 49-3 69-15" filter="url(#roadmap-glow)" />
                  <path className="roadmap-path-arrow" d="m500 11 12-2-7 11" />
                </svg>
                <div className="roadmap-stage roadmap-stage--mvp">
                  <span className="roadmap-icon"><EvolutionIcon type="mvp" /></span>
                  <h3>MVP</h3><p>Start small</p>
                </div>
                <div className="roadmap-stage roadmap-stage--learn">
                  <span className="roadmap-icon"><EvolutionIcon type="learn" /></span>
                  <h3>LEARN</h3><p>Build and learn</p>
                </div>
                <div className="roadmap-stage roadmap-stage--improve">
                  <span className="roadmap-icon"><EvolutionIcon type="improve" /></span>
                  <h3>IMPROVE</h3><p>Enhance and add<br />more value</p>
                </div>
                <div className="roadmap-stage roadmap-stage--evolve">
                  <span className="roadmap-icon"><EvolutionIcon type="evolve" /></span>
                  <h3>EVOLVE</h3><p>Towards a more<br />comprehensive platform</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="home-footer">
        <div className="home-footer-main">
          <div className="home-footer-brand">
            <span className="home-footer-icon"><EvolutionIcon type="institution" /></span>
            <div><strong>TRAI IR</strong><span>International Relations</span></div>
          </div>
          <span className="home-footer-divider" aria-hidden="true" />
          <div className="home-footer-internal">
            <span className="home-footer-icon"><EvolutionIcon type="shield" /></span>
            <div><strong>INTERNAL USE</strong><span>Strictly for internal use</span></div>
          </div>
        </div>
        <div className="home-footer-credit">
          <strong>Developed by Ravi Prakash Mishra</strong>
          <span>Young Professional, TRAI</span>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";

type IconName = "globe" | "calendar" | "podium" | "connection" | "groups";

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function CardIllustration({ name }: { name: IconName }) {
  if (name === "calendar") return <svg viewBox="0 0 120 84" aria-hidden="true" {...stroke}><rect x="19" y="14" width="52" height="55" rx="6" /><path d="M19 29h52M32 9v10M58 9v10M31 42h10M31 52h20M49 42h9" /><circle cx="88" cy="51" r="16" /><path d="M72 51h32M88 35c4 4.5 6 9.8 6 16s-2 11.5-6 16c-4-4.5-6-9.8-6-16s2-11.5 6-16M83 48l5 3 7-7" /></svg>;
  if (name === "podium") return <svg viewBox="0 0 120 84" aria-hidden="true" {...stroke}><path d="M38 64h44M44 64l4-27h24l4 27M48 37h24" /><path d="M60 37V22" /><rect x="54" y="14" width="12" height="12" rx="4" /><path d="M66 18h7c5 0 8 3 8 8M42 27c0-5 3-8 8-8h4M60 64v8" /><path d="M30 25h8M27 32h11M82 25h8M82 32h11" /></svg>;
  if (name === "connection") return <svg viewBox="0 0 120 84" aria-hidden="true" {...stroke}><circle cx="34" cy="42" r="13" /><circle cx="86" cy="42" r="13" /><path d="M47 38h26M47 46h26M30 41h8M82 41h8M20 19h17M83 65h17" /><path d="m37 42 7-7m32 14 7-7" /><circle cx="19" cy="19" r="3" /><circle cx="101" cy="65" r="3" /></svg>;
  if (name === "groups") return <svg viewBox="0 0 120 84" aria-hidden="true" {...stroke}><path d="M27 17h34v41H27zM34 27h20M34 35h20M34 43h13" /><path d="m53 58 7 9 8-9" /><circle cx="82" cy="34" r="8" /><path d="M68 60c1-10 5.7-15 14-15s13 5 14 15M68 24a6 6 0 1 0 0-12M96 24a6 6 0 1 1 0-12M64 53c-5-3-9-4-13-3M100 53c5-3 9-4 13-3" /></svg>;
  return <svg viewBox="0 0 120 84" aria-hidden="true" {...stroke}><circle cx="59" cy="42" r="28" /><path d="M31 42h56M59 14c7 8 10.5 17.3 10.5 28S66 62 59 70c-7-8-10.5-17.3-10.5-28S52 22 59 14" /><path d="M37 25c6 4 13.3 6 22 6s16-2 22-6M37 59c6-4 13.3-6 22-6s16 2 22 6" /><circle cx="20" cy="25" r="4" /><circle cx="101" cy="58" r="4" /><path d="m23 27 12 9M98 56 84 48" /></svg>;
}

export function ExploreCard({ title, description, action, href, icon, status }: { title: string; description: string; action: string; href: string; icon: IconName; status?: string }) {
  return (
    <article className={status ? "explore-card is-future" : "explore-card"}>
      <div className={`card-illustration illustration-${icon}`}><CardIllustration name={icon} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      {status ? <span className="card-status">Coming in a future version</span> : <Link href={href} className="card-action">{action}<span aria-hidden="true"> →</span></Link>}
    </article>
  );
}

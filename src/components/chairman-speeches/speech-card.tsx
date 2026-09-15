import type { ChairmanSpeech } from "@/types/chairman-speech";
import styles from "./speech-repository.module.css";

export function SpeechCard({ speech }: { speech: ChairmanSpeech }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardTop}><span>{speech.date}</span><span className={styles.typeBadge}>{speech.type === "international" ? "International" : "Domestic"}</span></div>
      <h4>{speech.title}</h4>
      <p>{speech.description}</p>
      <dl>
        <div><dt>Chairman</dt><dd>{speech.chairman}</dd></div>
        <div><dt>Event / Forum</dt><dd>{speech.event}</dd></div>
        <div><dt>Organisation</dt><dd>{speech.organisation}</dd></div>
        <div><dt>Country / Location</dt><dd>{[speech.country, speech.location].filter(Boolean).join(" · ")}</dd></div>
      </dl>
      <ul className={styles.topics} aria-label="Topics">{speech.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
      <div className={styles.actions}><a href={speech.documentPath}>View Speech</a><a href={speech.documentPath} download>Download</a></div>
    </article>
  );
}

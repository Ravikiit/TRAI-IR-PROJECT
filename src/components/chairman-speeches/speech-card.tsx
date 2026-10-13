import type { ChairmanSpeech } from "@/types/chairman-speech";
import { DeleteDocumentButton } from "@/components/documents/delete-document-button";
import styles from "./speech-repository.module.css";

export function SpeechCard({
  speech,
  isUploaded = false,
  onDeleted,
}: {
  speech: ChairmanSpeech;
  isUploaded?: boolean;
  onDeleted?: (id: string) => void;
}) {
  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <span>{speech.Date}</span>
        <span className={styles.typeBadge}>{speech["Document Type"]}</span>
      </div>
      <h3>{speech.Title}</h3>
      <p className={styles.event}>{speech.Event}</p>
      <p className={styles.description}>{speech["Short Description"]}</p>
      <dl>
        <div><dt>Broad Category</dt><dd>{speech["Broad Category"]}</dd></div>
        <div><dt>Standardised Theme</dt><dd>{speech["Standardised Theme"]}</dd></div>
      </dl>
      <a className={styles.documentLink} href={speech.filePath} rel="noopener noreferrer">
        VIEW DOCUMENT <span aria-hidden="true">→</span>
      </a>
      {isUploaded && onDeleted && (
        <DeleteDocumentButton
          documentId={speech.ID}
          title={speech.Title}
          onDeleted={() => onDeleted(speech.ID)}
        />
      )}
    </article>
  );
}

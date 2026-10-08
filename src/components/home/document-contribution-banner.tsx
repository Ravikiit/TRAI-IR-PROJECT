import styles from "./document-contribution-banner.module.css";
import { DocumentUploadModal } from "./document-upload-modal";
import Link from "next/link";

export function DocumentContributionBanner() {
  return (
    <section className={styles.section} aria-labelledby="document-contribution-title">
      <div className={styles.banner}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>CONTRIBUTE TO THE IR REPOSITORY</p>
          <h2 id="document-contribution-title">Upload &amp; Share IR Documents</h2>
          <p className={styles.description}>
            Have a report, presentation, meeting note or other relevant IR material? Upload it to
            the shared IR document repository.
          </p>
          <p className={styles.disclaimer}>
            Please do not upload any sensitive, confidential, or non-public information.
          </p>
        </div>
        <div className={styles.actions}>
          <DocumentUploadModal
            triggerClassName={styles.button}
            uploadIconClassName={styles.uploadIcon}
          />
          <Link className={styles.browseButton} href="/documents">
            Browse IR Repository
          </Link>
        </div>
      </div>
    </section>
  );
}

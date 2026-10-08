"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./documents.module.css";

type RepositoryDocument = {
  id: string;
  title: string;
  description: string | null;
  important_information: string | null;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: string | null;
  created_at: string;
};

const STORAGE_BUCKET = "ir-documents";

function getFileExtension(fileName: string) {
  const extensionSeparator = fileName.lastIndexOf(".");
  return extensionSeparator < 0 ? "" : fileName.slice(extensionSeparator + 1).toLowerCase();
}

function getFileType(document: RepositoryDocument) {
  const extension = getFileExtension(document.file_name);
  if (extension) return extension.toUpperCase();

  const mimeType = document.file_type.toLowerCase();
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word")) return "DOC";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "PPT";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "XLS";
  return "FILE";
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} bytes`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUploadDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<RepositoryDocument[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadDocuments() {
      try {
        const { data, error } = await getSupabaseBrowserClient()
          .from("documents")
          .select(
            "id, title, description, important_information, file_name, file_path, file_type, file_size, uploaded_by, created_at",
          )
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (isCurrent) setDocuments((data ?? []) as RepositoryDocument[]);
      } catch (error) {
        console.error("Unable to retrieve IR repository documents.", error);
        if (isCurrent) setHasError(true);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadDocuments();
    return () => {
      isCurrent = false;
    };
  }, []);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return documents;

    return documents.filter((document) =>
      [
        document.title,
        document.description,
        document.important_information,
        document.uploaded_by,
        document.file_name,
      ].some((value) => value?.toLocaleLowerCase().includes(query)),
    );
  }, [documents, search]);

  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className={`page-introduction ${styles.introduction}`} aria-labelledby="documents-title">
          <div className="container">
            <p className="page-kicker">IR DOCUMENT REPOSITORY</p>
            <h1 id="documents-title">Shared IR Document Repository</h1>
            <p>
              A central repository for International Relations reports, presentations, meeting
              notes and other relevant documents.
            </p>
            <p className={styles.disclaimer}>
              All documents uploaded to this repository are publicly accessible. Please do not
              upload sensitive, confidential, or non-public information.
            </p>
          </div>
        </section>

        <section className={styles.repositorySection} aria-label="IR documents">
          <div className="container">
            <div className={styles.searchWrap}>
              <label className="sr-only" htmlFor="document-search">
                Search documents
              </label>
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 5 5" />
              </svg>
              <input
                id="document-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search documents..."
                autoComplete="off"
              />
            </div>

            {isLoading ? (
              <div className={styles.loadingGrid} role="status" aria-label="Loading documents">
                {Array.from({ length: 3 }, (_, index) => (
                  <div className={styles.loadingCard} key={index} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                ))}
                <span className="sr-only">Loading documents...</span>
              </div>
            ) : hasError ? (
              <p className={styles.message} role="alert">
                Unable to load the IR Repository at the moment. Please try again later.
              </p>
            ) : documents.length === 0 ? (
              <p className={styles.message} role="status">
                No documents have been added to the IR Repository yet.
              </p>
            ) : filteredDocuments.length === 0 ? (
              <p className={styles.message} role="status">
                No documents match your search.
              </p>
            ) : (
              <div className={styles.documentGrid}>
                {filteredDocuments.map((document) => {
                  const supabase = getSupabaseBrowserClient();
                  const publicUrl = supabase.storage
                    .from(STORAGE_BUCKET)
                    .getPublicUrl(document.file_path).data.publicUrl;
                  const fileType = getFileType(document);

                  return (
                    <article className={styles.documentCard} key={document.id}>
                      <div className={styles.cardHeading}>
                        <span className={styles.fileIcon} aria-hidden="true">
                          <svg viewBox="0 0 32 36">
                            <path d="M6 2.5h13l8 8V33H6z" />
                            <path d="M19 2.5v8h8M10 18h13M10 23h13M10 28h9" />
                          </svg>
                          <span>{fileType}</span>
                        </span>
                        <div className={styles.titleWrap}>
                          <p className={styles.fileType}>{fileType} DOCUMENT</p>
                          <h2>{document.title}</h2>
                        </div>
                      </div>

                      {document.description?.trim() && (
                        <p className={styles.description}>{document.description}</p>
                      )}
                      {document.important_information?.trim() && (
                        <div className={styles.keyPoints}>
                          <h3>Important information / key points</h3>
                          <p>{document.important_information}</p>
                        </div>
                      )}

                      <dl className={styles.metadata}>
                        {document.uploaded_by?.trim() && (
                          <div>
                            <dt>Uploaded by</dt>
                            <dd>{document.uploaded_by}</dd>
                          </div>
                        )}
                        <div>
                          <dt>Uploaded</dt>
                          <dd>{formatUploadDate(document.created_at)}</dd>
                        </div>
                        <div>
                          <dt>File</dt>
                          <dd>{fileType} · {formatFileSize(document.file_size)}</dd>
                        </div>
                      </dl>

                      <a
                        className={styles.viewButton}
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View document: ${document.title}`}
                      >
                        View Document
                        <svg aria-hidden="true" viewBox="0 0 20 20">
                          <path d="M11 3h6v6M17 3l-8 8" />
                          <path d="M15 11v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
                        </svg>
                      </a>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

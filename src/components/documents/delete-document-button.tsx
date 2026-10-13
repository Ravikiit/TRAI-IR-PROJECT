"use client";

import { useState } from "react";
import styles from "./delete-document-button.module.css";

type DeleteDocumentButtonProps = {
  documentId: string;
  title: string;
  onDeleted: () => void;
};

const ERROR_MESSAGES: Record<string, string> = {
  deletion_not_configured:
    "Document deletion is not configured. Contact the site administrator.",
  unauthorized: "The deletion passphrase was not accepted.",
  document_lookup_failed: "The document could not be verified.",
  uploaded_document_not_found: "This uploaded document no longer exists.",
  document_storage_path_not_allowed:
    "The stored file path is not eligible for deletion. Contact the site administrator.",
  storage_delete_failed:
    "The file could not be deleted. Its repository record was left unchanged.",
  metadata_delete_failed:
    "The file was deleted, but its repository record remains. Contact the site administrator before retrying.",
  metadata_delete_unverified:
    "The file was deleted, but removal of its repository record could not be verified. Contact the site administrator.",
};

export function DeleteDocumentButton({
  documentId,
  title,
  onDeleted,
}: DeleteDocumentButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function deleteDocument() {
    if (
      !window.confirm(
        `Permanently delete "${title}" and its uploaded file? This cannot be undone.`,
      )
    ) {
      return;
    }

    const passphrase = window.prompt("Enter the shared document deletion passphrase.");
    if (passphrase === null) return;
    if (!passphrase) {
      setErrorMessage("Enter the deletion passphrase to continue.");
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");
    try {
      const response = await fetch(
        `/api/documents/${encodeURIComponent(documentId)}`,
        {
          method: "DELETE",
          headers: { "x-document-delete-passphrase": passphrase },
        },
      );
      const result: { error?: string; deleted?: boolean } = await response.json();

      if (!response.ok || !result.deleted) {
        setErrorMessage(
          ERROR_MESSAGES[result.error ?? ""] ??
            "The document could not be deleted. Contact the site administrator.",
        );
        return;
      }

      onDeleted();
    } catch {
      setErrorMessage(
        "The deletion request could not reach the server. Check your connection and try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.button}
        type="button"
        onClick={deleteDocument}
        disabled={isDeleting}
        aria-label={`Delete uploaded document: ${title}`}
      >
        {isDeleting ? "Deleting…" : "Delete"}
      </button>
      {errorMessage && (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

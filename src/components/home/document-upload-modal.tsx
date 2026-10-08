"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { DocumentUploadError, uploadDocument } from "@/lib/supabase/documents";
import styles from "./document-upload-modal.module.css";

type FieldErrors = {
  title?: string;
  about?: string;
  file?: string;
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_FILE_TYPES: Record<string, string> = {
  pdf: "PDF",
  doc: "DOC",
  docx: "DOCX",
  ppt: "PPT",
  pptx: "PPTX",
  xls: "XLS",
  xlsx: "XLSX",
};
const ACCEPTED_FILE_EXTENSIONS = Object.keys(ACCEPTED_FILE_TYPES)
  .map((extension) => `.${extension}`)
  .join(",");

function fileExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function fileType(file: File) {
  return ACCEPTED_FILE_TYPES[fileExtension(file)] ?? (file.type || "Unknown");
}

function formatFileSize(size: number) {
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function DocumentUploadModal({
  triggerClassName,
  uploadIconClassName,
}: {
  triggerClassName: string;
  uploadIconClassName: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [about, setAbout] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [validationMessage, setValidationMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSucceeded, setUploadSucceeded] = useState(false);

  function selectFile(file: File | undefined) {
    if (!file) return;

    const extension = fileExtension(file);
    if (!Object.prototype.hasOwnProperty.call(ACCEPTED_FILE_TYPES, extension)) {
      setSelectedFile(null);
      setErrors((current) => ({
        ...current,
        file: "Choose a PDF, DOC, DOCX, PPT, PPTX, XLS, or XLSX file.",
      }));
      setValidationMessage("");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setErrors((current) => ({ ...current, file: "The document must be 20 MB or smaller." }));
      setValidationMessage("");
      return;
    }

    setSelectedFile(file);
    setErrors((current) => ({ ...current, file: undefined }));
    setValidationMessage("");
  }

  function clearFile() {
    setSelectedFile(null);
    setErrors((current) => ({ ...current, file: undefined }));
    setValidationMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function resetForm() {
    setTitle("");
    setAbout("");
    setKeyPoints("");
    setUploadedBy("");
    setSelectedFile(null);
    setErrors({});
    setValidationMessage("");
    setIsDragging(false);
    setIsUploading(false);
    setUploadError("");
    setUploadSucceeded(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function closeDialog() {
    if (isUploading) return;
    dialogRef.current?.close();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isUploading) return;

    const nextErrors: FieldErrors = {};
    if (!title.trim()) nextErrors.title = "Enter a document title.";
    if (!about.trim()) nextErrors.about = "Describe what the document is about.";

    if (!selectedFile) {
      nextErrors.file = "Choose a document to continue.";
    } else if (!Object.prototype.hasOwnProperty.call(ACCEPTED_FILE_TYPES, fileExtension(selectedFile))) {
      nextErrors.file = "Choose a PDF, DOC, DOCX, PPT, PPTX, XLS, or XLSX file.";
    } else if (selectedFile.size > MAX_FILE_SIZE) {
      nextErrors.file = "The document must be 20 MB or smaller.";
    }

    setErrors(nextErrors);
    setValidationMessage("");
    setUploadError("");
    if (Object.keys(nextErrors).length > 0) return;

    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await uploadDocument({
        title,
        description: about,
        importantInformation: keyPoints,
        uploadedBy,
        file: selectedFile,
      });

      setTitle("");
      setAbout("");
      setKeyPoints("");
      setUploadedBy("");
      setSelectedFile(null);
      setErrors({});
      setValidationMessage("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadSucceeded(true);
    } catch (error) {
      if (error instanceof DocumentUploadError && error.stage === "storage") {
        setUploadError(
          "The document could not be uploaded. Please check your connection and try again.",
        );
      } else if (error instanceof DocumentUploadError && error.stage === "database") {
        setUploadError(
          "The document file was uploaded, but its record could not be saved. Please contact the site administrator before retrying.",
        );
      } else {
        console.error("Supabase document upload could not be completed.", error);
        setUploadError(
          "The document could not be uploaded. Please check the Supabase configuration and try again.",
        );
      }
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <button
        className={triggerClassName}
        type="button"
        aria-label="Upload a document to the IR repository"
        onClick={() => dialogRef.current?.showModal()}
      >
        <svg
          className={uploadIconClassName}
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M12 15V4m0 0L8 8m4-4 4 4M5 14v5h14v-5" />
        </svg>
        Upload Document
      </button>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="document-upload-title"
        aria-describedby="document-upload-introduction"
        aria-modal="true"
        onClose={resetForm}
        onCancel={(event) => {
          if (isUploading) event.preventDefault();
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current && !isUploading) closeDialog();
        }}
      >
        <header className={styles.header}>
          <div>
            <h2 id="document-upload-title">
              {uploadSucceeded ? "Upload complete" : "Upload Document"}
            </h2>
            {!uploadSucceeded && (
              <p id="document-upload-introduction">
                Share a relevant IR document with the TRAI IR Repository.
              </p>
            )}
          </div>
          <button
            className={styles.closeButton}
            type="button"
            aria-label="Close upload dialog"
            disabled={isUploading}
            onClick={closeDialog}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        {uploadSucceeded ? (
          <div className={styles.form}>
            <p className={styles.successMessage} role="status" aria-live="polite">
              <strong>✓ Document uploaded successfully</strong>
              <span>Your document has been added to the IR Repository.</span>
            </p>
            <div className={styles.actions}>
              <button className={styles.submitButton} type="button" onClick={closeDialog}>
                Close
              </button>
            </div>
          </div>
        ) : (
        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          <div className={styles.topFields}>
            <div className={styles.field}>
              <label htmlFor="document-title">Document Title <span>*</span></label>
              <input
                autoFocus
                id="document-title"
                name="title"
                type="text"
                required
                placeholder="e.g., FCC Meeting on Satellite Communications"
                value={title}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "document-title-error" : undefined}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setErrors((current) => ({ ...current, title: undefined }));
                  setValidationMessage("");
                }}
              />
              {errors.title && <p className={styles.error} id="document-title-error" role="alert">{errors.title}</p>}
            </div>

            <div className={styles.field}>
              <label htmlFor="document-uploaded-by">Uploaded By</label>
              <input
                id="document-uploaded-by"
                name="uploadedBy"
                type="text"
                placeholder="Your name (optional)"
                value={uploadedBy}
                onChange={(event) => setUploadedBy(event.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="document-about">What is this document about? <span>*</span></label>
            <textarea
              id="document-about"
              name="about"
              required
              placeholder="Briefly describe the purpose or subject of the document."
              rows={3}
              value={about}
              aria-invalid={Boolean(errors.about)}
              aria-describedby={errors.about ? "document-about-error" : undefined}
              onChange={(event) => {
                setAbout(event.target.value);
                setErrors((current) => ({ ...current, about: undefined }));
                setValidationMessage("");
              }}
            />
            {errors.about && <p className={styles.error} id="document-about-error" role="alert">{errors.about}</p>}
          </div>

          <div className={styles.field}>
            <label htmlFor="document-key-points">Important Information / Key Points</label>
            <textarea
              id="document-key-points"
              name="keyPoints"
              placeholder="Summarise any important information, discussions, decisions, or takeaways contained in the document."
              rows={3}
              value={keyPoints}
              onChange={(event) => {
                setKeyPoints(event.target.value);
                setValidationMessage("");
              }}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Document <span>*</span></span>
            <div
              className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setIsDragging(false);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                selectFile(event.dataTransfer.files[0]);
              }}
            >
              <input
                ref={fileInputRef}
                className={styles.visuallyHidden}
                id="document-file"
                name="file"
                type="file"
                accept={ACCEPTED_FILE_EXTENSIONS}
                required
                aria-label="Choose a document file"
                aria-invalid={Boolean(errors.file)}
                aria-describedby={`document-file-guidance${errors.file ? " document-file-error" : ""}`}
                onChange={(event) => {
                  selectFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <svg className={styles.fileIcon} viewBox="0 0 32 32" aria-hidden="true">
                <path d="M9 4.5h9l6 6v17H9zM18 4.5v6h6M12.5 16h8m-8 4h8m-8 4h5" />
              </svg>
              {selectedFile ? (
                <div className={styles.fileDetails}>
                  <strong>{selectedFile.name}</strong>
                  <span>{fileType(selectedFile)} · {formatFileSize(selectedFile.size)}</span>
                </div>
              ) : (
                <p className={styles.dropText}>
                  Drag &amp; drop your document here, or{" "}
                  <button
                    className={styles.chooseFile}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    choose a file
                  </button>
                </p>
              )}
              {selectedFile && (
                <div className={styles.fileActions}>
                  <button
                    className={styles.textButton}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Replace file
                  </button>
                  <button className={styles.textButton} type="button" onClick={clearFile}>
                    Remove
                  </button>
                </div>
              )}
              <p className={styles.fileGuidance} id="document-file-guidance">
                PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX · Maximum file size: 20 MB
              </p>
            </div>
            {errors.file && <p className={styles.error} id="document-file-error" role="alert">{errors.file}</p>}
          </div>

          <p className={styles.disclaimer}>
            Please do not upload any sensitive, confidential, or non-public information.
          </p>

          {validationMessage && (
            <p className={styles.successMessage} role="status" aria-live="polite">
              {validationMessage}
            </p>
          )}

          {uploadError && (
            <p className={styles.uploadError} role="alert" aria-live="assertive">
              {uploadError}
            </p>
          )}

          <div className={styles.actions}>
            <button
              className={styles.cancelButton}
              type="button"
              disabled={isUploading}
              onClick={closeDialog}
            >
              Cancel
            </button>
            <button className={styles.submitButton} type="submit" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </form>
        )}
      </dialog>
    </>
  );
}

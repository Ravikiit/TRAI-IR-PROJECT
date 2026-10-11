"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  DOCUMENT_CATEGORIES,
  DocumentUploadError,
  safeUploadDiagnostic,
  uploadDocument,
} from "@/lib/supabase/documents";
import type { DocumentCategory, DocumentUploadInput } from "@/lib/supabase/documents";
import styles from "./document-upload-modal.module.css";

type MetadataKey = Exclude<
  keyof DocumentUploadInput,
  "category" | "title" | "description" | "importantInformation" | "uploadedBy" | "file"
>;

type CategoryMetadata = Record<MetadataKey, string>;
type ErrorKey = "category" | "title" | "about" | "file" | MetadataKey;
type FieldErrors = Partial<Record<ErrorKey, string>>;

const EMPTY_METADATA: CategoryMetadata = {
  sourceContext: "",
  eventStartDate: "",
  eventEndDate: "",
  eventLocation: "",
  eventRegion: "",
  eventCounterpart: "",
  eventActivityType: "",
  eventParticipants: "",
  eventTheme: "",
  eventOutcome: "",
  eventSource: "",
  eventSourceUrl: "",
  speechDeliveryDate: "",
  speechEvent: "",
  speechDocumentType: "",
  speechBroadCategory: "",
  speechStandardisedTheme: "",
  speakerName: "",
  speakerDesignation: "",
};

const REQUIRED_EVENT_FIELDS: MetadataKey[] = [
  "eventStartDate",
  "eventLocation",
  "eventRegion",
  "eventCounterpart",
  "eventActivityType",
  "eventParticipants",
  "eventTheme",
  "eventOutcome",
  "eventSource",
];

const REQUIRED_SPEECH_FIELDS: MetadataKey[] = [
  "speechDeliveryDate",
  "speechEvent",
  "speechDocumentType",
  "speechBroadCategory",
  "speechStandardisedTheme",
];

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

function fieldId(name: string) {
  return `document-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

function storageErrorMessage(error: DocumentUploadError) {
  const diagnostics = error.diagnostics;
  const details = `${diagnostics?.code ?? ""} ${diagnostics?.statusCode ?? ""} ${error.message}`
    .toLowerCase();
  let guidance = "Contact the site administrator if the upload continues to fail.";

  if (diagnostics?.networkFailure) {
    guidance =
      "The browser could not get a response from Supabase. Check the deployed Supabase URL and browser network access, including DNS, TLS, and CORS settings.";
  } else if (
    diagnostics?.status === 401 ||
    diagnostics?.status === 403 ||
    details.includes("row-level security") ||
    details.includes("unauthorized") ||
    details.includes("accessdenied")
  ) {
    guidance = "Supabase Storage denied this upload. Check the upload permission for the ir-documents bucket.";
  } else if (diagnostics?.status === 404 || details.includes("bucketnotfound")) {
    guidance = "The ir-documents Storage bucket could not be found.";
  } else if (
    diagnostics?.status === 413 ||
    details.includes("entitytoolarge") ||
    details.includes("payload too large") ||
    details.includes("maximum allowed size")
  ) {
    guidance = "The file exceeds the current Supabase Storage bucket size limit. Try a smaller file.";
  } else if (
    diagnostics?.status === 415 ||
    details.includes("mime") ||
    details.includes("content type") ||
    details.includes("file type")
  ) {
    guidance = "Supabase Storage rejected this file type. Check the bucket's allowed file types.";
  }

  const response = [
    diagnostics?.pathname && `requestPath: ${diagnostics.pathname}`,
    !diagnostics?.pathname &&
      diagnostics?.attemptedPath &&
      `attemptedPath (SDK-derived): ${diagnostics.attemptedPath}`,
    diagnostics?.code && `code: ${diagnostics.code}`,
    diagnostics?.statusCode && `status code: ${diagnostics.statusCode}`,
    diagnostics?.status && `HTTP ${diagnostics.status}`,
    error.message && `message: ${error.message}`,
  ].filter(Boolean).join("; ");

  return `${guidance}${response ? ` Supabase response: ${response}` : ""}`;
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
  const [category, setCategory] = useState<DocumentCategory | "">("");
  const [title, setTitle] = useState("");
  const [about, setAbout] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
  const [metadata, setMetadata] = useState<CategoryMetadata>({ ...EMPTY_METADATA });
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
    setCategory("");
    setTitle("");
    setAbout("");
    setKeyPoints("");
    setUploadedBy("");
    setMetadata({ ...EMPTY_METADATA });
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

  function updateMetadata(key: MetadataKey, value: string) {
    setMetadata((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setValidationMessage("");
  }

  function renderMetadataField(
    key: MetadataKey,
    label: string,
    options: {
      required?: boolean;
      type?: "text" | "date" | "url";
      placeholder?: string;
      multiline?: boolean;
    } = {},
  ) {
    const id = fieldId(key);
    const errorId = `${id}-error`;
    const error = errors[key];
    const description = error ? errorId : undefined;
    const required = options.required ?? false;

    return (
      <div className={styles.field} key={key}>
        <label htmlFor={id}>
          {label} {required && <span>*</span>}
        </label>
        {options.multiline ? (
          <textarea
            id={id}
            name={key}
            required={required}
            placeholder={options.placeholder}
            rows={3}
            value={metadata[key]}
            aria-invalid={Boolean(error)}
            aria-describedby={description}
            onChange={(event) => updateMetadata(key, event.target.value)}
          />
        ) : (
          <input
            id={id}
            name={key}
            type={options.type ?? "text"}
            required={required}
            placeholder={options.placeholder}
            value={metadata[key]}
            aria-invalid={Boolean(error)}
            aria-describedby={description}
            onChange={(event) => updateMetadata(key, event.target.value)}
          />
        )}
        {error && <p className={styles.error} id={errorId} role="alert">{error}</p>}
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isUploading) return;

    const nextErrors: FieldErrors = {};
    if (!category) nextErrors.category = "Choose a document category.";
    if (!title.trim()) nextErrors.title = "Enter a document title.";
    if (!about.trim()) nextErrors.about = "Describe what the document is about.";

    const requiredMetadata =
      category === "Events"
        ? REQUIRED_EVENT_FIELDS
        : category === "Authority / Member Speeches"
          ? REQUIRED_SPEECH_FIELDS
          : [];

    for (const key of requiredMetadata) {
      if (!metadata[key].trim()) {
        const labels: Partial<Record<MetadataKey, string>> = {
          eventStartDate: "Enter the event start date.",
          eventLocation: "Enter the event location.",
          eventRegion: "Enter the event region.",
          eventCounterpart: "Enter the international counterpart.",
          eventActivityType: "Enter the activity type.",
          eventParticipants: "Enter the participants.",
          eventTheme: "Enter the theme or focus.",
          eventOutcome: "Enter the key outcome or purpose.",
          eventSource: "Enter the source or evidence.",
          speechDeliveryDate: "Enter the speech delivery date.",
          speechEvent: "Enter the event or occasion.",
          speechDocumentType: "Enter the document type.",
          speechBroadCategory: "Enter the broad category.",
          speechStandardisedTheme: "Enter the standardised theme.",
        };
        nextErrors[key] = labels[key] ?? "Complete this field.";
      }
    }

    if (
      category === "Events" &&
      metadata.eventStartDate &&
      metadata.eventEndDate &&
      metadata.eventEndDate < metadata.eventStartDate
    ) {
      nextErrors.eventEndDate = "The end date cannot be before the start date.";
    }

    if (category === "Events" && metadata.eventSourceUrl.trim()) {
      try {
        const sourceUrl = new URL(metadata.eventSourceUrl.trim());
        if (sourceUrl.protocol !== "http:" && sourceUrl.protocol !== "https:") {
          throw new Error("Unsupported URL protocol.");
        }
      } catch {
        nextErrors.eventSourceUrl = "Enter a valid http or https URL.";
      }
    }

    if (!selectedFile) {
      nextErrors.file = "Choose a document to continue.";
    } else if (!Object.prototype.hasOwnProperty.call(ACCEPTED_FILE_TYPES, fileExtension(selectedFile))) {
      nextErrors.file = "Choose a PDF, DOC, DOCX, PPT, PPTX, XLS, or XLSX file.";
    } else if (selectedFile.size > MAX_FILE_SIZE) {
      nextErrors.file = "The document must be 20 MB or smaller.";
    }

    setErrors(nextErrors);
    setValidationMessage("");
    if (Object.keys(nextErrors).length > 0) return;
    if (!category || !selectedFile) return;

    setUploadError("");
    setIsUploading(true);
    try {
      await uploadDocument({
        category,
        title,
        description: about,
        importantInformation: keyPoints,
        uploadedBy,
        file: selectedFile,
        ...metadata,
      });

      setCategory("");
      setTitle("");
      setAbout("");
      setKeyPoints("");
      setUploadedBy("");
      setMetadata({ ...EMPTY_METADATA });
      setSelectedFile(null);
      setErrors({});
      setValidationMessage("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadSucceeded(true);
    } catch (error) {
      if (error instanceof DocumentUploadError && error.stage === "storage") {
        setUploadError(storageErrorMessage(error));
      } else if (error instanceof DocumentUploadError && error.stage === "database") {
        const response = [
          error.diagnostics?.code && `code: ${error.diagnostics.code}`,
          error.message && `message: ${error.message}`,
        ].filter(Boolean).join("; ");
        setUploadError(
          `The document file was uploaded, but its record could not be saved.${response ? ` Supabase response: ${response}` : ""} Please contact the site administrator before retrying.`,
        );
      } else {
        const errorName = error instanceof Error ? error.name : "UnknownError";
        const message = safeUploadDiagnostic(
          error instanceof Error ? error.message : undefined,
        );
        if (error instanceof Error && error.message.includes("Missing NEXT_PUBLIC_SUPABASE_URL")) {
          console.error("Supabase document upload is missing its public deployment configuration.", {
            errorName,
            requiredVariables: [
              "NEXT_PUBLIC_SUPABASE_URL",
              "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
            ],
          });
          setUploadError(
            "Supabase is not configured for this deployment. The site administrator should check the required Vercel environment variables and redeploy.",
          );
        } else if (error instanceof TypeError) {
          console.error("Supabase document upload could not reach the service.", {
            errorName,
            message,
          });
          setUploadError(
            `Could not reach Supabase${message ? `: ${message}` : ""}. Check your connection and contact the site administrator if the problem continues.`,
          );
        } else {
          console.error("Supabase document upload could not be completed.", {
            errorName,
            message,
          });
          setUploadError(
            `The upload could not be completed${message ? `: ${message}` : ""}. Please contact the site administrator and try again later.`,
          );
        }
      }
    } finally {
      setIsUploading(false);
    }
  }

  const titleLabel =
    category === "Events"
      ? "Event Title"
      : category === "Authority / Member Speeches"
        ? "Speech Title"
        : "Document Title";
  const descriptionLabel =
    category === "Authority / Member Speeches"
      ? "Short Description"
      : category === "Events"
        ? "Description"
        : "What is this document about?";

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
            <div className={styles.field}>
              <label htmlFor="document-category">
                Category <span>*</span>
              </label>
              <select
                id="document-category"
                name="category"
                required
                value={category}
                aria-invalid={Boolean(errors.category)}
                aria-describedby={errors.category ? "document-category-error" : undefined}
                onChange={(event) => {
                  setCategory(event.target.value as DocumentCategory | "");
                  setMetadata({ ...EMPTY_METADATA });
                  setErrors((current) => ({
                    title: current.title,
                    about: current.about,
                    file: current.file,
                  }));
                  setValidationMessage("");
                }}
              >
                <option value="">Select a category</option>
                {DOCUMENT_CATEGORIES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.category && (
                <p className={styles.error} id="document-category-error" role="alert">
                  {errors.category}
                </p>
              )}
            </div>

            <div className={styles.topFields}>
              <div className={styles.field}>
                <label htmlFor="document-title">{titleLabel} <span>*</span></label>
                <input
                  autoFocus
                  id="document-title"
                  name="title"
                  type="text"
                  required
                  placeholder={
                    category === "Events"
                      ? "e.g., APT workshop on spectrum management"
                      : "e.g., FCC Meeting on Satellite Communications"
                  }
                  value={title}
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? "document-title-error" : undefined}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setErrors((current) => ({ ...current, title: undefined }));
                    setValidationMessage("");
                  }}
                />
                {errors.title && (
                  <p className={styles.error} id="document-title-error" role="alert">
                    {errors.title}
                  </p>
                )}
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
              <label htmlFor="document-about">{descriptionLabel} <span>*</span></label>
              <textarea
                id="document-about"
                name="about"
                required
                placeholder={
                  category === "Authority / Member Speeches"
                    ? "Briefly describe the speech or address."
                    : "Briefly describe the purpose or subject of the document."
                }
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
              {errors.about && (
                <p className={styles.error} id="document-about-error" role="alert">
                  {errors.about}
                </p>
              )}
            </div>

            {category === "Events" && (
              <div className={styles.categoryFields}>
                <div className={styles.metadataFields}>
                  {renderMetadataField("eventStartDate", "Start Date", { required: true, type: "date" })}
                  {renderMetadataField("eventEndDate", "End Date", { type: "date" })}
                </div>
                <div className={styles.metadataFields}>
                  {renderMetadataField("eventLocation", "Location", { required: true })}
                  {renderMetadataField("eventRegion", "Region", { required: true })}
                </div>
                <div className={styles.metadataFields}>
                  {renderMetadataField("eventCounterpart", "International Counterpart", { required: true })}
                  {renderMetadataField("eventActivityType", "Activity Type", { required: true })}
                </div>
                {renderMetadataField("eventParticipants", "Participants", {
                  required: true,
                  multiline: true,
                })}
                {renderMetadataField("eventTheme", "Theme / Focus", {
                  required: true,
                  multiline: true,
                })}
                {renderMetadataField("eventOutcome", "Key Outcome / Purpose", {
                  required: true,
                  multiline: true,
                })}
                {renderMetadataField("eventSource", "Source / Evidence", {
                  required: true,
                  multiline: true,
                })}
                {renderMetadataField("eventSourceUrl", "Source URL", {
                  type: "url",
                  placeholder: "https://",
                })}
              </div>
            )}

            {category === "Authority / Member Speeches" && (
              <div className={styles.categoryFields}>
                {renderMetadataField("speechDeliveryDate", "Delivery Date", {
                  required: true,
                  type: "date",
                })}
                {renderMetadataField("speechEvent", "Event / Occasion", { required: true })}
                <div className={styles.metadataFields}>
                  {renderMetadataField("speechDocumentType", "Document Type", { required: true })}
                  {renderMetadataField("speechBroadCategory", "Broad Category", { required: true })}
                </div>
                {renderMetadataField("speechStandardisedTheme", "Standardised Theme", { required: true })}
                <div className={styles.metadataFields}>
                  {renderMetadataField("speakerName", "Speaker Name")}
                  {renderMetadataField("speakerDesignation", "Speaker Designation")}
                </div>
              </div>
            )}

            {(category === "APT / ITU" || category === "Miscellaneous") && (
              <div className={styles.categoryFields}>
                {renderMetadataField("sourceContext", "Source / Context", {
                  multiline: true,
                  placeholder: "Optional source, origin, or other relevant context.",
                })}
              </div>
            )}

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
              {errors.file && (
                <p className={styles.error} id="document-file-error" role="alert">
                  {errors.file}
                </p>
              )}
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

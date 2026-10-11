export const STORAGE_BUCKET = "ir-documents";
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;

export const DOCUMENT_CATEGORIES = [
  "APT / ITU",
  "Authority / Member Speeches",
  "Events",
  "Miscellaneous",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const REQUIRED_EVENT_FIELDS = [
  "eventStartDate",
  "eventLocation",
  "eventRegion",
  "eventCounterpart",
  "eventActivityType",
  "eventParticipants",
  "eventTheme",
  "eventOutcome",
  "eventSource",
] as const;

const REQUIRED_SPEECH_FIELDS = [
  "speechDeliveryDate",
  "speechEvent",
  "speechDocumentType",
  "speechBroadCategory",
  "speechStandardisedTheme",
] as const;

export type DocumentUploadMetadata = {
  category: DocumentCategory;
  title: string;
  description: string;
  importantInformation: string;
  uploadedBy: string;
  sourceContext?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  eventLocation?: string;
  eventRegion?: string;
  eventCounterpart?: string;
  eventActivityType?: string;
  eventParticipants?: string;
  eventTheme?: string;
  eventOutcome?: string;
  eventSource?: string;
  eventSourceUrl?: string;
  speechDeliveryDate?: string;
  speechEvent?: string;
  speechDocumentType?: string;
  speechBroadCategory?: string;
  speechStandardisedTheme?: string;
  speakerName?: string;
  speakerDesignation?: string;
};

export type DocumentInsert = {
  category: DocumentCategory;
  title: string;
  description: string;
  important_information: string | null;
  uploaded_by: string | null;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  source_context: string | null;
  event_start_date: string | null;
  event_end_date: string | null;
  event_location: string | null;
  event_region: string | null;
  event_counterpart: string | null;
  event_activity_type: string | null;
  event_participants: string | null;
  event_theme: string | null;
  event_outcome: string | null;
  event_source: string | null;
  event_source_url: string | null;
  speech_delivery_date: string | null;
  speech_event: string | null;
  speech_document_type: string | null;
  speech_broad_category: string | null;
  speech_standardised_theme: string | null;
  speaker_name: string | null;
  speaker_designation: string | null;
};

export type MetadataValidation =
  | { valid: true; metadata: DocumentUploadMetadata }
  | { valid: false; message: string };

export type FileValidation =
  | { valid: true; contentType: string }
  | { valid: false; message: string; status: 400 | 413 };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateDocumentMetadata(value: unknown): MetadataValidation {
  if (!isRecord(value)) {
    return { valid: false, message: "Document metadata must be an object." };
  }

  if (!DOCUMENT_CATEGORIES.includes(value.category as DocumentCategory)) {
    return { valid: false, message: "Choose one of the supported document categories." };
  }

  const stringFields = [
    "title",
    "description",
    "importantInformation",
    "uploadedBy",
  ] as const;
  for (const field of stringFields) {
    if (typeof value[field] !== "string") {
      return { valid: false, message: `The ${field} field must be text.` };
    }
  }

  const optionalFields = [
    "sourceContext",
    "eventStartDate",
    "eventEndDate",
    "eventLocation",
    "eventRegion",
    "eventCounterpart",
    "eventActivityType",
    "eventParticipants",
    "eventTheme",
    "eventOutcome",
    "eventSource",
    "eventSourceUrl",
    "speechDeliveryDate",
    "speechEvent",
    "speechDocumentType",
    "speechBroadCategory",
    "speechStandardisedTheme",
    "speakerName",
    "speakerDesignation",
  ] as const;
  for (const field of optionalFields) {
    if (value[field] !== undefined && typeof value[field] !== "string") {
      return { valid: false, message: `The ${field} field must be text.` };
    }
  }

  const metadata = value as unknown as DocumentUploadMetadata;
  if (!metadata.title.trim()) {
    return { valid: false, message: "Enter a document title." };
  }
  if (!metadata.description.trim()) {
    return { valid: false, message: "Describe what the document is about." };
  }

  const requiredFields =
    metadata.category === "Events"
      ? REQUIRED_EVENT_FIELDS
      : metadata.category === "Authority / Member Speeches"
        ? REQUIRED_SPEECH_FIELDS
        : [];
  for (const field of requiredFields) {
    if (!metadata[field]?.trim()) {
      return {
        valid: false,
        message: `Complete the required ${field} field for this category.`,
      };
    }
  }

  if (
    metadata.eventStartDate &&
    !validDate(metadata.eventStartDate.trim())
  ) {
    return { valid: false, message: "Enter a valid event start date." };
  }
  if (metadata.eventEndDate && !validDate(metadata.eventEndDate.trim())) {
    return { valid: false, message: "Enter a valid event end date." };
  }
  if (
    metadata.eventStartDate &&
    metadata.eventEndDate &&
    metadata.eventEndDate.trim() < metadata.eventStartDate.trim()
  ) {
    return { valid: false, message: "The event end date cannot be before its start date." };
  }
  if (
    metadata.speechDeliveryDate &&
    !validDate(metadata.speechDeliveryDate.trim())
  ) {
    return { valid: false, message: "Enter a valid speech delivery date." };
  }
  if (metadata.eventSourceUrl?.trim()) {
    try {
      const url = new URL(metadata.eventSourceUrl.trim());
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return { valid: false, message: "The event source URL must use HTTP or HTTPS." };
      }
    } catch {
      return { valid: false, message: "Enter a valid event source URL." };
    }
  }

  return { valid: true, metadata };
}

export function validateDocumentFile(fileName: unknown, fileSize: unknown): FileValidation {
  if (typeof fileName !== "string" || !fileName.trim()) {
    return { valid: false, message: "Choose a document file.", status: 400 };
  }
  if (typeof fileSize !== "number" || !Number.isSafeInteger(fileSize) || fileSize < 0) {
    return { valid: false, message: "The document file size is invalid.", status: 400 };
  }
  if (fileSize > MAX_DOCUMENT_SIZE) {
    return { valid: false, message: "The document must be 20 MB or smaller.", status: 413 };
  }

  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  const contentType = MIME_TYPES[extension];
  if (!contentType) {
    return {
      valid: false,
      message: "Choose a PDF, DOC, DOCX, PPT, PPTX, XLS, or XLSX file.",
      status: 400,
    };
  }
  return { valid: true, contentType };
}

export function sanitizeDocumentFileName(fileName: string) {
  const safeName = fileName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 180);
  return safeName || "document";
}

export function createDocumentFilePath(fileName: string, id: string) {
  return `documents/${id}-${sanitizeDocumentFileName(fileName)}`;
}

export function isValidDocumentFilePath(filePath: unknown, fileName: string) {
  if (typeof filePath !== "string" || !filePath.startsWith("documents/")) return false;
  const name = filePath.slice("documents/".length);
  const id = name.slice(0, 36);
  const expectedName = `${id}-${sanitizeDocumentFileName(fileName)}`;
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) &&
    name === expectedName
  );
}

export function isExpectedSignedUploadUrl(
  signedUrl: string,
  projectUrl: string,
  filePath: string,
) {
  try {
    const parsedUrl = new URL(signedUrl);
    const project = new URL(projectUrl);
    return (
      (project.pathname === "" || project.pathname === "/") &&
      parsedUrl.origin === project.origin &&
      !parsedUrl.username &&
      !parsedUrl.password &&
      !parsedUrl.hash &&
      parsedUrl.pathname ===
        `/storage/v1/object/upload/sign/${STORAGE_BUCKET}/${filePath}` &&
      Boolean(parsedUrl.searchParams.get("token"))
    );
  } catch {
    return false;
  }
}

function nullableText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

export function toDocumentInsert(
  metadata: DocumentUploadMetadata,
  fileName: string,
  filePath: string,
  contentType: string,
  fileSize: number,
): DocumentInsert {
  return {
    category: metadata.category,
    title: metadata.title.trim(),
    description: metadata.description.trim(),
    important_information: nullableText(metadata.importantInformation),
    uploaded_by: nullableText(metadata.uploadedBy),
    file_name: fileName,
    file_path: filePath,
    file_type: contentType,
    file_size: fileSize,
    source_context: nullableText(metadata.sourceContext),
    event_start_date: nullableText(metadata.eventStartDate),
    event_end_date: nullableText(metadata.eventEndDate),
    event_location: nullableText(metadata.eventLocation),
    event_region: nullableText(metadata.eventRegion),
    event_counterpart: nullableText(metadata.eventCounterpart),
    event_activity_type: nullableText(metadata.eventActivityType),
    event_participants: nullableText(metadata.eventParticipants),
    event_theme: nullableText(metadata.eventTheme),
    event_outcome: nullableText(metadata.eventOutcome),
    event_source: nullableText(metadata.eventSource),
    event_source_url: nullableText(metadata.eventSourceUrl),
    speech_delivery_date: nullableText(metadata.speechDeliveryDate),
    speech_event: nullableText(metadata.speechEvent),
    speech_document_type: nullableText(metadata.speechDocumentType),
    speech_broad_category: nullableText(metadata.speechBroadCategory),
    speech_standardised_theme: nullableText(metadata.speechStandardisedTheme),
    speaker_name: nullableText(metadata.speakerName),
    speaker_designation: nullableText(metadata.speakerDesignation),
  };
}

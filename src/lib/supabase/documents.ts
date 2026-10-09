import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const STORAGE_BUCKET = "ir-documents";

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

export type DocumentUploadInput = {
  category: DocumentCategory;
  title: string;
  description: string;
  importantInformation: string;
  uploadedBy: string;
  file: File;
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

export class DocumentUploadError extends Error {
  constructor(
    readonly stage: "storage" | "database",
    message: string,
    readonly diagnostics?: {
      status?: number;
      statusCode?: string;
      code?: string;
      networkFailure?: boolean;
    },
  ) {
    super(message);
    this.name = "DocumentUploadError";
  }
}

function sanitizeFileName(fileName: string) {
  const safeName = fileName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 180);

  return safeName || "document";
}

function getMimeType(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_TYPES[extension] ?? (file.type || "application/octet-stream");
}

function optionalText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

export function safeUploadDiagnostic(value: string | undefined, sensitivePath?: string) {
  if (!value) return undefined;
  const safeValue = sensitivePath ? value.replaceAll(sensitivePath, "[redacted path]") : value;
  return safeValue
    .replace(/https?:\/\/[^\s"'<>]+/gi, "[redacted URL]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[redacted token]")
    .replace(/\bsb_(?:secret|publishable)_[A-Za-z0-9_-]+\b/g, "[redacted key]")
    .slice(0, 500);
}

export async function uploadDocument(input: DocumentUploadInput) {
  const supabase = getSupabaseBrowserClient();
  const filePath = `documents/${crypto.randomUUID()}-${sanitizeFileName(input.file.name)}`;
  const mimeType = getMimeType(input.file);

  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, input.file, {
      contentType: mimeType,
      upsert: false,
    });

  if (storageError) {
    const networkFailure =
      storageError.status === undefined &&
      /failed to fetch|networkerror|load failed/i.test(storageError.message);
    const diagnostics = {
      status: storageError.status,
      statusCode: safeUploadDiagnostic(storageError.statusCode),
      code: safeUploadDiagnostic(storageError.code),
      networkFailure,
    };
    const message = safeUploadDiagnostic(storageError.message, filePath) ?? "Unknown Storage error";
    console.error("Supabase document Storage upload failed.", {
      ...diagnostics,
      message,
    });
    throw new DocumentUploadError("storage", message, diagnostics);
  }

  const { error: databaseError } = await supabase
    .from("documents")
    .insert({
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      important_information: optionalText(input.importantInformation),
      uploaded_by: optionalText(input.uploadedBy),
      file_name: input.file.name,
      file_path: filePath,
      file_type: mimeType,
      file_size: input.file.size,
      source_context: optionalText(input.sourceContext),
      event_start_date: optionalText(input.eventStartDate),
      event_end_date: optionalText(input.eventEndDate),
      event_location: optionalText(input.eventLocation),
      event_region: optionalText(input.eventRegion),
      event_counterpart: optionalText(input.eventCounterpart),
      event_activity_type: optionalText(input.eventActivityType),
      event_participants: optionalText(input.eventParticipants),
      event_theme: optionalText(input.eventTheme),
      event_outcome: optionalText(input.eventOutcome),
      event_source: optionalText(input.eventSource),
      event_source_url: optionalText(input.eventSourceUrl),
      speech_delivery_date: optionalText(input.speechDeliveryDate),
      speech_event: optionalText(input.speechEvent),
      speech_document_type: optionalText(input.speechDocumentType),
      speech_broad_category: optionalText(input.speechBroadCategory),
      speech_standardised_theme: optionalText(input.speechStandardisedTheme),
      speaker_name: optionalText(input.speakerName),
      speaker_designation: optionalText(input.speakerDesignation),
    });

  if (databaseError) {
    const message = safeUploadDiagnostic(databaseError.message, filePath) ?? "Unknown database error";
    console.error("Supabase document database insert failed after Storage upload.", {
      code: safeUploadDiagnostic(databaseError.code),
      message,
    });
    throw new DocumentUploadError("database", message, {
      code: safeUploadDiagnostic(databaseError.code),
    });
  }
}

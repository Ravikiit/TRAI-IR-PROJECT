import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const STORAGE_BUCKET = "ir-documents";

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
  title: string;
  description: string;
  importantInformation: string;
  uploadedBy: string;
  file: File;
};

export class DocumentUploadError extends Error {
  constructor(
    readonly stage: "storage" | "database",
    message: string,
    readonly filePath?: string,
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
    console.error("Supabase document Storage upload failed.", {
      code: storageError.statusCode,
      message: storageError.message,
    });
    throw new DocumentUploadError("storage", storageError.message);
  }

  const { error: databaseError } = await supabase
    .from("documents")
    .insert({
      title: input.title.trim(),
      description: input.description.trim(),
      important_information: input.importantInformation.trim(),
      uploaded_by: input.uploadedBy.trim(),
      file_name: input.file.name,
      file_path: filePath,
      file_type: mimeType,
      file_size: input.file.size,
    });

  if (databaseError) {
    console.error("Supabase document database insert failed after Storage upload.", {
      code: databaseError.code,
      message: databaseError.message,
      filePath,
    });
    throw new DocumentUploadError("database", databaseError.message, filePath);
  }
}

import {
  DOCUMENT_CATEGORIES,
  STORAGE_BUCKET,
  type DocumentCategory,
  type DocumentUploadMetadata,
  isValidDocumentFilePath,
  validateDocumentFile,
} from "@/lib/supabase/document-upload-contract";
import { uploadFileToSignedUrl } from "@/lib/supabase/document-upload-client";

export { DOCUMENT_CATEGORIES };
export type { DocumentCategory };

export type DocumentUploadInput = DocumentUploadMetadata & { file: File };

type CleanupStatus = {
  attempted: boolean;
  succeeded: boolean | null;
  code?: string;
};

export class DocumentUploadError extends Error {
  constructor(
    readonly stage: "storage" | "database" | "validation" | "configuration",
    message: string,
    readonly diagnostics?: {
      status?: number | "unavailable";
      statusCode?: string;
      code?: string;
      networkFailure?: boolean;
      pathname?: string;
      attemptedPath?: string;
      cleanup?: CleanupStatus;
    },
  ) {
    super(message);
    this.name = "DocumentUploadError";
  }
}

type ApiError = {
  stage?: string;
  code?: string;
  message?: string;
  cleanup?: CleanupStatus;
};

type ApiReply = {
  response: Response;
  body: Record<string, unknown>;
};

function responseBody(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

async function callUploadApi(body: Record<string, unknown>): Promise<ApiReply> {
  const response = await fetch("/api/documents/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    parsed = {};
  }
  return { response, body: responseBody(parsed) };
}

function apiError(reply: ApiReply): ApiError {
  return responseBody(reply.body.error) as ApiError;
}

function cleanCode(value: unknown, fallback: string) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(value)
    ? value
    : fallback;
}

function errorForApiReply(reply: ApiReply, fallbackStage: "storage" | "database") {
  const error = apiError(reply);
  const stage =
    error.stage === "database" || error.stage === "validation" ||
    error.stage === "configuration"
      ? error.stage
      : fallbackStage;
  const cleanup = error.cleanup;
  return new DocumentUploadError(
    stage,
    typeof error.message === "string" ? error.message : "The upload request failed.",
    {
      status: reply.response.status,
      code: cleanCode(error.code, "upload_request_failed"),
      ...(cleanup ? { cleanup } : {}),
    },
  );
}

export function safeUploadDiagnostic(
  value: string | undefined,
  sensitivePaths?: string | string[],
) {
  if (!value) return undefined;
  const paths = typeof sensitivePaths === "string"
    ? [sensitivePaths]
    : sensitivePaths ?? [];
  let safeValue = value;
  for (const path of paths) {
    if (!path) continue;
    safeValue = safeValue
      .replaceAll(path, "[redacted path]")
      .replaceAll(encodeURIComponent(path), "[redacted path]");
  }

  return safeValue
    .replace(/\?[^\s"'<>]*/g, "?[redacted]")
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
      "[redacted id]",
    )
    .replace(/https?:\/\/[^\s"'<>]+/gi, "[redacted URL]")
    .replace(/Bearer\s+\S+/gi, "******")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[redacted token]")
    .replace(/\bsb_(?:secret|publishable)_[A-Za-z0-9_-]+\b/g, "[redacted key]")
    .slice(0, 500);
}

function requestPath(signedUrl: string, filePath: string) {
  try {
    const path = new URL(signedUrl).pathname;
    return path.replace(filePath, "<redacted>");
  } catch {
    return `/storage/v1/object/upload/sign/${STORAGE_BUCKET}/<redacted>`;
  }
}

export async function uploadDocument(input: DocumentUploadInput) {
  const file = validateDocumentFile(input.file.name, input.file.size);
  if (!file.valid) {
    throw new DocumentUploadError("validation", file.message, {
      status: file.status,
    });
  }

  const {
    file: _file,
    ...metadata
  } = input;
  let prepared: ApiReply;
  try {
    prepared = await callUploadApi({
      action: "prepare",
      metadata,
      fileName: input.file.name,
      fileSize: input.file.size,
    });
  } catch {
    throw new DocumentUploadError("storage", "The upload service could not be reached.", {
      status: "unavailable",
      networkFailure: true,
    });
  }
  if (!prepared.response.ok || prepared.body.ok !== true) {
    throw errorForApiReply(prepared, "storage");
  }

  const filePath = prepared.body.filePath;
  const signedUrl = prepared.body.signedUrl;
  if (
    typeof filePath !== "string" ||
    !isValidDocumentFilePath(filePath, input.file.name) ||
    typeof signedUrl !== "string"
  ) {
    throw new DocumentUploadError(
      "configuration",
      "The upload service returned an invalid Storage upload target.",
    );
  }

  const storageResult = await uploadFileToSignedUrl(
    signedUrl,
    input.file,
    file.contentType,
  );
  if (!storageResult.succeeded) {
    throw new DocumentUploadError("storage", "Supabase Storage could not save the document.", {
      status: storageResult.status,
      statusCode: storageResult.code,
      code: storageResult.code,
      networkFailure: storageResult.networkFailure,
      pathname: requestPath(signedUrl, filePath),
    });
  }

  let finalized: ApiReply;
  try {
    finalized = await callUploadApi({
      action: "finalize",
      metadata,
      fileName: input.file.name,
      fileSize: input.file.size,
      filePath,
    });
  } catch {
    throw new DocumentUploadError(
      "database",
      "The metadata save could not be confirmed. The document file may already exist; do not retry until the repository has been checked.",
      {
        code: "finalize_result_unknown",
        cleanup: {
          attempted: false,
          succeeded: null,
          code: "database_result_unknown",
        },
      },
    );
  }
  if (!finalized.response.ok || finalized.body.ok !== true) {
    throw errorForApiReply(finalized, "database");
  }
}

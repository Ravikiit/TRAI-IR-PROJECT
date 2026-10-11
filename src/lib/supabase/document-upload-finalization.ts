import type { DocumentInsert } from "./document-upload-contract";

export type UploadBackendError = { code?: string; status?: number } | null;

export type FinalizeUploadBackend = {
  insertDocument(row: DocumentInsert): Promise<{ error: UploadBackendError }>;
  removeDocument(filePath: string): Promise<{ error: UploadBackendError }>;
};

export type FinalizeUploadResult =
  | { succeeded: true }
  | {
      succeeded: false;
      code: string;
      cleanup: {
        attempted: boolean;
        succeeded: boolean | null;
        code?: string;
      };
    };

function safeCode(code: string | undefined, fallback: string) {
  return code && /^[A-Za-z0-9_-]{1,100}$/.test(code) ? code : fallback;
}

export async function finalizeDocumentUpload(
  row: DocumentInsert,
  filePath: string,
  backend: FinalizeUploadBackend,
): Promise<FinalizeUploadResult> {
  let insertError: UploadBackendError;
  try {
    ({ error: insertError } = await backend.insertDocument(row));
  } catch {
    return {
      succeeded: false,
      code: "database_result_unknown",
      cleanup: {
        attempted: false,
        succeeded: null,
        code: "database_result_unknown",
      },
    };
  }

  if (!insertError) return { succeeded: true };
  if (
    insertError.status === undefined ||
    insertError.status === 0 ||
    insertError.status >= 500
  ) {
    return {
      succeeded: false,
      code: safeCode(insertError.code, "database_result_unknown"),
      cleanup: {
        attempted: false,
        succeeded: null,
        code: "database_result_unknown",
      },
    };
  }

  try {
    const { error: cleanupError } = await backend.removeDocument(filePath);
    return {
      succeeded: false,
      code: safeCode(insertError.code, "metadata_insert_failed"),
      cleanup: cleanupError
        ? {
            attempted: true,
            succeeded: false,
            code: safeCode(cleanupError.code, "storage_cleanup_failed"),
          }
        : { attempted: true, succeeded: true },
    };
  } catch {
    return {
      succeeded: false,
      code: safeCode(insertError.code, "metadata_insert_failed"),
      cleanup: {
        attempted: true,
        succeeded: false,
        code: "storage_cleanup_request_failed",
      },
    };
  }
}

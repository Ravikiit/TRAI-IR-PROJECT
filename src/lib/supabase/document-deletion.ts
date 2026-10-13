import { timingSafeEqual } from "node:crypto";

const DOCUMENT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UPLOADED_FILE_PATH_PATTERN =
  /^documents\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-[A-Za-z0-9._-]+$/i;

export type UploadedDocumentDeletionStore = {
  findDocument(id: string): Promise<
    { filePath: string | null; error: false } | { filePath: null; error: true }
  >;
  removeStorageObject(filePath: string): Promise<boolean>;
  deleteDocumentRow(id: string, filePath: string): Promise<boolean>;
  documentRowExists(id: string): Promise<boolean | null>;
};

type DeleteConfiguration = {
  expectedPassphrase?: string;
  createStore?: () => UploadedDocumentDeletionStore;
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function passphrasesMatch(provided: string | null, expected: string) {
  if (!provided) return false;

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export async function deleteUploadedDocument(
  id: string,
  providedPassphrase: string | null,
  configuration: DeleteConfiguration,
) {
  if (!DOCUMENT_ID_PATTERN.test(id)) {
    return jsonResponse(400, { error: "invalid_document_id" });
  }

  if (!configuration.expectedPassphrase || !configuration.createStore) {
    return jsonResponse(503, { error: "deletion_not_configured" });
  }

  if (!passphrasesMatch(providedPassphrase, configuration.expectedPassphrase)) {
    return jsonResponse(401, { error: "unauthorized" });
  }

  let store: UploadedDocumentDeletionStore;
  try {
    store = configuration.createStore();
  } catch {
    return jsonResponse(503, { error: "deletion_not_configured" });
  }

  let document: Awaited<ReturnType<UploadedDocumentDeletionStore["findDocument"]>>;
  try {
    document = await store.findDocument(id);
  } catch {
    return jsonResponse(502, { error: "document_lookup_failed" });
  }

  if (document.error) {
    return jsonResponse(502, { error: "document_lookup_failed" });
  }
  if (!document.filePath) {
    return jsonResponse(404, { error: "uploaded_document_not_found" });
  }
  if (!UPLOADED_FILE_PATH_PATTERN.test(document.filePath)) {
    return jsonResponse(409, { error: "document_storage_path_not_allowed" });
  }

  let storageRemoved: boolean;
  try {
    storageRemoved = await store.removeStorageObject(document.filePath);
  } catch {
    storageRemoved = false;
  }
  if (!storageRemoved) {
    return jsonResponse(502, { error: "storage_delete_failed" });
  }

  let rowDeleted: boolean;
  try {
    rowDeleted = await store.deleteDocumentRow(id, document.filePath);
  } catch {
    rowDeleted = false;
  }

  let rowExists: boolean | null;
  try {
    rowExists = await store.documentRowExists(id);
  } catch {
    rowExists = null;
  }

  if (!rowDeleted && rowExists !== false) {
    return jsonResponse(500, {
      error: "metadata_delete_failed",
      partial: true,
    });
  }
  if (rowExists !== false) {
    return jsonResponse(500, {
      error: "metadata_delete_unverified",
      partial: true,
    });
  }

  return jsonResponse(200, { deleted: true });
}

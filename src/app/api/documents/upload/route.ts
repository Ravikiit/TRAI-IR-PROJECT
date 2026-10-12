import { createClient } from "@supabase/supabase-js";
import {
  createDocumentFilePath,
  isExpectedSignedUploadUrl,
  isValidDocumentFilePath,
  STORAGE_BUCKET,
  toDocumentInsert,
  validateDocumentFile,
  validateDocumentMetadata,
} from "@/lib/supabase/document-upload-contract";
import { finalizeDocumentUpload } from "@/lib/supabase/document-upload-finalization";

export const runtime = "nodejs";

const MAX_JSON_BODY_SIZE = 64 * 1024;

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function safeCode(code: string | undefined, fallback: string) {
  return code && /^[A-Za-z0-9_-]{1,100}$/.test(code) ? code : fallback;
}

function validationError(message: string, status = 400) {
  return jsonResponse(
    { ok: false, error: { stage: "validation", code: "invalid_request", message } },
    status,
  );
}

function getSupabaseConfiguration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  try {
    const parsedUrl = new URL(url);
    if (
      (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") ||
      parsedUrl.username ||
      parsedUrl.password
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return { url, key };
}

async function readRequestBody(request: Request): Promise<
  | { valid: true; body: Record<string, unknown> }
  | { valid: false; response: Response }
> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return {
      valid: false,
      response: validationError("Send the upload request as JSON."),
    };
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_JSON_BODY_SIZE) {
    return {
      valid: false,
      response: validationError("The upload metadata request is too large.", 413),
    };
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return {
      valid: false,
      response: validationError("The upload request could not be read."),
    };
  }
  if (new TextEncoder().encode(text).byteLength > MAX_JSON_BODY_SIZE) {
    return {
      valid: false,
      response: validationError("The upload metadata request is too large.", 413),
    };
  }

  try {
    const body: unknown = JSON.parse(text);
    if (typeof body === "object" && body !== null && !Array.isArray(body)) {
      return { valid: true, body: body as Record<string, unknown> };
    }
  } catch {
    // Return a client error below without reflecting request contents.
  }
  return {
    valid: false,
    response: validationError("The upload request must contain valid JSON."),
  };
}

export async function POST(request: Request) {
  const parsed = await readRequestBody(request);
  if (!parsed.valid) return parsed.response;

  const { body } = parsed;
  const config = getSupabaseConfiguration();
  if (!config) {
    return jsonResponse(
      {
        ok: false,
        error: {
          stage: "configuration",
          code: "supabase_configuration_invalid",
          message: "The server-side Supabase configuration is missing or invalid.",
        },
      },
      500,
    );
  }
  const projectUrl = new URL(config.url);
  if (projectUrl.pathname !== "" && projectUrl.pathname !== "/") {
    return jsonResponse(
      {
        ok: false,
        error: {
          stage: "configuration",
          code: "supabase_url_must_be_project_root",
          message: "The Supabase URL must be the project root, without an API path suffix.",
        },
      },
      500,
    );
  }
  const client = createClient(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  if (body.action === "prepare") {
    const metadata = validateDocumentMetadata(body.metadata);
    if (!metadata.valid) return validationError(metadata.message);
    const file = validateDocumentFile(body.fileName, body.fileSize);
    if (!file.valid) return validationError(file.message, file.status);

    const fileName = body.fileName as string;
    const fileSize = body.fileSize as number;
    const filePath = createDocumentFilePath(fileName, crypto.randomUUID());
    try {
      const { data, error } = await client.storage
        .from(STORAGE_BUCKET)
        .createSignedUploadUrl(filePath, { upsert: false });
      if (error || !data) {
        return jsonResponse(
          {
            ok: false,
            error: {
              stage: "storage",
              code: safeCode(error?.statusCode, "signed_upload_url_failed"),
              message: "Supabase Storage could not authorize this upload.",
            },
          },
          502,
        );
      }
      if (!isExpectedSignedUploadUrl(data.signedUrl, config.url, filePath)) {
        return jsonResponse(
          {
            ok: false,
            error: {
              stage: "configuration",
              code: "unexpected_storage_url",
              message:
                "The configured Supabase URL did not produce the expected Storage upload path.",
            },
          },
          500,
        );
      }

      return jsonResponse({
        ok: true,
        filePath,
        fileName,
        fileSize,
        contentType: file.contentType,
        signedUrl: data.signedUrl,
      });
    } catch {
      return jsonResponse(
        {
          ok: false,
          error: {
            stage: "storage",
            code: "signed_upload_url_request_failed",
            message: "Supabase Storage could not be reached.",
          },
        },
        502,
      );
    }
  }

  if (body.action === "finalize") {
    const metadata = validateDocumentMetadata(body.metadata);
    if (!metadata.valid) return validationError(metadata.message);
    const file = validateDocumentFile(body.fileName, body.fileSize);
    if (!file.valid) return validationError(file.message, file.status);
    const fileName = body.fileName as string;
    const fileSize = body.fileSize as number;
    if (!isValidDocumentFilePath(body.filePath, fileName)) {
      return validationError("The uploaded document path is invalid.");
    }

    const filePath = body.filePath as string;
    const row = toDocumentInsert(
      metadata.metadata,
      fileName,
      filePath,
      file.contentType,
      fileSize,
    );
    const result = await finalizeDocumentUpload(row, filePath, {
      async insertDocument(document) {
        const { error, status } = await client.from("documents").insert(document);
        return {
          error: error ? { code: error.code, status } : null,
        };
      },
      async removeDocument(path) {
        const { error } = await client.storage
          .from(STORAGE_BUCKET)
          .remove([path]);
        return { error: error ? { code: error.statusCode } : null };
      },
    });

    if (result.succeeded) return jsonResponse({ ok: true });
    return jsonResponse(
      {
        ok: false,
        error: {
          stage: "database",
          code: result.code,
          message: "The document metadata could not be saved.",
          cleanup: result.cleanup,
        },
      },
      500,
    );
  }

  return validationError("Choose a supported upload action.");
}

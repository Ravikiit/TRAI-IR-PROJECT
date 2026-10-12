export type SignedUploadResult =
  | { succeeded: true }
  | {
      succeeded: false;
      status: number | "unavailable";
      code: string;
      networkFailure: boolean;
    };

function safeStorageCode(value: unknown) {
  if (typeof value !== "string") return "storage_upload_failed";
  return /^[A-Za-z0-9_-]{1,100}$/.test(value) ? value : "storage_upload_failed";
}

export async function uploadFileToSignedUrl(
  signedUrl: string,
  file: File,
  contentType: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SignedUploadResult> {
  let response: Response;
  try {
    response = await fetchImpl(signedUrl, {
      method: "PUT",
      headers: {
        "cache-control": "max-age=3600",
        "content-type": contentType,
        "x-upsert": "false",
      },
      body: file,
      redirect: "error",
    });
  } catch {
    return {
      succeeded: false,
      status: "unavailable",
      code: "network_error",
      networkFailure: true,
    };
  }

  if (response.ok) return { succeeded: true };

  let code = "storage_upload_failed";
  try {
    const body: unknown = await response.clone().json();
    if (typeof body === "object" && body !== null && "code" in body) {
      code = safeStorageCode(body.code);
    }
  } catch {
    // A malformed response still becomes a structured Storage failure.
  }

  return {
    succeeded: false,
    status: response.status,
    code,
    networkFailure: false,
  };
}

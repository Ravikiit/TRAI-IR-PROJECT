"use client";

import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | undefined;

export type SupabaseRequestDiagnostic = {
  pathname: string;
  status: number | "unavailable";
  code: string;
  message: string;
};

export function createStorageRequestDiagnostic(bucket: string) {
  let diagnostic: SupabaseRequestDiagnostic | undefined;

  const diagnosticFetch: typeof fetch = async (input, init) => {
    let pathname = "/<unavailable>";
    let requestHostname: string | undefined;
    let isStorageUpload = false;
    try {
      const requestUrl =
        input instanceof Request ? input.url : input instanceof URL ? input.href : input;
      const parsedUrl = new URL(requestUrl);
      requestHostname = parsedUrl.hostname;
      const requestPath = parsedUrl.pathname;
      const method =
        init?.method ?? (input instanceof Request ? input.method : "GET");
      const storagePrefix = `/storage/v1/object/${bucket}/`;
      isStorageUpload =
        method.toUpperCase() === "POST" &&
        requestPath.lastIndexOf(storagePrefix) >= 0;
      if (isStorageUpload) {
        pathname = sanitizedRequestPath(requestPath, bucket);
      }
    } catch {
      // Diagnostic parsing must not interfere with the request.
    }

    let response: Response;
    try {
      response = await fetch(input, init);
    } catch (error) {
      if (isStorageUpload) {
        diagnostic = {
          pathname,
          status: "unavailable",
          code: "unavailable",
          message: "unavailable",
        };
      }
      throw error;
    }

    if (isStorageUpload && !response.ok) {
      let code = "unavailable";
      let message = "unavailable";
      try {
        const body: unknown = await response.clone().json();
        if (typeof body === "object" && body !== null) {
          if (
            "code" in body &&
            typeof body.code === "string" &&
            /^[A-Za-z0-9_-]{1,100}$/.test(body.code)
          ) {
            code = body.code;
          }
          if ("message" in body && typeof body.message === "string") {
            message = body.message.slice(0, 500);
            if (requestHostname) {
              const escapedHostname = requestHostname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              message = message.replace(
                new RegExp(escapedHostname, "gi"),
                "[redacted host]",
              );
            }
          }
        }
      } catch {
        // The original response remains usable if diagnostic parsing fails.
      }

      diagnostic = { pathname, status: response.status, code, message };
    }

    return response;
  };

  return {
    fetch: diagnosticFetch,
    getDiagnostic: () => diagnostic,
  };
}

function sanitizedRequestPath(pathname: string, bucket: string) {
  const storageMarker = "/storage/v1/object/";
  const storageIndex = pathname.lastIndexOf(storageMarker);
  if (storageIndex >= 0) {
    const bucketStart = storageIndex + storageMarker.length;
    const requestBucket = pathname.slice(bucketStart).split("/")[0];
    const safeBucket = requestBucket === bucket ? bucket : "<redacted>";
    return `${pathname.slice(0, bucketStart)}${safeBucket}/<redacted>`;
  }

  const restMarker = "/rest/v1";
  const restIndex = pathname.lastIndexOf(restMarker);
  if (restIndex >= 0) {
    return `${pathname.slice(0, restIndex)}${restMarker}/<redacted>`;
  }

  const apiPrefix = pathname.match(/^(.*\/(?:auth|functions|realtime)\/v1)(?:\/|$)/)?.[1];
  return apiPrefix ? `${apiPrefix}/<redacted>` : "/<redacted>";
}

export function getSupabaseBrowserClient() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  supabaseClient = createBrowserClient(supabaseUrl, supabasePublishableKey);
  return supabaseClient;
}

export function createSupabaseUploadClient(fetchImpl: typeof fetch) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return createBrowserClient(supabaseUrl, supabasePublishableKey, {
    global: { fetch: fetchImpl },
    isSingleton: false,
  });
}

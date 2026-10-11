"use client";

import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | undefined;

export type SupabaseRequestDiagnostic = {
  pathname: string;
  status: number | "unavailable";
  code: string;
};

let lastSupabaseRequestDiagnostic: SupabaseRequestDiagnostic | undefined;

export function clearSupabaseRequestDiagnostic() {
  lastSupabaseRequestDiagnostic = undefined;
}

export function getSupabaseRequestDiagnostic() {
  return lastSupabaseRequestDiagnostic;
}

function sanitizedRequestPath(input: RequestInfo | URL) {
  const requestUrl =
    input instanceof Request ? input.url : input instanceof URL ? input.href : input;
  const pathname = new URL(requestUrl).pathname;
  const storageObject = pathname.match(/^\/storage\/v1\/object\/([^/]+)(?:\/|$)/);

  if (storageObject) return `/storage/v1/object/${storageObject[1]}/<redacted>`;
  if (pathname.startsWith("/rest/v1/")) return "/rest/v1/<redacted>";
  if (pathname.startsWith("/storage/v1/")) return "/storage/v1/<redacted>";

  const apiPrefix = pathname.match(/^\/(?:auth|functions|realtime)\/v1(?:\/|$)/)?.[0];
  return apiPrefix ? `${apiPrefix}<redacted>` : "/<redacted>";
}

function diagnosticErrorCode(response: Response): Promise<string> {
  return response
    .clone()
    .json()
    .then((body: unknown) => {
      if (
        typeof body === "object" &&
        body !== null &&
        "code" in body &&
        typeof body.code === "string" &&
        /^[A-Za-z0-9_-]{1,100}$/.test(body.code)
      ) {
        return body.code;
      }

      return "unavailable";
    })
    .catch(() => "unavailable");
}

const diagnosticFetch: typeof fetch = async (input, init) => {
  let pathname = "/<unavailable>";
  try {
    pathname = sanitizedRequestPath(input);
  } catch {
    // Keep diagnostics best-effort; never block the request for logging.
  }

  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    lastSupabaseRequestDiagnostic = {
      pathname,
      status: "unavailable",
      code: "unavailable",
    };
    try {
      console.warn("Supabase request diagnostic", {
        pathname,
        status: "unavailable",
        code: "unavailable",
      });
    } catch {
      // Diagnostic logging must not replace the original network error.
    }
    throw error;
  }

  if (!response.ok) {
    let code = "unavailable";
    try {
      code = await diagnosticErrorCode(response);
    } catch {
      // The original response remains usable if diagnostic parsing fails.
    }

    lastSupabaseRequestDiagnostic = {
      pathname,
      status: response.status,
      code,
    };
    try {
      console.warn("Supabase request diagnostic", {
        pathname,
        status: response.status,
        code,
      });
    } catch {
      // Diagnostic logging must not alter the original response.
    }
  }

  return response;
};

export function getSupabaseBrowserClient() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  supabaseClient = createBrowserClient(supabaseUrl, supabasePublishableKey, {
    global: { fetch: diagnosticFetch },
  });
  return supabaseClient;
}

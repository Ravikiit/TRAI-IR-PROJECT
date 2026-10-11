import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import ts from "typescript";

async function loadTypeScriptModule(relativePath) {
  const sourceUrl = new URL(relativePath, import.meta.url);
  const source = await readFile(sourceUrl, "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const dataUrl = `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`;
  return import(dataUrl);
}

const [contract, uploadClient, finalization] = await Promise.all([
  loadTypeScriptModule("../src/lib/supabase/document-upload-contract.ts"),
  loadTypeScriptModule("../src/lib/supabase/document-upload-client.ts"),
  loadTypeScriptModule("../src/lib/supabase/document-upload-finalization.ts"),
]);
const {
  createDocumentFilePath,
  DOCUMENT_CATEGORIES,
  isExpectedSignedUploadUrl,
  isValidDocumentFilePath,
  MAX_DOCUMENT_SIZE,
  toDocumentInsert,
  validateDocumentFile,
  validateDocumentMetadata,
} = contract;
const { uploadFileToSignedUrl } = uploadClient;
const { finalizeDocumentUpload } = finalization;

const projectUrl = "https://example-project.supabase.co";
const id = "cd88c6a8-5487-4e04-8fc4-6a8dbf88b3fa";
const fileName = "briefing.pdf";
const filePath = `documents/${id}-briefing.pdf`;
const baseMetadata = {
  category: "Events",
  title: "  Regional meeting ",
  description: " Meeting notes ",
  importantInformation: " Key points ",
  uploadedBy: " Contributor ",
  sourceContext: " Annual program ",
  eventStartDate: "2025-03-12",
  eventEndDate: "2025-03-13",
  eventLocation: "Delhi",
  eventRegion: "Asia",
  eventCounterpart: "Partner regulator",
  eventActivityType: "Bilateral",
  eventParticipants: "TRAI delegation",
  eventTheme: "Connectivity",
  eventOutcome: "Follow-up agreed",
  eventSource: "Meeting record",
  eventSourceUrl: "https://example.org/meeting",
  speechDeliveryDate: "2025-03-12",
  speechEvent: "Opening session",
  speechDocumentType: "Address",
  speechBroadCategory: "Keynote",
  speechStandardisedTheme: "Digital regulation",
  speakerName: "A. Person",
  speakerDesignation: "Chair",
};

test("SDK constructs the signed Storage upload URL from a root Project URL", async () => {
  const requestedUrls = [];
  const sdk = createClient(projectUrl, "sb_publishable_test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input) => {
        requestedUrls.push(String(input));
        return Response.json({
          url: `/object/upload/sign/ir-documents/${filePath}?token=one-time-test-token`,
        });
      },
    },
  });

  const { data, error } = await sdk.storage
    .from("ir-documents")
    .createSignedUploadUrl(filePath, { upsert: false });

  assert.equal(error, null);
  assert.equal(
    new URL(requestedUrls[0]).pathname,
    `/storage/v1/object/upload/sign/ir-documents/${filePath}`,
  );
  assert.equal(
    new URL(data.signedUrl).pathname,
    `/storage/v1/object/upload/sign/ir-documents/${filePath}`,
  );
  assert.equal(
    isExpectedSignedUploadUrl(data.signedUrl, projectUrl, filePath),
    true,
  );
  assert.equal(
    isExpectedSignedUploadUrl(
      data.signedUrl,
      `${projectUrl}/rest/v1/`,
      filePath,
    ),
    false,
  );
  assert.doesNotMatch(new URL(data.signedUrl).pathname, /\/rest\/v1\/storage\/v1\//);
});

test("browser sends the file to the exact signed Storage URL", async () => {
  const signedUrl =
    `${projectUrl}/storage/v1/object/upload/sign/ir-documents/${filePath}?token=one-time-test-token`;
  const file = new File(["test document"], fileName, { type: "application/pdf" });
  let request;
  const result = await uploadFileToSignedUrl(
    signedUrl,
    file,
    "application/pdf",
    async (input, init) => {
      request = { url: String(input), init };
      return new Response(null, { status: 200 });
    },
  );

  assert.deepEqual(result, { succeeded: true });
  assert.equal(new URL(request.url).pathname, new URL(signedUrl).pathname);
  assert.doesNotMatch(new URL(request.url).pathname, /\/rest\/v1\/storage\/v1\//);
  assert.equal(request.init.method, "PUT");
  assert.equal(request.init.body, file);
  assert.equal(new Headers(request.init.headers).get("content-type"), "application/pdf");
});

test("reports Storage HTTP and network failures without exposing response contents", async () => {
  const file = new File(["test document"], fileName, { type: "application/pdf" });
  const httpFailure = await uploadFileToSignedUrl(
    "https://example-project.supabase.co/storage/v1/object/upload/sign/ir-documents/test?token=secret-token",
    file,
    "application/pdf",
    async () => Response.json(
      { code: "mime_mismatch", message: "private response content" },
      { status: 400 },
    ),
  );
  assert.deepEqual(httpFailure, {
    succeeded: false,
    status: 400,
    code: "mime_mismatch",
    networkFailure: false,
  });
  assert.equal("message" in httpFailure, false);

  const networkFailure = await uploadFileToSignedUrl(
    "https://example-project.supabase.co/storage/v1/object/upload/sign/ir-documents/test?token=secret-token",
    file,
    "application/pdf",
    async () => {
      throw new TypeError("network failure");
    },
  );
  assert.deepEqual(networkFailure, {
    succeeded: false,
    status: "unavailable",
    code: "network_error",
    networkFailure: true,
  });
});

test("validates the four categories, file extensions, size, and category fields", () => {
  assert.deepEqual(DOCUMENT_CATEGORIES, [
    "APT / ITU",
    "Authority / Member Speeches",
    "Events",
    "Miscellaneous",
  ]);
  assert.equal(validateDocumentFile(fileName, MAX_DOCUMENT_SIZE).valid, true);
  assert.equal(validateDocumentFile(fileName, 0).valid, true);
  assert.equal(validateDocumentFile("slides.PPTX", 1).valid, true);
  assert.equal(validateDocumentFile("archive.zip", 1).valid, false);
  assert.equal(validateDocumentFile(fileName, MAX_DOCUMENT_SIZE + 1).status, 413);
  assert.equal(validateDocumentMetadata(baseMetadata).valid, true);
  assert.equal(
    validateDocumentMetadata({ ...baseMetadata, eventStartDate: "2025-03-14" }).valid,
    false,
  );
  assert.equal(
    validateDocumentMetadata({
      ...baseMetadata,
      category: "Authority / Member Speeches",
      speechDeliveryDate: "",
    }).valid,
    false,
  );
  assert.equal(
    validateDocumentMetadata({ ...baseMetadata, category: "Other" }).valid,
    false,
  );
});

test("maps every core, Events, and Speeches metadata field to the existing columns", () => {
  const validated = validateDocumentMetadata(baseMetadata);
  assert.equal(validated.valid, true);
  if (!validated.valid) return;

  const row = toDocumentInsert(
    validated.metadata,
    fileName,
    filePath,
    "application/pdf",
    123,
  );
  assert.deepEqual(row, {
    category: "Events",
    title: "Regional meeting",
    description: "Meeting notes",
    important_information: "Key points",
    uploaded_by: "Contributor",
    file_name: fileName,
    file_path: filePath,
    file_type: "application/pdf",
    file_size: 123,
    source_context: "Annual program",
    event_start_date: "2025-03-12",
    event_end_date: "2025-03-13",
    event_location: "Delhi",
    event_region: "Asia",
    event_counterpart: "Partner regulator",
    event_activity_type: "Bilateral",
    event_participants: "TRAI delegation",
    event_theme: "Connectivity",
    event_outcome: "Follow-up agreed",
    event_source: "Meeting record",
    event_source_url: "https://example.org/meeting",
    speech_delivery_date: "2025-03-12",
    speech_event: "Opening session",
    speech_document_type: "Address",
    speech_broad_category: "Keynote",
    speech_standardised_theme: "Digital regulation",
    speaker_name: "A. Person",
    speaker_designation: "Chair",
  });
});

test("accepts only server-shaped paths tied to the original filename", () => {
  const generated = createDocumentFilePath(fileName, id);
  assert.equal(generated, filePath);
  assert.equal(isValidDocumentFilePath(generated, fileName), true);
  assert.equal(isValidDocumentFilePath(generated, "different.pdf"), false);
  assert.equal(isValidDocumentFilePath(`documents/../${fileName}`, fileName), false);
});

test("removes a newly uploaded object after a definite metadata error", async () => {
  const calls = [];
  const result = await finalizeDocumentUpload(
    toDocumentInsert(baseMetadata, fileName, filePath, "application/pdf", 123),
    filePath,
    {
      async insertDocument() {
        calls.push("insert");
        return { error: { code: "metadata_rejected", status: 400 } };
      },
      async removeDocument(path) {
        calls.push(`remove:${path}`);
        return { error: null };
      },
    },
  );

  assert.deepEqual(calls, ["insert", `remove:${filePath}`]);
  assert.deepEqual(result, {
    succeeded: false,
    code: "metadata_rejected",
    cleanup: { attempted: true, succeeded: true },
  });
});

test("reports cleanup failure separately from metadata failure", async () => {
  const result = await finalizeDocumentUpload(
    toDocumentInsert(baseMetadata, fileName, filePath, "application/pdf", 123),
    filePath,
    {
      async insertDocument() {
        return { error: { code: "metadata_rejected", status: 400 } };
      },
      async removeDocument() {
        return { error: { code: "delete_not_allowed" } };
      },
    },
  );

  assert.deepEqual(result, {
    succeeded: false,
    code: "metadata_rejected",
    cleanup: {
      attempted: true,
      succeeded: false,
      code: "delete_not_allowed",
    },
  });
});

test("does not delete the object when the metadata result is ambiguous", async () => {
  let cleanupCalled = false;
  const result = await finalizeDocumentUpload(
    toDocumentInsert(baseMetadata, fileName, filePath, "application/pdf", 123),
    filePath,
    {
      async insertDocument() {
        throw new Error("connection interrupted");
      },
      async removeDocument() {
        cleanupCalled = true;
        return { error: null };
      },
    },
  );

  assert.equal(cleanupCalled, false);
  assert.deepEqual(result, {
    succeeded: false,
    code: "database_result_unknown",
    cleanup: {
      attempted: false,
      succeeded: null,
      code: "database_result_unknown",
    },
  });
});

test("does not delete the object after a server-side database error with unknown outcome", async () => {
  let cleanupCalled = false;
  const result = await finalizeDocumentUpload(
    toDocumentInsert(baseMetadata, fileName, filePath, "application/pdf", 123),
    filePath,
    {
      async insertDocument() {
        return { error: { code: "server_error", status: 500 } };
      },
      async removeDocument() {
        cleanupCalled = true;
        return { error: null };
      },
    },
  );

  assert.equal(cleanupCalled, false);
  assert.deepEqual(result, {
    succeeded: false,
    code: "server_error",
    cleanup: {
      attempted: false,
      succeeded: null,
      code: "database_result_unknown",
    },
  });
});

test("does not delete the object when PostgREST reports a network failure", async () => {
  let cleanupCalled = false;
  const result = await finalizeDocumentUpload(
    toDocumentInsert(baseMetadata, fileName, filePath, "application/pdf", 123),
    filePath,
    {
      async insertDocument() {
        return { error: { code: "fetch_error", status: 0 } };
      },
      async removeDocument() {
        cleanupCalled = true;
        return { error: null };
      },
    },
  );

  assert.equal(cleanupCalled, false);
  assert.equal(result.succeeded, false);
  if (!result.succeeded) {
    assert.equal(result.cleanup.attempted, false);
    assert.equal(result.cleanup.succeeded, null);
  }
});

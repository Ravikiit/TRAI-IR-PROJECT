import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(
  new URL("../src/lib/supabase/document-deletion.ts", import.meta.url),
  "utf8",
);
const javascript = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { deleteUploadedDocument } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

const documentId = "cd88c6a8-5487-4e04-8fc4-6a8dbf88b3fa";
const filePath = "documents/91c1ab22-4468-4a5e-8a30-5901ef4300b1-briefing.pdf";
const passphrase = "a-long-shared-delete-passphrase";

function createStore(overrides = {}) {
  const calls = [];
  const store = {
    async findDocument(id) {
      calls.push(["findDocument", id]);
      return { filePath, error: false };
    },
    async removeStorageObject(path) {
      calls.push(["removeStorageObject", path]);
      return true;
    },
    async deleteDocumentRow(id, path) {
      calls.push(["deleteDocumentRow", id, path]);
      return true;
    },
    async documentRowExists(id) {
      calls.push(["documentRowExists", id]);
      return false;
    },
    ...overrides,
  };
  return { store, calls };
}

function configuration(store, expectedPassphrase = passphrase) {
  return {
    expectedPassphrase,
    createStore: () => store,
  };
}

async function responseBody(response) {
  return { status: response.status, body: await response.json() };
}

test("rejects an incorrect passphrase without accessing storage or metadata", async () => {
  const { store, calls } = createStore();
  const response = await deleteUploadedDocument(
    documentId,
    "incorrect",
    configuration(store),
  );

  assert.deepEqual(await responseBody(response), {
    status: 401,
    body: { error: "unauthorized" },
  });
  assert.deepEqual(calls, []);
});

test("fails closed when deletion configuration is missing", async () => {
  const originalConsoleError = console.error;
  const diagnosticCodes = [];
  console.error = (_message, details) => diagnosticCodes.push(details.code);

  try {
    const missingPassphrase = await deleteUploadedDocument(
      documentId,
      passphrase,
      {
        configurationErrorCode: "missing_document_delete_passphrase",
        createStore: () => createStore().store,
      },
    );
    const missingUrl = await deleteUploadedDocument(documentId, passphrase, {
      expectedPassphrase: passphrase,
      configurationErrorCode: "missing_supabase_url",
      createStore: undefined,
    });
    const missingServiceKey = await deleteUploadedDocument(
      documentId,
      passphrase,
      {
        expectedPassphrase: passphrase,
        configurationErrorCode: "missing_supabase_service_role_key",
      },
    );

    for (const response of [missingPassphrase, missingUrl, missingServiceKey]) {
      assert.deepEqual(await responseBody(response), {
        status: 503,
        body: { error: "deletion_not_configured" },
      });
    }
    assert.deepEqual(diagnosticCodes, [
      "missing_document_delete_passphrase",
      "missing_supabase_url",
      "missing_supabase_service_role_key",
    ]);
  } finally {
    console.error = originalConsoleError;
  }
});

test("logs only a safe code when Supabase client initialization fails", async () => {
  const originalConsoleError = console.error;
  const diagnosticEntries = [];
  console.error = (...args) => diagnosticEntries.push(args);

  try {
    const response = await deleteUploadedDocument(documentId, passphrase, {
      expectedPassphrase: passphrase,
      createStore: () => {
        throw new Error("private initialization details");
      },
    });

    assert.deepEqual(await responseBody(response), {
      status: 503,
      body: { error: "deletion_not_configured" },
    });
    assert.deepEqual(diagnosticEntries, [[
      "Document deletion configuration failure.",
      { code: "supabase_client_initialization_failed" },
    ]]);
    assert.equal(
      JSON.stringify(diagnosticEntries).includes("private initialization details"),
      false,
    );
  } finally {
    console.error = originalConsoleError;
  }
});

test("rejects invalid IDs before creating a Supabase client", async () => {
  let storeCreated = false;
  const response = await deleteUploadedDocument(
    "../curated-record",
    passphrase,
    {
      expectedPassphrase: passphrase,
      createStore: () => {
        storeCreated = true;
        return createStore().store;
      },
    },
  );

  assert.deepEqual(await responseBody(response), {
    status: 400,
    body: { error: "invalid_document_id" },
  });
  assert.equal(storeCreated, false);
});

test("protects curated records that have no uploaded-document row", async () => {
  const { store, calls } = createStore({
    async findDocument(id) {
      calls.push(["findDocument", id]);
      return { filePath: null, error: false };
    },
  });
  const response = await deleteUploadedDocument(
    documentId,
    passphrase,
    configuration(store),
  );

  assert.deepEqual(await responseBody(response), {
    status: 404,
    body: { error: "uploaded_document_not_found" },
  });
  assert.deepEqual(calls, [["findDocument", documentId]]);
});

test("deletes only the database-resolved Storage object and matching row", async () => {
  const { store, calls } = createStore();
  const response = await deleteUploadedDocument(
    documentId,
    passphrase,
    configuration(store),
  );

  assert.deepEqual(await responseBody(response), {
    status: 200,
    body: { deleted: true },
  });
  assert.deepEqual(calls, [
    ["findDocument", documentId],
    ["removeStorageObject", filePath],
    ["deleteDocumentRow", documentId, filePath],
    ["documentRowExists", documentId],
  ]);
});

test("does not delete metadata when Storage deletion fails", async () => {
  const { store, calls } = createStore({
    async removeStorageObject(path) {
      calls.push(["removeStorageObject", path]);
      return false;
    },
  });
  const response = await deleteUploadedDocument(
    documentId,
    passphrase,
    configuration(store),
  );

  assert.deepEqual(await responseBody(response), {
    status: 502,
    body: { error: "storage_delete_failed" },
  });
  assert.deepEqual(calls, [
    ["findDocument", documentId],
    ["removeStorageObject", filePath],
  ]);
});

test("reports partial failure when the database row remains after Storage removal", async () => {
  const { store, calls } = createStore({
    async deleteDocumentRow(id, path) {
      calls.push(["deleteDocumentRow", id, path]);
      return false;
    },
    async documentRowExists(id) {
      calls.push(["documentRowExists", id]);
      return true;
    },
  });
  const response = await deleteUploadedDocument(
    documentId,
    passphrase,
    configuration(store),
  );

  assert.deepEqual(await responseBody(response), {
    status: 500,
    body: { error: "metadata_delete_failed", partial: true },
  });
  assert.deepEqual(calls, [
    ["findDocument", documentId],
    ["removeStorageObject", filePath],
    ["deleteDocumentRow", documentId, filePath],
    ["documentRowExists", documentId],
  ]);
});

test("rejects database paths outside the uploaded documents naming convention", async () => {
  const { store, calls } = createStore({
    async findDocument(id) {
      calls.push(["findDocument", id]);
      return { filePath: "other-bucket/curated.pdf", error: false };
    },
  });
  const response = await deleteUploadedDocument(
    documentId,
    passphrase,
    configuration(store),
  );

  assert.deepEqual(await responseBody(response), {
    status: 409,
    body: { error: "document_storage_path_not_allowed" },
  });
  assert.deepEqual(calls, [["findDocument", documentId]]);
});

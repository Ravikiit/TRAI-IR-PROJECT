import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const sourceUrl = new URL(
  "../src/lib/supabase/repository-document-filter.ts",
  import.meta.url,
);
const source = await readFile(sourceUrl, "utf8");
const javascript = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const filterModule = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);
const repositorySource = await readFile(
  new URL("../src/app/documents/document-repository.tsx", import.meta.url),
  "utf8",
);
const aptItuPageSource = await readFile(
  new URL("../src/app/documents/apt-itu/page.tsx", import.meta.url),
  "utf8",
);
const miscellaneousPageSource = await readFile(
  new URL("../src/app/documents/miscellaneous/page.tsx", import.meta.url),
  "utf8",
);

test("dedicated repository categories use their exact stored values", () => {
  assert.deepEqual(filterModule.DOCUMENT_REPOSITORY_CATEGORIES, {
    aptItu: "APT / ITU",
    miscellaneous: "Miscellaneous",
  });
  assert.deepEqual(
    filterModule.getRepositoryDocumentCategoryFilter("APT / ITU"),
    { column: "category", value: "APT / ITU" },
  );
  assert.deepEqual(
    filterModule.getRepositoryDocumentCategoryFilter("Miscellaneous"),
    { column: "category", value: "Miscellaneous" },
  );
});

test("the general repository does not apply a category filter", () => {
  assert.equal(filterModule.getRepositoryDocumentCategoryFilter(), null);
});

test("dedicated pages pass their exact categories to a Supabase equality filter", () => {
  assert.match(repositorySource, /\.eq\(categoryFilter\.column, categoryFilter\.value\)/);
  assert.match(aptItuPageSource, /category=\{DOCUMENT_REPOSITORY_CATEGORIES\.aptItu\}/);
  assert.match(
    miscellaneousPageSource,
    /category=\{DOCUMENT_REPOSITORY_CATEGORIES\.miscellaneous\}/,
  );
});

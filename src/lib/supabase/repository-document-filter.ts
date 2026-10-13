export const DOCUMENT_REPOSITORY_CATEGORIES = {
  aptItu: "APT / ITU",
  miscellaneous: "Miscellaneous",
} as const;

export type RepositoryDocumentCategory =
  (typeof DOCUMENT_REPOSITORY_CATEGORIES)[keyof typeof DOCUMENT_REPOSITORY_CATEGORIES];

export function getRepositoryDocumentCategoryFilter(
  category?: RepositoryDocumentCategory,
) {
  return category ? { column: "category" as const, value: category } : null;
}

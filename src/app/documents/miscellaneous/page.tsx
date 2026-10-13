import { DocumentRepository } from "../document-repository";
import { DOCUMENT_REPOSITORY_CATEGORIES } from "@/lib/supabase/repository-document-filter";

export default function MiscellaneousDocumentsPage() {
  return (
    <DocumentRepository category={DOCUMENT_REPOSITORY_CATEGORIES.miscellaneous} />
  );
}

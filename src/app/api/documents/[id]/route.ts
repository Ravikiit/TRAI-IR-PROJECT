import { createClient } from "@supabase/supabase-js";
import { deleteUploadedDocument } from "@/lib/supabase/document-deletion";

export const runtime = "nodejs";

const STORAGE_BUCKET = "ir-documents";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const expectedPassphrase = process.env.DOCUMENT_DELETE_PASSPHRASE;
  const configurationErrorCode = !expectedPassphrase
    ? "missing_document_delete_passphrase"
    : !supabaseUrl
      ? "missing_supabase_url"
      : !serviceRoleKey
        ? "missing_supabase_service_role_key"
        : undefined;

  return deleteUploadedDocument(
    id,
    request.headers.get("x-document-delete-passphrase"),
    {
      expectedPassphrase,
      configurationErrorCode,
      createStore:
        supabaseUrl && serviceRoleKey
          ? () => {
              const supabase = createClient(supabaseUrl, serviceRoleKey, {
                auth: {
                  autoRefreshToken: false,
                  persistSession: false,
                },
              });

              return {
                async findDocument(documentId) {
                  const { data, error } = await supabase
                    .from("documents")
                    .select("file_path")
                    .eq("id", documentId)
                    .maybeSingle();

                  return error
                    ? { filePath: null, error: true }
                    : { filePath: data?.file_path ?? null, error: false };
                },
                async removeStorageObject(filePath) {
                  const { error } = await supabase.storage
                    .from(STORAGE_BUCKET)
                    .remove([filePath]);
                  return !error;
                },
                async deleteDocumentRow(documentId, filePath) {
                  const { error } = await supabase
                    .from("documents")
                    .delete()
                    .eq("id", documentId)
                    .eq("file_path", filePath);
                  return !error;
                },
                async documentRowExists(documentId) {
                  const { data, error } = await supabase
                    .from("documents")
                    .select("id")
                    .eq("id", documentId)
                    .maybeSingle();

                  return error ? null : Boolean(data);
                },
              };
            }
          : undefined,
    },
  );
}

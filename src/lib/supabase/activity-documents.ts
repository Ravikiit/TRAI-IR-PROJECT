import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { InternationalActivity } from "@/types/international-activity";
import type { ChairmanSpeech } from "@/types/chairman-speech";

const STORAGE_BUCKET = "ir-documents";

type UploadedActivityRow = {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  event_start_date: string | null;
  event_end_date: string | null;
  event_location: string | null;
  event_region: string | null;
  event_counterpart: string | null;
  event_activity_type: string | null;
  event_participants: string | null;
  event_theme: string | null;
  event_outcome: string | null;
  event_source: string | null;
  event_source_url: string | null;
};

type DatedActivityRow = UploadedActivityRow & { event_start_date: string };

type UploadedSpeechRow = {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_path: string;
  speech_delivery_date: string | null;
  speech_event: string | null;
  speech_document_type: string | null;
  speech_broad_category: string | null;
  speech_standardised_theme: string | null;
  speaker_name: string | null;
  speaker_designation: string | null;
};

function publicDocumentUrl(filePath: string) {
  return getSupabaseBrowserClient().storage.from(STORAGE_BUCKET).getPublicUrl(filePath).data.publicUrl;
}

function requiredText(value: string | null, fallback = "Not provided") {
  return value?.trim() || fallback;
}

function formatDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatEventDate(startDate: string, endDate: string | null) {
  if (!endDate || endDate === startDate) return formatDate(startDate);
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

function isDateOnly(value: string | null): value is string {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function fetchUploadedActivities(): Promise<InternationalActivity[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("documents")
    .select(
      "id, title, description, file_path, event_start_date, event_end_date, event_location, event_region, event_counterpart, event_activity_type, event_participants, event_theme, event_outcome, event_source, event_source_url",
    )
    .eq("category", "Events");

  if (error) throw error;

  return ((data ?? []) as UploadedActivityRow[])
    .filter((row): row is DatedActivityRow => isDateOnly(row.event_start_date))
    .map((row): InternationalActivity => ({
      key: row.id,
      activityId: row.id,
      date: formatEventDate(row.event_start_date, row.event_end_date),
      dateSort: row.event_start_date,
      location: requiredText(row.event_location),
      region: requiredText(row.event_region),
      counterpart: requiredText(row.event_counterpart),
      activityType: requiredText(row.event_activity_type),
      title: requiredText(row.title),
      description: requiredText(row.description),
      participants: requiredText(row.event_participants),
      theme: requiredText(row.event_theme),
      outcome: requiredText(row.event_outcome),
      source: requiredText(row.event_source),
      sourceUrl: row.event_source_url?.trim() || null,
      sourceAuthority: "User submitted",
      verificationStatus: "User submitted",
      documentUrl: publicDocumentUrl(row.file_path),
    }));
}

export async function fetchUploadedSpeeches(): Promise<ChairmanSpeech[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("documents")
    .select(
      "id, title, description, file_name, file_path, speech_delivery_date, speech_event, speech_document_type, speech_broad_category, speech_standardised_theme, speaker_name, speaker_designation",
    )
    .eq("category", "Authority / Member Speeches");

  if (error) throw error;

  return ((data ?? []) as UploadedSpeechRow[]).map((row): ChairmanSpeech => {
    const deliveryDate = isDateOnly(row.speech_delivery_date)
      ? row.speech_delivery_date
      : null;
    const date = deliveryDate ? formatDate(deliveryDate) : "Date unavailable";

    return {
      ID: row.id,
      Title: requiredText(row.title),
      Event: requiredText(row.speech_event),
      Date: date,
      Year: deliveryDate ? deliveryDate.slice(0, 4) : "Unknown",
      "Document Type": requiredText(row.speech_document_type),
      "Broad Category": requiredText(row.speech_broad_category),
      "Standardised Theme": requiredText(row.speech_standardised_theme),
      "Short Description": requiredText(row.description),
      filePath: publicDocumentUrl(row.file_path),
      "Original Filename": requiredText(row.file_name),
      "Theme Confidence": "Not assessed",
      "Human Review": "Not reviewed (user submitted)",
      ...(row.speaker_name?.trim() ? { "Speaker Name": row.speaker_name.trim() } : {}),
      ...(row.speaker_designation?.trim()
        ? { "Speaker Designation": row.speaker_designation.trim() }
        : {}),
    };
  });
}

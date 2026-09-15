export type EngagementType = "international" | "domestic";

export type ChairmanSpeech = {
  id: string;
  title: string;
  chairman: string;
  date: string;
  year: string;
  event: string;
  organisation: string;
  location: string;
  country: string;
  type: EngagementType;
  topics: string[];
  description: string;
  documentPath: string;
};

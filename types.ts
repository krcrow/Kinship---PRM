
export enum ContactType {
  EMAIL = 'Email',
  TEXT = 'Text',
  IN_PERSON = 'In-person',
  CALL = 'Call',
  TEAMS = 'Teams/Zoom',
}

export interface Interaction {
  id: string;
  date: string; // ISO String
  type: ContactType;
  notes: string;
  summary?: string; // Comprehensive 1-2 sentence summary
}

export interface Connection {
  id: string;
  name: string;
  company: string;
  role: string;
  
  // Contact Info V5
  emailPersonal?: string;
  emailWork?: string;
  phonePersonal?: string;
  phoneWork?: string;
  linkedinUrl?: string;
  address: string;
  avatarUrl?: string;
  
  // Status
  lastContactDate: string | null; // ISO String
  lastContactType: ContactType | null;
  plannedContactDate: string | null; // ISO String
  plannedContactType?: ContactType | null;
  
  // Memory Bank -> Context
  contextInput: string; // Formerly rawThoughts
  contextSummary: string; // Summary of ONLY contextInput
  overviewSummary: string; // Master summary: contextInput + latest interaction
  
  // Timeline
  interactions: Interaction[];
}

export type SortOption = 'name' | 'lastContacted' | 'upcoming';
export type ViewMode = 'grid' | 'list' | 'calendar';

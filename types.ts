export interface CostTier {
  id: string;
  pages: number;
  credits: number;
}

export interface BirthdayBonusConfig {
  enabled: boolean;
  credits: number;
  emailTemplate: string;
}

export interface AdminConfig {
  costTiers: CostTier[];
  birthdayBonus: BirthdayBonusConfig;
}

export interface Chapter {
  title: string;
  content: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  language: string;
  coverImageUrl: string;
  chapters: Chapter[];
  synopsis: string;
}

export interface GenerationProgress {
  status: string;
  current?: number;
  total?: number;
  message?: string;
}

export interface User {
    id: string;
    name: string;
    credits: number;
    books: Book[];
    birthDate?: string; // Format: YYYY-MM-DD
}

export interface BookGenerationDetails {
    description: string;
    pages: number;
    coverKeywords: string;
    authorName: string;
    title: string; // Empty if AI should generate
    language: string;
}

export interface GenerationJob {
  jobId: string;
  progress: GenerationProgress;
  tempTitle: string;
  authorName: string;
}

export interface AppNotification {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
  details?: string;
}
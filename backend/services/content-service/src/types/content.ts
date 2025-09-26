/**
 * Content Service Types
 * Based on database-schema.md and api-specification.md
 */

export interface Scenario {
  id: string;
  title: string;
  description: string;
  profession: 'doctor' | 'nurse' | 'dentist' | 'physiotherapist';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  duration: number; // in minutes
  dialogues: Dialogue[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface Dialogue {
  id: string;
  scenarioId: string;
  speaker: 'user' | 'patient';
  message: string;
  expectedResponse?: string;
  order: number;
  metadata?: Record<string, any>;
}

export interface UserProgress {
  id: string;
  userId: string;
  scenarioId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  currentDialogueId?: string;
  score?: number;
  completedAt?: Date;
  timeSpent: number; // in seconds
  attempts: number;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  uploadedBy: string;
  scenarioId?: string | undefined;
  dialogueId?: string | undefined;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface ScenarioCreateRequest {
  title: string;
  description: string;
  profession: 'doctor' | 'nurse' | 'dentist' | 'physiotherapist';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  duration: number;
  dialogues: Omit<Dialogue, 'id' | 'scenarioId'>[];
  metadata?: Record<string, any>;
}

export interface ScenarioUpdateRequest {
  title?: string;
  description?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  duration?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface ProgressUpdateRequest {
  status?: 'in_progress' | 'completed';
  currentDialogueId?: string;
  score?: number;
  timeSpent?: number;
  metadata?: Record<string, any>;
}

export interface ScenarioListResponse {
  scenarios: Scenario[];
  total: number;
  page: number;
  limit: number;
}

export interface ProgressResponse {
  progress: UserProgress;
  scenario: Scenario;
  nextDialogue?: Dialogue;
}

export interface ScenarioFilters {
  profession?: string | undefined;
  difficulty?: string | undefined;
  category?: string | undefined;
  search?: string | undefined;
  isActive?: boolean | undefined;
}
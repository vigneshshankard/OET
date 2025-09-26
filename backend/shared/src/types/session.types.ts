// Session-related types from database-schema.md
export interface Session {
  id: string;
  userId: string;
  scenarioId: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  durationSeconds: number;
  createdAt: Date;
}

export interface CreateSessionRequest {
  scenarioId: string;
}

export interface UpdateSessionRequest {
  status?: 'active' | 'completed' | 'cancelled';
  durationSeconds?: number;
}

export interface SessionProgress {
  sessionId: string;
  userId: string;
  averageScore: number;
  sessionsCompleted: number;
  totalPracticeTime: number;
  improvementAreas: string[];
  strengths: string[];
}

export interface SessionAnalytics {
  totalSessions: number;
  averageScore: number;
  totalPracticeTime: number;
  completionRate: number;
  progressTrend: Array<{
    date: string;
    score: number;
    sessionsCount: number;
  }>;
}
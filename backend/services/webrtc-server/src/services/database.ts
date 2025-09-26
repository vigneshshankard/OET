import { Pool, PoolClient } from 'pg';
import { environment } from '../config/environment';
import logger from '../utils/logger';
import {
  PracticeSession,
  SessionStatus,
  SessionMessage,
  SessionAnalytics,
  WebRTCStats,
  AudioMetrics,
  ConnectionMetrics
} from '../types/session';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: environment.DB_HOST,
      port: environment.DB_PORT,
      database: environment.DB_NAME,
      user: environment.DB_USER,
      password: environment.DB_PASSWORD,
      max: environment.DB_MAX_CONNECTIONS,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    logger.info('Database pool configured', {
      host: environment.DB_HOST,
      database: environment.DB_NAME,
      maxConnections: environment.DB_MAX_CONNECTIONS
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      logger.error('Database health check failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  // Session Management
  async createSession(sessionData: {
    userId: string;
    scenarioId: string;
    livekitRoomName: string;
    livekitToken?: string;
  }): Promise<PracticeSession> {
    const client = await this.pool.connect();
    try {
      const sessionId = crypto.randomUUID();
      const now = new Date();

      const result = await client.query(
        `INSERT INTO practice_sessions 
         (id, user_id, scenario_id, status, livekit_room_name, livekit_token, 
          start_time, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          sessionId,
          sessionData.userId,
          sessionData.scenarioId,
          'active',
          sessionData.livekitRoomName,
          sessionData.livekitToken,
          now,
          now,
          now
        ]
      );

      logger.info('Practice session created', { 
        sessionId, 
        userId: sessionData.userId,
        scenarioId: sessionData.scenarioId 
      });
      
      return this.mapSessionRow(result.rows[0]);

    } catch (error) {
      logger.error('Failed to create practice session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: sessionData.userId,
        scenarioId: sessionData.scenarioId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async getSessionById(sessionId: string): Promise<PracticeSession | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM practice_sessions WHERE id = $1',
        [sessionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapSessionRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get session by ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async getActiveSessionsByUser(userId: string): Promise<PracticeSession[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM practice_sessions 
         WHERE user_id = $1 AND status = 'active' 
         ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows.map(row => this.mapSessionRow(row));
    } catch (error) {
      logger.error('Failed to get active sessions by user', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async updateSession(sessionId: string, updates: Partial<PracticeSession>): Promise<PracticeSession> {
    const client = await this.pool.connect();
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id' && key !== 'createdAt') {
          const dbKey = this.camelToSnakeCase(key);
          updateFields.push(`${dbKey} = $${paramCount}`);
          updateValues.push(value);
          paramCount++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push(`updated_at = $${paramCount}`);
      updateValues.push(new Date());
      updateValues.push(sessionId);

      const query = `
        UPDATE practice_sessions 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount + 1}
        RETURNING *
      `;

      const result = await client.query(query, updateValues);

      if (result.rows.length === 0) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      logger.info('Practice session updated', { sessionId });
      return this.mapSessionRow(result.rows[0]);

    } catch (error) {
      logger.error('Failed to update session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async completeSession(sessionId: string, duration: number): Promise<PracticeSession> {
    const endTime = new Date();
    return this.updateSession(sessionId, {
      status: 'completed' as SessionStatus,
      endTime,
      duration
    });
  }

  async cancelSession(sessionId: string): Promise<PracticeSession> {
    const endTime = new Date();
    return this.updateSession(sessionId, {
      status: 'cancelled' as SessionStatus,
      endTime
    });
  }

  // Session Messages
  async saveSessionMessage(message: {
    sessionId: string;
    type: string;
    data: any;
    userId: string;
    sequence: number;
  }): Promise<SessionMessage> {
    const client = await this.pool.connect();
    try {
      const messageId = crypto.randomUUID();
      const now = new Date();

      const result = await client.query(
        `INSERT INTO session_messages 
         (id, session_id, type, data, user_id, sequence, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          messageId,
          message.sessionId,
          message.type,
          JSON.stringify(message.data),
          message.userId,
          message.sequence,
          now
        ]
      );

      return this.mapMessageRow(result.rows[0]);

    } catch (error) {
      logger.error('Failed to save session message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: message.sessionId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async getSessionMessages(
    sessionId: string, 
    limit: number = 100
  ): Promise<SessionMessage[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM session_messages 
         WHERE session_id = $1 
         ORDER BY timestamp DESC, sequence DESC 
         LIMIT $2`,
        [sessionId, limit]
      );

      return result.rows.map(row => this.mapMessageRow(row));
    } catch (error) {
      logger.error('Failed to get session messages', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // Analytics and Metrics
  async saveSessionAnalytics(analytics: {
    sessionId: string;
    audioQualityScore: number;
    averageLatency: number;
    totalSpeakingTime: number;
    silenceRatio: number;
    interruptionCount: number;
    responseAccuracy: number;
    technicalIssues: string[];
  }): Promise<SessionAnalytics> {
    const client = await this.pool.connect();
    try {
      const analyticsId = crypto.randomUUID();
      const now = new Date();

      const result = await client.query(
        `INSERT INTO session_analytics 
         (id, session_id, audio_quality_score, average_latency, total_speaking_time,
          silence_ratio, interruption_count, response_accuracy, technical_issues, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          analyticsId,
          analytics.sessionId,
          analytics.audioQualityScore,
          analytics.averageLatency,
          analytics.totalSpeakingTime,
          analytics.silenceRatio,
          analytics.interruptionCount,
          analytics.responseAccuracy,
          JSON.stringify(analytics.technicalIssues),
          now
        ]
      );

      logger.info('Session analytics saved', { sessionId: analytics.sessionId });
      return this.mapAnalyticsRow(result.rows[0]);

    } catch (error) {
      logger.error('Failed to save session analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: analytics.sessionId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async saveWebRTCStats(stats: {
    sessionId: string;
    connectionId: string;
    audioMetrics: AudioMetrics[];
    connectionMetrics: ConnectionMetrics[];
    totalDuration: number;
    averageQuality: number;
  }): Promise<WebRTCStats> {
    const client = await this.pool.connect();
    try {
      const statsId = crypto.randomUUID();
      const now = new Date();

      const result = await client.query(
        `INSERT INTO webrtc_stats 
         (id, session_id, connection_id, audio_metrics, connection_metrics,
          total_duration, average_quality, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          statsId,
          stats.sessionId,
          stats.connectionId,
          JSON.stringify(stats.audioMetrics),
          JSON.stringify(stats.connectionMetrics),
          stats.totalDuration,
          stats.averageQuality,
          now
        ]
      );

      logger.info('WebRTC stats saved', { 
        sessionId: stats.sessionId,
        connectionId: stats.connectionId 
      });
      
      return this.mapWebRTCStatsRow(result.rows[0]);

    } catch (error) {
      logger.error('Failed to save WebRTC stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: stats.sessionId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // Recent Sessions
  async getRecentSessions(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: SessionStatus
  ): Promise<{ sessions: PracticeSession[]; total: number }> {
    const client = await this.pool.connect();
    try {
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE user_id = $1';
      let params: any[] = [userId];
      let paramCount = 2;

      if (status) {
        whereClause += ` AND status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM practice_sessions ${whereClause}`;
      const countResult = await client.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count, 10);

      // Get sessions
      const sessionsQuery = `
        SELECT * FROM practice_sessions 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;
      params.push(limit, offset);

      const sessionsResult = await client.query(sessionsQuery, params);
      const sessions = sessionsResult.rows.map(row => this.mapSessionRow(row));

      return { sessions, total };
    } catch (error) {
      logger.error('Failed to get recent sessions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // Utility Methods
  private mapSessionRow(row: any): PracticeSession {
    const session: any = {
      id: row.id,
      userId: row.user_id,
      scenarioId: row.scenario_id,
      status: row.status,
      livekitRoomName: row.livekit_room_name,
      startTime: new Date(row.start_time),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };

    if (row.livekit_token) {
      session.livekitToken = row.livekit_token;
    }

    if (row.end_time) {
      session.endTime = new Date(row.end_time);
    }

    if (row.duration !== null && row.duration !== undefined) {
      session.duration = row.duration;
    }

    return session;
  }

  private mapMessageRow(row: any): SessionMessage {
    return {
      sessionId: row.session_id,
      type: row.type,
      data: JSON.parse(row.data),
      timestamp: new Date(row.timestamp),
      userId: row.user_id,
      sequence: row.sequence
    };
  }

  private mapAnalyticsRow(row: any): SessionAnalytics {
    return {
      sessionId: row.session_id,
      audioQualityScore: row.audio_quality_score,
      averageLatency: row.average_latency,
      totalSpeakingTime: row.total_speaking_time,
      silenceRatio: row.silence_ratio,
      interruptionCount: row.interruption_count,
      responseAccuracy: row.response_accuracy,
      technicalIssues: JSON.parse(row.technical_issues),
      createdAt: new Date(row.created_at)
    };
  }

  private mapWebRTCStatsRow(row: any): WebRTCStats {
    return {
      sessionId: row.session_id,
      connectionId: row.connection_id,
      audioMetrics: JSON.parse(row.audio_metrics),
      connectionMetrics: JSON.parse(row.connection_metrics),
      totalDuration: row.total_duration,
      averageQuality: row.average_quality
    };
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}
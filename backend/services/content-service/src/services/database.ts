/**
 * Database Service for Content Management
 * PostgreSQL operations for scenarios, progress, and media
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { 
  Scenario, 
  Dialogue, 
  UserProgress, 
  MediaFile, 
  ScenarioCreateRequest,
  ScenarioUpdateRequest,
  ProgressUpdateRequest,
  ScenarioFilters 
} from '../types/content';
import { logger } from '../utils/logger';

export class DatabaseService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Scenario Operations
  async createScenario(
    scenarioData: ScenarioCreateRequest, 
    createdBy: string
  ): Promise<Scenario> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert scenario
      const scenarioQuery = `
        INSERT INTO scenarios (
          title, description, profession, difficulty, category, 
          duration, is_active, metadata, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, created_at, updated_at
      `;
      
      const scenarioResult = await client.query(scenarioQuery, [
        scenarioData.title,
        scenarioData.description,
        scenarioData.profession,
        scenarioData.difficulty,
        scenarioData.category,
        scenarioData.duration,
        true, // isActive
        scenarioData.metadata || {},
        createdBy
      ]);
      
      const scenarioId = scenarioResult.rows[0].id;
      
      // Insert dialogues
      const dialogues: Dialogue[] = [];
      for (const [index, dialogue] of scenarioData.dialogues.entries()) {
        const dialogueQuery = `
          INSERT INTO dialogues (
            scenario_id, speaker, message, expected_response, 
            order_index, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `;
        
        const dialogueResult = await client.query(dialogueQuery, [
          scenarioId,
          dialogue.speaker,
          dialogue.message,
          dialogue.expectedResponse,
          dialogue.order,
          dialogue.metadata || {}
        ]);
        
        dialogues.push({
          id: dialogueResult.rows[0].id,
          scenarioId,
          speaker: dialogue.speaker,
          message: dialogue.message,
          expectedResponse: dialogue.expectedResponse || '',
          order: dialogue.order,
          metadata: dialogue.metadata || {}
        });
      }
      
      await client.query('COMMIT');
      
      const scenario: Scenario = {
        id: scenarioId,
        title: scenarioData.title,
        description: scenarioData.description,
        profession: scenarioData.profession,
        difficulty: scenarioData.difficulty,
        category: scenarioData.category,
        duration: scenarioData.duration,
        dialogues,
        isActive: true,
        createdAt: scenarioResult.rows[0].created_at,
        updatedAt: scenarioResult.rows[0].updated_at,
        metadata: scenarioData.metadata || {}
      };
      
      logger.info('Scenario created successfully', { scenarioId, createdBy });
      return scenario;
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create scenario', { error, scenarioData });
      throw error;
    } finally {
      client.release();
    }
  }

  async getScenarios(
    filters: ScenarioFilters = {}, 
    page = 1, 
    limit = 20
  ): Promise<{ scenarios: Scenario[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const queryParams: any[] = [];
      let paramIndex = 1;

      // Apply filters
      if (filters.profession) {
        whereClause += ` AND s.profession = $${paramIndex}`;
        queryParams.push(filters.profession);
        paramIndex++;
      }

      if (filters.difficulty) {
        whereClause += ` AND s.difficulty = $${paramIndex}`;
        queryParams.push(filters.difficulty);
        paramIndex++;
      }

      if (filters.category) {
        whereClause += ` AND s.category = $${paramIndex}`;
        queryParams.push(filters.category);
        paramIndex++;
      }

      if (filters.search) {
        whereClause += ` AND (s.title ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex})`;
        queryParams.push(`%${filters.search}%`);
        paramIndex++;
      }

      if (filters.isActive !== undefined) {
        whereClause += ` AND s.is_active = $${paramIndex}`;
        queryParams.push(filters.isActive);
        paramIndex++;
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM scenarios s 
        ${whereClause}
      `;
      const countResult = await this.pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Get scenarios with dialogues
      const scenarioQuery = `
        SELECT 
          s.id, s.title, s.description, s.profession, s.difficulty, 
          s.category, s.duration, s.is_active, s.created_at, 
          s.updated_at, s.metadata,
          COALESCE(
            json_agg(
              json_build_object(
                'id', d.id,
                'scenarioId', d.scenario_id,
                'speaker', d.speaker,
                'message', d.message,
                'expectedResponse', d.expected_response,
                'order', d.order_index,
                'metadata', d.metadata
              ) ORDER BY d.order_index
            ) FILTER (WHERE d.id IS NOT NULL), 
            '[]'::json
          ) as dialogues
        FROM scenarios s
        LEFT JOIN dialogues d ON s.id = d.scenario_id
        ${whereClause}
        GROUP BY s.id, s.created_at
        ORDER BY s.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);
      const scenarioResult = await this.pool.query(scenarioQuery, queryParams);

      const scenarios: Scenario[] = scenarioResult.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        profession: row.profession,
        difficulty: row.difficulty,
        category: row.category,
        duration: row.duration,
        dialogues: row.dialogues,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        metadata: row.metadata
      }));

      return { scenarios, total };

    } catch (error) {
      logger.error('Failed to get scenarios', { error, filters });
      throw error;
    }
  }

  async getScenarioById(id: string): Promise<Scenario | null> {
    try {
      const query = `
        SELECT 
          s.id, s.title, s.description, s.profession, s.difficulty, 
          s.category, s.duration, s.is_active, s.created_at, 
          s.updated_at, s.metadata,
          COALESCE(
            json_agg(
              json_build_object(
                'id', d.id,
                'scenarioId', d.scenario_id,
                'speaker', d.speaker,
                'message', d.message,
                'expectedResponse', d.expected_response,
                'order', d.order_index,
                'metadata', d.metadata
              ) ORDER BY d.order_index
            ) FILTER (WHERE d.id IS NOT NULL), 
            '[]'::json
          ) as dialogues
        FROM scenarios s
        LEFT JOIN dialogues d ON s.id = d.scenario_id
        WHERE s.id = $1
        GROUP BY s.id
      `;

      const result = await this.pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        profession: row.profession,
        difficulty: row.difficulty,
        category: row.category,
        duration: row.duration,
        dialogues: row.dialogues,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        metadata: row.metadata
      };

    } catch (error) {
      logger.error('Failed to get scenario by ID', { error, scenarioId: id });
      throw error;
    }
  }

  async updateScenario(
    id: string, 
    updateData: ScenarioUpdateRequest
  ): Promise<Scenario | null> {
    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updateData.title !== undefined) {
        setClauses.push(`title = $${paramIndex}`);
        values.push(updateData.title);
        paramIndex++;
      }

      if (updateData.description !== undefined) {
        setClauses.push(`description = $${paramIndex}`);
        values.push(updateData.description);
        paramIndex++;
      }

      if (updateData.difficulty !== undefined) {
        setClauses.push(`difficulty = $${paramIndex}`);
        values.push(updateData.difficulty);
        paramIndex++;
      }

      if (updateData.category !== undefined) {
        setClauses.push(`category = $${paramIndex}`);
        values.push(updateData.category);
        paramIndex++;
      }

      if (updateData.duration !== undefined) {
        setClauses.push(`duration = $${paramIndex}`);
        values.push(updateData.duration);
        paramIndex++;
      }

      if (updateData.isActive !== undefined) {
        setClauses.push(`is_active = $${paramIndex}`);
        values.push(updateData.isActive);
        paramIndex++;
      }

      if (updateData.metadata !== undefined) {
        setClauses.push(`metadata = $${paramIndex}`);
        values.push(updateData.metadata);
        paramIndex++;
      }

      if (setClauses.length === 0) {
        return await this.getScenarioById(id);
      }

      setClauses.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE scenarios 
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id
      `;

      const result = await this.pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Scenario updated successfully', { scenarioId: id });
      return await this.getScenarioById(id);

    } catch (error) {
      logger.error('Failed to update scenario', { error, scenarioId: id });
      throw error;
    }
  }

  // User Progress Operations
  async getUserProgress(
    userId: string, 
    scenarioId: string
  ): Promise<UserProgress | null> {
    try {
      const query = `
        SELECT * FROM user_progress 
        WHERE user_id = $1 AND scenario_id = $2
      `;

      const result = await this.pool.query(query, [userId, scenarioId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        scenarioId: row.scenario_id,
        status: row.status,
        currentDialogueId: row.current_dialogue_id,
        score: row.score,
        completedAt: row.completed_at,
        timeSpent: row.time_spent,
        attempts: row.attempts,
        lastAccessedAt: row.last_accessed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        metadata: row.metadata
      };

    } catch (error) {
      logger.error('Failed to get user progress', { error, userId, scenarioId });
      throw error;
    }
  }

  async createOrUpdateProgress(
    userId: string,
    scenarioId: string,
    updateData: ProgressUpdateRequest
  ): Promise<UserProgress> {
    try {
      const upsertQuery = `
        INSERT INTO user_progress (
          user_id, scenario_id, status, current_dialogue_id, 
          score, time_spent, attempts, last_accessed_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
        ON CONFLICT (user_id, scenario_id) 
        DO UPDATE SET 
          status = COALESCE($3, user_progress.status),
          current_dialogue_id = COALESCE($4, user_progress.current_dialogue_id),
          score = COALESCE($5, user_progress.score),
          time_spent = COALESCE($6, user_progress.time_spent) + user_progress.time_spent,
          attempts = user_progress.attempts + 1,
          last_accessed_at = NOW(),
          updated_at = NOW(),
          metadata = COALESCE($8, user_progress.metadata),
          completed_at = CASE WHEN $3 = 'completed' THEN NOW() ELSE user_progress.completed_at END
        RETURNING *
      `;

      const result = await this.pool.query(upsertQuery, [
        userId,
        scenarioId,
        updateData.status || 'in_progress',
        updateData.currentDialogueId,
        updateData.score,
        updateData.timeSpent || 0,
        1, // attempts increment
        updateData.metadata || {}
      ]);

      const row = result.rows[0];
      const progress: UserProgress = {
        id: row.id,
        userId: row.user_id,
        scenarioId: row.scenario_id,
        status: row.status,
        currentDialogueId: row.current_dialogue_id,
        score: row.score,
        completedAt: row.completed_at,
        timeSpent: row.time_spent,
        attempts: row.attempts,
        lastAccessedAt: row.last_accessed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        metadata: row.metadata
      };

      logger.info('User progress updated', { userId, scenarioId, status: updateData.status });
      return progress;

    } catch (error) {
      logger.error('Failed to create/update progress', { error, userId, scenarioId });
      throw error;
    }
  }

  async getUserProgressList(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{ progress: UserProgress[]; total: number }> {
    try {
      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM user_progress 
        WHERE user_id = $1
      `;
      const countResult = await this.pool.query(countQuery, [userId]);
      const total = parseInt(countResult.rows[0].total);

      // Get progress records
      const progressQuery = `
        SELECT * FROM user_progress 
        WHERE user_id = $1
        ORDER BY last_accessed_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await this.pool.query(progressQuery, [userId, limit, offset]);

      const progress: UserProgress[] = result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        scenarioId: row.scenario_id,
        status: row.status,
        currentDialogueId: row.current_dialogue_id,
        score: row.score,
        completedAt: row.completed_at,
        timeSpent: row.time_spent,
        attempts: row.attempts,
        lastAccessedAt: row.last_accessed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        metadata: row.metadata
      }));

      return { progress, total };

    } catch (error) {
      logger.error('Failed to get user progress list', { error, userId });
      throw error;
    }
  }

  // Media File Operations
  async saveMediaFile(
    fileData: Omit<MediaFile, 'id' | 'createdAt'>
  ): Promise<MediaFile> {
    try {
      const query = `
        INSERT INTO media_files (
          filename, original_name, mime_type, size, path, 
          url, uploaded_by, scenario_id, dialogue_id, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, created_at
      `;

      const result = await this.pool.query(query, [
        fileData.filename,
        fileData.originalName,
        fileData.mimeType,
        fileData.size,
        fileData.path,
        fileData.url,
        fileData.uploadedBy,
        fileData.scenarioId,
        fileData.dialogueId,
        fileData.metadata || {}
      ]);

      const mediaFile: MediaFile = {
        ...fileData,
        id: result.rows[0].id,
        createdAt: result.rows[0].created_at
      };

      logger.info('Media file saved', { fileId: mediaFile.id, filename: fileData.filename });
      return mediaFile;

    } catch (error) {
      logger.error('Failed to save media file', { error, fileData });
      throw error;
    }
  }

  async getMediaFile(id: string): Promise<MediaFile | null> {
    try {
      const query = `SELECT * FROM media_files WHERE id = $1`;
      const result = await this.pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        filename: row.filename,
        originalName: row.original_name,
        mimeType: row.mime_type,
        size: row.size,
        path: row.path,
        url: row.url,
        uploadedBy: row.uploaded_by,
        scenarioId: row.scenario_id,
        dialogueId: row.dialogue_id,
        createdAt: row.created_at,
        metadata: row.metadata
      };

    } catch (error) {
      logger.error('Failed to get media file', { error, fileId: id });
      throw error;
    }
  }

  async deleteMediaFile(id: string): Promise<boolean> {
    try {
      const query = `DELETE FROM media_files WHERE id = $1`;
      const result = await this.pool.query(query, [id]);
      
      const deleted = (result.rowCount ?? 0) > 0;
      if (deleted) {
        logger.info('Media file deleted', { fileId: id });
      }
      
      return deleted;

    } catch (error) {
      logger.error('Failed to delete media file', { error, fileId: id });
      throw error;
    }
  }
}
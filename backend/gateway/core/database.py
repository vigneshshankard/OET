"""
Database connection and operations for OET Praxis
Complete database manager for all microservice data requirements
Based on database-schema.md and microservice type definitions
"""

import asyncio
from typing import List, Dict, Any, Optional
import asyncpg
from datetime import datetime, date
import structlog
import uuid
import json
from config.settings import get_settings

logger = structlog.get_logger(__name__)

class DatabaseManager:
    """Manages database connections and operations"""
    
    def __init__(self):
        self.settings = get_settings()
        self._pool: Optional[asyncpg.Pool] = None
    
    async def initialize(self):
        """Initialize database connection pool"""
        try:
            self._pool = await asyncpg.create_pool(
                self.settings.database_url,
                min_size=5,
                max_size=20,
                command_timeout=60
            )
            logger.info("Database connection pool initialized")
        except Exception as e:
            logger.error(f"Failed to initialize database pool: {e}")
            raise
    
    async def close(self):
        """Close database connections"""
        if self._pool:
            await self._pool.close()
            logger.info("Database pool closed")
    
    async def get_connection(self):
        """Get database connection from pool"""
        if not self._pool:
            await self.initialize()
        return self._pool.acquire()

    # User Operations
    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user"""
        async with self._pool.acquire() as conn:
            query = """
                INSERT INTO users (email, hashed_password, full_name, role, profession)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, email, full_name, role, profession, is_email_verified, created_at
            """
            row = await conn.fetchrow(
                query,
                user_data['email'],
                user_data['hashed_password'],
                user_data['full_name'],
                user_data.get('role', 'user'),
                user_data['profession']
            )
            return dict(row)
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        async with self._pool.acquire() as conn:
            query = """
                SELECT id, email, hashed_password, full_name, role, profession, 
                       is_email_verified, last_login_at, created_at, updated_at
                FROM users 
                WHERE email = $1
            """
            row = await conn.fetchrow(query, email)
            return dict(row) if row else None
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        async with self._pool.acquire() as conn:
            query = """
                SELECT id, email, full_name, role, profession, 
                       is_email_verified, last_login_at, created_at, updated_at
                FROM users 
                WHERE id = $1
            """
            row = await conn.fetchrow(query, user_id)
            return dict(row) if row else None
    
    async def update_last_login(self, user_id: str):
        """Update user's last login timestamp"""
        async with self._pool.acquire() as conn:
            await conn.execute(
                "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1",
                user_id
            )

    # Scenario Operations  
    async def get_scenarios(self, profession: Optional[str] = None, difficulty: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get scenarios with optional filtering"""
        async with self._pool.acquire() as conn:
            query = """
                SELECT id, title, description, patient_persona, clinical_area, 
                       profession, difficulty_level, created_at
                FROM scenarios 
                WHERE status = 'published'
            """
            params = []
            
            if profession:
                query += " AND profession = $1"
                params.append(profession)
                
            if difficulty:
                if params:
                    query += f" AND difficulty_level = ${len(params) + 1}"
                else:
                    query += " AND difficulty_level = $1"
                params.append(difficulty)
                
            query += " ORDER BY created_at DESC"
            
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]
    
    async def get_scenario_by_id(self, scenario_id: str) -> Optional[Dict[str, Any]]:
        """Get scenario by ID"""
        async with self._pool.acquire() as conn:
            query = """
                SELECT id, title, description, patient_persona, clinical_area, 
                       profession, difficulty_level, created_at
                FROM scenarios 
                WHERE id = $1 AND status = 'published'
            """
            row = await conn.fetchrow(query, scenario_id)
            return dict(row) if row else None

    # Session Operations
    async def create_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new practice session"""
        async with self._pool.acquire() as conn:
            query = """
                INSERT INTO sessions (user_id, scenario_id, status)
                VALUES ($1, $2, $3)
                RETURNING id, user_id, scenario_id, status, created_at
            """
            row = await conn.fetchrow(
                query,
                session_data['user_id'],
                session_data['scenario_id'],
                session_data.get('status', 'active')
            )
            return dict(row)
    
    async def update_session(self, session_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update session status and duration"""
        async with self._pool.acquire() as conn:
            set_clauses = []
            params = []
            param_count = 1
            
            if 'status' in updates:
                set_clauses.append(f"status = ${param_count}")
                params.append(updates['status'])
                param_count += 1
                
            if 'duration_seconds' in updates:
                set_clauses.append(f"duration_seconds = ${param_count}")
                params.append(updates['duration_seconds'])
                param_count += 1
            
            params.append(session_id)
            
            query = f"""
                UPDATE sessions 
                SET {', '.join(set_clauses)}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ${param_count}
                RETURNING id, user_id, scenario_id, status, duration_seconds, created_at
            """
            
            row = await conn.fetchrow(query, *params)
            return dict(row) if row else None
    
    async def get_session_by_id(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID"""
        async with self._pool.acquire() as conn:
            query = """
                SELECT s.id, s.user_id, s.scenario_id, s.status, s.duration_seconds, s.created_at,
                       sc.title as scenario_title, sc.profession
                FROM sessions s
                JOIN scenarios sc ON s.scenario_id = sc.id
                WHERE s.id = $1
            """
            row = await conn.fetchrow(query, session_id)
            return dict(row) if row else None
    
    async def get_user_sessions(self, user_id: str, limit: int = 10, offset: int = 0) -> List[Dict[str, Any]]:
        """Get user's sessions with pagination"""
        async with self._pool.acquire() as conn:
            query = """
                SELECT s.id, s.scenario_id, s.status, s.duration_seconds, s.created_at,
                       sc.title as scenario_title, sc.difficulty_level,
                       fr.score_raw
                FROM sessions s
                JOIN scenarios sc ON s.scenario_id = sc.id
                LEFT JOIN feedback_reports fr ON s.id = fr.session_id
                WHERE s.user_id = $1
                ORDER BY s.created_at DESC
                LIMIT $2 OFFSET $3
            """
            rows = await conn.fetch(query, user_id, limit, offset)
            return [dict(row) for row in rows]

    # Feedback Operations
    async def create_feedback_report(self, feedback_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create AI-generated feedback report"""
        async with self._pool.acquire() as conn:
            query = """
                INSERT INTO feedback_reports (
                    session_id, transcript, ai_summary, score_raw, 
                    strengths, areas_for_improvement
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, session_id, score_raw, created_at
            """
            row = await conn.fetchrow(
                query,
                feedback_data['session_id'],
                feedback_data['transcript'],
                feedback_data['ai_summary'],
                feedback_data['score_raw'],
                feedback_data['strengths'],
                feedback_data['areas_for_improvement']
            )
            return dict(row)
    
    async def get_feedback_by_session_id(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get feedback report by session ID"""
        async with self._pool.acquire() as conn:
            query = """
                SELECT id, session_id, transcript, ai_summary, score_raw, 
                       strengths, areas_for_improvement, created_at
                FROM feedback_reports 
                WHERE session_id = $1
            """
            row = await conn.fetchrow(query, session_id)
            return dict(row) if row else None

    # Progress Tracking Operations
    async def create_progress_snapshot(self, user_id: str, snapshot_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create user progress snapshot"""
        async with self._pool.acquire() as conn:
            query = """
                INSERT INTO user_progress_snapshots (
                    user_id, snapshot_date, average_score, 
                    sessions_completed_count, strengths_topics
                )
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, user_id, snapshot_date, average_score, sessions_completed_count
            """
            row = await conn.fetchrow(
                query,
                user_id,
                snapshot_data['snapshot_date'],
                snapshot_data['average_score'],
                snapshot_data['sessions_completed_count'],
                snapshot_data['strengths_topics']
            )
            return dict(row)
    
    async def get_user_progress(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user progress data"""
        async with self._pool.acquire() as conn:
            # Get overall stats
            stats_query = """
                SELECT 
                    COUNT(s.id) as total_sessions,
                    COALESCE(AVG(fr.score_raw), 0) as average_score,
                    COALESCE(SUM(s.duration_seconds), 0) as total_duration_seconds
                FROM sessions s
                LEFT JOIN feedback_reports fr ON s.id = fr.session_id
                WHERE s.user_id = $1 AND s.status = 'completed'
            """
            stats = await conn.fetchrow(stats_query, user_id)
            
            # Get recent sessions
            recent_query = """
                SELECT s.id, s.created_at, s.duration_seconds,
                       sc.title as scenario_title, sc.difficulty_level,
                       fr.score_raw
                FROM sessions s
                JOIN scenarios sc ON s.scenario_id = sc.id
                LEFT JOIN feedback_reports fr ON s.id = fr.session_id
                WHERE s.user_id = $1 AND s.status = 'completed'
                ORDER BY s.created_at DESC
                LIMIT 10
            """
            recent_sessions = await conn.fetch(recent_query, user_id)
            
            return {
                'overall_stats': dict(stats),
                'recent_sessions': [dict(session) for session in recent_sessions]
            }

    # ===== NEW COMPREHENSIVE DATABASE OPERATIONS =====
    
    # Dialogue Operations (Content Service)
    async def create_dialogue(self, dialogue_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new dialogue for a scenario"""
        async with await self.get_connection() as conn:
            query = """
                INSERT INTO dialogues (scenario_id, speaker, message, expected_response, order_number, metadata)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            """
            dialogue = await conn.fetchrow(
                query,
                uuid.UUID(dialogue_data['scenario_id']),
                dialogue_data['speaker'],
                dialogue_data['message'],
                dialogue_data.get('expected_response'),
                dialogue_data['order_number'],
                json.dumps(dialogue_data.get('metadata', {}))
            )
            return dict(dialogue)
    
    async def get_scenario_dialogues(self, scenario_id: str) -> List[Dict[str, Any]]:
        """Get all dialogues for a scenario"""
        async with await self.get_connection() as conn:
            query = """
                SELECT * FROM dialogues 
                WHERE scenario_id = $1 
                ORDER BY order_number ASC
            """
            # Handle UUID conversion properly
            if isinstance(scenario_id, str):
                scenario_id = uuid.UUID(scenario_id)
            
            dialogues = await conn.fetch(query, scenario_id)
            return [dict(dialogue) for dialogue in dialogues]
    
    # User Progress Operations
    async def create_user_progress(self, progress_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update user progress"""
        async with await self.get_connection() as conn:
            query = """
                INSERT INTO user_progress (user_id, scenario_id, status, current_dialogue_id, score, 
                                         completed_at, time_spent, attempts, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (user_id, scenario_id) 
                DO UPDATE SET
                    status = $3,
                    current_dialogue_id = $4,
                    score = $5,
                    completed_at = $6,
                    time_spent = user_progress.time_spent + $7,
                    attempts = $8,
                    metadata = $9,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *
            """
            progress = await conn.fetchrow(
                query,
                uuid.UUID(progress_data['user_id']),
                uuid.UUID(progress_data['scenario_id']),
                progress_data.get('status', 'not_started'),
                uuid.UUID(progress_data['current_dialogue_id']) if progress_data.get('current_dialogue_id') else None,
                progress_data.get('score'),
                progress_data.get('completed_at'),
                progress_data.get('time_spent', 0),
                progress_data.get('attempts', 1),
                json.dumps(progress_data.get('metadata', {}))
            )
            return dict(progress)
    
    async def get_user_progress(self, user_id: str, scenario_id: str = None) -> List[Dict[str, Any]]:
        """Get user progress for one or all scenarios"""
        async with await self.get_connection() as conn:
            if scenario_id:
                query = """
                    SELECT up.*, s.title as scenario_title 
                    FROM user_progress up
                    JOIN scenarios s ON up.scenario_id = s.id
                    WHERE up.user_id = $1 AND up.scenario_id = $2
                """
                progress = await conn.fetchrow(query, uuid.UUID(user_id), uuid.UUID(scenario_id))
                return [dict(progress)] if progress else []
            else:
                query = """
                    SELECT up.*, s.title as scenario_title 
                    FROM user_progress up
                    JOIN scenarios s ON up.scenario_id = s.id
                    WHERE up.user_id = $1
                    ORDER BY up.last_accessed_at DESC
                """
                progress = await conn.fetch(query, uuid.UUID(user_id))
                return [dict(p) for p in progress]
    
    # Session Data Operations (Session Service)
    async def create_session_data(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new session"""
        async with await self.get_connection() as conn:
            query = """
                INSERT INTO session_data (user_id, user_email, user_role, device_id, device_info,
                                        ip_address, user_agent, expires_at, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            """
            session = await conn.fetchrow(
                query,
                uuid.UUID(session_data['user_id']),
                session_data['user_email'],
                session_data['user_role'],
                session_data.get('device_id'),
                json.dumps(session_data.get('device_info', {})),
                session_data['ip_address'],
                session_data.get('user_agent'),
                session_data['expires_at'],
                json.dumps(session_data.get('metadata', {}))
            )
            return dict(session)
    
    async def get_active_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """Get active sessions for a user"""
        async with await self.get_connection() as conn:
            query = """
                SELECT * FROM session_data 
                WHERE user_id = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
                ORDER BY last_activity DESC
            """
            sessions = await conn.fetch(query, uuid.UUID(user_id))
            return [dict(session) for session in sessions]
    
    async def update_session_activity(self, session_id: str) -> None:
        """Update session last activity"""
        async with await self.get_connection() as conn:
            await conn.execute(
                "UPDATE session_data SET last_activity = CURRENT_TIMESTAMP WHERE id = $1",
                uuid.UUID(session_id)
            )
    
    # Session Activity Operations
    async def log_session_activity(self, activity_data: Dict[str, Any]) -> Dict[str, Any]:
        """Log session activity"""
        async with await self.get_connection() as conn:
            query = """
                INSERT INTO session_activity (session_id, action, ip_address, user_agent, details)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            """
            # Handle UUID conversion properly
            session_id = activity_data['session_id']
            if isinstance(session_id, str):
                session_id = uuid.UUID(session_id)
            
            activity = await conn.fetchrow(
                query,
                session_id,
                activity_data['action'],
                activity_data['ip_address'],
                activity_data.get('user_agent'),
                json.dumps(activity_data.get('details', {}))
            )
            return dict(activity)
    
    # Practice Session Operations (WebRTC Service)
    async def create_practice_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new practice session"""
        async with await self.get_connection() as conn:
            query = """
                INSERT INTO practice_sessions (user_id, scenario_id, status, livekit_room_name, 
                                             livekit_token, metadata)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            """
            session = await conn.fetchrow(
                query,
                uuid.UUID(session_data['user_id']),
                uuid.UUID(session_data['scenario_id']),
                session_data.get('status', 'active'),
                session_data['livekit_room_name'],
                session_data.get('livekit_token'),
                json.dumps(session_data.get('metadata', {}))
            )
            return dict(session)
    
    async def complete_practice_session(self, session_id: str, end_data: Dict[str, Any]) -> Dict[str, Any]:
        """Complete a practice session"""
        async with await self.get_connection() as conn:
            query = """
                UPDATE practice_sessions 
                SET status = $2, end_time = CURRENT_TIMESTAMP, duration = $3, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            """
            session = await conn.fetchrow(
                query,
                uuid.UUID(session_id),
                end_data.get('status', 'completed'),
                end_data.get('duration')
            )
            return dict(session) if session else None
    
    # Session Messages Operations
    async def create_session_message(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a session message"""
        async with await self.get_connection() as conn:
            query = """
                INSERT INTO session_messages (session_id, user_id, message_type, data, 
                                            sequence_number, metadata)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            """
            message = await conn.fetchrow(
                query,
                uuid.UUID(message_data['session_id']),
                uuid.UUID(message_data['user_id']),
                message_data['message_type'],
                json.dumps(message_data['data']),
                message_data['sequence_number'],
                json.dumps(message_data.get('metadata', {}))
            )
            return dict(message)
    
    async def get_session_messages(self, session_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get messages for a session"""
        async with await self.get_connection() as conn:
            query = """
                SELECT * FROM session_messages 
                WHERE session_id = $1 
                ORDER BY sequence_number ASC
                LIMIT $2
            """
            messages = await conn.fetch(query, uuid.UUID(session_id), limit)
            return [dict(message) for message in messages]
    
    # Media Files Operations
    async def create_media_file(self, file_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a media file record"""
        async with await self.get_connection() as conn:
            query = """
                INSERT INTO media_files (filename, original_name, file_type, file_size, 
                                       file_path, mime_type, uploaded_by, scenario_id, 
                                       dialogue_id, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            """
            file_record = await conn.fetchrow(
                query,
                file_data['filename'],
                file_data['original_name'],
                file_data['file_type'],
                file_data['file_size'],
                file_data['file_path'],
                file_data['mime_type'],
                uuid.UUID(file_data['uploaded_by']) if file_data.get('uploaded_by') else None,
                uuid.UUID(file_data['scenario_id']) if file_data.get('scenario_id') else None,
                uuid.UUID(file_data['dialogue_id']) if file_data.get('dialogue_id') else None,
                json.dumps(file_data.get('metadata', {}))
            )
            return dict(file_record)
    
    # LiveKit Operations
    async def create_livekit_room(self, room_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a LiveKit room record"""
        async with await self.get_connection() as conn:
            query = """
                INSERT INTO livekit_rooms (name, sid, metadata)
                VALUES ($1, $2, $3)
                ON CONFLICT (name) DO UPDATE SET
                    sid = $2,
                    metadata = $3,
                    is_active = true
                RETURNING *
            """
            room = await conn.fetchrow(
                query,
                room_data['name'],
                room_data['sid'],
                room_data.get('metadata')
            )
            return dict(room)
    
    async def add_livekit_participant(self, participant_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a participant to a LiveKit room"""
        async with await self.get_connection() as conn:
            query = """
                INSERT INTO livekit_participants (room_id, user_id, participant_id, identity, metadata)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            """
            participant = await conn.fetchrow(
                query,
                uuid.UUID(participant_data['room_id']),
                uuid.UUID(participant_data['user_id']),
                participant_data['participant_id'],
                participant_data['identity'],
                json.dumps(participant_data.get('metadata', {}))
            )
            return dict(participant)


# Global database instance
db_manager = DatabaseManager()


# Startup/shutdown events
async def initialize_database():
    """Initialize database on startup"""
    await db_manager.initialize()
    logger.info("Database manager initialized")


async def close_database():
    """Close database on shutdown"""
    await db_manager.close()
    logger.info("Database manager closed")
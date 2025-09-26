class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.webSockets = new Map();
    console.log('📋 Session Manager initialized');
  }

  /**
   * Create a new session
   */
  createSession(sessionId, sessionData) {
    const session = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      status: 'created',
      participantCount: 0,
      conversationHistory: [],
      ...sessionData
    };

    this.sessions.set(sessionId, session);
    console.log(`✅ Session created: ${sessionId}`);
    
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Update session status
   */
  updateSessionStatus(sessionId, status) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = status;
      session.lastUpdated = new Date().toISOString();
      console.log(`📝 Session ${sessionId} status updated to: ${status}`);
    }
  }

  /**
   * Set AI participant as active
   */
  setAIParticipantActive(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.aiParticipantActive = true;
      session.participantCount = (session.participantCount || 0) + 1;
      console.log(`🤖 AI participant active for session: ${sessionId}`);
    }
  }

  /**
   * Add conversation turn to history
   */
  addConversationTurn(sessionId, turn) {
    const session = this.sessions.get(sessionId);
    if (session) {
      if (!session.conversationHistory) {
        session.conversationHistory = [];
      }
      session.conversationHistory.push(turn);
      session.lastActivity = new Date().toISOString();
      
      console.log(`💬 Added conversation turn to session ${sessionId}`);
    }
  }

  /**
   * Store WebSocket connection for session
   */
  setWebSocket(sessionId, ws) {
    this.webSockets.set(sessionId, ws);
    console.log(`🔗 WebSocket connected for session: ${sessionId}`);
  }

  /**
   * Remove WebSocket connection
   */
  removeWebSocket(sessionId) {
    this.webSockets.delete(sessionId);
    console.log(`🔌 WebSocket disconnected for session: ${sessionId}`);
  }

  /**
   * Get WebSocket for session
   */
  getWebSocket(sessionId) {
    return this.webSockets.get(sessionId);
  }

  /**
   * Broadcast message to session participants
   */
  broadcastToSession(sessionId, message) {
    const ws = this.webSockets.get(sessionId);
    if (ws && ws.readyState === 1) { // WebSocket.OPEN = 1
      ws.send(JSON.stringify(message));
      console.log(`📡 Broadcasted message to session ${sessionId}`);
    }
  }

  /**
   * Complete session and generate summary
   */
  completeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      session.completedAt = new Date().toISOString();
      session.duration = this.calculateSessionDuration(session);
      
      console.log(`✅ Session completed: ${sessionId} (${session.duration} minutes)`);
      
      return session;
    }
    return null;
  }

  /**
   * Calculate session duration in minutes
   */
  calculateSessionDuration(session) {
    if (!session.createdAt || !session.completedAt) return 0;
    
    const start = new Date(session.createdAt);
    const end = new Date(session.completedAt);
    const durationMs = end.getTime() - start.getTime();
    
    return Math.round(durationMs / (1000 * 60)); // Convert to minutes
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      sessionId,
      status: session.status,
      duration: session.duration || 0,
      conversationTurns: session.conversationHistory?.length || 0,
      participantCount: session.participantCount || 0,
      aiParticipantActive: session.aiParticipantActive || false,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    };
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of this.sessions.entries()) {
      const sessionAge = now - new Date(session.createdAt).getTime();
      
      if (sessionAge > maxAge && session.status !== 'active') {
        this.sessions.delete(sessionId);
        this.webSockets.delete(sessionId);
        console.log(`🧹 Cleaned up expired session: ${sessionId}`);
      }
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions() {
    const activeSessions = [];
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.status === 'active') {
        activeSessions.push(this.getSessionStats(sessionId));
      }
    }
    
    return activeSessions;
  }

  /**
   * Delete session
   */
  deleteSession(sessionId) {
    const deleted = this.sessions.delete(sessionId);
    this.webSockets.delete(sessionId);
    
    if (deleted) {
      console.log(`🗑️ Deleted session: ${sessionId}`);
    }
    
    return deleted;
  }
}

module.exports = SessionManager;
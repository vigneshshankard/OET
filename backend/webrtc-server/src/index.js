const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const LiveKitService = require('./services/livekit-service');
const AIService = require('./services/ai-service');
const SessionManager = require('./services/session-manager');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Initialize services
const liveKitService = new LiveKitService({
  apiKey: process.env.LIVEKIT_API_KEY,
  secretKey: process.env.LIVEKIT_SECRET_KEY,
  url: process.env.LIVEKIT_URL
});

const aiService = new AIService({
  huggingFaceApiKey: process.env.HUGGINGFACE_API_KEY,
  modelUrl: process.env.HUGGINGFACE_MODEL_URL
});

const sessionManager = new SessionManager();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Create LiveKit room and generate tokens
app.post('/api/sessions/create-room', async (req, res) => {
  try {
    const { scenarioId, userId, profession } = req.body;
    const sessionId = uuidv4();
    const roomName = `practice-${sessionId}`;

    console.log(`Creating room: ${roomName} for user: ${userId}`);

    // Create room and tokens
    const userToken = await liveKitService.createParticipantToken(roomName, `user-${userId}`, {
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    const aiToken = await liveKitService.createParticipantToken(roomName, `ai-patient-${sessionId}`, {
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    // Initialize session in manager
    sessionManager.createSession(sessionId, {
      roomName,
      scenarioId,
      userId,
      profession,
      userToken,
      aiToken,
      status: 'created'
    });

    // Start AI participant (simulate joining the room)
    setTimeout(() => {
      console.log(`AI participant joining room: ${roomName}`);
      sessionManager.setAIParticipantActive(sessionId);
    }, 2000);

    res.json({
      sessionId,
      roomName,
      userToken,
      serverUrl: process.env.LIVEKIT_URL,
      websocketUrl: `ws://localhost:${process.env.PORT}/ws/${sessionId}`
    });

  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get session info
app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessionManager.getSession(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    sessionId,
    status: session.status,
    roomName: session.roomName,
    participantCount: session.participantCount || 0
  });
});

// WebSocket handling for real-time audio processing
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const sessionId = url.pathname.split('/').pop();
  
  console.log(`WebSocket connected for session: ${sessionId}`);
  
  if (!sessionId) {
    ws.close(1000, 'Session ID required');
    return;
  }

  const session = sessionManager.getSession(sessionId);
  if (!session) {
    ws.close(1000, 'Invalid session');
    return;
  }

  // Store WebSocket connection with session
  sessionManager.setWebSocket(sessionId, ws);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`Received message type: ${data.type} for session: ${sessionId}`);

      switch (data.type) {
        case 'audio':
          await handleAudioMessage(sessionId, data, ws);
          break;
        case 'session_start':
          await handleSessionStart(sessionId, data, ws);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        default:
          console.log(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Failed to process message' 
      }));
    }
  });

  ws.on('close', () => {
    console.log(`WebSocket disconnected for session: ${sessionId}`);
    sessionManager.removeWebSocket(sessionId);
  });

  // Send session joined confirmation and initial greeting
  setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'session_joined',
        sessionId: sessionId,
        message: 'Connected to practice session'
      }));

      // Send AI greeting after a brief delay
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const session = sessionManager.getSession(sessionId);
          const patientName = session?.patientPersona?.name || "Patient"; 
          
          ws.send(JSON.stringify({
            type: 'ai_greeting',
            text: `Hello, I'm ${patientName}. Thank you for seeing me today, Doctor. I've been having some concerns that I'd like to discuss with you.`
          }));
        }
      }, 2000);
    }
  }, 500);
});

// Handle audio processing and AI response
async function handleAudioMessage(sessionId, data, ws) {
  try {
    const session = sessionManager.getSession(sessionId);
    if (!session) return;

    console.log(`Processing audio for session: ${sessionId}`);

    // Decode base64 audio data
    const audioBuffer = Buffer.from(data.data, 'base64');
    
    // Process with AI service for speech-to-text
    const sttResult = await aiService.processAudioInput({
      audioData: audioBuffer,
      sessionContext: {
        scenarioId: session.scenarioId,
        profession: session.profession,
        conversationHistory: session.conversationHistory || []
      }
    });

    // Send transcription result back to frontend
    if (sttResult.transcript) {
      ws.send(JSON.stringify({
        type: 'transcription',
        text: sttResult.transcript,
        confidence: sttResult.confidence || 0.9
      }));
    }

    // Generate AI response based on transcription
    const aiResponse = await aiService.generatePatientResponse({
      userInput: sttResult.transcript,
      sessionContext: {
        scenarioId: session.scenarioId,
        profession: session.profession,
        patientPersona: session.patientPersona,
        conversationHistory: session.conversationHistory || []
      }
    });

    // Add conversation turn to history
    sessionManager.addConversationTurn(sessionId, {
      speaker: 'user',
      text: sttResult.transcript,
      timestamp: new Date()
    });

    sessionManager.addConversationTurn(sessionId, {
      speaker: 'ai',
      text: aiResponse.text,
      timestamp: new Date()
    });

    // Send AI text response
    ws.send(JSON.stringify({
      type: 'ai_response',
      text: aiResponse.text,
      confidence: aiResponse.confidence || 0.9,
      emotion: aiResponse.emotion || 'neutral'
    }));

    // Generate and send TTS audio for AI response
    if (aiResponse.audioData) {
      ws.send(JSON.stringify({
        type: 'tts_chunk',
        data: aiResponse.audioData.toString('base64'),
        sequence: 1
      }));
    }

    // Update conversation history
    sessionManager.addConversationTurn(sessionId, {
      user: data.transcript || "[Audio input]",
      ai: aiResponse.text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error handling audio message:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to process audio'
    }));
  }
}

// Handle session start
async function handleSessionStart(sessionId, data, ws) {
  try {
    console.log(`Starting session: ${sessionId}`);
    
    sessionManager.updateSessionStatus(sessionId, 'active');
    
    ws.send(JSON.stringify({
      type: 'session_started',
      sessionId,
      message: 'Session is now active. Begin speaking when ready.'
    }));

    // Send initial AI patient introduction
    setTimeout(() => {
      const session = sessionManager.getSession(sessionId);
      const initialGreeting = generateInitialPatientGreeting(session.profession, session.scenarioId);
      
      ws.send(JSON.stringify({
        type: 'ai_response',
        text: initialGreeting,
        isInitial: true
      }));
    }, 2000);

  } catch (error) {
    console.error('Error starting session:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to start session'
    }));
  }
}

// Generate initial patient greeting based on scenario
function generateInitialPatientGreeting(profession, scenarioId) {
  const greetings = {
    doctor: "Good morning, Doctor. Thank you for seeing me today. I've been having some health concerns that I'd like to discuss with you.",
    nurse: "Hello Nurse. I hope you can help me today. I've been feeling quite worried about some symptoms I've been experiencing.",
    dentist: "Hi Doctor. I'm here for my appointment. I've been having some dental issues that are causing me discomfort.",
    physiotherapist: "Hello. I was referred to see you about my mobility issues. I'm hoping you can help me with my recovery."
  };

  return greetings[profession] || "Hello, I'm here for my appointment today. Thank you for your time.";
}

// REST API Routes
app.use(express.json());

// Route for creating a new session room
app.post('/api/sessions/create-room', async (req, res) => {
  try {
    const { scenarioId, profession, patientPersona } = req.body;
    
    const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    // Create session
    const session = sessionManager.createSession(sessionId, {
      scenarioId,
      profession,
      patientPersona,
      createdAt: new Date().toISOString(),
      status: 'created'
    });

    // Generate LiveKit token
    const accessToken = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: `user_${Date.now()}`,
      name: 'OET Practitioner'
    });

    accessToken.addGrant({
      roomJoin: true,
      room: sessionId,
      canPublish: true,
      canSubscribe: true
    });

    const token = await accessToken.toJwt();

    console.log(`Created session: ${sessionId} for scenario: ${scenarioId}`);

    res.json({
      sessionId,
      token,
      url: LIVEKIT_URL,
      room: sessionId,
      wsUrl: `ws://localhost:${PORT}/ws/${sessionId}`
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Route for getting room token
app.get('/api/sessions/:sessionId/token', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessionManager.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Generate LiveKit token
    const accessToken = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: `user_${Date.now()}`,
      name: 'OET Practitioner'
    });

    accessToken.addGrant({
      roomJoin: true,
      room: sessionId,
      canPublish: true,
      canSubscribe: true
    });

    const token = await accessToken.toJwt();

    res.json({
      token,
      url: LIVEKIT_URL,
      room: sessionId
    });
  } catch (error) {
    console.error('Error generating room token:', error);
    res.status(500).json({ error: 'Failed to generate room token' });
  }
});

// Generic route for generating LiveKit tokens
app.post('/api/token', async (req, res) => {
  try {
    const { roomName, participantName, userId, metadata = {} } = req.body;
    
    if (!roomName || !participantName) {
      return res.status(400).json({ error: 'roomName and participantName are required' });
    }

    console.log(`Generating LiveKit token for user ${userId} in room ${roomName}`);

    // Generate LiveKit token
    const accessToken = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      name: participantName,
      metadata: JSON.stringify(metadata)
    });

    accessToken.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    const token = await accessToken.toJwt();

    res.json({
      token,
      url: LIVEKIT_URL,
      roomName
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Route for completing a session
app.post('/api/sessions/:sessionId/complete', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { duration } = req.body;
    
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update session with completion data
    session.completedAt = new Date().toISOString();
    session.duration = duration;
    session.status = 'completed';

    // Prepare transcript from conversation history
    const conversationHistory = session.conversationHistory || [];
    const transcript = conversationHistory.map(turn => 
      `${turn.speaker}: ${turn.text}`
    ).join('\n');

    console.log(`📊 Generating comprehensive feedback for session ${sessionId}`);
    console.log(`Transcript length: ${transcript.length} characters`);

    // Generate comprehensive feedback via AI services
    let feedbackData = null;
    try {
      const feedbackRequest = {
        transcript: transcript,
        patientPersona: session.patientPersona || {
          name: 'Patient',
          age: 45,
          background: 'Standard consultation scenario',
          complaint: 'Health concerns',
          emotionalState: 'neutral',
          communicationStyle: 'cooperative'
        },
        sessionDuration: duration,
        targetProfession: session.profession || 'doctor',
        difficultyLevel: 'intermediate',
        scenarioType: 'consultation'
      };

      console.log(`🔍 Calling AI feedback generation API...`);
      const aiResponse = await fetch('http://localhost:8003/api/v2/feedback/comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackRequest),
        timeout: 30000
      });

      if (aiResponse.ok) {
        const aiResult = await aiResponse.json();
        console.log(`✅ AI feedback generated successfully`);
        
        if (aiResult.success && aiResult.data) {
          feedbackData = {
            overallScore: aiResult.data.scoring?.overallScore || aiResult.data.feedback?.overall_score || 75,
            detailedScores: aiResult.data.scoring?.detailedScores || aiResult.data.feedback?.detailed_scores || {
              pronunciation: 75,
              grammar: 75,
              vocabulary: 75,
              clinicalCommunication: 75,
              empathy: 75,
              patientEducation: 75
            },
            strengths: aiResult.data.scoring?.strengths || aiResult.data.feedback?.strengths || [
              'Good communication skills',
              'Professional approach'
            ],
            improvements: aiResult.data.scoring?.improvements || aiResult.data.feedback?.improvements || [
              'Could ask more follow-up questions',
              'Consider patient education opportunities'
            ],
            transcriptAnalysis: aiResult.data.scoring?.transcriptAnalysis || {
              totalWords: transcript.split(' ').length,
              speakingTimePercentage: 60,
              keyPhrasesUsed: [],
              missedOpportunities: []
            }
          };
        }
      } else {
        console.warn(`⚠️ AI feedback API returned ${aiResponse.status}: ${aiResponse.statusText}`);
      }
    } catch (aiError) {
      console.error('❌ Error calling AI feedback service:', aiError.message);
    }

    // Fallback feedback if AI service fails
    if (!feedbackData) {
      console.log('🔄 Using fallback feedback generation');
      feedbackData = {
        overallScore: 75,
        detailedScores: {
          pronunciation: 80,
          grammar: 75,
          vocabulary: 70,
          clinicalCommunication: 75,
          empathy: 85,
          patientEducation: 70
        },
        strengths: [
          'Good listening skills and patient engagement',
          'Professional manner throughout consultation',
          'Clear communication style'
        ],
        improvements: [
          'Consider using more specific medical terminology',
          'Ask more detailed follow-up questions',
          'Provide more comprehensive patient education'
        ],
        transcriptAnalysis: {
          totalWords: transcript.split(' ').length,
          speakingTimePercentage: 65,
          keyPhrasesUsed: ['How are you feeling?', 'I understand', 'Can you tell me more?'],
          missedOpportunities: ['Pain scale assessment', 'Lifestyle recommendations']
        }
      };
    }

    // Store feedback in session
    session.feedback = feedbackData;
    
    // Clean up room and connections
    const wsConnections = wss.clients;
    wsConnections.forEach(ws => {
      if (ws.sessionId === sessionId) {
        ws.send(JSON.stringify({
          type: 'session_completed',
          sessionId: sessionId,
          duration: duration,
          feedback: feedbackData
        }));
      }
    });

    console.log(`✅ Session ${sessionId} completed with feedback generated`);
    
    res.json({
      success: true,
      session: {
        id: sessionId,
        status: 'completed',
        duration: duration,
        completedAt: session.completedAt,
        feedback: feedbackData,
        transcript: transcript,
        conversationTurns: conversationHistory.length
      }
    });
  } catch (error) {
    console.error('❌ Error completing session:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

const PORT = process.env.PORT || 8005;

server.listen(PORT, () => {
  console.log(`🚀 WebRTC Server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws/{sessionId}`);
  console.log(`🎤 LiveKit URL: ${process.env.LIVEKIT_URL}`);
});
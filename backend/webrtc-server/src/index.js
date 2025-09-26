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

  // Send initial greeting when connection is established
  setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'ai_greeting',
        text: "Hello! I'm ready to begin our practice session. Please introduce yourself when you're ready."
      }));
    }
  }, 1000);
});

// Handle audio processing and AI response
async function handleAudioMessage(sessionId, data, ws) {
  try {
    const session = sessionManager.getSession(sessionId);
    if (!session) return;

    console.log(`Processing audio for session: ${sessionId}`);

    // Simulate audio processing (in real implementation, this would process the base64 audio)
    const audioBuffer = Buffer.from(data.data, 'base64');
    
    // Process with AI service
    const aiResponse = await aiService.processAudioInput({
      audioData: audioBuffer,
      sessionContext: {
        scenarioId: session.scenarioId,
        profession: session.profession,
        conversationHistory: session.conversationHistory || []
      }
    });

    // Send AI text response
    ws.send(JSON.stringify({
      type: 'ai_response',
      text: aiResponse.text,
      confidence: aiResponse.confidence || 0.9
    }));

    // Generate and send TTS audio if available
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

const PORT = process.env.PORT || 8005;

server.listen(PORT, () => {
  console.log(`🚀 WebRTC Server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws/{sessionId}`);
  console.log(`🎤 LiveKit URL: ${process.env.LIVEKIT_URL}`);
});
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { config } from './config';
import { logger, AppError, createServiceResponse } from './utils/logger';
import { AIOrchestrationService } from './services/orchestration.service';
import { HealthStatus } from './types/common';
import { enhancedAIRoutes } from './routes/enhanced-ai.routes';
import { aiMonitoringRoutes } from './routes/ai-monitoring.routes';

const fastify = Fastify({ 
  logger: true,
  bodyLimit: 50 * 1024 * 1024, // 50MB for audio files
});

// Global AI service instance
let aiService: AIOrchestrationService;

// Register plugins
async function registerPlugins() {
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  await fastify.register(multipart, {
    limits: {
      fieldNameSize: 100,
      fieldSize: 50 * 1024 * 1024, // 50MB
      fields: 10,
      fileSize: 50 * 1024 * 1024, // 50MB
      files: 1,
      headerPairs: 2000
    }
  });

  // Register enhanced AI routes
  await fastify.register(enhancedAIRoutes, { prefix: '/api/v2' });
  
  // Register monitoring and dashboard routes
  await fastify.register(aiMonitoringRoutes, { prefix: '/monitor' });
}

// Error handler
fastify.setErrorHandler((error: any, request: any, reply: any) => {
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
  });

  if (error instanceof AppError) {
    reply.status(error.statusCode).send(
      createServiceResponse(undefined, {
        code: error.code,
        message: error.message,
        details: error.details,
      })
    );
    return;
  }

  reply.status(500).send(
    createServiceResponse(undefined, {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    })
  );
});

// Health check endpoint
fastify.get('/health', async (request: any, reply: any) => {
  try {
    const serviceStatus = await aiService.getHealthStatus();
    const allReady = Object.values(serviceStatus).every(status => status === 'ready');

    const healthStatus: HealthStatus = {
      status: allReady ? 'healthy' : 'unhealthy',
      services: {
        stt: serviceStatus.stt as 'ready' | 'loading' | 'error',
        tts: serviceStatus.tts as 'ready' | 'loading' | 'error',
        llm: serviceStatus.llm as 'ready' | 'loading' | 'error',
      },
      uptime: process.uptime(),
      version: '1.0.0',
    };

    reply.status(allReady ? 200 : 503).send(createServiceResponse(healthStatus));
  } catch (error) {
    reply.status(503).send(
      createServiceResponse(undefined, {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Health check failed',
      })
    );
  }
});

// Speech-to-Text endpoint
fastify.post('/api/stt/transcribe', async (request: any, reply: any) => {
  try {
    const data = await request.file();
    
    if (!data) {
      throw new AppError('No audio file provided', 400, 'MISSING_AUDIO');
    }

    const buffer = await data.toBuffer();
    const sessionId = (request.body as any)?.sessionId || `session_${Date.now()}`;

    const result = await aiService.processAudioToText({
      audioData: buffer,
      sessionId,
      format: data.mimetype?.includes('wav') ? 'wav' : 'mp3',
    });

    reply.send(createServiceResponse(result));
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Transcription failed', 500, 'TRANSCRIPTION_ERROR');
  }
});

// Text-to-Speech endpoint
fastify.post('/api/tts/synthesize', async (request: any, reply: any) => {
  const { text, sessionId, voice, speed } = request.body as any;

  if (!text || !sessionId) {
    throw new AppError('Missing required fields: text, sessionId', 400, 'MISSING_FIELDS');
  }

  try {
    const result = await aiService.generateSpeechFromText({
      text,
      sessionId,
      voice,
      speed,
    });

    reply
      .type('audio/wav')
      .header('Content-Disposition', `attachment; filename="speech_${sessionId}.wav"`)
      .send(result.audioData);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Speech synthesis failed', 500, 'TTS_ERROR');
  }
});

// LLM Chat endpoint
fastify.post('/api/llm/chat', async (request: any, reply: any) => {
  const { message, context, sessionId, temperature, maxTokens } = request.body as any;

  if (!message || !sessionId) {
    throw new AppError('Missing required fields: message, sessionId', 400, 'MISSING_FIELDS');
  }

  try {
    const result = await aiService.generateResponse({
      message,
      context,
      sessionId,
      temperature,
      maxTokens,
    });

    reply.send(createServiceResponse(result));
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('LLM response generation failed', 500, 'LLM_ERROR');
  }
});

// Complete conversation turn endpoint (legacy v1)
fastify.post('/api/conversation/turn', async (request: any, reply: any) => {
  try {
    const data = await request.file();
    
    if (!data) {
      throw new AppError('No audio file provided', 400, 'MISSING_AUDIO');
    }

    const buffer = await data.toBuffer();
    const sessionId = (request.body as any)?.sessionId || `session_${Date.now()}`;
    const context = (request.body as any)?.context ? JSON.parse((request.body as any).context) : undefined;

    // Create default patient persona and prompt context for legacy compatibility
    const defaultPatientPersona = {
      name: "Generic Patient",
      age: 35,
      gender: "unspecified",
      occupation: "unknown",
      culture: "general",
      primaryCondition: "general consultation",
      medicalHistory: [],
      currentSymptoms: [],
      currentMedications: [],
      previousTreatments: [],
      knownAllergies: [],
      emotionalState: "calm",
      anxietyLevel: "low",
      communicationStyle: "direct",
      healthLiteracyLevel: "average",
      healthcareExperiences: []
    };

    const defaultPromptContext = {
      sessionId,
      conversationHistory: [],
      currentTurn: 1,
      targetProfession: "doctor" as "nurse" | "doctor" | "dentist" | "physiotherapist",
      difficultyLevel: "intermediate" as "beginner" | "intermediate" | "advanced",
      scenarioType: "consultation" as "consultation" | "emergency" | "first_visit" | "follow_up",
      clinicalArea: "general" as "general" | "emergency" | "chronic" | "preventive"
    };

    const result = await aiService.processConversationTurn(
      buffer, 
      sessionId, 
      defaultPatientPersona,
      defaultPromptContext,
      []
    );

    reply.send(createServiceResponse(result));
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Conversation turn processing failed', 500, 'CONVERSATION_ERROR');
  }
});

// Conversation analysis endpoint
fastify.post('/api/conversation/analyze', async (request: any, reply: any) => {
  const { transcript, sessionId } = request.body as any;

  if (!transcript || !sessionId) {
    throw new AppError('Missing required fields: transcript, sessionId', 400, 'MISSING_FIELDS');
  }

  try {
    const result = await aiService.analyzeConversation(transcript, sessionId);
    reply.send(createServiceResponse(result));
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Conversation analysis failed', 500, 'ANALYSIS_ERROR');
  }
});

// Scenario introduction endpoint
fastify.post('/api/scenario/introduction', async (request: any, reply: any) => {
  const { scenarioText, sessionId } = request.body as any;

  if (!scenarioText || !sessionId) {
    throw new AppError('Missing required fields: scenarioText, sessionId', 400, 'MISSING_FIELDS');
  }

  try {
    const result = await aiService.generateScenarioIntroduction(scenarioText, sessionId);

    reply
      .type('audio/wav')
      .header('Content-Disposition', `attachment; filename="intro_${sessionId}.wav"`)
      .send(result.audioData);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Scenario introduction generation failed', 500, 'INTRO_ERROR');
  }
});

// Feedback audio endpoint
fastify.post('/api/feedback/audio', async (request: any, reply: any) => {
  const { analysis } = request.body as any;

  if (!analysis || !analysis.sessionId) {
    throw new AppError('Missing required field: analysis with sessionId', 400, 'MISSING_ANALYSIS');
  }

  try {
    const result = await aiService.generateFeedbackAudio(analysis);

    reply
      .type('audio/wav')
      .header('Content-Disposition', `attachment; filename="feedback_${analysis.sessionId}.wav"`)
      .send(result.audioData);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Feedback audio generation failed', 500, 'FEEDBACK_ERROR');
  }
});

// Start server
async function start() {
  try {
    // Initialize AI services
    logger.info('Starting AI Services...');
    aiService = new AIOrchestrationService();
    
    // Register plugins
    await registerPlugins();
    
    // Initialize AI services (this may take some time for model loading)
    logger.info('Initializing AI models...');
    await aiService.initialize();
    
    // Start the server
    const port = config.port;
    await fastify.listen({ port, host: '0.0.0.0' });
    
    logger.info(`AI Services server running on port ${port}`);
    logger.info(`Health check available at http://localhost:${port}/health`);
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  await fastify.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  await fastify.close();
  process.exit(0);
});

// Start the server if this file is run directly
if (require.main === module) {
  start();
}

export { fastify, start };
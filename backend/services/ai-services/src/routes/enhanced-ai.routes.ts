/**
 * Enhanced AI Service Routes
 * 
 * Exposes comprehensive AI functionality including guardrails, 
 * advanced prompting, and OET-standard scoring
 */

import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { AIOrchestrationService } from '../services/orchestration.service';
import { PatientPersona } from '../services/ai-guardrails.service';
import { PromptContext } from '../services/advanced-prompt.service';
import { logger } from '../utils/logger';

interface ConversationTurnRequest {
  audioData: string; // Base64 encoded audio
  sessionId: string;
  patientPersona: PatientPersona;
  promptContext: PromptContext;
  conversationHistory: string[];
}

interface FeedbackGenerationRequest {
  transcript: string;
  patientPersona: PatientPersona;
  sessionDuration: number;
  targetProfession: string;
  difficultyLevel: string;
  scenarioType: string;
}

interface ScenarioGuidanceRequest {
  profession: string;
  clinicalArea: string;
  difficulty: string;
  patientPersona: PatientPersona;
}

interface ValidationRequest {
  response: string;
  responseType: 'patient' | 'feedback';
  patientPersona?: PatientPersona;
  conversationHistory?: string[];
}

export async function enhancedAIRoutes(fastify: FastifyInstance) {
  const orchestrationService = new AIOrchestrationService();

  // Initialize services on startup
  fastify.addHook('onReady', async () => {
    await orchestrationService.initialize();
    logger.info('Enhanced AI services initialized');
  });

  // Enhanced conversation processing with full AI pipeline
  const conversationTurnOpts: RouteShorthandOptions = {
    schema: {
      body: {
        type: 'object',
        required: ['audioData', 'sessionId', 'patientPersona', 'promptContext'],
        properties: {
          audioData: { type: 'string' },
          sessionId: { type: 'string' },
          patientPersona: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'number' },
              gender: { type: 'string' },
              occupation: { type: 'string' },
              culture: { type: 'string' },
              primaryCondition: { type: 'string' },
              medicalHistory: { type: 'array', items: { type: 'string' } },
              currentSymptoms: { type: 'array', items: { type: 'string' } },
              currentMedications: { type: 'array', items: { type: 'string' } },
              previousTreatments: { type: 'array', items: { type: 'string' } },
              knownAllergies: { type: 'array', items: { type: 'string' } },
              emotionalState: { type: 'string' },
              anxietyLevel: { type: 'string' },
              communicationStyle: { type: 'string' },
              healthLiteracyLevel: { type: 'string' },
              healthcareExperiences: { type: 'array', items: { type: 'string' } }
            }
          },
          promptContext: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              conversationHistory: { type: 'array', items: { type: 'string' } },
              currentTurn: { type: 'number' },
              targetProfession: { type: 'string' },
              difficultyLevel: { type: 'string' },
              scenarioType: { type: 'string' },
              clinicalArea: { type: 'string' }
            }
          },
          conversationHistory: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  };

  fastify.post<{ Body: ConversationTurnRequest }>('/conversation/turn', conversationTurnOpts, async (request, reply) => {
    try {
      const { audioData, sessionId, patientPersona, promptContext, conversationHistory } = request.body;

      // Convert base64 audio to buffer
      const audioBuffer = Buffer.from(audioData, 'base64');

      // Process conversation turn with full AI pipeline
      const result = await orchestrationService.processConversationTurn(
        audioBuffer,
        sessionId,
        patientPersona,
        promptContext,
        conversationHistory || []
      );

      reply.code(200).send({
        success: true,
        data: {
          transcription: {
            text: result.transcription.text,
            confidence: result.transcription.confidence,
            processingTime: result.transcription.processingTime
          },
          response: {
            text: result.response.response,
            confidence: result.response.confidence,
            processingTime: result.response.processingTime
          },
          audioResponse: {
            audioData: result.audioResponse.audioData,
            format: result.audioResponse.format,
            processingTime: result.audioResponse.processingTime
          },
          validation: {
            isValid: result.validationResult.isValid,
            issues: result.validationResult.issues,
            severity: result.validationResult.severity
          }
        }
      });

    } catch (error) {
      logger.error('Error in enhanced conversation turn', { error });
      reply.code(500).send({
        success: false,
        error: 'Conversation processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Comprehensive OET feedback generation
  const feedbackOpts: RouteShorthandOptions = {
    schema: {
      body: {
        type: 'object',
        required: ['transcript', 'patientPersona', 'sessionDuration', 'targetProfession', 'difficultyLevel', 'scenarioType'],
        properties: {
          transcript: { type: 'string' },
          patientPersona: { type: 'object' }, // Same structure as above
          sessionDuration: { type: 'number' },
          targetProfession: { type: 'string' },
          difficultyLevel: { type: 'string' },
          scenarioType: { type: 'string' }
        }
      }
    }
  };

  fastify.post<{ Body: FeedbackGenerationRequest }>('/feedback/comprehensive', feedbackOpts, async (request, reply) => {
    try {
      const { transcript, patientPersona, sessionDuration, targetProfession, difficultyLevel, scenarioType } = request.body;

      // Generate comprehensive feedback
      const result = await orchestrationService.generateComprehensiveFeedback(
        transcript,
        patientPersona,
        sessionDuration,
        targetProfession,
        difficultyLevel,
        scenarioType
      );

      reply.code(200).send({
        success: true,
        data: {
          feedback: result.feedbackContent,
          scoring: {
            overallScore: result.scoringResult.overallScore,
            detailedScores: result.scoringResult.detailedScores,
            strengths: result.scoringResult.strengths,
            improvements: result.scoringResult.improvements,
            transcriptAnalysis: result.scoringResult.transcriptAnalysis
          },
          validation: {
            isValid: result.validationResult.isValid,
            issues: result.validationResult.issues,
            severity: result.validationResult.severity
          }
        }
      });

    } catch (error) {
      logger.error('Error in comprehensive feedback generation', { error });
      reply.code(500).send({
        success: false,
        error: 'Feedback generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Scenario guidance generation
  const scenarioGuidanceOpts: RouteShorthandOptions = {
    schema: {
      body: {
        type: 'object',
        required: ['profession', 'clinicalArea', 'difficulty', 'patientPersona'],
        properties: {
          profession: { type: 'string' },
          clinicalArea: { type: 'string' },
          difficulty: { type: 'string' },
          patientPersona: { type: 'object' }
        }
      }
    }
  };

  fastify.post<{ Body: ScenarioGuidanceRequest }>('/scenario/guidance', scenarioGuidanceOpts, async (request, reply) => {
    try {
      const { profession, clinicalArea, difficulty, patientPersona } = request.body;

      const guidance = await orchestrationService.generateScenarioGuidance(
        profession,
        clinicalArea,
        difficulty,
        patientPersona
      );

      reply.code(200).send({
        success: true,
        data: guidance
      });

    } catch (error) {
      logger.error('Error in scenario guidance generation', { error });
      reply.code(500).send({
        success: false,
        error: 'Scenario guidance generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Response validation and sanitization
  const validationOpts: RouteShorthandOptions = {
    schema: {
      body: {
        type: 'object',
        required: ['response', 'responseType'],
        properties: {
          response: { type: 'string' },
          responseType: { type: 'string', enum: ['patient', 'feedback'] },
          patientPersona: { type: 'object' },
          conversationHistory: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  };

  fastify.post<{ Body: ValidationRequest }>('/validation/sanitize', validationOpts, async (request, reply) => {
    try {
      const { response, responseType, patientPersona, conversationHistory } = request.body;

      const result = await orchestrationService.validateAndSanitizeResponse(
        response,
        responseType,
        patientPersona,
        conversationHistory
      );

      reply.code(200).send({
        success: true,
        data: {
          sanitizedResponse: result.sanitizedResponse,
          validation: {
            isValid: result.validationResult.isValid,
            issues: result.validationResult.issues,
            severity: result.validationResult.severity
          }
        }
      });

    } catch (error) {
      logger.error('Error in response validation', { error });
      reply.code(500).send({
        success: false,
        error: 'Response validation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Comprehensive health check
  fastify.get('/health/comprehensive', async (request, reply) => {
    try {
      const healthStatus = await orchestrationService.comprehensiveHealthCheck();

      const statusCode = healthStatus.overall ? 200 : 503;
      
      reply.code(statusCode).send({
        success: healthStatus.overall,
        timestamp: new Date().toISOString(),
        services: healthStatus.services,
        overall: healthStatus.overall
      });

    } catch (error) {
      logger.error('Error in comprehensive health check', { error });
      reply.code(503).send({
        success: false,
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Service readiness check
  fastify.get('/ready', async (request, reply) => {
    try {
      const isReady = orchestrationService.isReady();
      
      reply.code(isReady ? 200 : 503).send({
        ready: isReady,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      reply.code(503).send({
        ready: false,
        error: 'Readiness check failed'
      });
    }
  });

  // AI capabilities discovery
  fastify.get('/capabilities', async (request, reply) => {
    reply.code(200).send({
      success: true,
      capabilities: {
        speechToText: {
          enabled: true,
          technology: 'faster-whisper',
          features: ['real-time transcription', 'multiple formats', 'confidence scoring']
        },
        textToSpeech: {
          enabled: true,
          technology: 'Edge-TTS',
          features: ['neural voices', 'multiple languages', 'natural prosody']
        },
        languageModel: {
          enabled: true,
          technology: 'Hugging Face API',
          features: ['medical conversations', 'context awareness', 'persona consistency']
        },
        aiGuardrails: {
          enabled: true,
          features: ['content safety', 'medical accuracy', 'persona validation', 'response sanitization']
        },
        advancedPrompting: {
          enabled: true,
          features: ['patient personas', 'scenario generation', 'educational prompts', 'follow-up suggestions']
        },
        oetScoring: {
          enabled: true,
          features: ['comprehensive rubrics', 'detailed feedback', 'strength identification', 'improvement suggestions']
        }
      }
    });
  });

  logger.info('Enhanced AI routes registered successfully');
}
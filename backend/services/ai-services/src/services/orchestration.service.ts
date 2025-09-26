import { SpeechToTextService } from './stt.service';
import { TextToSpeechService } from './tts.service';
import { HuggingFaceService } from './huggingface.service';
import { AIGuardrailsService, PatientPersona } from './ai-guardrails.service';
import { AdvancedPromptService, PromptContext, FeedbackContext } from './advanced-prompt.service';
import { AdvancedScoringService, ScoringResult } from './advanced-scoring.service';
import { logger, AppError } from '../utils/logger';
import { 
  AudioProcessingRequest, 
  TranscriptionResult, 
  TTSRequest, 
  TTSResult, 
  LLMRequest, 
  LLMResponse,
  ConversationAnalysis 
} from '../types/ai';

export class AIOrchestrationService {
  private sttService: SpeechToTextService;
  private ttsService: TextToSpeechService;
  private llmService: HuggingFaceService;
  private guardrailsService: AIGuardrailsService;
  private promptService: AdvancedPromptService;
  private scoringService: AdvancedScoringService;
  private isInitialized = false;

  constructor() {
    this.sttService = new SpeechToTextService();
    this.ttsService = new TextToSpeechService();
    this.llmService = new HuggingFaceService();
    this.guardrailsService = new AIGuardrailsService();
    this.promptService = new AdvancedPromptService();
    this.scoringService = new AdvancedScoringService();
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing AI Orchestration Service with advanced components');

      // Initialize all services in parallel for faster startup
      await Promise.all([
        this.sttService.initialize(),
        this.ttsService.initialize(),
        // LLM, guardrails, prompt, and scoring services don't need initialization (API/logic-based)
      ]);

      // Verify all services are operational
      const healthChecks = await Promise.all([
        this.guardrailsService.healthCheck(),
        this.promptService.healthCheck(),
        this.scoringService.healthCheck()
      ]);

      if (!healthChecks.every(check => check)) {
        throw new Error('One or more AI services failed health check');
      }

      this.isInitialized = true;
      logger.info('AI Orchestration Service with all advanced components initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI Orchestration Service', { error });
      throw new AppError('AI services initialization failed', 500, 'AI_INIT_ERROR');
    }
  }

  async processAudioToText(request: AudioProcessingRequest): Promise<TranscriptionResult> {
    this.ensureInitialized();
    return this.sttService.transcribeAudio(request);
  }

  async generateSpeechFromText(request: TTSRequest): Promise<TTSResult> {
    this.ensureInitialized();
    return this.ttsService.synthesizeSpeech(request);
  }

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    // LLM service is API-based, doesn't require local initialization
    return this.llmService.generateResponse(request);
  }

  async processConversationTurn(
    audioData: Buffer,
    sessionId: string,
    patientPersona: PatientPersona,
    promptContext: PromptContext,
    conversationHistory: string[]
  ): Promise<{
    transcription: TranscriptionResult;
    response: LLMResponse;
    audioResponse: TTSResult;
    validationResult: any;
  }> {
    this.ensureInitialized();

    try {
      logger.info(`Processing advanced conversation turn for session ${sessionId}`);

      // Step 1: Convert audio to text
      const transcription = await this.processAudioToText({
        audioData,
        sessionId,
        format: 'wav'
      });

      // Step 2: Generate advanced prompt using patient persona
      const advancedPrompt = this.promptService.generatePatientPersonaPrompt(
        patientPersona,
        promptContext,
        transcription.text
      );

      // Step 3: Generate AI response using advanced prompt
      const llmResponse = await this.llmService.generateResponse({
        message: advancedPrompt,
        context: conversationHistory,
        sessionId,
        temperature: 0.8, // Slightly higher for more natural patient responses
        maxTokens: 200
      });

      // Step 4: Validate AI response with guardrails
      const validationResult = await this.guardrailsService.validatePatientResponse(
        llmResponse.response,
        patientPersona,
        conversationHistory
      );

      // Step 5: Sanitize response if needed
      const finalResponse = validationResult.isValid 
        ? llmResponse.response 
        : (validationResult.sanitizedResponse || llmResponse.response);

      // Step 6: Convert response to speech
      const audioResponse = await this.generateSpeechFromText({
        text: finalResponse,
        sessionId
      });

      // Step 7: Update conversation history
      conversationHistory.push(transcription.text, finalResponse);

      logger.info('Advanced conversation turn completed', {
        sessionId,
        validationPassed: validationResult.isValid,
        issueCount: validationResult.issues.length
      });

      return {
        transcription,
        response: {
          ...llmResponse,
          response: finalResponse
        },
        audioResponse,
        validationResult
      };
    } catch (error) {
      logger.error('Conversation turn processing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId
      });
      throw error;
    }
  }

  async analyzeConversation(
    transcript: string,
    sessionId: string
  ): Promise<ConversationAnalysis> {
    try {
      logger.info(`Analyzing conversation for session ${sessionId}`);

      const analysis = await this.llmService.analyzeConversation(transcript, sessionId);

      // Extract potential mistakes from transcript
      const mistakes = await this.extractMistakes(transcript, sessionId);

      return {
        sessionId,
        transcript,
        analysis: {
          fluency: analysis.fluency,
          pronunciation: analysis.pronunciation,
          vocabulary: analysis.vocabulary,
          grammar: analysis.grammar,
          overall: Math.round((analysis.fluency + analysis.pronunciation + analysis.vocabulary + analysis.grammar) / 4)
        },
        feedback: {
          strengths: analysis.strengths,
          improvements: analysis.improvements,
          suggestions: analysis.suggestions
        },
        mistakes
      };
    } catch (error) {
      logger.error('Conversation analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId
      });
      throw error;
    }
  }

  async generateScenarioIntroduction(
    scenarioText: string,
    sessionId: string
  ): Promise<TTSResult> {
    this.ensureInitialized();

    const introText = `Here is your OET speaking scenario: ${scenarioText}. Please take a moment to read through this, and then we'll begin your practice session. You may start when you're ready.`;

    return this.generateSpeechFromText({
      text: introText,
      sessionId,
      speed: 0.9 // Slightly slower for clarity
    });
  }

  async generateFeedbackAudio(
    analysis: ConversationAnalysis
  ): Promise<TTSResult> {
    this.ensureInitialized();

    const feedbackText = this.createFeedbackText(analysis);

    return this.generateSpeechFromText({
      text: feedbackText,
      sessionId: analysis.sessionId
    });
  }

  private async extractMistakes(transcript: string, sessionId: string) {
    // For now, return empty array - this could be enhanced with grammar checking
    return [];
  }

  private createFeedbackText(analysis: ConversationAnalysis): string {
    const { analysis: scores, feedback } = analysis;

    let feedbackText = `Thank you for completing your OET practice session. `;
    
    feedbackText += `Your overall performance score is ${scores.overall} out of 10. `;

    if (feedback.strengths.length > 0) {
      feedbackText += `Your key strengths include: ${feedback.strengths.join(', ')}. `;
    }

    if (feedback.improvements.length > 0) {
      feedbackText += `Areas for improvement: ${feedback.improvements.join(', ')}. `;
    }

    if (feedback.suggestions.length > 0) {
      feedbackText += `I suggest focusing on: ${feedback.suggestions.join(', ')}. `;
    }

    feedbackText += `Keep practicing regularly to improve your OET speaking skills. Good luck with your exam!`;

    return feedbackText;
  }

  async getHealthStatus() {
    return {
      stt: this.sttService.isReady() ? 'ready' : 'loading',
      tts: this.ttsService.isReady() ? 'ready' : 'loading',
      llm: await this.llmService.healthCheck() ? 'ready' : 'error'
    };
  }

  /**
   * Generate comprehensive OET-standard feedback analysis
   */
  async generateComprehensiveFeedback(
    fullTranscript: string,
    patientPersona: PatientPersona,
    sessionDuration: number,
    targetProfession: string,
    difficultyLevel: string,
    scenarioType: string
  ): Promise<{
    feedbackContent: any;
    scoringResult: ScoringResult;
    validationResult: any;
  }> {
    this.ensureInitialized();

    try {
      logger.info('Generating comprehensive feedback analysis');

      // Step 1: Generate detailed scoring analysis
      const scoringResult = await this.scoringService.calculateScores(
        fullTranscript,
        patientPersona,
        sessionDuration,
        targetProfession
      );

      // Step 2: Create feedback context
      const feedbackContext: FeedbackContext = {
        transcript: fullTranscript,
        sessionDuration,
        patientPersona,
        targetProfession,
        difficultyLevel,
        scenarioType
      };

      // Step 3: Generate advanced feedback prompt
      const feedbackPrompt = this.promptService.generateFeedbackPrompt(feedbackContext);

      // Step 4: Get AI-generated feedback
      const feedbackResponse = await this.llmService.generateResponse({
        message: feedbackPrompt,
        context: [],
        sessionId: 'feedback-generation',
        temperature: 0.3, // Lower temperature for more consistent feedback
        maxTokens: 1000
      });

      // Step 5: Parse and validate feedback
      let feedbackContent;
      try {
        // Extract JSON from response
        const jsonMatch = feedbackResponse.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          feedbackContent = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in feedback response');
        }
      } catch (parseError) {
        logger.warn('Failed to parse AI feedback, using scoring service results', { parseError });
        
        // Fallback to scoring service results
        feedbackContent = {
          overall_score: scoringResult.overallScore,
          detailed_scores: {
            pronunciation: scoringResult.detailedScores.pronunciation,
            grammar: scoringResult.detailedScores.grammar,
            vocabulary: scoringResult.detailedScores.vocabulary,
            clinical_communication: scoringResult.detailedScores.clinicalCommunication,
            empathy: scoringResult.detailedScores.empathy,
            patient_education: scoringResult.detailedScores.patientEducation
          },
          strengths: scoringResult.strengths,
          improvements: scoringResult.improvements,
          transcript_analysis: {
            total_words: scoringResult.transcriptAnalysis.totalWords,
            speaking_time_percentage: scoringResult.transcriptAnalysis.speakingTimePercentage,
            key_phrases_used: scoringResult.transcriptAnalysis.keyPhrasesUsed,
            missed_opportunities: scoringResult.transcriptAnalysis.missedOpportunities
          }
        };
      }

      // Step 6: Validate feedback content
      const validationResult = await this.guardrailsService.validateFeedbackResponse(
        feedbackContent,
        fullTranscript
      );

      // Step 7: Sanitize feedback if needed
      if (!validationResult.isValid) {
        logger.warn('Feedback validation failed, applying corrections', {
          issues: validationResult.issues
        });
        
        // Apply basic corrections to ensure valid feedback
        feedbackContent = this.applyFeedbackCorrections(feedbackContent, scoringResult);
      }

      logger.info('Comprehensive feedback generation completed', {
        overallScore: feedbackContent.overall_score,
        validationPassed: validationResult.isValid
      });

      return {
        feedbackContent,
        scoringResult,
        validationResult
      };

    } catch (error) {
      logger.error('Error in comprehensive feedback generation', { error });
      throw new AppError('Comprehensive feedback generation failed', 500, 'FEEDBACK_ERROR');
    }
  }

  /**
   * Generate scenario-specific prompts and guidance
   */
  async generateScenarioGuidance(
    profession: string,
    clinicalArea: string,
    difficulty: string,
    patientPersona: PatientPersona
  ): Promise<{
    scenarioPrompt: string;
    educationalPrompts: string;
    medicalContextPrompts: string[];
    followUpSuggestions: string[];
  }> {
    this.ensureInitialized();

    try {
      logger.info('Generating scenario guidance', { profession, clinicalArea, difficulty });

      // Generate comprehensive scenario guidance
      const scenarioPrompt = this.promptService.generateScenarioPrompt(profession, clinicalArea, difficulty);
      
      const educationalPrompts = this.promptService.generateEducationalPrompts(
        patientPersona.primaryCondition,
        patientPersona.healthLiteracyLevel,
        patientPersona.culture
      );

      const medicalContextPrompts = this.promptService.generateMedicalContextPrompts(
        patientPersona.primaryCondition,
        patientPersona.currentSymptoms,
        profession
      );

      const followUpSuggestions = this.promptService.generateFollowUpPrompts(
        [],
        patientPersona,
        ['symptom assessment', 'medication review', 'lifestyle counseling']
      );

      return {
        scenarioPrompt,
        educationalPrompts,
        medicalContextPrompts,
        followUpSuggestions
      };

    } catch (error) {
      logger.error('Error in scenario guidance generation', { error });
      throw new AppError('Scenario guidance generation failed', 500, 'GUIDANCE_ERROR');
    }
  }

  /**
   * Validate and sanitize any AI response
   */
  async validateAndSanitizeResponse(
    response: string,
    responseType: 'patient' | 'feedback',
    persona?: PatientPersona,
    conversationHistory?: string[]
  ): Promise<{
    sanitizedResponse: string;
    validationResult: any;
  }> {
    this.ensureInitialized();

    try {
      let validationResult;
      
      if (responseType === 'patient' && persona) {
        validationResult = await this.guardrailsService.validatePatientResponse(
          response,
          persona,
          conversationHistory || []
        );
      } else if (responseType === 'feedback') {
        const feedbackObj = typeof response === 'string' ? JSON.parse(response) : response;
        validationResult = await this.guardrailsService.validateFeedbackResponse(
          feedbackObj,
          conversationHistory?.join('\n') || ''
        );
      } else {
        throw new Error('Invalid response type or missing persona');
      }

      const sanitizedResponse = validationResult.isValid 
        ? response 
        : this.guardrailsService.sanitizeResponse(response, responseType);

      return {
        sanitizedResponse,
        validationResult
      };

    } catch (error) {
      logger.error('Error in response validation and sanitization', { error });
      throw new AppError('Response validation failed', 500, 'VALIDATION_ERROR');
    }
  }

  /**
   * Health check for all AI services
   */
  async comprehensiveHealthCheck(): Promise<{
    overall: boolean;
    services: {
      stt: boolean;
      tts: boolean;
      llm: boolean;
      guardrails: boolean;
      prompt: boolean;
      scoring: boolean;
    };
  }> {
    try {
      const [sttHealth, ttsHealth, llmHealth, guardrailsHealth, promptHealth, scoringHealth] = await Promise.all([
        this.sttService.healthCheck ? this.sttService.healthCheck() : true,
        this.ttsService.healthCheck ? this.ttsService.healthCheck() : true,
        this.llmService.healthCheck(),
        this.guardrailsService.healthCheck(),
        this.promptService.healthCheck(),
        this.scoringService.healthCheck()
      ]);

      const services = {
        stt: sttHealth,
        tts: ttsHealth,
        llm: llmHealth,
        guardrails: guardrailsHealth,
        prompt: promptHealth,
        scoring: scoringHealth
      };

      const overall = Object.values(services).every(health => health);

      logger.info('Comprehensive health check completed', { overall, services });

      return { overall, services };

    } catch (error) {
      logger.error('Error in comprehensive health check', { error });
      return {
        overall: false,
        services: {
          stt: false,
          tts: false,
          llm: false,
          guardrails: false,
          prompt: false,
          scoring: false
        }
      };
    }
  }

  // Private helper methods

  private applyFeedbackCorrections(feedbackContent: any, scoringResult: ScoringResult): any {
    // Ensure required structure
    const corrected = {
      overall_score: feedbackContent.overall_score || scoringResult.overallScore,
      detailed_scores: feedbackContent.detailed_scores || {
        pronunciation: scoringResult.detailedScores.pronunciation,
        grammar: scoringResult.detailedScores.grammar,
        vocabulary: scoringResult.detailedScores.vocabulary,
        clinical_communication: scoringResult.detailedScores.clinicalCommunication,
        empathy: scoringResult.detailedScores.empathy,
        patient_education: scoringResult.detailedScores.patientEducation
      },
      strengths: feedbackContent.strengths || scoringResult.strengths,
      improvements: feedbackContent.improvements || scoringResult.improvements,
      transcript_analysis: feedbackContent.transcript_analysis || {
        total_words: scoringResult.transcriptAnalysis.totalWords,
        speaking_time_percentage: scoringResult.transcriptAnalysis.speakingTimePercentage,
        key_phrases_used: scoringResult.transcriptAnalysis.keyPhrasesUsed,
        missed_opportunities: scoringResult.transcriptAnalysis.missedOpportunities
      }
    };

    // Ensure scores are within valid range (0-100)
    if (corrected.overall_score < 0 || corrected.overall_score > 100) {
      corrected.overall_score = Math.max(0, Math.min(100, corrected.overall_score));
    }

    Object.keys(corrected.detailed_scores).forEach(key => {
      const score = corrected.detailed_scores[key];
      if (typeof score === 'number' && (score < 0 || score > 100)) {
        corrected.detailed_scores[key] = Math.max(0, Math.min(100, score));
      }
    });

    // Ensure required arrays
    if (!Array.isArray(corrected.strengths) || corrected.strengths.length === 0) {
      corrected.strengths = scoringResult.strengths;
    }

    if (!Array.isArray(corrected.improvements) || corrected.improvements.length === 0) {
      corrected.improvements = scoringResult.improvements;
    }

    return corrected;
  }

  /**
   * Check if all AI services are ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new AppError('AI Orchestration Service not initialized', 500, 'AI_NOT_INITIALIZED');
    }
  }
}
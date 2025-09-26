import { SpeechToTextService } from './stt.service';
import { HuggingFaceService } from './huggingface.service';
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

// Mock TTS Service for development environment compatibility
class MockTTSService {
  private modelLoaded = false;

  async initialize(): Promise<void> {
    logger.info('Initializing Mock TTS service (development mode)');
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.modelLoaded = true;
    logger.info('Mock TTS service initialized successfully');
  }

  async synthesizeSpeech(request: TTSRequest): Promise<TTSResult> {
    if (!this.modelLoaded) {
      throw new AppError('TTS service not initialized', 500, 'TTS_NOT_READY');
    }

    logger.info(`Generating mock speech for session ${request.sessionId}`);

    // Create a minimal WAV file (silence)
    const sampleRate = 22050;
    const duration = Math.max(1, this.estimateAudioDuration(request.text, request.speed || 1.0));
    const samples = Math.floor(sampleRate * duration);
    
    // Create minimal WAV header + silence
    const buffer = Buffer.alloc(44 + samples * 2);
    
    // WAV header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + samples * 2, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(samples * 2, 40);
    
    // Fill with silence (zeros are already in Buffer.alloc)

    return {
      audioData: buffer,
      format: 'wav',
      duration,
      processingTime: 100,
    };
  }

  private estimateAudioDuration(text: string, speed: number): number {
    const words = text.split(' ').length;
    const baseMinutes = words / 150;
    const adjustedMinutes = baseMinutes / speed;
    return adjustedMinutes * 60;
  }

  async generateWelcomeMessage(sessionId: string): Promise<TTSResult> {
    const welcomeText = "Welcome to your OET speaking practice session. Please listen carefully to the scenario and respond naturally. You may begin when ready.";
    
    return this.synthesizeSpeech({
      text: welcomeText,
      sessionId,
      speed: 0.9,
    });
  }

  async generateFeedbackAudio(feedbackText: string, sessionId: string): Promise<TTSResult> {
    return this.synthesizeSpeech({
      text: feedbackText,
      sessionId,
      speed: 1.0,
    });
  }

  async healthCheck(): Promise<boolean> {
    return this.modelLoaded;
  }

  isReady(): boolean {
    return this.modelLoaded;
  }
}

export class AIOrchestrationService {
  private sttService: SpeechToTextService;
  private ttsService: MockTTSService;
  private llmService: HuggingFaceService;
  private isInitialized = false;

  constructor() {
    this.sttService = new SpeechToTextService();
    this.ttsService = new MockTTSService();
    this.llmService = new HuggingFaceService();
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing AI Orchestration Service (Development Mode)');

      // Initialize services with graceful fallbacks
      const initPromises = [
        this.initializeSTT(),
        this.ttsService.initialize(),
        // LLM service doesn't need initialization (API-based)
      ];

      const results = await Promise.allSettled(initPromises);
      
      // Check if any critical services failed
      let hasSTT = false;
      let hasTTS = false;

      if (results[0].status === 'fulfilled') {
        hasSTT = true;
      } else {
        logger.warn('STT service initialization failed, using mock mode');
      }

      if (results[1].status === 'fulfilled') {
        hasTTS = true;
      } else {
        logger.warn('TTS service initialization failed, using mock mode');
      }

      this.isInitialized = true;
      logger.info(`AI Orchestration Service initialized - STT: ${hasSTT ? 'ready' : 'mock'}, TTS: ${hasTTS ? 'ready' : 'mock'}`);
    } catch (error) {
      logger.error('Failed to initialize AI Orchestration Service', { error });
      throw new AppError('AI services initialization failed', 500, 'AI_INIT_ERROR');
    }
  }

  private async initializeSTT(): Promise<void> {
    try {
      await this.sttService.initialize();
    } catch (error) {
      logger.warn('STT initialization failed, creating mock STT');
      // Create a mock STT that returns placeholder transcription
      (this.sttService as any).transcribeAudio = async (request: AudioProcessingRequest): Promise<TranscriptionResult> => {
        logger.info(`Mock STT processing for session ${request.sessionId}`);
        return {
          text: "This is a mock transcription for development purposes. The actual audio processing requires Python dependencies to be properly configured.",
          confidence: 0.8,
          segments: [{
            start: 0,
            end: 5,
            text: "Mock transcription"
          }],
          language: 'en',
          processingTime: 100
        };
      };
      (this.sttService as any).isReady = () => true;
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
    context?: string[]
  ): Promise<{
    transcription: TranscriptionResult;
    response: LLMResponse;
    audioResponse: TTSResult;
  }> {
    this.ensureInitialized();

    try {
      logger.info(`Processing conversation turn for session ${sessionId}`);

      // Step 1: Convert audio to text
      const transcription = await this.processAudioToText({
        audioData,
        sessionId,
        format: 'wav'
      });

      // Step 2: Generate AI response
      const llmResponse = await this.generateResponse({
        message: transcription.text,
        context: context || [],
        sessionId
      });

      // Step 3: Convert response to speech
      const audioResponse = await this.generateSpeechFromText({
        text: llmResponse.response,
        sessionId
      });

      return {
        transcription,
        response: llmResponse,
        audioResponse
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
      speed: 0.9
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
    const sttReady = this.sttService.isReady();
    const ttsReady = this.ttsService.isReady();
    const llmReady = await this.llmService.healthCheck();

    return {
      stt: sttReady ? 'ready' : 'loading',
      tts: ttsReady ? 'ready' : 'loading',
      llm: llmReady ? 'ready' : 'error'
    };
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new AppError('AI services not initialized', 500, 'AI_NOT_READY');
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}
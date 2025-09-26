import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { config } from '../config';
import { logger, AppError } from '../utils/logger';
import { TTSRequest, TTSResult } from '../types/ai';

export class TextToSpeechService {
  private modelLoaded = false;
  private modelPath: string;

  constructor() {
    this.modelPath = join(process.cwd(), 'models', 'tts');
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing TTS service with Edge-TTS (Microsoft Azure)');
      
      // Check if Python and required packages are available
      await this.checkDependencies();
      
      // Test TTS functionality
      await this.testTTSFunctionality();
      
      this.modelLoaded = true;
      logger.info('TTS service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize TTS service', { error });
      throw new AppError('TTS service initialization failed', 500, 'TTS_INIT_ERROR');
    }
  }

  async synthesizeSpeech(request: TTSRequest): Promise<TTSResult> {
    if (!this.modelLoaded) {
      throw new AppError('TTS service not initialized', 500, 'TTS_NOT_READY');
    }

    const startTime = Date.now();
    const outputFile = join(config.processing.tempDir, `${request.sessionId}_${Date.now()}.wav`);

    try {
      logger.info(`Synthesizing speech for session ${request.sessionId}`);

      // Ensure temp directory exists
      await fs.mkdir(config.processing.tempDir, { recursive: true });

      // Run Coqui TTS synthesis
      await this.runTTSSynthesis(request.text, outputFile, request.voice, request.speed);

      // Read the generated audio file
      const audioData = await fs.readFile(outputFile);
      
      // Get audio duration (simplified estimation)
      const duration = this.estimateAudioDuration(request.text, request.speed || 1.0);
      
      const processingTime = Date.now() - startTime;

      return {
        audioData,
        format: 'wav',
        duration,
        processingTime,
      };
    } catch (error) {
      logger.error('Speech synthesis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: request.sessionId,
      });
      throw error;
    } finally {
      // Clean up temporary file
      try {
        await fs.unlink(outputFile);
      } catch (error) {
        logger.warn('Failed to clean up temp file', { outputFile, error });
      }
    }
  }

  private async checkDependencies(): Promise<void> {
    return new Promise((resolve, reject) => {
      const pythonPath = '/workspaces/OET/.venv/bin/python';
      const pythonCheck = spawn(pythonPath, ['-c', 'import edge_tts; print("OK")']);
      
      let output = '';
      pythonCheck.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonCheck.on('close', (code) => {
        if (code === 0 && output.includes('OK')) {
          resolve();
        } else {
          reject(new Error('edge-tts not available. Please install: pip install edge-tts'));
        }
      });

      pythonCheck.on('error', () => {
        reject(new Error('Python3 not available'));
      });
    });
  }

  private async testTTSFunctionality(): Promise<void> {
    const testText = "Test";
    const testFile = join(config.processing.tempDir, 'tts_test.wav');
    
    try {
      await fs.mkdir(config.processing.tempDir, { recursive: true });
      await this.runEdgeTTSSynthesis(testText, testFile);
      await fs.unlink(testFile);
      logger.info('TTS test completed successfully');
    } catch (error) {
      throw new Error(`TTS functionality test failed: ${error}`);
    }
  }

  private async ensureModelExists(): Promise<void> {
    // Edge-TTS uses Microsoft's cloud voices, no local model download needed
    logger.info('Using Microsoft Edge-TTS neural voices');
  }

  private async runTTSSynthesis(
    text: string,
    outputFile: string,
    voice?: string,
    speed?: number
  ): Promise<void> {
    return this.runEdgeTTSSynthesis(text, outputFile, voice, speed);
  }

  private async runEdgeTTSSynthesis(
    text: string,
    outputFile: string,
    voice?: string,
    speed?: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const pythonScript = this.createEdgeTTSScript(text, outputFile, voice, speed);
      const pythonPath = '/workspaces/OET/.venv/bin/python';
      const python = spawn(pythonPath, ['-c', pythonScript]);

      let errorOutput = '';

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Edge-TTS synthesis failed: ${errorOutput}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Python execution failed: ${error.message}`));
      });
    });
  }

  private createTTSScript(
    text: string, 
    outputFile: string, 
    voice?: string, 
    speed?: number
  ): string {
    return this.createEdgeTTSScript(text, outputFile, voice, speed);
  }

  private createEdgeTTSScript(
    text: string, 
    outputFile: string, 
    voice?: string, 
    speed?: number
  ): string {
    const cleanText = text.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const selectedVoice = voice || 'en-US-JennyNeural'; // Professional female voice
    const rate = speed ? `${Math.round((speed - 1) * 50)}%` : '+0%';
    
    return `
import asyncio
import edge_tts
import sys

async def synthesize_speech():
    try:
        text = "${cleanText}"
        voice = "${selectedVoice}"
        rate = "${rate}"
        
        # Create TTS communicator
        communicate = edge_tts.Communicate(text, voice, rate=rate)
        
        # Save to file
        await communicate.save("${outputFile}")
        
        print("Edge-TTS synthesis completed successfully")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

# Run the async function
asyncio.run(synthesize_speech())
`;
  }

  private estimateAudioDuration(text: string, speed: number): number {
    // Rough estimation: average speaking rate is ~150 words per minute
    const words = text.split(' ').length;
    const baseMinutes = words / 150;
    const adjustedMinutes = baseMinutes / speed;
    return adjustedMinutes * 60; // Convert to seconds
  }

  async generateWelcomeMessage(sessionId: string): Promise<TTSResult> {
    const welcomeText = "Welcome to your OET speaking practice session. Please listen carefully to the scenario and respond naturally. You may begin when ready.";
    
    return this.synthesizeSpeech({
      text: welcomeText,
      sessionId,
      speed: 0.9, // Slightly slower for clarity
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
    try {
      await this.checkDependencies();
      return this.modelLoaded;
    } catch (error) {
      return false;
    }
  }

  isReady(): boolean {
    return this.modelLoaded;
  }
}
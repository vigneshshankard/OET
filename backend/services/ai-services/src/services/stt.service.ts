import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { config } from '../config';
import { logger, AppError } from '../utils/logger';
import { AudioProcessingRequest, TranscriptionResult } from '../types/ai';

export class SpeechToTextService {
  private modelLoaded = false;
  private modelPath: string;

  constructor() {
    this.modelPath = join(process.cwd(), 'models', 'whisper');
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing STT service with faster-whisper');
      
      // Check if Python and required packages are available
      await this.checkDependencies();
      
      // Download model if not exists
      await this.ensureModelExists();
      
      this.modelLoaded = true;
      logger.info('STT service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize STT service', { error });
      throw new AppError('STT service initialization failed', 500, 'STT_INIT_ERROR');
    }
  }

  async transcribeAudio(request: AudioProcessingRequest): Promise<TranscriptionResult> {
    if (!this.modelLoaded) {
      throw new AppError('STT service not initialized', 500, 'STT_NOT_READY');
    }

    const startTime = Date.now();
    const tempFile = join(config.processing.tempDir, `${request.sessionId}_${Date.now()}.wav`);

    try {
      logger.info(`Transcribing audio for session ${request.sessionId}`);

      // Ensure temp directory exists
      await fs.mkdir(config.processing.tempDir, { recursive: true });

      // Write audio data to temporary file
      await fs.writeFile(tempFile, request.audioData);

      // Run faster-whisper transcription
      const result = await this.runWhisperTranscription(tempFile, request.language);
      
      const processingTime = Date.now() - startTime;

      return {
        text: result.text,
        confidence: result.confidence,
        segments: result.segments,
        language: result.language || 'en',
        processingTime,
      };
    } catch (error) {
      logger.error('Audio transcription failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: request.sessionId,
      });
      throw error;
    } finally {
      // Clean up temporary file
      try {
        await fs.unlink(tempFile);
      } catch (error) {
        logger.warn('Failed to clean up temp file', { tempFile, error });
      }
    }
  }

  private async checkDependencies(): Promise<void> {
    return new Promise((resolve, reject) => {
      const pythonPath = '/workspaces/OET/.venv/bin/python';
      const pythonCheck = spawn(pythonPath, ['-c', 'import faster_whisper; print("OK")']);
      
      let output = '';
      pythonCheck.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonCheck.on('close', (code) => {
        if (code === 0 && output.includes('OK')) {
          resolve();
        } else {
          reject(new Error('faster-whisper not available. Please install: pip install faster-whisper'));
        }
      });

      pythonCheck.on('error', () => {
        reject(new Error('Python3 not available'));
      });
    });
  }

  private async ensureModelExists(): Promise<void> {
    // For development, we'll use the automatic model download
    // The model will be downloaded on first use by faster-whisper
    logger.info(`Using ${config.models.stt.size} whisper model`);
  }

  private async runWhisperTranscription(
    audioFile: string, 
    language?: string
  ): Promise<{
    text: string;
    confidence: number;
    segments: Array<{ start: number; end: number; text: string; }>;
    language?: string;
  }> {
    return new Promise((resolve, reject) => {
      const pythonScript = this.createWhisperScript(audioFile, language);
      const pythonPath = '/workspaces/OET/.venv/bin/python';
      const python = spawn(pythonPath, ['-c', pythonScript]);

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse transcription result: ${output}`));
          }
        } else {
          reject(new Error(`Transcription failed: ${errorOutput}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Python execution failed: ${error.message}`));
      });
    });
  }

  private createWhisperScript(audioFile: string, language?: string): string {
    return `
import json
from faster_whisper import WhisperModel

try:
    model = WhisperModel("${config.models.stt.size}", device="${config.models.stt.device}")
    segments, info = model.transcribe("${audioFile}", language="${language || 'en'}")
    
    result = {
        "text": "",
        "confidence": 0.0,
        "segments": [],
        "language": info.language
    }
    
    total_confidence = 0
    segment_count = 0
    
    for segment in segments:
        result["text"] += segment.text + " "
        result["segments"].append({
            "start": segment.start,
            "end": segment.end,
            "text": segment.text.strip()
        })
        total_confidence += segment.avg_logprob
        segment_count += 1
    
    result["text"] = result["text"].strip()
    result["confidence"] = max(0, min(1, (total_confidence / segment_count + 5) / 5)) if segment_count > 0 else 0.5
    
    print(json.dumps(result))
    
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;
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
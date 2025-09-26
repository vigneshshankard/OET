import dotenv from 'dotenv';
import { Config } from '../types/common';

dotenv.config();

const requiredEnvVars = [
  'HUGGINGFACE_API_KEY',
  'LIVEKIT_API_KEY',
  'LIVEKIT_API_SECRET'
];

// Validate required environment variables
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`);
  }
});

export const config: Config = {
  port: parseInt(process.env.PORT || '8003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY!,
    model: process.env.HUGGINGFACE_MODEL || 'microsoft/DialoGPT-large',
    baseUrl: process.env.HUGGINGFACE_BASE_URL || 'https://api-inference.huggingface.co',
  },
  
  livekit: {
    apiKey: process.env.LIVEKIT_API_KEY!,
    apiSecret: process.env.LIVEKIT_API_SECRET!,
    url: process.env.LIVEKIT_URL || 'wss://localhost:7880',
  },
  
  models: {
    stt: {
      size: process.env.STT_MODEL_SIZE || 'tiny',
      device: process.env.STT_DEVICE || 'cpu',
    },
    tts: {
      modelName: process.env.TTS_MODEL_NAME || 'tts_models/en/ljspeech/tacotron2-DDC',
      voiceCloning: process.env.TTS_VOICE_CLONING === 'true',
    },
  },
  
  processing: {
    maxAudioLength: parseInt(process.env.MAX_AUDIO_LENGTH || '300', 10),
    processingTimeout: parseInt(process.env.PROCESSING_TIMEOUT || '30', 10) * 1000,
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '5', 10),
    tempDir: process.env.TEMP_DIR || '/tmp/ai-processing',
  },
};
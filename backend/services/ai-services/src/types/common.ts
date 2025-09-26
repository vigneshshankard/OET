export interface Config {
  port: number;
  nodeEnv: string;
  logLevel: string;
  huggingface: {
    apiKey: string;
    model: string;
    baseUrl: string;
  };
  livekit: {
    apiKey: string;
    apiSecret: string;
    url: string;
  };
  models: {
    stt: {
      size: string;
      device: string;
    };
    tts: {
      modelName: string;
      voiceCloning: boolean;
    };
  };
  processing: {
    maxAudioLength: number;
    processingTimeout: number;
    maxConcurrentRequests: number;
    tempDir: string;
  };
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  services: {
    stt: 'ready' | 'loading' | 'error';
    tts: 'ready' | 'loading' | 'error';
    llm: 'ready' | 'loading' | 'error';
  };
  uptime: number;
  version: string;
}
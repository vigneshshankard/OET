# AI Services Development Configuration

This document outlines the current development setup using a hybrid approach with minimal local models and Hugging Face API.

## Current Development Architecture

### Models Used
- **STT**: faster-whisper tiny model (~39 MB) - Local
- **TTS**: Basic Coqui TTS voice (~50 MB) - Local  
- **LLM**: Hugging Face API (gpt-3.5-turbo via API) - Remote
- **Total Local Storage**: ~100 MB

### Environment Variables Required

Create a `.env` file in the AI services directory with:

```env
# Hugging Face Configuration
HUGGINGFACE_API_KEY=your_hf_api_key_here
HUGGINGFACE_MODEL=microsoft/DialoGPT-large
HUGGINGFACE_BASE_URL=https://api-inference.huggingface.co

# LiveKit Configuration  
LIVEKIT_API_KEY=your_livekit_api_key_here
LIVEKIT_API_SECRET=your_livekit_api_secret_here
LIVEKIT_URL=wss://your-project.livekit.cloud

# Local Model Configuration
STT_MODEL_SIZE=tiny
STT_DEVICE=cpu
TTS_MODEL_NAME=tts_models/en/ljspeech/tacotron2-DDC
TTS_VOICE_CLONING=false

# Service Configuration
AI_SERVICE_PORT=8003
DEBUG_MODE=true
LOG_LEVEL=debug
MAX_AUDIO_LENGTH=300
PROCESSING_TIMEOUT=30
```

### Required API Keys

1. **Hugging Face API Key**: 
   - Sign up at https://huggingface.co/
   - Go to Settings → Access Tokens
   - Create a new token with read permissions

2. **LiveKit API Credentials**:
   - Sign up at https://livekit.io/
   - Create a new project
   - Copy API Key and Secret from project settings

### Development Benefits

- **Fast startup**: Models load in < 30 seconds
- **Low memory**: < 2 GB RAM usage
- **Quick iteration**: API changes don't require model reloads
- **Cost effective**: Free tier available for development

### Performance Expectations

- **STT Processing**: Real-time (1x speed)
- **TTS Generation**: 2-3x real-time
- **LLM Response**: 1-3 seconds via API
- **Total Latency**: 3-5 seconds end-to-end

### Migration Notes

This setup maintains the same API interface as the future local deployment, making migration seamless when ready for production Option A deployment.
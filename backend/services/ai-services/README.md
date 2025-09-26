# AI Services

OET AI Services providing Speech-to-Text, Text-to-Speech, and Language Model capabilities.

## Architecture

- **STT**: faster-whisper (tiny model) - Local processing
- **TTS**: Coqui TTS (basic voice) - Local processing  
- **LLM**: Hugging Face API - Remote processing
- **Framework**: Fastify (Node.js/TypeScript)

## Setup Instructions

### 1. Install Node.js Dependencies

```bash
cd /workspaces/OET/backend/services/ai-services
npm install
```

### 2. Install Python Dependencies

```bash
# Install Python packages
pip install -r requirements.txt

# For faster CPU inference (optional)
pip install faster-whisper[cpu]
```

### 3. Environment Configuration

Copy the example environment file and configure your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- `HUGGINGFACE_API_KEY`: Get from https://huggingface.co/settings/tokens
- `LIVEKIT_API_KEY` & `LIVEKIT_API_SECRET`: Get from https://livekit.io/

### 4. Create Temp Directory

```bash
mkdir -p /tmp/ai-processing
```

### 5. Development Server

```bash
npm run dev
```

### 6. Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Service status

### Speech Processing  
- `POST /api/stt/transcribe` - Convert audio to text
- `POST /api/tts/synthesize` - Convert text to speech

### Language Model
- `POST /api/llm/chat` - Generate text responses

### Conversation Flow
- `POST /api/conversation/turn` - Process complete audio → text → response → audio
- `POST /api/conversation/analyze` - Analyze conversation performance

### OET Specific
- `POST /api/scenario/introduction` - Generate scenario audio
- `POST /api/feedback/audio` - Generate feedback audio

## Model Storage

- **Local Models**: ~100 MB total
- **Storage Location**: Downloads automatically on first use
- **Temp Files**: `/tmp/ai-processing/` (auto-cleanup)

## Performance

- **STT**: Real-time processing on CPU
- **TTS**: 2-3x real-time generation
- **LLM**: 1-3 seconds via API
- **Memory**: < 2 GB RAM usage

## Migration Path

This hybrid setup maintains API compatibility with the future fully local deployment (Option A from the deployment guide).
# OET AI Services - Enhanced Implementation

## 🚀 Overview

The OET AI Services provide comprehensive artificial intelligence capabilities for the Occupational English Test (OET) training platform. This enhanced implementation includes advanced AI guardrails, sophisticated prompting systems, OET-standard scoring algorithms, and comprehensive monitoring.

## 🌟 Key Features

### Core AI Capabilities
- **Speech-to-Text (STT)**: Real-time transcription with confidence scoring
- **Text-to-Speech (TTS)**: Natural voice synthesis with multiple personas
- **Large Language Model (LLM)**: Medical conversation generation and response
- **AI Guardrails**: Comprehensive safety and validation systems
- **Advanced Prompting**: Sophisticated prompt engineering for educational scenarios
- **OET Scoring**: Professional-grade scoring algorithms with detailed feedback

### Enhanced Features (v2.0)
- **Patient Persona System**: Detailed patient characterizations for realistic scenarios
- **Medical Safety Validation**: Ensures medically accurate and safe AI responses
- **Content Sanitization**: Filters inappropriate content and maintains professionalism
- **Conversation Analysis**: Deep analysis of medical conversations with scoring
- **Real-time Monitoring**: Comprehensive system monitoring and performance metrics
- **Compliance Validation**: Ensures responses meet OET standards and guidelines

## 🏗️ Architecture

### Service Structure
```
ai-services/
├── src/
│   ├── services/
│   │   ├── orchestration.service.ts       # Main AI coordination
│   │   ├── ai-guardrails.service.ts       # Safety and validation
│   │   ├── advanced-prompt.service.ts     # Prompt engineering
│   │   ├── advanced-scoring.service.ts    # OET scoring algorithms
│   │   ├── stt.service.ts                 # Speech-to-Text
│   │   ├── tts.service.ts                 # Text-to-Speech
│   │   └── llm.service.ts                 # Language Model
│   ├── routes/
│   │   ├── enhanced-ai.routes.ts          # v2 API endpoints
│   │   ├── ai-monitoring.routes.ts        # Monitoring dashboard
│   │   ├── speech.routes.ts               # Legacy speech endpoints
│   │   └── llm.routes.ts                  # Legacy LLM endpoints
│   ├── types/
│   │   └── [type definitions]
│   ├── utils/
│   │   └── logger.ts                      # Logging utilities
│   └── server.ts                          # Main server
```

### Technology Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Fastify 4.x for high-performance APIs
- **AI Models**: 
  - STT: Faster-Whisper (local deployment ready)
  - TTS: Edge-TTS with neural voices
  - LLM: Hugging Face Transformers (cloud/local hybrid)
- **Validation**: Natural language processing libraries
- **Monitoring**: Real-time performance metrics and health checks

## 🛡️ AI Guardrails System

### Safety Measures
- **Content Safety**: Filters inappropriate, offensive, or harmful content
- **Medical Accuracy**: Validates medical information against established guidelines
- **Professional Standards**: Ensures responses maintain healthcare professionalism
- **Privacy Protection**: Removes or masks personally identifiable information
- **Conversation Consistency**: Maintains patient persona and scenario coherence

### Validation Checks
```typescript
interface ValidationResult {
  isValid: boolean;
  issues: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestions: string[];
  confidence: number;
}
```

## 🎯 Advanced Prompting System

### Patient Persona Generation
- **Demographics**: Age, gender, cultural background, occupation
- **Medical Profile**: Conditions, history, medications, allergies
- **Psychological Profile**: Emotional state, anxiety levels, communication style
- **Educational Context**: Health literacy, healthcare experiences

### Scenario Types
- **Consultation**: Initial patient consultations and assessments
- **Emergency**: Urgent care and emergency department scenarios
- **First Visit**: New patient introductions and history taking
- **Follow-up**: Continued care and treatment monitoring

### Prompt Engineering Features
- Context-aware prompt generation
- Professional-specific adaptations (nurse, doctor, dentist, physiotherapist)
- Difficulty scaling (beginner, intermediate, advanced)
- Cultural sensitivity integration

## 📊 OET Scoring System

### Scoring Rubrics
- **Communication Skills**: Clarity, empathy, active listening
- **Language Proficiency**: Grammar, vocabulary, pronunciation
- **Clinical Knowledge**: Medical accuracy, appropriate responses
- **Professional Interaction**: Maintaining boundaries, ethical considerations

### Detailed Feedback
```typescript
interface ScoringResult {
  overallScore: number;           // 0-100
  detailedScores: {
    communication: number;
    language: number;
    clinical: number;
    professional: number;
  };
  strengths: string[];
  improvements: string[];
  transcriptAnalysis: TranscriptAnalysis;
}
```

## 🔧 API Endpoints

### Enhanced AI Routes (v2.0)
```
POST /api/v2/conversation/turn
POST /api/v2/feedback/comprehensive
POST /api/v2/scenario/guidance
POST /api/v2/validation/sanitize
GET  /api/v2/capabilities
GET  /api/v2/health/comprehensive
GET  /api/v2/ready
```

### Monitoring Routes
```
GET  /monitor/dashboard           # HTML dashboard
GET  /monitor/dashboard/api       # JSON metrics
POST /monitor/dashboard/reset-metrics
```

### Legacy Routes (v1.0)
```
POST /api/stt/transcribe
POST /api/tts/synthesize
POST /api/llm/chat
POST /api/conversation/turn
POST /api/conversation/analyze
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.0 or higher
- Python 3.8+ (for AI model dependencies)
- Docker (optional, for containerized deployment)

### Installation
```bash
# Install dependencies
npm install

# Install Python dependencies for AI models
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Build the project
npm run build

# Start development server
npm run dev

# Start production server
npm start
```

### Environment Configuration
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# AI Service URLs
HUGGINGFACE_API_URL=https://api-inference.huggingface.co
HUGGINGFACE_API_KEY=your_api_key_here

# Model Configuration
STT_MODEL=openai/whisper-large-v3
TTS_VOICE=en-US-AriaNeural
LLM_MODEL=microsoft/DialoGPT-large

# Safety Configuration
ENABLE_CONTENT_FILTER=true
ENABLE_MEDICAL_VALIDATION=true
ENABLE_PROFANITY_FILTER=true

# Performance Configuration
MAX_CONCURRENT_REQUESTS=10
REQUEST_TIMEOUT=30000
MEMORY_LIMIT=2048
```

## 📈 Monitoring & Performance

### Health Checks
- `/health` - Basic service health
- `/ready` - Service readiness status
- `/api/v2/health/comprehensive` - Detailed health with dependencies

### Performance Metrics
- Request count and success rates
- Average response times
- AI operation performance
- Memory and CPU usage
- Error rates and trending

### Dashboard Features
- Real-time system metrics
- Service status monitoring
- AI capability performance
- Request analytics
- Auto-refresh capabilities

Access the monitoring dashboard at: `http://localhost:3001/monitor/dashboard`

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testNamePattern="AI Guardrails"
npm test -- --testNamePattern="Scoring Service"

# Run tests with coverage
npm test -- --coverage
```

### API Testing
```bash
# Test conversation turn (enhanced)
curl -X POST http://localhost:3001/api/v2/conversation/turn \
  -H "Content-Type: application/json" \
  -d '{
    "audioData": "base64_encoded_audio",
    "sessionId": "test-session",
    "patientPersona": {...},
    "promptContext": {...}
  }'

# Test comprehensive feedback
curl -X POST http://localhost:3001/api/v2/feedback/comprehensive \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "conversation transcript",
    "patientPersona": {...},
    "sessionDuration": 300,
    "targetProfession": "doctor"
  }'
```

## 🔒 Security Features

### Input Validation
- Request schema validation
- Audio file format verification
- Content length limits
- Rate limiting protection

### AI Safety
- Response content filtering
- Medical accuracy validation
- Inappropriate content detection
- Privacy information masking

### Access Control
- API key authentication
- Request origin validation
- Rate limiting by IP
- Request size limits

## 📝 Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint configuration for consistency
- Prettier for code formatting
- Comprehensive error handling

### AI Integration Best Practices
- Always use guardrails for AI responses
- Implement proper timeout handling
- Log AI operations for monitoring
- Validate inputs before processing
- Sanitize outputs before returning

### Performance Optimization
- Use streaming for large audio files
- Implement connection pooling
- Cache frequent AI operations
- Monitor memory usage
- Implement graceful degradation

## 🚢 Deployment

### Docker Deployment
```bash
# Build Docker image
docker build -t oet-ai-services .

# Run container
docker run -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  oet-ai-services
```

### Production Considerations
- Enable clustering for CPU utilization
- Configure reverse proxy (nginx)
- Set up log aggregation
- Implement health check monitoring
- Configure auto-scaling policies
- Set up backup strategies for models

### Scaling
- Horizontal scaling with load balancers
- GPU acceleration for AI models
- CDN integration for audio files
- Database connection pooling
- Caching layer implementation

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Install dependencies
4. Run tests to ensure everything works
5. Make your changes
6. Add tests for new features
7. Ensure all tests pass
8. Submit a pull request

### Coding Standards
- Follow TypeScript best practices
- Write comprehensive tests
- Document API changes
- Update README for new features
- Use semantic commit messages

## 📚 API Documentation

Comprehensive API documentation is available at:
- OpenAPI/Swagger: `http://localhost:3001/docs`
- Interactive testing: `http://localhost:3001/playground`

## 🆘 Support

### Troubleshooting
- Check service health at `/health`
- Review logs for error details
- Verify environment configuration
- Test AI model connectivity
- Monitor system resources

### Common Issues
1. **Model Loading Timeout**: Increase `REQUEST_TIMEOUT` in environment
2. **Memory Issues**: Adjust `MEMORY_LIMIT` or scale vertically
3. **API Rate Limits**: Configure rate limiting appropriately
4. **Audio Processing Errors**: Verify supported audio formats

### Contact
- Technical Issues: Create GitHub issue
- Performance Questions: Check monitoring dashboard
- Feature Requests: Submit enhancement proposal

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔄 Changelog

### Version 2.0.0
- ✨ Enhanced AI guardrails system
- ✨ Advanced prompting with patient personas
- ✨ OET-standard scoring algorithms
- ✨ Comprehensive monitoring dashboard
- ✨ Medical safety validation
- ✨ Content sanitization system
- 🐛 Fixed conversation consistency issues
- 📈 Improved performance metrics
- 🔒 Enhanced security features

### Version 1.0.0
- 🎉 Initial AI services implementation
- ⚡ Basic STT/TTS/LLM functionality
- 📊 Health check endpoints
- 🔧 Configuration management
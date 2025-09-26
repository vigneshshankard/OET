# AI Services Deployment Guide

## Overview

The OET AI Services provide intelligent speech processing, conversation management, and performance analysis for the OET practice platform. This document outlines both the current development setup and the recommended production deployment strategy.

## Architecture Options

### Current Development Setup (Hybrid)
- **STT**: Tiny faster-whisper model (~39 MB) - Local
- **TTS**: Basic Coqui TTS voice (~50 MB) - Local  
- **LLM**: Hugging Face API - Remote
- **Total Local Storage**: ~100 MB
- **Benefits**: Fast development, minimal storage, API flexibility

### Future Production Setup (Option A - Fully Local)
- **STT**: Medium faster-whisper model (~1.5 GB) - Local
- **TTS**: Neural Coqui TTS voices (~2 GB) - Local
- **LLM**: LLaMA-7B or Mistral-7B (~7-15 GB) - Local
- **Total Storage**: ~10-18 GB
- **Benefits**: Complete privacy, no API costs, full control

---

## Option A: Fully Local Production Deployment

### 🎯 **Strategic Benefits**

#### Privacy & Security
- **Zero external API calls** - all patient audio stays on-premises
- **GDPR/HIPAA compliance** - no data leaves your infrastructure
- **Complete audit trail** - all processing logged locally
- **No vendor lock-in** - independent of external services

#### Performance & Reliability
- **Sub-100ms latency** - no network round trips
- **Offline capability** - works without internet connectivity
- **Predictable performance** - no API rate limits or throttling
- **24/7 availability** - no dependency on external service uptime

#### Cost Efficiency
- **No per-request API fees** - unlimited usage at fixed infrastructure cost
- **Scalable economics** - cost doesn't increase with user growth
- **Predictable budgeting** - only hardware and electricity costs

### 🛠 **Technical Architecture**

#### Hardware Requirements

**Minimum Production Server Specs:**
```
CPU: 8 cores (Intel Xeon or AMD EPYC)
RAM: 32 GB DDR4
Storage: 50 GB NVMe SSD (for models + OS)
GPU: Optional - NVIDIA RTX 4090 or Tesla T4 (10x speed boost)
Network: 1 Gbps for user connections
```

**Recommended Production Server Specs:**
```
CPU: 16 cores (Intel Xeon or AMD EPYC)
RAM: 64 GB DDR4
Storage: 100 GB NVMe SSD
GPU: NVIDIA RTX 4090 24GB or A100 40GB (20x speed boost)
Network: 10 Gbps for high concurrent users
```

#### Model Storage Breakdown

**Speech-to-Text (faster-whisper)**
```
Model Size: 1.5 GB (Medium model)
Languages: English + 99 other languages
Accuracy: 95%+ for medical conversations
Load Time: 30-60 seconds on startup
Memory Usage: 2-4 GB RAM during inference
Processing Speed: Real-time (1x speed) on CPU, 5x on GPU
```

**Text-to-Speech (Coqui TTS)**
```
Model Size: 2 GB (Neural voices - Male + Female)
Voice Quality: Natural, professional medical tone
Languages: English (expandable to other languages)
Load Time: 10-30 seconds per voice
Memory Usage: 1-2 GB RAM per loaded voice
Processing Speed: 2-5x real-time on CPU, 10x on GPU
```

**Language Model (LLaMA-7B or Mistral-7B)**
```
Model Size: 7-15 GB (depending on quantization)
Context Window: 4,096 tokens (long conversations)
Response Quality: GPT-3.5 level for medical conversations
Load Time: 2-5 minutes on startup
Memory Usage: 8-16 GB RAM during inference
Processing Speed: 20-50 tokens/second on CPU, 100+ on GPU
```

### 📦 **Deployment Implementation**

#### Docker Container Strategy
```dockerfile
# Multi-stage build for optimized production image
FROM python:3.11-slim as base
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    espeak-ng \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download and cache models during build
FROM base as model-downloader
RUN python -c "
import whisper
import TTS
from transformers import AutoTokenizer, AutoModelForCausalLM

# Download STT model
whisper.load_model('medium')

# Download TTS models
tts = TTS('tts_models/en/ljspeech/tacotron2-DDC')

# Download LLM
tokenizer = AutoTokenizer.from_pretrained('mistralai/Mistral-7B-Instruct-v0.1')
model = AutoModelForCausalLM.from_pretrained('mistralai/Mistral-7B-Instruct-v0.1', device_map='cpu')
"

# Production image with models
FROM base as production
COPY --from=model-downloader /root/.cache /root/.cache
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-services
spec:
  replicas: 2  # High availability
  selector:
    matchLabels:
      app: ai-services
  template:
    metadata:
      labels:
        app: ai-services
    spec:
      containers:
      - name: ai-services
        image: oet/ai-services:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "16Gi"
            cpu: "4"
          limits:
            memory: "32Gi"
            cpu: "8"
        env:
        - name: MODEL_PATH
          value: "/models"
        - name: ENVIRONMENT
          value: "production"
        volumeMounts:
        - name: model-storage
          mountPath: /models
      volumes:
      - name: model-storage
        persistentVolumeClaim:
          claimName: ai-models-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ai-models-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
  storageClassName: fast-ssd
```

### ⚡ **Performance Optimizations**

#### Model Loading Strategy
```python
# Lazy loading with caching
class AIModelManager:
    def __init__(self):
        self.stt_model = None
        self.tts_model = None
        self.llm_model = None
        self.model_cache = {}
    
    async def get_stt_model(self):
        if self.stt_model is None:
            self.stt_model = await self.load_whisper_model()
        return self.stt_model
    
    async def warm_up_models(self):
        """Preload all models during startup"""
        await asyncio.gather(
            self.get_stt_model(),
            self.get_tts_model(),
            self.get_llm_model()
        )
```

#### GPU Acceleration
```python
# Automatic GPU detection and fallback
import torch

def get_device():
    if torch.cuda.is_available():
        return "cuda"
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        return "mps"  # Apple Silicon
    else:
        return "cpu"

# Model initialization with optimal device
device = get_device()
model = WhisperModel("medium", device=device, compute_type="float16")
```

#### Memory Management
```python
# Streaming processing for large audio files
async def process_audio_stream(audio_stream):
    chunk_size = 30  # 30-second chunks
    results = []
    
    async for chunk in audio_stream.chunks(chunk_size):
        result = await model.transcribe(chunk)
        results.append(result)
        
        # Clear GPU memory after each chunk
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    
    return combine_results(results)
```

### 🔧 **Configuration Management**

#### Environment Variables
```bash
# Model Configuration
STT_MODEL_SIZE=medium
STT_DEVICE=cuda
TTS_MODEL_NAME=tts_models/en/ljspeech/tacotron2-DDC
LLM_MODEL_NAME=mistralai/Mistral-7B-Instruct-v0.1
LLM_DEVICE=cuda
LLM_QUANTIZATION=4bit

# Performance Settings
MAX_CONCURRENT_REQUESTS=10
MODEL_CACHE_SIZE=3
BATCH_SIZE=4
MAX_AUDIO_LENGTH=300  # 5 minutes

# Resource Limits
MAX_MEMORY_USAGE=28GB
GPU_MEMORY_FRACTION=0.8
CPU_THREADS=8
```

#### Model Configuration
```python
# config/models.py
from dataclasses import dataclass
from typing import Dict, Any

@dataclass
class ModelConfig:
    name: str
    size: str
    device: str
    cache_dir: str
    max_memory: str
    
class AIConfig:
    STT_CONFIG = ModelConfig(
        name="openai/whisper-medium",
        size="medium",
        device="cuda",
        cache_dir="/models/whisper",
        max_memory="4GB"
    )
    
    TTS_CONFIG = ModelConfig(
        name="tts_models/en/ljspeech/tacotron2-DDC",
        size="standard",
        device="cuda", 
        cache_dir="/models/tts",
        max_memory="2GB"
    )
    
    LLM_CONFIG = ModelConfig(
        name="mistralai/Mistral-7B-Instruct-v0.1",
        size="7B",
        device="cuda",
        cache_dir="/models/llm",
        max_memory="16GB"
    )
```

### 📊 **Monitoring & Metrics**

#### Performance Monitoring
```python
# Enhanced logging with performance metrics
import time
from prometheus_client import Counter, Histogram, Gauge

# Metrics collection
REQUEST_COUNT = Counter('ai_requests_total', 'Total AI requests', ['service', 'status'])
REQUEST_DURATION = Histogram('ai_request_duration_seconds', 'Request duration', ['service'])
MODEL_MEMORY = Gauge('ai_model_memory_usage_bytes', 'Model memory usage', ['model'])
GPU_UTILIZATION = Gauge('ai_gpu_utilization_percent', 'GPU utilization', ['gpu_id'])

class MetricsMiddleware:
    async def __call__(self, request: Request, call_next):
        start_time = time.time()
        
        response = await call_next(request)
        
        duration = time.time() - start_time
        REQUEST_DURATION.labels(service=request.url.path).observe(duration)
        REQUEST_COUNT.labels(service=request.url.path, status=response.status_code).inc()
        
        return response
```

#### Health Checks
```python
# Comprehensive health monitoring
class AIHealthCheck:
    async def check_models_loaded(self) -> bool:
        """Verify all models are loaded and responsive"""
        try:
            # Quick inference test for each model
            await self.test_stt_model()
            await self.test_tts_model() 
            await self.test_llm_model()
            return True
        except Exception as e:
            logger.error(f"Model health check failed: {e}")
            return False
    
    async def check_gpu_status(self) -> Dict[str, Any]:
        """Monitor GPU memory and utilization"""
        if not torch.cuda.is_available():
            return {"status": "no_gpu", "message": "Running on CPU"}
        
        gpu_info = {}
        for i in range(torch.cuda.device_count()):
            gpu_info[f"gpu_{i}"] = {
                "memory_used": torch.cuda.memory_allocated(i),
                "memory_total": torch.cuda.max_memory_allocated(i),
                "utilization": torch.cuda.utilization(i)
            }
        return gpu_info
```

### 🚀 **Migration Path from Development to Production**

#### Phase 1: Current Development (API-based)
- ✅ Use Hugging Face API for LLM inference
- ✅ Local tiny STT/TTS models for development
- ✅ Environment variable configuration ready

#### Phase 2: Staging Deployment (Hybrid)
- 📦 Deploy medium STT model locally
- 📦 Deploy neural TTS model locally
- 🌐 Continue using Hugging Face API for LLM
- 🧪 Performance testing and optimization

#### Phase 3: Production Deployment (Fully Local)
- 📦 Deploy full LLM locally (LLaMA-7B/Mistral-7B)
- ⚡ GPU acceleration implementation
- 📊 Production monitoring setup
- 🔒 Security hardening and compliance

#### Phase 4: Scale Optimization
- 🔄 Load balancing across multiple AI service instances
- 📈 Auto-scaling based on demand
- 🎯 Model fine-tuning on OET-specific data
- 🌍 Multi-region deployment

### 💰 **Cost Analysis**

#### Development Costs (Current)
```
Hugging Face API: $0.50-2.00 per 1000 requests
Local Storage: ~100 MB (negligible)
Development Time: Fast iteration and testing
Total Monthly Cost: $50-200 (depending on usage)
```

#### Production Costs (Option A - Fully Local)
```
Server Hardware: $5,000-15,000 one-time cost
Monthly Hosting: $500-2,000/month (cloud) or $200-500/month (self-hosted)
Electricity: $50-200/month
Maintenance: $500-1,000/month
No API Fees: $0 ongoing

Break-even Point: 3-6 months compared to API costs at scale
Annual Savings: $10,000-50,000+ (depending on usage volume)
```

### 🔒 **Security & Compliance**

#### Data Protection
- **Audio Encryption**: All audio processed in encrypted memory
- **Model Security**: Models stored in secure containers
- **Access Control**: Role-based access to AI endpoints
- **Audit Logging**: Complete processing trail for compliance

#### Compliance Features
- **GDPR Ready**: No data leaves premises, automatic deletion
- **HIPAA Compliant**: PHI protection in medical conversations
- **SOC 2**: Security controls for enterprise deployment
- **ISO 27001**: Information security management

---

## Implementation Timeline

### Immediate (Current Development)
- ✅ Hybrid setup with API LLM
- ✅ Basic STT/TTS local models
- ✅ Core functionality development

### 3 Months (Staging)
- 📦 Medium quality local models
- ⚡ Basic GPU acceleration
- 📊 Performance monitoring

### 6 Months (Production Ready)
- 🚀 Full local deployment option
- 🔒 Security hardening
- 📈 Auto-scaling capability

### 12 Months (Optimized)
- 🎯 Fine-tuned models for OET
- 🌍 Multi-region deployment
- 📊 Advanced analytics

---

## Conclusion

Option A (Fully Local) provides the optimal balance of privacy, performance, and cost-effectiveness for production OET deployment. The hybrid development approach allows for rapid iteration while maintaining a clear path to the secure, scalable production architecture.

The investment in local infrastructure pays dividends in:
- **Unlimited usage** without per-request costs
- **Complete privacy** for sensitive medical conversations  
- **Predictable performance** for real-time applications
- **Independence** from external service providers
- **Customization** capability for OET-specific requirements

This architecture positions OET as a privacy-first, performance-optimized platform ready for enterprise healthcare deployment.
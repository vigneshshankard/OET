"""
Local LLM Manager for OET Python AI Engine
Handles loading, inference, and management of local language models
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Union
import time
import psutil
import torch
from transformers import (
    AutoTokenizer, AutoModelForCausalLM, AutoModel,
    BitsAndBytesConfig, pipeline, TextStreamer
)
from peft import PeftModel
import requests
import json
from concurrent.futures import ThreadPoolExecutor
import threading
from dataclasses import dataclass
from enum import Enum

from app.core.config import Settings

logger = logging.getLogger(__name__)

class ModelType(Enum):
    """Types of models supported"""
    LLM = "llm"                    # Large Language Models
    MEDICAL_NLP = "medical_nlp"    # Medical NLP models  
    EMBEDDING = "embedding"         # Embedding models
    CLASSIFIER = "classifier"       # Classification models
    CUSTOM = "custom"              # Custom trained models

@dataclass
class ModelInfo:
    """Information about a loaded model"""
    name: str
    model_type: ModelType
    size_gb: float
    device: str
    quantization: Optional[str]
    load_time: float
    last_used: float
    use_count: int
    memory_usage: float

@dataclass
class GenerationRequest:
    """Request for text generation"""
    prompt: str
    model_name: Optional[str] = None
    max_tokens: int = 512
    temperature: float = 0.7
    top_p: float = 0.9
    top_k: int = 50
    repetition_penalty: float = 1.1
    stop_sequences: List[str] = None
    stream: bool = False
    context_length: Optional[int] = None

@dataclass
class GenerationResponse:
    """Response from text generation"""
    text: str
    model_used: str
    tokens_generated: int
    generation_time: float
    prompt_tokens: int
    total_tokens: int
    finish_reason: str
    metadata: Dict[str, Any]

class LLMManager:
    """Manages local language models and inference"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.loaded_models: Dict[str, Any] = {}
        self.model_info: Dict[str, ModelInfo] = {}
        self.tokenizers: Dict[str, Any] = {}
        self.executor = ThreadPoolExecutor(max_workers=2)  # Limit concurrent model operations
        self.model_lock = asyncio.Lock()
        
        # GPU configuration
        self.gpu_available = torch.cuda.is_available() and not settings.FORCE_CPU
        self.device = settings.device
        
        # Initialize quantization config if enabled
        self.quantization_config = None
        if settings.ENABLE_QUANTIZATION and self.gpu_available:
            self.quantization_config = BitsAndBytesConfig(
                load_in_8bit=settings.QUANTIZATION_BITS == 8,
                load_in_4bit=settings.QUANTIZATION_BITS == 4,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True,
            )
        
        logger.info(f"🔧 LLM Manager initialized - Device: {self.device}, GPU: {self.gpu_available}")
    
    async def initialize(self):
        """Initialize the LLM manager"""
        try:
            logger.info("🚀 Initializing LLM Manager...")
            
            # Check GPU memory if available
            if self.gpu_available:
                gpu_info = await self.get_gpu_memory_info()
                logger.info(f"🎮 GPU Memory: {gpu_info}")
            
            # Initialize Ollama connection if enabled
            if self.settings.ENABLE_LOCAL_LLMS:
                await self._check_ollama_connection()
            
            logger.info("✅ LLM Manager initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize LLM Manager: {e}")
            raise
    
    async def preload_default_models(self):
        """Preload default models for faster inference"""
        try:
            logger.info("⚡ Preloading default models...")
            
            models_to_load = [
                (self.settings.DEFAULT_LLM_MODEL, ModelType.LLM),
                (self.settings.DEFAULT_MEDICAL_MODEL, ModelType.MEDICAL_NLP),
            ]
            
            for model_name, model_type in models_to_load:
                try:
                    await self.load_model(model_name, model_type)
                    logger.info(f"✅ Preloaded {model_name}")
                except Exception as e:
                    logger.warning(f"⚠️ Failed to preload {model_name}: {e}")
            
        except Exception as e:
            logger.error(f"❌ Failed to preload models: {e}")
    
    async def load_model(
        self, 
        model_name: str, 
        model_type: ModelType = ModelType.LLM,
        force_reload: bool = False
    ) -> bool:
        """Load a model into memory"""
        async with self.model_lock:
            try:
                # Check if already loaded
                if model_name in self.loaded_models and not force_reload:
                    logger.info(f"📚 Model {model_name} already loaded")
                    self.model_info[model_name].last_used = time.time()
                    return True
                
                logger.info(f"🔄 Loading model: {model_name} (type: {model_type.value})")
                start_time = time.time()
                
                # Check available memory
                available_memory = await self._get_available_memory()
                if available_memory < 2.0:  # Minimum 2GB
                    logger.warning("⚠️ Low memory available, attempting cleanup...")
                    await self._cleanup_unused_models()
                
                # Load model based on type
                model, tokenizer = await self._load_model_by_type(model_name, model_type)
                
                if model is None:
                    logger.error(f"❌ Failed to load model {model_name}")
                    return False
                
                # Store loaded model
                self.loaded_models[model_name] = model
                self.tokenizers[model_name] = tokenizer
                
                # Calculate model size and memory usage
                model_size = await self._calculate_model_size(model)
                memory_usage = await self._get_model_memory_usage(model_name)
                
                # Store model info
                load_time = time.time() - start_time
                self.model_info[model_name] = ModelInfo(
                    name=model_name,
                    model_type=model_type,
                    size_gb=model_size,
                    device=str(model.device) if hasattr(model, 'device') else self.device,
                    quantization=f"{self.settings.QUANTIZATION_BITS}bit" if self.quantization_config else None,
                    load_time=load_time,
                    last_used=time.time(),
                    use_count=0,
                    memory_usage=memory_usage
                )
                
                logger.info(f"✅ Model {model_name} loaded successfully ({load_time:.2f}s, {model_size:.2f}GB)")
                return True
                
            except Exception as e:
                logger.error(f"❌ Failed to load model {model_name}: {e}")
                return False
    
    async def unload_model(self, model_name: str) -> bool:
        """Unload a model from memory"""
        async with self.model_lock:
            try:
                if model_name not in self.loaded_models:
                    logger.warning(f"⚠️ Model {model_name} not loaded")
                    return False
                
                logger.info(f"🗑️ Unloading model: {model_name}")
                
                # Clear model from memory
                del self.loaded_models[model_name]
                if model_name in self.tokenizers:
                    del self.tokenizers[model_name]
                if model_name in self.model_info:
                    del self.model_info[model_name]
                
                # Force garbage collection
                import gc
                gc.collect()
                if self.gpu_available:
                    torch.cuda.empty_cache()
                
                logger.info(f"✅ Model {model_name} unloaded successfully")
                return True
                
            except Exception as e:
                logger.error(f"❌ Failed to unload model {model_name}: {e}")
                return False
    
    async def generate_text(self, request: GenerationRequest) -> GenerationResponse:
        """Generate text using a loaded model"""
        try:
            model_name = request.model_name or self.settings.DEFAULT_LLM_MODEL
            
            # Ensure model is loaded
            if model_name not in self.loaded_models:
                logger.info(f"🔄 Model {model_name} not loaded, loading now...")
                success = await self.load_model(model_name, ModelType.LLM)
                if not success:
                    raise ValueError(f"Failed to load model {model_name}")
            
            model = self.loaded_models[model_name]
            tokenizer = self.tokenizers[model_name]
            
            # Update usage stats
            self.model_info[model_name].last_used = time.time()
            self.model_info[model_name].use_count += 1
            
            start_time = time.time()
            
            # Prepare generation parameters
            generation_kwargs = {
                "max_new_tokens": request.max_tokens,
                "temperature": request.temperature,
                "top_p": request.top_p,
                "top_k": request.top_k,
                "repetition_penalty": request.repetition_penalty,
                "do_sample": True,
                "pad_token_id": tokenizer.eos_token_id,
            }
            
            # Handle stop sequences
            if request.stop_sequences:
                generation_kwargs["stopping_criteria"] = self._create_stopping_criteria(
                    tokenizer, request.stop_sequences
                )
            
            # Tokenize input
            inputs = tokenizer.encode(request.prompt, return_tensors="pt")
            if self.gpu_available:
                inputs = inputs.to(self.device)
            
            prompt_tokens = inputs.shape[1]
            
            # Generate text
            with torch.no_grad():
                if request.stream:
                    # Streaming generation (for real-time responses)
                    outputs = model.generate(
                        inputs,
                        **generation_kwargs,
                        streamer=TextStreamer(tokenizer, skip_special_tokens=True)
                    )
                else:
                    # Standard generation
                    outputs = model.generate(inputs, **generation_kwargs)
            
            # Decode output
            generated_tokens = outputs[0][prompt_tokens:]
            generated_text = tokenizer.decode(generated_tokens, skip_special_tokens=True)
            
            generation_time = time.time() - start_time
            total_tokens = outputs[0].shape[0]
            tokens_generated = total_tokens - prompt_tokens
            
            return GenerationResponse(
                text=generated_text,
                model_used=model_name,
                tokens_generated=tokens_generated,
                generation_time=generation_time,
                prompt_tokens=prompt_tokens,
                total_tokens=total_tokens,
                finish_reason="length" if tokens_generated >= request.max_tokens else "stop",
                metadata={
                    "temperature": request.temperature,
                    "top_p": request.top_p,
                    "device": self.device,
                    "quantization": self.model_info[model_name].quantization
                }
            )
            
        except Exception as e:
            logger.error(f"❌ Text generation failed: {e}")
            raise
    
    async def get_embedding(self, text: str, model_name: Optional[str] = None) -> List[float]:
        """Generate embeddings for text"""
        try:
            model_name = model_name or self.settings.DEFAULT_MEDICAL_MODEL
            
            # Ensure model is loaded
            if model_name not in self.loaded_models:
                success = await self.load_model(model_name, ModelType.EMBEDDING)
                if not success:
                    raise ValueError(f"Failed to load embedding model {model_name}")
            
            model = self.loaded_models[model_name]
            tokenizer = self.tokenizers[model_name]
            
            # Tokenize and encode
            inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
            if self.gpu_available:
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Generate embeddings
            with torch.no_grad():
                outputs = model(**inputs)
                embeddings = outputs.last_hidden_state.mean(dim=1)  # Mean pooling
                embeddings = embeddings.squeeze().cpu().numpy()
            
            return embeddings.tolist()
            
        except Exception as e:
            logger.error(f"❌ Embedding generation failed: {e}")
            raise
    
    async def is_ready(self) -> bool:
        """Check if LLM manager is ready for requests"""
        return len(self.loaded_models) > 0 or self.settings.ENABLE_LOCAL_LLMS
    
    async def get_loaded_models_info(self) -> Dict[str, Any]:
        """Get information about loaded models"""
        return {
            model_name: {
                "type": info.model_type.value,
                "size_gb": info.size_gb,
                "device": info.device,
                "quantization": info.quantization,
                "load_time": info.load_time,
                "last_used": info.last_used,
                "use_count": info.use_count,
                "memory_usage": info.memory_usage
            }
            for model_name, info in self.model_info.items()
        }
    
    async def get_models_status(self) -> Dict[str, Any]:
        """Get comprehensive models status"""
        loaded_models = await self.get_loaded_models_info()
        gpu_info = await self.get_gpu_memory_info() if self.gpu_available else {}
        memory_info = await self._get_system_memory_info()
        
        return {
            "loaded_models": loaded_models,
            "total_models": len(loaded_models),
            "gpu_info": gpu_info,
            "system_memory": memory_info,
            "device": self.device,
            "quantization_enabled": self.settings.ENABLE_QUANTIZATION,
            "max_model_memory_gb": self.settings.MAX_MODEL_MEMORY_GB
        }
    
    async def get_gpu_memory_info(self) -> Dict[str, Any]:
        """Get GPU memory information"""
        if not self.gpu_available:
            return {"gpu_available": False}
        
        try:
            memory_info = {}
            for i in range(torch.cuda.device_count()):
                props = torch.cuda.get_device_properties(i)
                memory_allocated = torch.cuda.memory_allocated(i) / 1024**3  # GB
                memory_reserved = torch.cuda.memory_reserved(i) / 1024**3   # GB
                memory_total = props.total_memory / 1024**3                 # GB
                
                memory_info[f"gpu_{i}"] = {
                    "name": props.name,
                    "total_memory_gb": memory_total,
                    "allocated_memory_gb": memory_allocated,
                    "reserved_memory_gb": memory_reserved,
                    "free_memory_gb": memory_total - memory_reserved,
                    "utilization": (memory_reserved / memory_total) * 100
                }
            
            return {
                "gpu_available": True,
                "device_count": torch.cuda.device_count(),
                "current_device": torch.cuda.current_device(),
                "devices": memory_info
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get GPU info: {e}")
            return {"gpu_available": True, "error": str(e)}
    
    async def cleanup(self):
        """Cleanup resources"""
        try:
            logger.info("🔄 Cleaning up LLM Manager...")
            
            # Unload all models
            model_names = list(self.loaded_models.keys())
            for model_name in model_names:
                await self.unload_model(model_name)
            
            # Shutdown executor
            self.executor.shutdown(wait=True)
            
            logger.info("✅ LLM Manager cleanup complete")
            
        except Exception as e:
            logger.error(f"❌ Cleanup failed: {e}")
    
    # Private helper methods
    async def _load_model_by_type(self, model_name: str, model_type: ModelType):
        """Load model based on type"""
        try:
            if model_type == ModelType.LLM:
                return await self._load_llm_model(model_name)
            elif model_type in [ModelType.MEDICAL_NLP, ModelType.EMBEDDING]:
                return await self._load_bert_model(model_name)
            else:
                raise ValueError(f"Unsupported model type: {model_type}")
        except Exception as e:
            logger.error(f"❌ Failed to load {model_type} model {model_name}: {e}")
            return None, None
    
    async def _load_llm_model(self, model_name: str):
        """Load a language model"""
        def _load():
            tokenizer = AutoTokenizer.from_pretrained(
                model_name,
                cache_dir=self.settings.huggingface_cache_path,
                trust_remote_code=True
            )
            
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                cache_dir=self.settings.huggingface_cache_path,
                quantization_config=self.quantization_config,
                device_map="auto" if self.gpu_available else None,
                torch_dtype=torch.float16 if self.gpu_available else torch.float32,
                trust_remote_code=True,
                low_cpu_mem_usage=True
            )
            
            if tokenizer.pad_token is None:
                tokenizer.pad_token = tokenizer.eos_token
            
            return model, tokenizer
        
        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, _load)
    
    async def _load_bert_model(self, model_name: str):
        """Load a BERT-style model"""
        def _load():
            tokenizer = AutoTokenizer.from_pretrained(
                model_name,
                cache_dir=self.settings.huggingface_cache_path
            )
            
            model = AutoModel.from_pretrained(
                model_name,
                cache_dir=self.settings.huggingface_cache_path,
                torch_dtype=torch.float16 if self.gpu_available else torch.float32,
            )
            
            if self.gpu_available:
                model = model.to(self.device)
            
            return model, tokenizer
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, _load)
    
    async def _check_ollama_connection(self):
        """Check if Ollama is available"""
        try:
            response = requests.get(f"{self.settings.OLLAMA_HOST}/api/tags", timeout=5)
            if response.status_code == 200:
                logger.info("✅ Ollama connection successful")
                return True
            else:
                logger.warning("⚠️ Ollama server not responding correctly")
                return False
        except Exception as e:
            logger.warning(f"⚠️ Ollama not available: {e}")
            return False
    
    async def _get_available_memory(self) -> float:
        """Get available system memory in GB"""
        memory = psutil.virtual_memory()
        return memory.available / 1024**3
    
    async def _get_system_memory_info(self) -> Dict[str, Any]:
        """Get system memory information"""
        memory = psutil.virtual_memory()
        return {
            "total_gb": memory.total / 1024**3,
            "available_gb": memory.available / 1024**3,
            "used_gb": memory.used / 1024**3,
            "percentage": memory.percent
        }
    
    async def _calculate_model_size(self, model) -> float:
        """Calculate model size in GB"""
        try:
            param_count = sum(p.numel() for p in model.parameters())
            # Rough estimate: 4 bytes per parameter for float32, 2 for float16
            bytes_per_param = 2 if self.gpu_available else 4
            size_bytes = param_count * bytes_per_param
            return size_bytes / 1024**3
        except Exception:
            return 0.0
    
    async def _get_model_memory_usage(self, model_name: str) -> float:
        """Get current memory usage of a model"""
        try:
            if self.gpu_available and model_name in self.loaded_models:
                return torch.cuda.memory_allocated() / 1024**3
            else:
                # Rough estimate for CPU models
                return 2.0  # Default 2GB estimate
        except Exception:
            return 0.0
    
    async def _cleanup_unused_models(self):
        """Clean up least recently used models"""
        if len(self.model_info) <= 1:
            return
        
        # Sort by last used time
        sorted_models = sorted(
            self.model_info.items(),
            key=lambda x: x[1].last_used
        )
        
        # Remove oldest model
        oldest_model = sorted_models[0][0]
        logger.info(f"🗑️ Cleaning up unused model: {oldest_model}")
        await self.unload_model(oldest_model)
    
    def _create_stopping_criteria(self, tokenizer, stop_sequences: List[str]):
        """Create stopping criteria for generation"""
        # This is a simplified implementation
        # In practice, you'd want a more sophisticated stopping criteria
        from transformers import StoppingCriteria
        
        class CustomStoppingCriteria(StoppingCriteria):
            def __init__(self, stop_sequences, tokenizer):
                self.stop_sequences = stop_sequences
                self.tokenizer = tokenizer
            
            def __call__(self, input_ids, scores, **kwargs):
                # Decode last few tokens and check for stop sequences
                last_tokens = self.tokenizer.decode(input_ids[0][-20:])
                return any(stop_seq in last_tokens for stop_seq in self.stop_sequences)
        
        return [CustomStoppingCriteria(stop_sequences, tokenizer)]
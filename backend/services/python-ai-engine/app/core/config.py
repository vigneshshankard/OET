"""
Configuration Management for OET Python AI Engine
"""

import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field, validator
import torch

class Settings(BaseSettings):
    """Application settings"""
    
    # Basic Configuration
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8080, env="PORT")
    RELOAD: bool = Field(default=True, env="RELOAD")
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Security
    SECRET_KEY: str = Field(default="dev-secret-key", env="SECRET_KEY")
    REQUIRE_AUTH: bool = Field(default=False, env="REQUIRE_AUTH")
    API_KEY_HEADER: str = Field(default="X-API-Key", env="API_KEY_HEADER")
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"], 
        env="ALLOWED_ORIGINS"
    )
    
    # Model Configuration
    MODEL_CACHE_DIR: str = Field(default="./models", env="MODEL_CACHE_DIR")
    MAX_MODEL_MEMORY_GB: float = Field(default=8.0, env="MAX_MODEL_MEMORY_GB")
    PRELOAD_MODELS: bool = Field(default=False, env="PRELOAD_MODELS")
    DEFAULT_LLM_MODEL: str = Field(default="microsoft/DialoGPT-medium", env="DEFAULT_LLM_MODEL")
    DEFAULT_MEDICAL_MODEL: str = Field(default="emilyalsentzer/Bio_ClinicalBERT", env="DEFAULT_MEDICAL_MODEL")
    
    # GPU Configuration
    FORCE_CPU: bool = Field(default=False, env="FORCE_CPU")
    GPU_MEMORY_FRACTION: float = Field(default=0.8, env="GPU_MEMORY_FRACTION")
    ENABLE_QUANTIZATION: bool = Field(default=True, env="ENABLE_QUANTIZATION")
    QUANTIZATION_BITS: int = Field(default=8, env="QUANTIZATION_BITS")
    
    # Performance Settings
    MAX_CONCURRENT_REQUESTS: int = Field(default=10, env="MAX_CONCURRENT_REQUESTS")
    REQUEST_TIMEOUT_SECONDS: int = Field(default=300, env="REQUEST_TIMEOUT_SECONDS")
    MODEL_LOAD_TIMEOUT_SECONDS: int = Field(default=600, env="MODEL_LOAD_TIMEOUT_SECONDS")
    BATCH_SIZE: int = Field(default=1, env="BATCH_SIZE")
    
    # Local LLM Configuration
    ENABLE_LOCAL_LLMS: bool = Field(default=True, env="ENABLE_LOCAL_LLMS")
    OLLAMA_HOST: str = Field(default="http://localhost:11434", env="OLLAMA_HOST")
    HUGGINGFACE_CACHE_DIR: str = Field(default="./cache/huggingface", env="HUGGINGFACE_CACHE_DIR")
    TRANSFORMERS_OFFLINE: bool = Field(default=False, env="TRANSFORMERS_OFFLINE")
    
    # Medical AI Configuration
    ENABLE_MEDICAL_VALIDATION: bool = Field(default=True, env="ENABLE_MEDICAL_VALIDATION")
    UMLS_API_KEY: Optional[str] = Field(default=None, env="UMLS_API_KEY")
    SNOMED_CT_PATH: Optional[str] = Field(default=None, env="SNOMED_CT_PATH")
    ICD10_PATH: Optional[str] = Field(default=None, env="ICD10_PATH")
    
    # OET Evaluation Configuration
    OET_SCORING_MODEL: str = Field(default="custom", env="OET_SCORING_MODEL")
    ENABLE_ADVANCED_ANALYTICS: bool = Field(default=True, env="ENABLE_ADVANCED_ANALYTICS")
    LINGUISTIC_ANALYSIS_MODEL: str = Field(default="en_core_web_sm", env="LINGUISTIC_ANALYSIS_MODEL")
    
    # Safety Configuration
    ENABLE_CONTENT_FILTERING: bool = Field(default=True, env="ENABLE_CONTENT_FILTERING")
    ENABLE_BIAS_DETECTION: bool = Field(default=True, env="ENABLE_BIAS_DETECTION")
    ENABLE_HALLUCINATION_DETECTION: bool = Field(default=True, env="ENABLE_HALLUCINATION_DETECTION")
    SAFETY_THRESHOLD: float = Field(default=0.8, env="SAFETY_THRESHOLD")
    
    # Database Configuration (if needed for caching/analytics)
    REDIS_HOST: str = Field(default="localhost", env="REDIS_HOST")
    REDIS_PORT: int = Field(default=6379, env="REDIS_PORT")
    REDIS_PASSWORD: Optional[str] = Field(default=None, env="REDIS_PASSWORD")
    REDIS_DB: int = Field(default=0, env="REDIS_DB")
    
    # Monitoring Configuration
    ENABLE_METRICS: bool = Field(default=True, env="ENABLE_METRICS")
    METRICS_PORT: int = Field(default=9090, env="METRICS_PORT")
    HEALTH_CHECK_INTERVAL: int = Field(default=30, env="HEALTH_CHECK_INTERVAL")
    
    # Integration Configuration
    NODE_AI_SERVICE_URL: str = Field(default="http://localhost:3001", env="NODE_AI_SERVICE_URL")
    GATEWAY_URL: str = Field(default="http://localhost:8000", env="GATEWAY_URL")
    
    @validator("QUANTIZATION_BITS")
    def validate_quantization_bits(cls, v):
        if v not in [4, 8, 16]:
            raise ValueError("Quantization bits must be 4, 8, or 16")
        return v
    
    @validator("GPU_MEMORY_FRACTION")
    def validate_gpu_memory_fraction(cls, v):
        if not 0.1 <= v <= 1.0:
            raise ValueError("GPU memory fraction must be between 0.1 and 1.0")
        return v
    
    @validator("SAFETY_THRESHOLD")
    def validate_safety_threshold(cls, v):
        if not 0.0 <= v <= 1.0:
            raise ValueError("Safety threshold must be between 0.0 and 1.0")
        return v
    
    @property
    def gpu_available(self) -> bool:
        """Check if GPU is available and not forced to CPU"""
        return torch.cuda.is_available() and not self.FORCE_CPU
    
    @property
    def device(self) -> str:
        """Get the device to use for model inference"""
        if self.gpu_available:
            return "cuda"
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            return "mps"  # Apple Metal Performance Shaders
        else:
            return "cpu"
    
    @property
    def model_cache_path(self) -> str:
        """Get absolute path for model cache"""
        return os.path.abspath(self.MODEL_CACHE_DIR)
    
    @property
    def huggingface_cache_path(self) -> str:
        """Get absolute path for Hugging Face cache"""
        return os.path.abspath(self.HUGGINGFACE_CACHE_DIR)
    
    def get_model_config(self) -> dict:
        """Get model configuration dictionary"""
        return {
            "device": self.device,
            "gpu_memory_fraction": self.GPU_MEMORY_FRACTION,
            "enable_quantization": self.ENABLE_QUANTIZATION,
            "quantization_bits": self.QUANTIZATION_BITS,
            "max_model_memory_gb": self.MAX_MODEL_MEMORY_GB,
            "batch_size": self.BATCH_SIZE,
            "cache_dir": self.model_cache_path
        }
    
    def get_safety_config(self) -> dict:
        """Get safety configuration dictionary"""
        return {
            "enable_content_filtering": self.ENABLE_CONTENT_FILTERING,
            "enable_bias_detection": self.ENABLE_BIAS_DETECTION,
            "enable_hallucination_detection": self.ENABLE_HALLUCINATION_DETECTION,
            "safety_threshold": self.SAFETY_THRESHOLD,
            "enable_medical_validation": self.ENABLE_MEDICAL_VALIDATION
        }
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

# Global settings instance
_settings: Optional[Settings] = None

def get_settings() -> Settings:
    """Get application settings (singleton pattern)"""
    global _settings
    if _settings is None:
        _settings = Settings()
        
        # Ensure cache directories exist
        os.makedirs(_settings.model_cache_path, exist_ok=True)
        os.makedirs(_settings.huggingface_cache_path, exist_ok=True)
        
        # Set environment variables for model caching
        os.environ["TRANSFORMERS_CACHE"] = _settings.huggingface_cache_path
        os.environ["HF_HOME"] = _settings.huggingface_cache_path
        
    return _settings

def update_settings(**kwargs) -> Settings:
    """Update settings (useful for testing)"""
    global _settings
    if _settings is None:
        _settings = Settings(**kwargs)
    else:
        for key, value in kwargs.items():
            if hasattr(_settings, key):
                setattr(_settings, key, value)
    return _settings
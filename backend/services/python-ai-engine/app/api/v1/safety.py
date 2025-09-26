"""
AI Safety and Guardrails API Endpoints
Content filtering, bias detection, and medical validation
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging
import re

from app.core.dependencies import get_llm_manager
from app.models.llm_manager import LLMManager
from app.utils.performance import measure_performance

router = APIRouter()
logger = logging.getLogger(__name__)

class ContentValidationRequest(BaseModel):
    content: str = Field(..., description="Content to validate")
    content_type: str = Field("medical_conversation", description="Type of content")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")

class ContentValidationResponse(BaseModel):
    is_safe: bool = Field(..., description="Whether content is safe")
    risk_level: str = Field(..., description="Risk level: low, medium, high, critical")
    issues: List[str] = Field(..., description="Identified safety issues")
    suggestions: List[str] = Field(..., description="Improvement suggestions")
    filtered_content: Optional[str] = Field(None, description="Filtered/sanitized content")
    confidence: float = Field(..., description="Confidence in safety assessment")

class BiasDetectionRequest(BaseModel):
    text: str = Field(..., description="Text to analyze for bias")
    categories: List[str] = Field(["gender", "race", "age", "culture"], description="Bias categories to check")

class BiasDetectionResponse(BaseModel):
    overall_bias_score: float = Field(..., description="Overall bias score (0-1)")
    category_scores: Dict[str, float] = Field(..., description="Bias scores by category")
    detected_biases: List[Dict[str, Any]] = Field(..., description="Specific biases detected")
    recommendations: List[str] = Field(..., description="Bias mitigation recommendations")

@router.post("/validate-content", response_model=ContentValidationResponse)
async def validate_content(
    request: ContentValidationRequest,
    llm_manager: LLMManager = Depends(get_llm_manager)
):
    """Validate content for safety and appropriateness"""
    try:
        with measure_performance("content_validation") as perf:
            content = request.content.lower()
            issues = []
            suggestions = []
            risk_level = "low"
            
            # Check for inappropriate content
            inappropriate_terms = [
                "offensive", "discriminatory", "harmful", "inappropriate",
                "dangerous", "misleading", "false medical advice"
            ]
            
            # Medical safety checks
            medical_red_flags = [
                "self-medicate", "stop taking medication", "ignore symptoms",
                "avoid medical care", "dangerous advice"
            ]
            
            # Privacy checks  
            privacy_patterns = [
                r'\b\d{3}-\d{2}-\d{4}\b',  # SSN pattern
                r'\b\d{3}-\d{3}-\d{4}\b',  # Phone pattern
                r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'  # Email pattern
            ]
            
            # Check for issues
            for term in inappropriate_terms:
                if term in content:
                    issues.append(f"Potentially inappropriate content: {term}")
                    risk_level = "medium"
            
            for term in medical_red_flags:
                if term in content:
                    issues.append(f"Medical safety concern: {term}")
                    risk_level = "high"
                    suggestions.append("Ensure medical advice is appropriate and safe")
            
            for pattern in privacy_patterns:
                if re.search(pattern, request.content):
                    issues.append("Potential privacy information detected")
                    risk_level = "high"
                    suggestions.append("Remove or mask personal information")
            
            # Generate filtered content if issues found
            filtered_content = None
            if issues:
                filtered_content = request.content
                for pattern in privacy_patterns:
                    filtered_content = re.sub(pattern, "[REDACTED]", filtered_content)
            
            is_safe = risk_level in ["low", "medium"]
            confidence = 0.8 if issues else 0.95
            
            return ContentValidationResponse(
                is_safe=is_safe,
                risk_level=risk_level,
                issues=issues,
                suggestions=suggestions or ["Content appears appropriate"],
                filtered_content=filtered_content,
                confidence=confidence
            )
    
    except Exception as e:
        logger.error(f"Content validation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

@router.post("/detect-bias", response_model=BiasDetectionResponse)
async def detect_bias(
    request: BiasDetectionRequest,
    llm_manager: LLMManager = Depends(get_llm_manager)
):
    """Detect potential biases in text"""
    try:
        with measure_performance("bias_detection") as perf:
            # Simplified bias detection implementation
            # In production, this would use sophisticated ML models
            
            text_lower = request.text.lower()
            detected_biases = []
            category_scores = {}
            recommendations = []
            
            # Gender bias patterns
            gender_biased_terms = ["he should", "she must", "men are", "women are"]
            gender_score = sum(1 for term in gender_biased_terms if term in text_lower) / 10
            category_scores["gender"] = min(1.0, gender_score)
            
            # Age bias patterns
            age_biased_terms = ["too old", "too young", "elderly", "kids these days"]
            age_score = sum(1 for term in age_biased_terms if term in text_lower) / 10
            category_scores["age"] = min(1.0, age_score)
            
            # Cultural bias patterns
            cultural_biased_terms = ["those people", "their kind", "not from here"]
            cultural_score = sum(1 for term in cultural_biased_terms if term in text_lower) / 10
            category_scores["culture"] = min(1.0, cultural_score)
            
            # Race bias (simplified detection)
            race_score = 0.0  # Would implement sophisticated detection in production
            category_scores["race"] = race_score
            
            # Calculate overall bias score
            overall_bias_score = sum(category_scores.values()) / len(category_scores)
            
            # Generate recommendations
            if overall_bias_score > 0.3:
                recommendations.append("Consider using more inclusive language")
            if category_scores.get("gender", 0) > 0.2:
                recommendations.append("Avoid gender-specific assumptions")
            if category_scores.get("age", 0) > 0.2:
                recommendations.append("Use age-neutral language when appropriate")
            if category_scores.get("culture", 0) > 0.2:
                recommendations.append("Ensure cultural sensitivity in language use")
            
            if not recommendations:
                recommendations.append("Text appears to be bias-free")
            
            return BiasDetectionResponse(
                overall_bias_score=overall_bias_score,
                category_scores=category_scores,
                detected_biases=detected_biases,
                recommendations=recommendations
            )
    
    except Exception as e:
        logger.error(f"Bias detection failed: {e}")
        raise HTTPException(status_code=500, detail=f"Bias detection failed: {str(e)}")

@router.post("/medical-validation")
async def validate_medical_content(
    content: str,
    llm_manager: LLMManager = Depends(get_llm_manager)
):
    """Validate medical content for accuracy and safety"""
    try:
        with measure_performance("medical_validation") as perf:
            # Simplified medical validation
            # In production, this would check against medical knowledge bases
            
            medical_terms = [
                "diagnosis", "treatment", "medication", "symptoms", "procedure",
                "therapy", "prescription", "dosage", "contraindication"
            ]
            
            content_lower = content.lower()
            found_terms = [term for term in medical_terms if term in content_lower]
            
            # Check for dangerous advice patterns
            dangerous_patterns = [
                "stop medication without", "ignore severe symptoms", 
                "avoid emergency care", "self-treat serious"
            ]
            
            safety_issues = []
            for pattern in dangerous_patterns:
                if pattern in content_lower:
                    safety_issues.append(f"Potentially dangerous advice: {pattern}")
            
            accuracy_score = len(found_terms) / max(1, len(medical_terms)) * 0.8
            safety_score = 1.0 - (len(safety_issues) * 0.3)
            
            return {
                "is_medically_valid": len(safety_issues) == 0,
                "accuracy_score": accuracy_score,
                "safety_score": max(0, safety_score),
                "medical_terms_found": found_terms,
                "safety_issues": safety_issues,
                "recommendations": [
                    "Verify medical information with authoritative sources",
                    "Ensure advice follows current clinical guidelines",
                    "Consider patient safety in all recommendations"
                ] if safety_issues else ["Medical content appears appropriate"]
            }
    
    except Exception as e:
        logger.error(f"Medical validation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Medical validation failed: {str(e)}")

@router.get("/safety-guidelines")
async def get_safety_guidelines():
    """Get AI safety guidelines and best practices"""
    return {
        "content_guidelines": {
            "medical_advice": {
                "allowed": [
                    "General health information",
                    "Educational content about medical conditions",
                    "Encouragement to seek professional medical care"
                ],
                "prohibited": [
                    "Specific medical diagnoses",
                    "Prescription recommendations",
                    "Advice to avoid medical care",
                    "Unverified medical claims"
                ]
            },
            "privacy": {
                "requirements": [
                    "No personal identifying information",
                    "No specific patient details",
                    "Anonymized examples only"
                ]
            },
            "bias_prevention": {
                "guidelines": [
                    "Use inclusive language",
                    "Avoid assumptions based on demographics",
                    "Respect cultural differences",
                    "Ensure equal treatment representation"
                ]
            }
        },
        "risk_levels": {
            "low": "Content is appropriate and safe",
            "medium": "Content has minor issues that should be reviewed",
            "high": "Content has significant issues requiring modification",
            "critical": "Content must not be used due to safety concerns"
        }
    }
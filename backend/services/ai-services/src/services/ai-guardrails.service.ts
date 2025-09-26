/**
 * AI Guardrails Service
 * 
 * Implements comprehensive safety measures and validation for AI responses
 * Based on ai-components.md specification Section 5
 */

import { logger, AppError } from '../utils/logger';

export interface PatientPersona {
  name: string;
  age: number;
  gender: string;
  occupation: string;
  culture: string;
  primaryCondition: string;
  medicalHistory: string[];
  currentSymptoms: string[];
  currentMedications: string[];
  previousTreatments: string[];
  knownAllergies: string[];
  emotionalState: string;
  anxietyLevel: string;
  communicationStyle: string;
  healthLiteracyLevel: string;
  healthcareExperiences: string[];
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  sanitizedResponse: string;
  suggestions: string[];
  confidence: number;
}

export class AIGuardrailsService {
  private prohibitedPatientBehaviors = [
    'providing medical advice',
    'diagnosing conditions',
    'recommending treatments',
    'sharing personal data',
    'inappropriate personal details',
    'offensive language',
    'discriminatory content'
  ];

  private requiredPatientBehaviors = [
    'persona consistency',
    'appropriate emotions',
    'realistic symptoms',
    'natural conversation',
    'healthcare appropriateness'
  ];

  private medicalTermsWhitelist = [
    'symptoms', 'pain', 'medication', 'treatment', 'doctor', 'nurse',
    'hospital', 'clinic', 'appointment', 'prescription', 'therapy',
    'diagnosis', 'condition', 'surgery', 'recovery', 'follow-up'
  ];

  /**
   * Validate AI patient response against persona consistency
   */
  async validatePatientResponse(
    response: string,
    persona: PatientPersona,
    conversationHistory: string[]
  ): Promise<ValidationResult> {
    const issues: string[] = [];
    let severity: ValidationResult['severity'] = 'low';

    try {
      // Check response length (10-100 words as per spec)
      const wordCount = response.trim().split(/\s+/).length;
      if (wordCount < 10) {
        issues.push('Response too short (minimum 10 words)');
        severity = 'medium';
      } else if (wordCount > 100) {
        issues.push('Response too long (maximum 100 words)');
        severity = 'medium';
      }

      // Check for prohibited behaviors
      const prohibitedCheck = this.checkProhibitedBehaviors(response);
      if (prohibitedCheck.length > 0) {
        issues.push(...prohibitedCheck);
        severity = 'critical';
      }

      // Validate persona consistency
      const personaCheck = this.validatePersonaConsistency(response, persona, conversationHistory);
      if (personaCheck.length > 0) {
        issues.push(...personaCheck);
        if (severity !== 'critical') severity = 'high';
      }

      // Check medical information consistency
      const medicalCheck = this.validateMedicalConsistency(response, persona);
      if (medicalCheck.length > 0) {
        issues.push(...medicalCheck);
        if (severity === 'low') severity = 'medium';
      }

      // Validate emotional tone appropriateness
      const emotionalCheck = this.validateEmotionalTone(response, persona);
      if (emotionalCheck.length > 0) {
        issues.push(...emotionalCheck);
        if (severity === 'low') severity = 'medium';
      }

      // Check for healthcare appropriateness
      const healthcareCheck = this.validateHealthcareAppropriateness(response);
      if (healthcareCheck.length > 0) {
        issues.push(...healthcareCheck);
        if (severity !== 'critical' && severity !== 'high') severity = 'medium';
      }

      const isValid = issues.length === 0;
      const sanitizedResponse = isValid ? response : this.sanitizePatientResponse(response, persona);

      logger.info('Patient response validation completed', {
        isValid,
        issueCount: issues.length,
        severity,
        wordCount
      });

      return {
        isValid,
        issues,
        severity,
        sanitizedResponse,
        suggestions: [],
        confidence: isValid ? 0.9 : 0.6
      };

    } catch (error) {
      logger.error('Error in patient response validation', { error });
      throw new AppError('Patient response validation failed', 500, 'VALIDATION_ERROR');
    }
  }

  /**
   * Validate AI feedback response format and content
   */
  async validateFeedbackResponse(
    feedback: any,
    transcript: string
  ): Promise<ValidationResult> {
    const issues: string[] = [];
    let severity: ValidationResult['severity'] = 'low';

    try {
      // Validate JSON format compliance
      if (typeof feedback !== 'object' || feedback === null) {
        issues.push('Feedback must be a valid JSON object');
        return { 
          isValid: false, 
          issues, 
          severity: 'critical',
          sanitizedResponse: '',
          suggestions: [],
          confidence: 0.1
        };
      }

      // Check required fields
      const requiredFields = [
        'overall_score', 'detailed_scores', 'strengths', 'improvements', 'transcript_analysis'
      ];
      
      for (const field of requiredFields) {
        if (!(field in feedback)) {
          issues.push(`Missing required field: ${field}`);
          severity = 'critical';
        }
      }

      // Validate score ranges (0-100)
      if (typeof feedback.overall_score === 'number') {
        if (feedback.overall_score < 0 || feedback.overall_score > 100) {
          issues.push('Overall score must be between 0-100');
          severity = 'high';
        }
      }

      if (feedback.detailed_scores && typeof feedback.detailed_scores === 'object') {
        const scoreFields = ['pronunciation', 'grammar', 'vocabulary', 'clinical_communication', 'empathy', 'patient_education'];
        for (const field of scoreFields) {
          const score = feedback.detailed_scores[field];
          if (typeof score === 'number' && (score < 0 || score > 100)) {
            issues.push(`${field} score must be between 0-100`);
            severity = 'high';
          }
        }
      }

      // Validate examples are quoted from transcript
      if (feedback.strengths && Array.isArray(feedback.strengths)) {
        for (const strength of feedback.strengths) {
          if (strength.examples && Array.isArray(strength.examples)) {
            for (const example of strength.examples) {
              if (typeof example === 'string' && !transcript.toLowerCase().includes(example.toLowerCase())) {
                issues.push(`Strength example not found in transcript: "${example}"`);
                if (severity === 'low') severity = 'medium';
              }
            }
          }
        }
      }

      // Check constructive tone
      const toneCheck = this.validateConstructiveTone(feedback);
      if (toneCheck.length > 0) {
        issues.push(...toneCheck);
        if (severity === 'low') severity = 'medium';
      }

      const isValid = issues.length === 0;

      logger.info('Feedback validation completed', {
        isValid,
        issueCount: issues.length,
        severity
      });

      return {
        isValid,
        issues,
        severity,
        sanitizedResponse: isValid ? JSON.stringify(feedback) : '',
        suggestions: [],
        confidence: isValid ? 0.9 : 0.6
      };

    } catch (error) {
      logger.error('Error in feedback validation', { error });
      throw new AppError('Feedback validation failed', 500, 'VALIDATION_ERROR');
    }
  }

  /**
   * Sanitize AI response and ensure safety
   */
  sanitizeResponse(response: string, responseType: 'patient' | 'feedback'): string {
    try {
      let sanitized = response;

      // Remove any system prompts that may have leaked
      sanitized = this.removeSystemPrompts(sanitized);

      // Filter inappropriate content
      sanitized = this.filterInappropriateContent(sanitized);

      // Ensure professional healthcare tone
      if (responseType === 'patient') {
        sanitized = this.ensurePatientTone(sanitized);
      } else {
        sanitized = this.ensureProfessionalTone(sanitized);
      }

      // Truncate if exceeding limits
      sanitized = this.truncateToLimits(sanitized, responseType);

      // Validate medical terminology usage
      sanitized = this.validateMedicalTerminology(sanitized);

      logger.info('Response sanitization completed', {
        responseType,
        originalLength: response.length,
        sanitizedLength: sanitized.length
      });

      return sanitized;

    } catch (error) {
      logger.error('Error in response sanitization', { error });
      return response; // Return original if sanitization fails
    }
  }

  // Private helper methods

  private checkProhibitedBehaviors(response: string): string[] {
    const issues: string[] = [];
    const lowerResponse = response.toLowerCase();

    // Check for medical advice giving
    const advicePatterns = [
      /you should take/i,
      /i recommend/i,
      /the best treatment/i,
      /you need to/i,
      /take this medication/i
    ];

    for (const pattern of advicePatterns) {
      if (pattern.test(response)) {
        issues.push('Patient should not provide medical advice');
        break;
      }
    }

    // Check for inappropriate content
    const inappropriatePatterns = [
      /personal data/i,
      /social security/i,
      /credit card/i,
      /password/i
    ];

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(response)) {
        issues.push('Contains inappropriate personal information');
        break;
      }
    }

    return issues;
  }

  private validatePersonaConsistency(
    response: string,
    persona: PatientPersona,
    conversationHistory: string[]
  ): string[] {
    const issues: string[] = [];

    // Check age-appropriate language
    if (persona.age < 18 && /adult responsibilities/i.test(response)) {
      issues.push('Response not age-appropriate for minor patient');
    }

    // Check cultural sensitivity
    if (persona.culture && !this.isCulturallySensitive(response, persona.culture)) {
      issues.push('Response may not be culturally appropriate');
    }

    // Check consistency with previous statements
    if (conversationHistory.length > 0) {
      const inconsistencies = this.checkConsistencyWithHistory(response, conversationHistory, persona);
      issues.push(...inconsistencies);
    }

    return issues;
  }

  private validateMedicalConsistency(response: string, persona: PatientPersona): string[] {
    const issues: string[] = [];

    // Check if symptoms mentioned are consistent with condition
    if (persona.primaryCondition) {
      const mentionedSymptoms = this.extractMentionedSymptoms(response);
      for (const symptom of mentionedSymptoms) {
        if (!persona.currentSymptoms.some(s => s.toLowerCase().includes(symptom.toLowerCase()))) {
          issues.push(`Mentioned symptom "${symptom}" not consistent with patient condition`);
        }
      }
    }

    // Check medication consistency
    const mentionedMeds = this.extractMentionedMedications(response);
    for (const med of mentionedMeds) {
      if (!persona.currentMedications.some(m => m.toLowerCase().includes(med.toLowerCase()))) {
        issues.push(`Mentioned medication "${med}" not in patient's current medications`);
      }
    }

    return issues;
  }

  private validateEmotionalTone(response: string, persona: PatientPersona): string[] {
    const issues: string[] = [];

    const responseEmotion = this.detectEmotionalTone(response);
    
    if (persona.anxietyLevel === 'high' && responseEmotion === 'calm') {
      issues.push('Response tone too calm for high anxiety patient');
    }

    if (persona.emotionalState === 'worried' && responseEmotion === 'cheerful') {
      issues.push('Response tone inconsistent with worried emotional state');
    }

    return issues;
  }

  private validateHealthcareAppropriateness(response: string): string[] {
    const issues: string[] = [];

    // Check for appropriate healthcare interaction
    if (!/\b(doctor|nurse|healthcare|medical|treatment|symptoms?)\b/i.test(response) && 
        response.length > 50) {
      issues.push('Response lacks healthcare context relevance');
    }

    // Check for professional boundaries
    if (/personal relationship|friendship|dating/i.test(response)) {
      issues.push('Response crosses professional healthcare boundaries');
    }

    return issues;
  }

  private validateConstructiveTone(feedback: any): string[] {
    const issues: string[] = [];

    // Check strengths for positivity
    if (feedback.strengths && Array.isArray(feedback.strengths)) {
      for (const strength of feedback.strengths) {
        if (strength.observation && typeof strength.observation === 'string') {
          if (/poor|bad|terrible|awful/i.test(strength.observation)) {
            issues.push('Strength observation contains negative language');
          }
        }
      }
    }

    // Check improvements for constructiveness
    if (feedback.improvements && Array.isArray(feedback.improvements)) {
      for (const improvement of feedback.improvements) {
        if (improvement.suggestion && typeof improvement.suggestion === 'string') {
          if (!/try|consider|might|could|would help/i.test(improvement.suggestion)) {
            issues.push('Improvement suggestion not constructively phrased');
          }
        }
      }
    }

    return issues;
  }

  private sanitizePatientResponse(response: string, persona: PatientPersona): string {
    let sanitized = response;

    // Remove any medical advice
    sanitized = sanitized.replace(/you should take|i recommend|the best treatment/gi, 'I wonder about');

    // Ensure persona consistency
    sanitized = sanitized.replace(/I am a doctor|I am a nurse/gi, `I am ${persona.name}`);

    // Maintain appropriate emotional tone
    if (persona.emotionalState === 'worried') {
      sanitized = sanitized.replace(/I'm fine|everything's great/gi, 'I\'m a bit concerned');
    }

    return sanitized;
  }

  private removeSystemPrompts(text: string): string {
    // Remove common system prompt patterns
    const systemPatterns = [
      /System:|Assistant:|Human:|User:/gi,
      /\[SYSTEM\].*?\[\/SYSTEM\]/gi,
      /<<.*?>>/gi
    ];

    let cleaned = text;
    for (const pattern of systemPatterns) {
      cleaned = cleaned.replace(pattern, '');
    }

    return cleaned.trim();
  }

  private filterInappropriateContent(text: string): string {
    // Basic inappropriate content filtering
    const inappropriatePatterns = [
      /\b(damn|hell|shit|fuck)\b/gi,
      /\b(stupid|idiot|moron)\b/gi
    ];

    let filtered = text;
    for (const pattern of inappropriatePatterns) {
      filtered = filtered.replace(pattern, '[inappropriate]');
    }

    return filtered;
  }

  private ensurePatientTone(text: string): string {
    // Ensure patient uses appropriate language
    return text.replace(/I diagnose|My medical opinion/gi, 'I feel like');
  }

  private ensureProfessionalTone(text: string): string {
    // Ensure feedback maintains professional healthcare tone
    return text.replace(/\byou suck\b/gi, 'there is room for improvement');
  }

  private truncateToLimits(text: string, responseType: string): string {
    const maxLength = responseType === 'patient' ? 500 : 2000;
    if (text.length > maxLength) {
      return text.substring(0, maxLength - 3) + '...';
    }
    return text;
  }

  private validateMedicalTerminology(text: string): string {
    // Ensure medical terms are used appropriately
    const medicalTerms = text.match(/\b(diagnosis|prognosis|pathology|etiology)\b/gi);
    
    if (medicalTerms && medicalTerms.length > 0) {
      // Replace with patient-friendly alternatives
      return text.replace(/diagnosis/gi, 'condition')
                .replace(/prognosis/gi, 'outlook')
                .replace(/pathology/gi, 'problem')
                .replace(/etiology/gi, 'cause');
    }

    return text;
  }

  // Additional helper methods for medical content analysis

  private extractMentionedSymptoms(text: string): string[] {
    const symptomPatterns = [
      /pain/gi, /ache/gi, /hurt/gi, /sore/gi, /swelling/gi, /fever/gi,
      /nausea/gi, /dizzy/gi, /tired/gi, /weak/gi, /cough/gi, /headache/gi
    ];

    const symptoms: string[] = [];
    for (const pattern of symptomPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        symptoms.push(...matches.map(m => m.toLowerCase()));
      }
    }

    return [...new Set(symptoms)]; // Remove duplicates
  }

  private extractMentionedMedications(text: string): string[] {
    const medicationPatterns = [
      /pills?/gi, /tablets?/gi, /medication/gi, /medicine/gi, /drug/gi,
      /prescription/gi, /dose/gi, /mg\b/gi, /ml\b/gi
    ];

    const medications: string[] = [];
    for (const pattern of medicationPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        medications.push(...matches.map(m => m.toLowerCase()));
      }
    }

    return [...new Set(medications)];
  }

  private detectEmotionalTone(text: string): string {
    const emotionalPatterns = {
      anxious: /worried|nervous|scared|afraid|anxious|concerned/i,
      calm: /fine|okay|alright|good|peaceful|relaxed/i,
      frustrated: /frustrated|annoyed|irritated|upset/i,
      cheerful: /great|wonderful|excellent|fantastic|happy/i,
      sad: /sad|depressed|down|low|unhappy/i
    };

    for (const [emotion, pattern] of Object.entries(emotionalPatterns)) {
      if (pattern.test(text)) {
        return emotion;
      }
    }

    return 'neutral';
  }

  private isCulturallySensitive(text: string, culture: string): boolean {
    // Basic cultural sensitivity check
    const insensitivePatterns = [
      /all people from/i,
      /your people always/i,
      /typical for your culture/i
    ];

    for (const pattern of insensitivePatterns) {
      if (pattern.test(text)) {
        return false;
      }
    }

    return true;
  }

  private checkConsistencyWithHistory(
    response: string,
    history: string[],
    persona: PatientPersona
  ): string[] {
    const issues: string[] = [];

    // Check for contradictory statements
    const currentAge = this.extractMentionedAge(response);
    if (currentAge && currentAge !== persona.age) {
      issues.push(`Age inconsistency: mentioned ${currentAge}, persona age is ${persona.age}`);
    }

    // Check for contradictory symptoms
    const historySymptoms = history.join(' ');
    const currentSymptoms = this.extractMentionedSymptoms(response);
    
    for (const symptom of currentSymptoms) {
      if (historySymptoms.includes(`no ${symptom}`) && response.includes(symptom)) {
        issues.push(`Symptom contradiction: previously denied ${symptom}`);
      }
    }

    return issues;
  }

  private extractMentionedAge(text: string): number | null {
    const ageMatch = text.match(/I am (\d+)|I'm (\d+)|age (\d+)/i);
    if (ageMatch) {
      return parseInt(ageMatch[1] || ageMatch[2] || ageMatch[3]);
    }
    return null;
  }

  /**
   * Health check for the guardrails service
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic validation functionality
      const testResult = await this.validatePatientResponse(
        'I have some pain in my chest.',
        {
          name: 'Test Patient',
          age: 45,
          gender: 'male',
          occupation: 'teacher',
          culture: 'western',
          primaryCondition: 'chest pain',
          medicalHistory: [],
          currentSymptoms: ['chest pain'],
          currentMedications: [],
          previousTreatments: [],
          knownAllergies: [],
          emotionalState: 'worried',
          anxietyLevel: 'medium',
          communicationStyle: 'direct',
          healthLiteracyLevel: 'medium',
          healthcareExperiences: []
        },
        []
      );

      return testResult !== null;
    } catch (error) {
      logger.error('Guardrails service health check failed', { error });
      return false;
    }
  }
}
/**
 * Advanced Scoring and Analysis Service
 * 
 * Implements comprehensive OET-standard scoring algorithms and rubrics
 * Based on ai-components.md specification Section 3
 */

import { logger, AppError } from '../utils/logger';
import { PatientPersona } from './ai-guardrails.service';

export interface TranscriptAnalysis {
  totalWords: number;
  speakingTimePercentage: number;
  keyPhrasesUsed: string[];
  missedOpportunities: string[];
  averageResponseLength: number;
  questionTypes: {
    openEnded: number;
    closedEnded: number;
    clarifying: number;
  };
  medicalTerminologyUsage: {
    appropriate: string[];
    inappropriate: string[];
    missing: string[];
  };
}

export interface DetailedScores {
  pronunciation: number;
  grammar: number;
  vocabulary: number;
  clinicalCommunication: number;
  empathy: number;
  patientEducation: number;
}

export interface ScoringResult {
  overallScore: number;
  detailedScores: DetailedScores;
  strengths: Array<{
    category: string;
    observation: string;
    examples: string[];
  }>;
  improvements: Array<{
    category: string;
    observation: string;
    suggestion: string;
    example: string;
  }>;
  transcriptAnalysis: TranscriptAnalysis;
}

export class AdvancedScoringService {
  
  // Scoring weights as per OET specification
  private readonly SCORING_WEIGHTS = {
    CLINICAL_COMMUNICATION: 0.20,
    EMPATHY: 0.20,
    LANGUAGE_ACCURACY: 0.15,
    PATIENT_EDUCATION: 0.15,
    PRONUNCIATION: 0.15,
    VOCABULARY: 0.15
  };

  // OET Band Descriptors
  private readonly BAND_DESCRIPTORS = {
    90: 'Exceptional performance with comprehensive systematic approach',
    80: 'Good performance with generally systematic approach and minor gaps',
    70: 'Adequate performance with basic systematic approach',
    60: 'Below adequate with limited systematic approach',
    50: 'Poor performance with significant gaps'
  };

  /**
   * Calculate comprehensive scores based on transcript analysis
   */
  async calculateScores(
    transcript: string,
    patientPersona: PatientPersona,
    sessionDuration: number,
    targetProfession: string
  ): Promise<ScoringResult> {
    try {
      logger.info('Starting comprehensive scoring analysis', {
        transcriptLength: transcript.length,
        sessionDuration,
        targetProfession
      });

      // Analyze transcript structure and content
      const transcriptAnalysis = await this.analyzeTranscript(transcript, patientPersona);

      // Calculate detailed scores for each category
      const detailedScores = await this.calculateDetailedScores(
        transcript,
        transcriptAnalysis,
        patientPersona,
        targetProfession
      );

      // Calculate weighted overall score
      const overallScore = this.calculateOverallScore(detailedScores);

      // Identify strengths and areas for improvement
      const strengths = await this.identifyStrengths(transcript, detailedScores, transcriptAnalysis);
      const improvements = await this.identifyImprovements(transcript, detailedScores, transcriptAnalysis);

      const result: ScoringResult = {
        overallScore,
        detailedScores,
        strengths,
        improvements,
        transcriptAnalysis
      };

      logger.info('Scoring analysis completed', {
        overallScore,
        strengthsCount: strengths.length,
        improvementsCount: improvements.length
      });

      return result;

    } catch (error) {
      logger.error('Error in scoring calculation', { error });
      throw new AppError('Scoring calculation failed', 500, 'SCORING_ERROR');
    }
  }

  /**
   * Analyze transcript for structural and content metrics
   */
  private async analyzeTranscript(
    transcript: string,
    patientPersona: PatientPersona
  ): Promise<TranscriptAnalysis> {
    const lines = transcript.split('\n').filter(line => line.trim());
    const professionalLines = lines.filter(line => 
      line.toLowerCase().startsWith('healthcare professional:') || 
      line.toLowerCase().startsWith('doctor:') ||
      line.toLowerCase().startsWith('nurse:')
    );

    // Calculate word counts
    const totalWords = transcript.split(/\s+/).length;
    const professionalWords = professionalLines.join(' ').split(/\s+/).length;
    const speakingTimePercentage = Math.round((professionalWords / totalWords) * 100);

    // Analyze question types
    const questionTypes = this.analyzeQuestionTypes(professionalLines);

    // Identify key phrases and medical terminology
    const keyPhrasesUsed = this.identifyKeyPhrases(transcript);
    const medicalTerminologyUsage = this.analyzeMedicalTerminology(transcript, patientPersona);

    // Identify missed opportunities
    const missedOpportunities = this.identifyMissedOpportunities(
      transcript,
      patientPersona,
      keyPhrasesUsed
    );

    // Calculate average response length
    const responseLengths = professionalLines.map(line => line.split(/\s+/).length);
    const averageResponseLength = responseLengths.length > 0 
      ? Math.round(responseLengths.reduce((a, b) => a + b, 0) / responseLengths.length)
      : 0;

    return {
      totalWords,
      speakingTimePercentage,
      keyPhrasesUsed,
      missedOpportunities,
      averageResponseLength,
      questionTypes,
      medicalTerminologyUsage
    };
  }

  /**
   * Calculate detailed scores for each assessment category
   */
  private async calculateDetailedScores(
    transcript: string,
    analysis: TranscriptAnalysis,
    patientPersona: PatientPersona,
    targetProfession: string
  ): Promise<DetailedScores> {
    
    const clinicalCommunication = this.scoreClinicalCommunication(transcript, analysis, patientPersona);
    const empathy = this.scoreEmpathy(transcript, patientPersona);
    const grammar = this.scoreGrammar(transcript);
    const vocabulary = this.scoreVocabulary(transcript, analysis);
    const pronunciation = this.scorePronunciation(transcript, analysis);
    const patientEducation = this.scorePatientEducation(transcript, patientPersona);

    return {
      pronunciation,
      grammar,
      vocabulary,
      clinicalCommunication,
      empathy,
      patientEducation
    };
  }

  /**
   * Score Clinical Communication (20% weight)
   */
  private scoreClinicalCommunication(
    transcript: string,
    analysis: TranscriptAnalysis,
    patientPersona: PatientPersona
  ): number {
    let score = 70; // Base adequate score

    // Information gathering effectiveness (+/-15 points)
    const systematicApproach = this.assessSystematicApproach(transcript, patientPersona);
    score += systematicApproach;

    // Professional questioning techniques (+/-10 points)
    const questioningQuality = this.assessQuestioningTechniques(analysis.questionTypes);
    score += questioningQuality;

    // Medical concept explanations (+/-10 points)
    const explanationClarity = this.assessExplanationClarity(transcript);
    score += explanationClarity;

    // Clinical decision communication (+/-5 points)
    const decisionCommunication = this.assessDecisionCommunication(transcript);
    score += decisionCommunication;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score Professional Empathy (20% weight)
   */
  private scoreEmpathy(transcript: string, patientPersona: PatientPersona): number {
    let score = 70; // Base adequate score

    // Emotional acknowledgment (+/-15 points)
    const emotionalAwareness = this.assessEmotionalAwareness(transcript, patientPersona);
    score += emotionalAwareness;

    // Appropriate tone and manner (+/-10 points)
    const toneAppropriateness = this.assessToneAppropriateness(transcript);
    score += toneAppropriateness;

    // Patient comfort and reassurance (+/-10 points)
    const reassuranceProvided = this.assessReassurance(transcript);
    score += reassuranceProvided;

    // Cultural sensitivity (+/-5 points)
    const culturalSensitivity = this.assessCulturalSensitivity(transcript, patientPersona.culture);
    score += culturalSensitivity;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score Grammar and Language Accuracy (15% weight)
   */
  private scoreGrammar(transcript: string): number {
    let score = 70; // Base adequate score

    // Grammar complexity and accuracy
    const grammarErrors = this.countGrammarErrors(transcript);
    const complexityBonus = this.assessGrammarComplexity(transcript);
    
    // Deduct points for errors (max -20)
    score -= Math.min(20, grammarErrors * 2);
    
    // Add points for complexity (max +15)
    score += Math.min(15, complexityBonus);

    // Professional register consistency (+/-5 points)
    const registerConsistency = this.assessProfessionalRegister(transcript);
    score += registerConsistency;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score Vocabulary Usage (15% weight)
   */
  private scoreVocabulary(transcript: string, analysis: TranscriptAnalysis): number {
    let score = 70; // Base adequate score

    // Medical terminology appropriateness (+/-10 points)
    const medicalTermScore = this.scoreMedicalTerminology(analysis.medicalTerminologyUsage);
    score += medicalTermScore;

    // Vocabulary range and sophistication (+/-10 points)
    const vocabularyRange = this.assessVocabularyRange(transcript);
    score += vocabularyRange;

    // Context-appropriate word choice (+/-10 points)
    const contextAppropriateness = this.assessContextualVocabulary(transcript);
    score += contextAppropriateness;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score Pronunciation and Fluency (15% weight)
   */
  private scorePronunciation(transcript: string, analysis: TranscriptAnalysis): number {
    // Note: This is estimated based on text analysis
    // In a real implementation, this would require audio analysis
    
    let score = 75; // Base score assuming clear communication

    // Estimate based on response flow and structure
    const fluencyIndicators = this.assessFluencyIndicators(transcript);
    score += fluencyIndicators;

    // Confidence indicators from text
    const confidenceIndicators = this.assessConfidenceIndicators(transcript);
    score += confidenceIndicators;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score Patient Education (15% weight)
   */
  private scorePatientEducation(transcript: string, patientPersona: PatientPersona): number {
    let score = 70; // Base adequate score

    // Clear instruction delivery (+/-10 points)
    const instructionClarity = this.assessInstructionClarity(transcript);
    score += instructionClarity;

    // Understanding verification (+/-10 points)
    const understandingCheck = this.assessUnderstandingVerification(transcript);
    score += understandingCheck;

    // Health literacy considerations (+/-10 points)
    const literacyAdaptation = this.assessHealthLiteracyAdaptation(transcript, patientPersona);
    score += literacyAdaptation;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate weighted overall score
   */
  private calculateOverallScore(scores: DetailedScores): number {
    const weightedScore = 
      (scores.clinicalCommunication * this.SCORING_WEIGHTS.CLINICAL_COMMUNICATION) +
      (scores.empathy * this.SCORING_WEIGHTS.EMPATHY) +
      (scores.grammar * this.SCORING_WEIGHTS.LANGUAGE_ACCURACY) +
      (scores.patientEducation * this.SCORING_WEIGHTS.PATIENT_EDUCATION) +
      (scores.pronunciation * this.SCORING_WEIGHTS.PRONUNCIATION) +
      (scores.vocabulary * this.SCORING_WEIGHTS.VOCABULARY);

    return Math.round(weightedScore);
  }

  // Helper methods for detailed analysis

  private analyzeQuestionTypes(professionalLines: string[]) {
    let openEnded = 0;
    let closedEnded = 0;
    let clarifying = 0;

    for (const line of professionalLines) {
      const question = line.toLowerCase();
      
      if (question.includes('?')) {
        if (question.includes('how') || question.includes('what') || question.includes('why') || question.includes('describe') || question.includes('tell me')) {
          openEnded++;
        } else if (question.includes('can you') || question.includes('could you') || question.includes('clarify')) {
          clarifying++;
        } else {
          closedEnded++;
        }
      }
    }

    return { openEnded, closedEnded, clarifying };
  }

  private identifyKeyPhrases(transcript: string): string[] {
    const keyPhrases = [
      'blood pressure', 'medication adherence', 'pain level', 'symptoms', 'follow-up',
      'treatment plan', 'side effects', 'lifestyle changes', 'prevention', 'health education',
      'patient safety', 'quality of life', 'support system', 'emergency contact'
    ];

    return keyPhrases.filter(phrase => 
      transcript.toLowerCase().includes(phrase.toLowerCase())
    );
  }

  private analyzeMedicalTerminology(transcript: string, patientPersona: PatientPersona) {
    const appropriate: string[] = [];
    const inappropriate: string[] = [];
    const missing: string[] = [];

    // Define appropriate medical terms for the condition
    const conditionTerms = this.getConditionSpecificTerms(patientPersona.primaryCondition);
    const generalMedicalTerms = [
      'symptoms', 'treatment', 'medication', 'diagnosis', 'prognosis',
      'therapy', 'prevention', 'management', 'consultation', 'examination'
    ];

    const allExpectedTerms = [...conditionTerms, ...generalMedicalTerms];
    const transcriptLower = transcript.toLowerCase();

    // Check which terms are used appropriately
    for (const term of allExpectedTerms) {
      if (transcriptLower.includes(term.toLowerCase())) {
        appropriate.push(term);
      } else {
        missing.push(term);
      }
    }

    // Check for overly complex terminology that might confuse patients
    const complexTerms = ['pathophysiology', 'etiology', 'contraindications', 'pharmacokinetics'];
    for (const term of complexTerms) {
      if (transcriptLower.includes(term.toLowerCase())) {
        inappropriate.push(term);
      }
    }

    return { appropriate, inappropriate, missing: missing.slice(0, 3) }; // Limit missing to 3
  }

  private identifyMissedOpportunities(
    transcript: string,
    patientPersona: PatientPersona,
    keyPhrasesUsed: string[]
  ): string[] {
    const opportunities: string[] = [];

    // Check for missed empathy opportunities
    if (patientPersona.emotionalState === 'worried' && !transcript.toLowerCase().includes('understand')) {
      opportunities.push('Acknowledge patient concerns and emotions');
    }

    // Check for missed education opportunities
    if (patientPersona.healthLiteracyLevel === 'low' && !transcript.toLowerCase().includes('explain')) {
      opportunities.push('Provide patient education appropriate for health literacy level');
    }

    // Check for missed follow-up planning
    if (!transcript.toLowerCase().includes('follow-up') && !transcript.toLowerCase().includes('next appointment')) {
      opportunities.push('Discuss follow-up care and next steps');
    }

    // Check for missed lifestyle counseling
    if (['diabetes', 'hypertension', 'obesity'].includes(patientPersona.primaryCondition.toLowerCase()) &&
        !keyPhrasesUsed.some(phrase => phrase.includes('lifestyle'))) {
      opportunities.push('Address lifestyle modifications and self-care');
    }

    return opportunities.slice(0, 3); // Limit to 3 main opportunities
  }

  private getConditionSpecificTerms(condition: string): string[] {
    const conditionTerms: { [key: string]: string[] } = {
      'diabetes': ['blood sugar', 'glucose', 'insulin', 'hemoglobin A1C', 'diabetic', 'glycemic control'],
      'hypertension': ['blood pressure', 'systolic', 'diastolic', 'hypertensive', 'cardiovascular'],
      'asthma': ['inhaler', 'bronchodilator', 'respiratory', 'airways', 'breathing', 'peak flow'],
      'arthritis': ['joint', 'inflammation', 'mobility', 'stiffness', 'range of motion'],
      'depression': ['mood', 'mental health', 'counseling', 'therapy', 'emotional wellbeing']
    };

    return conditionTerms[condition.toLowerCase()] || ['symptoms', 'condition', 'treatment'];
  }

  // Assessment helper methods

  private assessSystematicApproach(transcript: string, patientPersona: PatientPersona): number {
    let score = 0;

    // Check for systematic information gathering
    const systematicElements = [
      'history', 'symptoms', 'duration', 'severity', 'medication',
      'allergies', 'previous treatment', 'family history'
    ];

    const coveredElements = systematicElements.filter(element =>
      transcript.toLowerCase().includes(element)
    );

    // Award points based on systematic coverage
    if (coveredElements.length >= 6) score += 15;
    else if (coveredElements.length >= 4) score += 10;
    else if (coveredElements.length >= 2) score += 5;
    else score -= 10;

    return score;
  }

  private assessQuestioningTechniques(questionTypes: TranscriptAnalysis['questionTypes']): number {
    let score = 0;

    // Good balance of question types
    if (questionTypes.openEnded >= 2) score += 5;
    if (questionTypes.clarifying >= 1) score += 5;
    
    // Penalize too many closed-ended questions
    if (questionTypes.closedEnded > questionTypes.openEnded * 2) score -= 5;

    return score;
  }

  private assessExplanationClarity(transcript: string): number {
    let score = 0;

    // Look for clear explanation indicators
    const clarityIndicators = [
      'this means', 'in other words', 'to put it simply', 'what this tells us',
      'the reason for this', 'let me explain', 'for example'
    ];

    const foundIndicators = clarityIndicators.filter(indicator =>
      transcript.toLowerCase().includes(indicator)
    );

    score += foundIndicators.length * 3; // Up to 9 points for clear explanations

    return Math.min(10, score);
  }

  private assessDecisionCommunication(transcript: string): number {
    let score = 0;

    // Look for decision-making communication
    const decisionIndicators = [
      'recommend', 'suggest', 'plan', 'next step', 'treatment option',
      'we will', 'I think', 'best course'
    ];

    const foundDecisions = decisionIndicators.filter(indicator =>
      transcript.toLowerCase().includes(indicator)
    );

    if (foundDecisions.length >= 2) score += 5;
    else if (foundDecisions.length >= 1) score += 3;

    return score;
  }

  private assessEmotionalAwareness(transcript: string, patientPersona: PatientPersona): number {
    let score = 0;

    // Look for empathy indicators
    const empathyIndicators = [
      'I understand', 'I can see', 'that must be', 'I appreciate',
      'concerned', 'worried', 'frustrating', 'difficult'
    ];

    const foundEmpathy = empathyIndicators.filter(indicator =>
      transcript.toLowerCase().includes(indicator)
    );

    if (foundEmpathy.length >= 3) score += 15;
    else if (foundEmpathy.length >= 2) score += 10;
    else if (foundEmpathy.length >= 1) score += 5;
    else score -= 10;

    return score;
  }

  private assessToneAppropriateness(transcript: string): number {
    let score = 0;

    // Look for appropriate professional tone
    const professionalTone = [
      'please', 'thank you', 'if you don\'t mind', 'would you',
      'could you', 'I\'d like to', 'may I'
    ];

    const foundProfessional = professionalTone.filter(phrase =>
      transcript.toLowerCase().includes(phrase)
    );

    score += Math.min(10, foundProfessional.length * 2);

    // Penalize inappropriate tone
    const inappropriateTone = ['whatever', 'obviously', 'you should know'];
    const foundInappropriate = inappropriateTone.filter(phrase =>
      transcript.toLowerCase().includes(phrase)
    );

    score -= foundInappropriate.length * 5;

    return score;
  }

  private assessReassurance(transcript: string): number {
    let score = 0;

    const reassuranceIndicators = [
      'don\'t worry', 'it\'s normal', 'we can help', 'treatable',
      'manageable', 'common condition', 'nothing to be alarmed'
    ];

    const foundReassurance = reassuranceIndicators.filter(indicator =>
      transcript.toLowerCase().includes(indicator)
    );

    score += Math.min(10, foundReassurance.length * 3);

    return score;
  }

  private assessCulturalSensitivity(transcript: string, culture: string): number {
    let score = 0;

    // Check for cultural awareness (basic implementation)
    if (transcript.toLowerCase().includes('cultural') ||
        transcript.toLowerCase().includes('background') ||
        transcript.toLowerCase().includes('community')) {
      score += 3;
    }

    // Penalize cultural insensitivity
    const insensitiveTerms = ['your people', 'all of you', 'typical for'];
    const foundInsensitive = insensitiveTerms.filter(term =>
      transcript.toLowerCase().includes(term)
    );

    score -= foundInsensitive.length * 5;

    return score;
  }

  private countGrammarErrors(transcript: string): number {
    let errorCount = 0;

    // Basic grammar error detection (simplified)
    const grammarPatterns = [
      /\bis\s+are\b/gi,  // Subject-verb disagreement
      /\bare\s+is\b/gi,
      /\ba\s+[aeiou]/gi, // Incorrect article usage (basic)
      /\bdon't\s+has\b/gi, // Auxiliary verb errors
    ];

    for (const pattern of grammarPatterns) {
      const matches = transcript.match(pattern);
      if (matches) errorCount += matches.length;
    }

    return errorCount;
  }

  private assessGrammarComplexity(transcript: string): number {
    let complexity = 0;

    // Look for complex structures
    const complexStructures = [
      /\b(although|however|nevertheless|furthermore|moreover)\b/gi,
      /\b(if|when|while|because|since)\b.*,/gi, // Subordinate clauses
      /\b(who|which|that)\b/gi, // Relative clauses
    ];

    for (const pattern of complexStructures) {
      const matches = transcript.match(pattern);
      if (matches) complexity += matches.length;
    }

    return complexity;
  }

  private assessProfessionalRegister(transcript: string): number {
    let score = 0;

    // Check for consistent professional language
    const professionalTerms = transcript.toLowerCase().match(/\b(patient|consultation|examination|assessment|treatment|clinical)\b/g);
    const informalTerms = transcript.toLowerCase().match(/\b(yeah|okay|um|like|you know)\b/g);

    if (professionalTerms && professionalTerms.length >= 3) score += 3;
    if (informalTerms && informalTerms.length > 3) score -= 2;

    return score;
  }

  private scoreMedicalTerminology(usage: TranscriptAnalysis['medicalTerminologyUsage']): number {
    let score = 0;

    // Award points for appropriate usage
    score += Math.min(8, usage.appropriate.length * 2);

    // Penalize inappropriate usage
    score -= usage.inappropriate.length * 3;

    // Small penalty for missing essential terms
    score -= Math.min(5, usage.missing.length);

    return score;
  }

  private assessVocabularyRange(transcript: string): number {
    const words = transcript.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const varietyRatio = uniqueWords.size / words.length;

    // Higher variety ratio indicates better vocabulary range
    if (varietyRatio >= 0.7) return 10;
    if (varietyRatio >= 0.6) return 7;
    if (varietyRatio >= 0.5) return 5;
    if (varietyRatio >= 0.4) return 3;
    return 0;
  }

  private assessContextualVocabulary(transcript: string): number {
    let score = 5; // Base score

    // Look for context-appropriate medical vocabulary
    const medicalContext = /\b(symptoms?|treatment|medication|diagnosis|therapy|consultation|examination)\b/gi;
    const matches = transcript.match(medicalContext);
    
    if (matches && matches.length >= 5) score += 5;
    else if (matches && matches.length >= 3) score += 3;

    return score;
  }

  private assessFluencyIndicators(transcript: string): number {
    let score = 0;

    // Look for fluency indicators in text structure
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim());
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;

    // Appropriate sentence length indicates fluency
    if (avgSentenceLength >= 10 && avgSentenceLength <= 25) score += 5;
    
    // Look for connector words indicating smooth flow
    const connectors = transcript.match(/\b(and|but|so|then|also|however|therefore|moreover)\b/gi);
    if (connectors && connectors.length >= 3) score += 5;

    return score;
  }

  private assessConfidenceIndicators(transcript: string): number {
    let score = 0;

    // Look for confidence indicators
    const confidenceWords = ['certainly', 'definitely', 'clearly', 'obviously', 'I believe', 'I think'];
    const foundConfidence = confidenceWords.filter(word => 
      transcript.toLowerCase().includes(word)
    );

    score += Math.min(5, foundConfidence.length * 2);

    // Penalize hesitation indicators
    const hesitationWords = ['um', 'uh', 'maybe', 'I guess', 'sort of'];
    const foundHesitation = hesitationWords.filter(word =>
      transcript.toLowerCase().includes(word)
    );

    score -= foundHesitation.length * 2;

    return score;
  }

  private assessInstructionClarity(transcript: string): number {
    let score = 0;

    const instructionIndicators = [
      'first', 'second', 'next', 'then', 'finally',
      'step by step', 'make sure', 'remember to', 'it\'s important'
    ];

    const foundInstructions = instructionIndicators.filter(indicator =>
      transcript.toLowerCase().includes(indicator)
    );

    score += Math.min(10, foundInstructions.length * 2);

    return score;
  }

  private assessUnderstandingVerification(transcript: string): number {
    let score = 0;

    const verificationPhrases = [
      'do you understand', 'does that make sense', 'can you repeat',
      'tell me back', 'any questions', 'is that clear', 'follow me'
    ];

    const foundVerification = verificationPhrases.filter(phrase =>
      transcript.toLowerCase().includes(phrase)
    );

    if (foundVerification.length >= 2) score += 10;
    else if (foundVerification.length >= 1) score += 5;
    else score -= 5; // Penalize lack of understanding verification

    return score;
  }

  private assessHealthLiteracyAdaptation(transcript: string, patientPersona: PatientPersona): number {
    let score = 0;

    const literacyLevel = patientPersona.healthLiteracyLevel;

    if (literacyLevel === 'low') {
      // Should use simple language
      const simpleLanguageIndicators = [
        'simple words', 'easy to understand', 'in plain terms',
        'let me put it simply', 'basic terms'
      ];

      const foundSimple = simpleLanguageIndicators.filter(indicator =>
        transcript.toLowerCase().includes(indicator)
      );

      if (foundSimple.length >= 1) score += 10;
      
      // Penalize complex medical jargon for low literacy
      const complexTerms = ['pathophysiology', 'contraindications', 'pharmacokinetics'];
      const foundComplex = complexTerms.filter(term =>
        transcript.toLowerCase().includes(term)
      );

      score -= foundComplex.length * 5;

    } else if (literacyLevel === 'high') {
      // Can use more sophisticated medical terminology appropriately
      const appropriateComplexity = transcript.match(/\b(diagnosis|prognosis|treatment protocol|clinical guidelines)\b/gi);
      if (appropriateComplexity && appropriateComplexity.length >= 2) score += 8;
    }

    return score;
  }

  /**
   * Identify strengths based on scores and transcript analysis
   */
  private async identifyStrengths(
    transcript: string,
    scores: DetailedScores,
    analysis: TranscriptAnalysis
  ): Promise<ScoringResult['strengths']> {
    const strengths: ScoringResult['strengths'] = [];

    // Find top performing areas
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    for (let i = 0; i < Math.min(3, sortedScores.length); i++) {
      const [category, score] = sortedScores[i];
      
      if (score >= 80) {
        strengths.push(this.generateStrengthObservation(category, score, transcript, analysis));
      }
    }

    // If we don't have 3 strengths from high scores, add general positive observations
    while (strengths.length < 3) {
      const additionalStrength = this.generateGeneralStrength(transcript, analysis, strengths.length);
      if (additionalStrength) {
        strengths.push(additionalStrength);
      } else {
        break;
      }
    }

    return strengths;
  }

  /**
   * Identify areas for improvement based on scores and analysis
   */
  private async identifyImprovements(
    transcript: string,
    scores: DetailedScores,
    analysis: TranscriptAnalysis
  ): Promise<ScoringResult['improvements']> {
    const improvements: ScoringResult['improvements'] = [];

    // Find lowest performing areas
    const sortedScores = Object.entries(scores).sort((a, b) => a[1] - b[1]);

    for (let i = 0; i < Math.min(3, sortedScores.length); i++) {
      const [category, score] = sortedScores[i];
      
      if (score <= 75) {
        improvements.push(this.generateImprovementSuggestion(category, score, transcript, analysis));
      }
    }

    // Add missed opportunities as improvements
    for (const opportunity of analysis.missedOpportunities.slice(0, 3 - improvements.length)) {
      improvements.push({
        category: 'clinical_communication',
        observation: `Missed opportunity: ${opportunity}`,
        suggestion: 'Consider incorporating this aspect in future consultations',
        example: this.generateExampleForOpportunity(opportunity)
      });
    }

    return improvements.slice(0, 3); // Ensure exactly 3 improvements
  }

  private generateStrengthObservation(
    category: string,
    score: number,
    transcript: string,
    analysis: TranscriptAnalysis
  ): ScoringResult['strengths'][0] {
    const examples = this.findExamplesFromTranscript(transcript, category);

    const observations = {
      'clinicalCommunication': 'Excellent systematic approach to information gathering and clinical assessment',
      'empathy': 'Outstanding demonstration of empathy and patient-centered communication',
      'grammar': 'Excellent grammatical accuracy and complex sentence structures',
      'vocabulary': 'Sophisticated and appropriate use of medical and professional vocabulary',
      'pronunciation': 'Clear and confident delivery with excellent fluency',
      'patientEducation': 'Effective patient education with clear explanations and verification'
    };

    return {
      category,
      observation: observations[category as keyof typeof observations] || 'Strong performance in this area',
      examples: examples.slice(0, 2) // Limit to 2 examples
    };
  }

  private generateImprovementSuggestion(
    category: string,
    score: number,
    transcript: string,
    analysis: TranscriptAnalysis
  ): ScoringResult['improvements'][0] {
    const suggestions = {
      'clinicalCommunication': {
        category: 'clinicalCommunication',
        observation: 'Limited systematic approach to clinical assessment',
        suggestion: 'Try using a structured approach like SOCRATES for symptom assessment',
        example: 'Can you describe the Site, Onset, Character, Radiation, Associated symptoms, Timing, Exacerbating factors, and Severity of your pain?'
      },
      'empathy': {
        category: 'empathy',
        observation: 'Limited acknowledgment of patient emotions and concerns',
        suggestion: 'Use more empathetic language to acknowledge patient feelings',
        example: 'I can understand this must be very concerning for you. Let me help address your worries.'
      },
      'grammar': {
        category: 'grammar',
        observation: 'Frequent grammatical errors affecting communication clarity',
        suggestion: 'Focus on subject-verb agreement and appropriate tenses',
        example: 'The patient has been experiencing symptoms (not "have been experiencing")'
      },
      'vocabulary': {
        category: 'vocabulary',
        observation: 'Limited range of medical vocabulary or inappropriate usage',
        suggestion: 'Expand medical vocabulary while ensuring patient understanding',
        example: 'Instead of "pathology," use "condition" or "medical problem" for better patient comprehension'
      },
      'pronunciation': {
        category: 'pronunciation',
        observation: 'Unclear pronunciation affecting communication effectiveness',
        suggestion: 'Focus on clear articulation of key medical terms',
        example: 'Practice pronouncing medical terms clearly: "hy-per-TEN-sion" not "hypertension"'
      },
      'patientEducation': {
        category: 'patientEducation',
        observation: 'Limited patient education and understanding verification',
        suggestion: 'Always check patient understanding using teach-back methods',
        example: 'Can you tell me in your own words what we discussed about your medication?'
      }
    };

    const suggestion = suggestions[category as keyof typeof suggestions];
    return suggestion || {
      category: category,
      observation: 'Area needs improvement',
      suggestion: 'Practice this aspect more in future consultations',
      example: 'Focus on developing this skill through targeted practice'
    };
  }

  private findExamplesFromTranscript(transcript: string, category: string): string[] {
    const lines = transcript.split('\n').filter(line => 
      line.toLowerCase().includes('healthcare professional:') || 
      line.toLowerCase().includes('doctor:') ||
      line.toLowerCase().includes('nurse:')
    );

    // Extract the actual spoken content (remove speaker labels)
    const spokenContent = lines.map(line => 
      line.replace(/^(healthcare professional:|doctor:|nurse:)/i, '').trim()
    ).filter(content => content.length > 10);

    // Return up to 2 examples
    return spokenContent.slice(0, 2);
  }

  private generateGeneralStrength(
    transcript: string,
    analysis: TranscriptAnalysis,
    strengthIndex: number
  ): ScoringResult['strengths'][0] | null {
    const generalStrengths = [
      {
        category: 'communication',
        observation: 'Maintained professional communication throughout the consultation',
        examples: ['Demonstrated appropriate healthcare professional manner']
      },
      {
        category: 'engagement',
        observation: 'Good patient engagement and interactive dialogue',
        examples: ['Asked relevant questions to gather information']
      },
      {
        category: 'structure',
        observation: 'Attempted to follow a structured approach to the consultation',
        examples: ['Showed organization in consultation approach']
      }
    ];

    return generalStrengths[strengthIndex] || null;
  }

  private generateExampleForOpportunity(opportunity: string): string {
    const examples: { [key: string]: string } = {
      'Acknowledge patient concerns and emotions': 'I can see you\'re worried about this. That\'s completely understandable.',
      'Provide patient education appropriate for health literacy level': 'Let me explain this condition in simple terms so you can understand it better.',
      'Discuss follow-up care and next steps': 'I\'d like to see you again in two weeks to check on your progress.',
      'Address lifestyle modifications and self-care': 'Let\'s talk about some changes you can make at home to help manage this condition.'
    };

    return examples[opportunity] || 'Consider incorporating this aspect in your consultation approach.';
  }

  /**
   * Health check for the scoring service
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic scoring functionality
      const testPersona: PatientPersona = {
        name: 'Test Patient',
        age: 45,
        gender: 'female',
        occupation: 'teacher',
        culture: 'western',
        primaryCondition: 'diabetes',
        medicalHistory: ['hypertension'],
        currentSymptoms: ['fatigue'],
        currentMedications: ['metformin'],
        previousTreatments: ['dietary modification'],
        knownAllergies: ['none'],
        emotionalState: 'concerned',
        anxietyLevel: 'medium',
        communicationStyle: 'direct',
        healthLiteracyLevel: 'medium',
        healthcareExperiences: ['regular checkups']
      };

      const testTranscript = 'Healthcare Professional: Hello, how are you feeling today? Can you tell me about your symptoms?';
      
      const result = await this.calculateScores(testTranscript, testPersona, 600, 'doctor');
      
      return result.overallScore !== undefined && result.detailedScores !== undefined;
    } catch (error) {
      logger.error('Scoring service health check failed', { error });
      return false;
    }
  }
}
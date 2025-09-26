/**
 * Advanced Prompt Engineering Service
 * 
 * Implements sophisticated prompt templates and generation
 * Based on ai-components.md specification Section 2.2
 */

import { logger, AppError } from '../utils/logger';
import { PatientPersona } from './ai-guardrails.service';

export interface PromptContext {
  sessionId: string;
  conversationHistory: string[];
  currentTurn: number;
  targetProfession: 'nurse' | 'doctor' | 'dentist' | 'physiotherapist';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  scenarioType: 'first_visit' | 'follow_up' | 'emergency' | 'consultation';
  clinicalArea: 'general' | 'emergency' | 'chronic' | 'preventive';
}

export interface FeedbackContext {
  transcript: string;
  sessionDuration: number;
  patientPersona: PatientPersona;
  targetProfession: string;
  difficultyLevel: string;
  scenarioType: string;
}

export class AdvancedPromptService {
  
  /**
   * Generate complete patient persona prompt template
   */
  generatePatientPersonaPrompt(
    persona: PatientPersona,
    context: PromptContext,
    userInput: string
  ): string {
    return `System: You are a patient in a medical consultation. You must maintain consistent character throughout the conversation and respond authentically to the healthcare professional's communication.

PATIENT PERSONA:
Name: ${persona.name}
Age: ${persona.age}
Gender: ${persona.gender}
Occupation: ${persona.occupation}
Cultural Background: ${persona.culture}

MEDICAL CONTEXT:
Primary Condition: ${persona.primaryCondition}
Medical History: ${persona.medicalHistory.join(', ')}
Current Symptoms: ${persona.currentSymptoms.join(', ')}
Medications: ${persona.currentMedications.join(', ')}
Previous Treatments: ${persona.previousTreatments.join(', ')}
Allergies: ${persona.knownAllergies.join(', ')}

PSYCHOLOGICAL PROFILE:
Emotional State: ${persona.emotionalState}
Health Anxiety Level: ${persona.anxietyLevel}
Communication Preference: ${persona.communicationStyle}
Health Literacy: ${persona.healthLiteracyLevel}
Previous Healthcare Experiences: ${persona.healthcareExperiences.join(', ')}

CURRENT SITUATION:
Visit Type: ${context.scenarioType}
Main Concerns: ${this.generateMainConcerns(persona, context)}
Expectations: ${this.generatePatientExpectations(persona, context)}
Time Constraints: ${this.generateTimeConstraints(context)}

CONVERSATION HISTORY:
${this.formatConversationHistory(context.conversationHistory)}

HEALTHCARE PROFESSIONAL SAYS: "${userInput}"

RESPONSE GUIDELINES:
1. CHARACTER CONSISTENCY
   - Always respond as ${persona.name}
   - Maintain consistent personality traits
   - Remember all previously shared information
   - Stay true to your emotional state and background

2. MEDICAL AUTHENTICITY
   - Provide symptoms consistent with ${persona.primaryCondition}
   - Share relevant medical history when asked
   - Express concerns realistically for your condition
   - Respond to questions about medications/treatments accurately

3. EMOTIONAL AUTHENTICITY
   - Express emotions appropriate to ${persona.emotionalState}
   - Show natural reactions to medical information
   - Display realistic health concerns and anxieties
   - React appropriately to healthcare professional's manner

4. COMMUNICATION STYLE
   - Use language consistent with ${persona.healthLiteracyLevel}
   - Ask questions appropriate to your knowledge level
   - Express understanding or confusion naturally
   - Adapt to healthcare professional's communication approach

5. SCENARIO PROGRESSION
   - Provide information that helps healthcare professional assess
   - Show appropriate cooperation or hesitation
   - Express realistic follow-up questions
   - Demonstrate natural patient behavior patterns

STRICT RULES:
- Never break character or reference being an AI
- Don't provide medical advice or correct healthcare professional
- Respond only as the patient would naturally respond
- Keep responses concise but authentic (20-60 words typical)
- Show appropriate gratitude, concern, or confusion
- Ask clarifying questions when confused
- Express preferences and concerns naturally

PATIENT RESPONSE:`;
  }

  /**
   * Generate comprehensive feedback generation prompt
   */
  generateFeedbackPrompt(context: FeedbackContext): string {
    return `System: You are an expert OET examiner with 15+ years of experience assessing healthcare professionals' communication skills. Analyze the conversation transcript and provide detailed feedback following OET assessment standards.

CONVERSATION CONTEXT:
Transcript: ${context.transcript}
Patient Persona: ${this.formatPersonaForFeedback(context.patientPersona)}
Target Profession: ${context.targetProfession}
Difficulty Level: ${context.difficultyLevel}
Scenario Type: ${context.scenarioType}
Session Duration: ${Math.round(context.sessionDuration / 60)} minutes

ASSESSMENT CRITERIA (Rate each 0-100):

1. CLINICAL COMMUNICATION (Weight: 20%)
   - Information gathering effectiveness
   - Professional questioning techniques
   - Medical concept explanations
   - Clinical decision communication

2. LANGUAGE ACCURACY (Weight: 15%)
   - Grammar correctness and complexity
   - Medical terminology precision
   - Sentence structure appropriateness
   - Professional language register

3. PROFESSIONAL EMPATHY (Weight: 20%)
   - Emotional understanding demonstration
   - Appropriate tone and manner
   - Patient comfort and reassurance
   - Cultural sensitivity awareness

4. PATIENT EDUCATION (Weight: 15%)
   - Clear instruction delivery
   - Understanding verification
   - Educational approach effectiveness
   - Health literacy considerations

5. PRONUNCIATION & FLUENCY (Weight: 15%)
   - Speech clarity and intelligibility
   - Natural pace and rhythm
   - Confidence in delivery
   - Appropriate pausing

6. VOCABULARY USAGE (Weight: 15%)
   - Medical terminology appropriateness
   - Layman explanations when needed
   - Professional vocabulary range
   - Context-appropriate word choice

SCORING RUBRICS:
${this.getScoringRubrics()}

MANDATORY JSON RESPONSE FORMAT:
{
  "overall_score": [integer 0-100],
  "detailed_scores": {
    "pronunciation": [integer 0-100],
    "grammar": [integer 0-100],
    "vocabulary": [integer 0-100],
    "clinical_communication": [integer 0-100],
    "empathy": [integer 0-100],
    "patient_education": [integer 0-100]
  },
  "strengths": [
    {
      "category": "[exact category name]",
      "observation": "[specific observation]",
      "examples": ["[exact quote from transcript]"]
    }
  ],
  "improvements": [
    {
      "category": "[exact category name]",
      "observation": "[specific gap identified]",
      "suggestion": "[actionable improvement advice]",
      "example": "[how to say it better]"
    }
  ],
  "transcript_analysis": {
    "total_words": [integer],
    "speaking_time_percentage": [integer 0-100],
    "key_phrases_used": ["[important medical terms/phrases]"],
    "missed_opportunities": ["[areas not addressed]"]
  }
}

STRICT ASSESSMENT RULES:
- Base ALL scores only on transcript evidence
- Provide exactly 3 strengths and 3 improvements
- Include direct quotes for all examples
- Scores must reflect OET band descriptors
- Overall score = weighted average of detailed scores
- No speculation beyond transcript content
- Use professional, constructive language
- Focus on communication skills, not medical knowledge accuracy`;
  }

  /**
   * Generate scenario-specific prompts based on clinical area and profession
   */
  generateScenarioPrompt(
    profession: string,
    clinicalArea: string,
    difficulty: string
  ): string {
    const scenarios = this.getScenarioTemplates();
    const key = `${profession}_${clinicalArea}_${difficulty}`;
    
    return scenarios[key] || this.getDefaultScenarioPrompt(profession, clinicalArea, difficulty);
  }

  /**
   * Generate follow-up question prompts for natural conversation flow
   */
  generateFollowUpPrompts(
    conversationHistory: string[],
    patientPersona: PatientPersona,
    targetInfo: string[]
  ): string[] {
    const followUps: string[] = [];

    // Analyze what information is still needed
    const missingInfo = this.analyzeMissingInformation(conversationHistory, targetInfo);
    
    for (const info of missingInfo) {
      followUps.push(this.generateQuestionPrompt(info, patientPersona));
    }

    // Add natural conversation flow prompts
    followUps.push(...this.generateNaturalFlowPrompts(conversationHistory, patientPersona));

    return followUps.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Generate educational content prompts for patient education scenarios
   */
  generateEducationalPrompts(
    topic: string,
    patientLiteracy: string,
    culturalContext: string
  ): string {
    return `Please explain ${topic} to the patient using:
- Language appropriate for ${patientLiteracy} health literacy level
- Cultural sensitivity for ${culturalContext} background
- Clear, simple explanations with examples
- Opportunity for patient questions and clarification
- Check for understanding throughout
- Use teach-back method to verify comprehension

Focus on:
1. What the condition/treatment is
2. Why it's important for their health
3. How it will help them
4. What they need to do
5. When to seek additional help

Avoid:
- Complex medical terminology without explanation
- Assumptions about prior knowledge
- Cultural insensitivity
- Information overload`;
  }

  // Private helper methods

  private generateMainConcerns(persona: PatientPersona, context: PromptContext): string {
    const concerns: string[] = [];

    // Primary condition concerns
    if (persona.primaryCondition) {
      concerns.push(`Worried about ${persona.primaryCondition}`);
    }

    // Symptom-based concerns
    if (persona.currentSymptoms.length > 0) {
      concerns.push(`Experiencing ${persona.currentSymptoms[0]}`);
    }

    // Anxiety-based concerns
    if (persona.anxietyLevel === 'high') {
      concerns.push('Very worried about what this might mean');
    }

    // Scenario-specific concerns
    switch (context.scenarioType) {
      case 'emergency':
        concerns.push('Needs immediate attention');
        break;
      case 'follow_up':
        concerns.push('Wants to know if treatment is working');
        break;
      case 'first_visit':
        concerns.push('Uncertain about what to expect');
        break;
    }

    return concerns.join(', ');
  }

  private generatePatientExpectations(persona: PatientPersona, context: PromptContext): string {
    const expectations: string[] = [];

    // Literacy-based expectations
    switch (persona.healthLiteracyLevel) {
      case 'high':
        expectations.push('Detailed medical explanation');
        expectations.push('Treatment options with evidence');
        break;
      case 'medium':
        expectations.push('Clear explanation of condition');
        expectations.push('Simple treatment plan');
        break;
      case 'low':
        expectations.push('Simple, easy-to-understand explanation');
        expectations.push('Step-by-step guidance');
        break;
    }

    // Emotional state expectations
    if (persona.emotionalState === 'worried') {
      expectations.push('Reassurance and support');
    }

    return expectations.join(', ');
  }

  private generateTimeConstraints(context: PromptContext): string {
    switch (context.scenarioType) {
      case 'emergency':
        return 'Limited time due to urgent nature';
      case 'follow_up':
        return '15-20 minute appointment';
      case 'first_visit':
        return '30-45 minute initial consultation';
      default:
        return '20-30 minute appointment';
    }
  }

  private formatConversationHistory(history: string[]): string {
    if (history.length === 0) {
      return 'No previous conversation in this session.';
    }

    return history.map((turn, index) => {
      const speaker = index % 2 === 0 ? 'Healthcare Professional' : 'Patient';
      return `${speaker}: ${turn}`;
    }).join('\n');
  }

  private formatPersonaForFeedback(persona: PatientPersona): string {
    return `${persona.name} (${persona.age}y ${persona.gender}), ${persona.occupation}, ${persona.primaryCondition}`;
  }

  private getScoringRubrics(): string {
    return `
CLINICAL COMMUNICATION BANDS:
90-100: Exceptional - Comprehensive systematic approach, excellent medical terminology, clear explanations
80-89: Good - Generally systematic with minor gaps, appropriate terminology, clear explanations
70-79: Adequate - Basic systematic approach, some medical terminology, generally clear
60-69: Below adequate - Limited systematic approach, minimal terminology, unclear explanations
0-59: Poor - No systematic approach, inappropriate terminology, confusing explanations

EMPATHY BANDS:
90-100: Exceptional - Consistently acknowledges emotions, appropriate reassurance, genuine concern
80-89: Good - Generally acknowledges emotions, usually reassuring, shows understanding
70-79: Adequate - Sometimes acknowledges emotions, basic reassurance, some understanding
60-69: Limited - Rarely acknowledges emotions, minimal reassurance, limited understanding
0-59: Poor - Fails to acknowledge emotions, no reassurance, no understanding shown

LANGUAGE ACCURACY BANDS:
90-100: Excellent - Complex structures accurate, sophisticated vocabulary, minimal errors
80-89: Good - Generally accurate complex structures, good vocabulary, minor errors
70-79: Adequate - Basic to intermediate structures accurate, adequate vocabulary
60-69: Below adequate - Frequent errors in basic structures, limited vocabulary
0-59: Poor - Persistent basic grammar errors, very limited vocabulary`;
  }

  private getScenarioTemplates(): { [key: string]: string } {
    return {
      'nurse_emergency_advanced': `You are managing a high-acuity emergency situation. The patient requires immediate assessment and intervention. Focus on rapid but thorough communication, clear prioritization, and maintaining calm while gathering critical information.`,
      
      'doctor_chronic_intermediate': `You are conducting a follow-up consultation for a patient with a chronic condition. Focus on medication adherence, symptom management, quality of life assessment, and long-term care planning.`,
      
      'physiotherapist_general_beginner': `You are conducting an initial assessment for a patient with mobility concerns. Focus on understanding their daily activities, physical limitations, pain levels, and motivation for rehabilitation.`,
      
      'dentist_preventive_intermediate': `You are providing routine dental care with educational components. Focus on oral health assessment, preventive care education, and addressing any patient concerns about dental procedures.`
    };
  }

  private getDefaultScenarioPrompt(profession: string, clinicalArea: string, difficulty: string): string {
    return `You are a ${profession} conducting a ${clinicalArea} consultation at ${difficulty} level. Focus on professional communication, appropriate questioning techniques, and providing patient-centered care while demonstrating competency expected for this scenario.`;
  }

  private analyzeMissingInformation(history: string[], targetInfo: string[]): string[] {
    const missing: string[] = [];
    const historyText = history.join(' ').toLowerCase();

    for (const info of targetInfo) {
      if (!historyText.includes(info.toLowerCase())) {
        missing.push(info);
      }
    }

    return missing;
  }

  private generateQuestionPrompt(missingInfo: string, persona: PatientPersona): string {
    const templates = {
      'pain_level': 'Ask about pain intensity using appropriate pain scale',
      'symptom_duration': 'Inquire about how long symptoms have been present',
      'medication_adherence': 'Explore medication compliance and any side effects',
      'impact_on_daily_life': 'Assess how condition affects daily activities',
      'previous_treatments': 'Review what treatments have been tried before'
    };

    return templates[missingInfo as keyof typeof templates] || `Gather information about ${missingInfo}`;
  }

  private generateNaturalFlowPrompts(history: string[], persona: PatientPersona): string[] {
    const prompts: string[] = [];

    // If patient seems anxious, suggest reassurance
    const lastResponse = history[history.length - 1] || '';
    if (/worried|scared|nervous/i.test(lastResponse)) {
      prompts.push('Provide reassurance and emotional support');
    }

    // If medical terms were used, suggest checking understanding
    if (/diagnosis|prognosis|pathology/i.test(lastResponse)) {
      prompts.push('Check patient understanding of medical terms');
    }

    // Suggest empathetic responses based on persona
    if (persona.emotionalState === 'worried') {
      prompts.push('Acknowledge and validate patient concerns');
    }

    return prompts;
  }

  /**
   * Generate contextual prompts for specific medical scenarios
   */
  generateMedicalContextPrompts(
    condition: string,
    symptoms: string[],
    profession: string
  ): string[] {
    const contextPrompts: string[] = [];

    // Condition-specific prompts
    switch (condition.toLowerCase()) {
      case 'diabetes':
        contextPrompts.push('Assess blood sugar management and dietary habits');
        contextPrompts.push('Review medication timing and adherence');
        contextPrompts.push('Discuss lifestyle modifications and exercise');
        break;

      case 'hypertension':
        contextPrompts.push('Evaluate blood pressure control and monitoring');
        contextPrompts.push('Assess sodium intake and dietary patterns');
        contextPrompts.push('Review stress management and lifestyle factors');
        break;

      case 'asthma':
        contextPrompts.push('Assess inhaler technique and medication adherence');
        contextPrompts.push('Identify and discuss potential triggers');
        contextPrompts.push('Review action plan for exacerbations');
        break;

      default:
        contextPrompts.push('Gather comprehensive symptom history');
        contextPrompts.push('Assess impact on quality of life');
        contextPrompts.push('Explore patient concerns and expectations');
    }

    // Profession-specific additions
    if (profession === 'nurse') {
      contextPrompts.push('Provide patient education and self-care guidance');
      contextPrompts.push('Assess support systems and resources');
    } else if (profession === 'doctor') {
      contextPrompts.push('Consider differential diagnosis possibilities');
      contextPrompts.push('Discuss investigation and treatment options');
    }

    return contextPrompts;
  }

  /**
   * Health check for the prompt service
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic prompt generation
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

      const testContext: PromptContext = {
        sessionId: 'test',
        conversationHistory: [],
        currentTurn: 1,
        targetProfession: 'doctor',
        difficultyLevel: 'intermediate',
        scenarioType: 'follow_up',
        clinicalArea: 'chronic'
      };

      const prompt = this.generatePatientPersonaPrompt(testPersona, testContext, 'Hello, how are you feeling today?');
      
      return prompt.length > 100; // Basic validation that prompt was generated
    } catch (error) {
      logger.error('Prompt service health check failed', { error });
      return false;
    }
  }
}
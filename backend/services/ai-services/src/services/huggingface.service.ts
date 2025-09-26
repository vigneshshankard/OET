import axios from 'axios';
import { config } from '../config';
import { logger, AppError } from '../utils/logger';
import { LLMRequest, LLMResponse } from '../types/ai';

export class HuggingFaceService {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor() {
    this.baseUrl = config.huggingface.baseUrl;
    this.apiKey = config.huggingface.apiKey;
    this.model = config.huggingface.model;
  }

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    
    try {
      logger.info(`Generating LLM response for session ${request.sessionId}`);

      const response = await axios.post(
        `${this.baseUrl}/models/${this.model}`,
        {
          inputs: this.formatInput(request),
          parameters: {
            temperature: request.temperature || 0.7,
            max_new_tokens: request.maxTokens || 150,
            return_full_text: false,
            do_sample: true,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: config.processing.processingTimeout,
        }
      );

      const processingTime = Date.now() - startTime;
      
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        throw new AppError('Invalid response from Hugging Face API', 500, 'LLM_API_ERROR');
      }

      const generatedText = response.data[0].generated_text || '';
      
      return {
        response: this.cleanResponse(generatedText),
        confidence: 0.85, // Estimated confidence for API response
        processingTime,
        tokenUsage: {
          input: this.countTokens(request.message),
          output: this.countTokens(generatedText),
          total: this.countTokens(request.message) + this.countTokens(generatedText),
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('LLM generation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: request.sessionId,
        processingTime
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(
        'Failed to generate LLM response',
        500,
        'LLM_GENERATION_ERROR',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  async analyzeConversation(transcript: string, sessionId: string) {
    const analysisPrompt = this.createAnalysisPrompt(transcript);
    
    const request: LLMRequest = {
      message: analysisPrompt,
      sessionId,
      temperature: 0.3, // Lower temperature for more consistent analysis
      maxTokens: 300,
    };

    try {
      const response = await this.generateResponse(request);
      return this.parseAnalysisResponse(response.response);
    } catch (error) {
      logger.error('Conversation analysis failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId
      });
      throw error;
    }
  }

  private formatInput(request: LLMRequest): string {
    let input = '';
    
    // Add context if provided
    if (request.context && request.context.length > 0) {
      input += request.context.join('\n') + '\n\n';
    }
    
    // Add current message
    input += `Human: ${request.message}\nAssistant:`;
    
    return input;
  }

  private cleanResponse(response: string): string {
    // Remove any unwanted prefixes or suffixes
    return response
      .replace(/^(Human:|Assistant:)/gi, '')
      .trim();
  }

  private countTokens(text: string): number {
    // Rough token estimation (actual tokenization would be more accurate)
    return Math.ceil(text.length / 4);
  }

  private createAnalysisPrompt(transcript: string): string {
    return `
Please analyze the following OET speaking practice conversation and provide structured feedback:

TRANSCRIPT:
${transcript}

Please evaluate the speaker's performance in these areas (score 1-10):
1. Fluency and coherence
2. Pronunciation and clarity  
3. Vocabulary range and accuracy
4. Grammar accuracy
5. Task achievement

Provide specific examples and suggestions for improvement. Format your response as JSON with the following structure:
{
  "scores": {"fluency": X, "pronunciation": X, "vocabulary": X, "grammar": X, "overall": X},
  "strengths": ["strength1", "strength2"],
  "improvements": ["area1", "area2"], 
  "suggestions": ["suggestion1", "suggestion2"]
}
`;
  }

  private parseAnalysisResponse(response: string) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          fluency: parsed.scores?.fluency || 7,
          pronunciation: parsed.scores?.pronunciation || 7,
          vocabulary: parsed.scores?.vocabulary || 7,
          grammar: parsed.scores?.grammar || 7,
          overall: parsed.scores?.overall || 7,
          strengths: parsed.strengths || [],
          improvements: parsed.improvements || [],
          suggestions: parsed.suggestions || [],
        };
      }
    } catch (error) {
      logger.warn('Failed to parse structured analysis response', { error });
    }

    // Fallback to default analysis
    return {
      fluency: 7,
      pronunciation: 7,
      vocabulary: 7,
      grammar: 7,
      overall: 7,
      strengths: ['Attempted the speaking task'],
      improvements: ['Continue practicing regularly'],
      suggestions: ['Focus on clear pronunciation and natural flow'],
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/models/${this.model}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      logger.error('Hugging Face health check failed', { error });
      return false;
    }
  }
}
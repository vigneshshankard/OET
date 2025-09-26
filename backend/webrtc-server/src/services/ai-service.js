const axios = require('axios');
const FormData = require('form-data');

class AIService {
  constructor({ huggingFaceApiKey, modelUrl }) {
    this.apiKey = huggingFaceApiKey;
    this.modelUrl = modelUrl;
    this.baseUrl = 'https://api-inference.huggingface.co/models/';
    
    // Configure axios instance
    this.client = axios.create({
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('🤖 AI Service initialized with Hugging Face API');
  }

  /**
   * Process audio input and generate AI response
   */
  async processAudioInput({ audioData, sessionContext }) {
    try {
      console.log('🎵 Processing audio input with AI...');

      // Step 1: Transcribe audio (simulated for now - in production use Whisper API)
      const transcript = await this.transcribeAudio(audioData);
      console.log(`📝 Transcribed: ${transcript}`);

      // Step 2: Generate AI patient response
      const patientResponse = await this.generatePatientResponse({
        userInput: transcript,
        context: sessionContext
      });

      // Step 3: Convert response to speech (simulated TTS)
      const audioResponse = await this.textToSpeech(patientResponse.text);

      return {
        transcript,
        text: patientResponse.text,
        confidence: patientResponse.confidence,
        audioData: audioResponse
      };

    } catch (error) {
      console.error('❌ Error in AI processing:', error);
      
      // Return fallback response
      return {
        transcript: "[Unable to process audio]",
        text: "I'm sorry, could you please repeat that? I didn't quite catch what you said.",
        confidence: 0.5,
        audioData: null
      };
    }
  }

  /**
   * Transcribe audio to text (simulated - replace with actual Whisper API)
   */
  async transcribeAudio(audioBuffer) {
    // TODO: Integrate with Hugging Face Whisper model
    // For now, simulate transcription
    const simulatedTranscripts = [
      "Hello doctor, I've been having some pain in my chest.",
      "The pain started about a week ago and it's getting worse.",
      "It happens mostly when I'm exercising or climbing stairs.",
      "I'm really worried about this. Could it be something serious?",
      "Do I need to change my diet or medication?",
      "Thank you for listening to my concerns, doctor."
    ];

    // Return a random simulated transcript
    const randomIndex = Math.floor(Math.random() * simulatedTranscripts.length);
    return simulatedTranscripts[randomIndex];
  }

  /**
   * Generate patient response using Hugging Face LLM
   */
  async generatePatientResponse({ userInput, context }) {
    try {
      console.log('🤖 Generating AI patient response...');

      const prompt = this.buildPatientPrompt({
        userInput,
        profession: context.profession,
        scenarioId: context.scenarioId,
        conversationHistory: context.conversationHistory || []
      });

      const response = await this.client.post(`${this.baseUrl}microsoft/DialoGPT-large`, {
        inputs: prompt,
        parameters: {
          max_new_tokens: 100,
          temperature: 0.7,
          do_sample: true,
          top_p: 0.9,
          repetition_penalty: 1.1
        }
      });

      let aiText = '';
      
      if (response.data && Array.isArray(response.data)) {
        aiText = response.data[0]?.generated_text || '';
      } else if (response.data && response.data.generated_text) {
        aiText = response.data.generated_text;
      }

      // Clean up the response (remove the original prompt)
      aiText = aiText.replace(prompt, '').trim();
      
      // If empty response, use fallback
      if (!aiText) {
        aiText = this.getFallbackResponse(context.profession);
      }

      console.log(`✅ AI Response: ${aiText}`);

      return {
        text: aiText,
        confidence: 0.85
      };

    } catch (error) {
      console.error('❌ Error generating AI response:', error);
      
      if (error.response?.status === 503) {
        // Model is loading
        console.log('⏳ Model is loading, using fallback...');
      }
      
      return {
        text: this.getFallbackResponse(context.profession),
        confidence: 0.6
      };
    }
  }

  /**
   * Build patient prompt based on context
   */
  buildPatientPrompt({ userInput, profession, scenarioId, conversationHistory }) {
    const patientPersonas = {
      doctor: {
        name: "Sarah Chen",
        age: 45,
        condition: "experiencing chest pain and shortness of breath",
        personality: "anxious but cooperative patient seeking medical help"
      },
      nurse: {
        name: "Michael Rodriguez",
        age: 32,
        condition: "post-surgical recovery with pain management concerns",
        personality: "worried patient needing reassurance and clear instructions"
      },
      dentist: {
        name: "Emma Thompson",
        age: 28,
        condition: "dental pain and sensitivity issues",
        personality: "nervous patient with dental anxiety"
      },
      physiotherapist: {
        name: "David Kim",
        age: 55,
        condition: "lower back pain affecting mobility",
        personality: "determined patient wanting to recover quickly"
      }
    };

    const persona = patientPersonas[profession] || patientPersonas.doctor;
    
    const prompt = `You are ${persona.name}, a ${persona.age}-year-old patient ${persona.condition}. You have a ${persona.personality}. 
    
Healthcare Professional says: "${userInput}"

As the patient, respond naturally and authentically. Keep responses under 50 words. Show appropriate emotion and concern for your condition.

Patient response:`;

    return prompt;
  }

  /**
   * Get fallback response based on profession
   */
  getFallbackResponse(profession) {
    const fallbacks = {
      doctor: "I understand, doctor. Could you explain that in simpler terms? I'm quite worried about my symptoms.",
      nurse: "Thank you for helping me. I want to make sure I understand the care instructions properly.",
      dentist: "I'm quite nervous about dental procedures. Can you walk me through what will happen?",
      physiotherapist: "I really want to get better. What exercises should I be doing at home?"
    };

    return fallbacks[profession] || "I see. Could you please tell me more about that?";
  }

  /**
   * Convert text to speech (simulated - replace with actual TTS API)
   */
  async textToSpeech(text) {
    // TODO: Integrate with Coqui TTS or similar service
    // For now, return null (no audio generated)
    console.log('🔊 TTS generation (simulated):', text);
    return null;
  }

  /**
   * Generate comprehensive feedback after session completion
   */
  async generateSessionFeedback({ transcript, duration, profession, scenarioId }) {
    try {
      console.log('📊 Generating session feedback...');

      const feedbackPrompt = `
Analyze this healthcare communication session:

Profession: ${profession}
Duration: ${duration} minutes
Transcript: ${transcript}

Provide feedback on:
1. Communication clarity (1-10)
2. Empathy and bedside manner (1-10) 
3. Medical knowledge application (1-10)
4. Overall effectiveness (1-10)

Also provide:
- 2 key strengths
- 2 areas for improvement
- Specific recommendations

Format as JSON with scores, strengths, improvements, and recommendations arrays.`;

      const response = await this.client.post(`${this.baseUrl}microsoft/DialoGPT-large`, {
        inputs: feedbackPrompt,
        parameters: {
          max_new_tokens: 300,
          temperature: 0.3,
          do_sample: true
        }
      });

      // Process and structure the feedback
      return this.processFeedbackResponse(response.data);

    } catch (error) {
      console.error('❌ Error generating feedback:', error);
      return this.getDefaultFeedback();
    }
  }

  processFeedbackResponse(data) {
    // TODO: Parse AI response and structure feedback
    return this.getDefaultFeedback();
  }

  getDefaultFeedback() {
    return {
      scores: {
        communication: 7.5,
        empathy: 8.0,
        knowledge: 7.0,
        overall: 7.5
      },
      strengths: [
        "Good listening skills and patient engagement",
        "Clear communication of medical concepts"
      ],
      improvements: [
        "Could ask more follow-up questions",
        "Consider summarizing key points for patient understanding"
      ],
      recommendations: [
        "Practice active listening techniques",
        "Use more patient-friendly language for medical terms"
      ]
    };
  }
}

module.exports = AIService;
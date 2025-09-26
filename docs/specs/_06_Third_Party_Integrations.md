# OET Praxis: Third-Party Integrations

This document specifies the technical details for integrating key third-party services into the OET Praxis platform, ensuring a robust and well-defined implementation.

## 1. LiveKit (WebRTC)

**Purpose:** LiveKit provides the real-time audio infrastructure for the practice sessions. It handles the connections, audio streaming, and room management.

* **Integration Flow:**
    1.  User initiates a session via the Backend API (`POST /api/v1/sessions`).
    2.  The Backend API creates a unique LiveKit room for the session.
    3.  The Backend API generates a LiveKit **access token** for the user.
    4.  The Backend API returns this token and the room details to the frontend.
    5.  The frontend uses the LiveKit client SDK to connect to the room using the provided token.
    6.  The AI Patient service also connects to the same room as a separate participant, acting as the audio source for the AI's dialogue.

* **Key Components:**
    * **LiveKit Server:** The central server that hosts the rooms.
    * **LiveKit SDK:** The client-side library used by the frontend (Next.js/React Native) to join rooms.
    * **Access Token:** A signed JWT that authenticates a user to a specific room with a defined set of permissions (e.g., `can_publish`, `can_subscribe`).

* **Implementation Notes:**
    * The Backend API must securely manage the LiveKit API key and secret.
    * The access token should have a short expiration time and be specific to the session.

## 2. Stripe (Payments)

**Purpose:** Stripe is the payment gateway for managing user subscriptions and handling all billing events.

* **Integration Flow:**
    1.  User clicks "Upgrade" or "Subscribe" on the frontend.
    2.  The frontend calls the Backend API (`POST /api/v1/user/subscription/upgrade`).
    3.  The Backend API uses the Stripe API to create a **Checkout Session**.
    4.  The Backend API returns the `url` of the Checkout Session to the frontend.
    5.  The frontend redirects the user to the Stripe Checkout page.
    6.  After a successful payment, Stripe sends a **webhook event** to a pre-configured endpoint on the Backend API.
    7.  The Backend API's webhook handler processes this event (e.g., `checkout.session.completed`) and updates the user's subscription status in the `subscriptions` table.

* **Key Components:**
    * **Stripe API:** Used by the backend to create Checkout Sessions and manage subscriptions.
    * **Stripe Webhooks:** The primary mechanism for receiving asynchronous events from Stripe.
    * **`stripe_customer_id`:** A key field in the `subscriptions` table for mapping a user to their Stripe customer record.

## 3. AI Model Integrations

The AI models are primarily integrated via API calls from the Backend API.

### 3.1. Hosted LLM (Hugging Face)

**Purpose:** The LLM generates the AI patient's dialogue and the post-session feedback report.

* **Implementation:**
    * The Backend API will make HTTPS POST requests to the Hugging Face Inference API endpoint.
    * The API key will be managed as a secure environment variable.
    * The request body will be a JSON object containing the prompt, as specified in `_04_AI_Agent_Logic.md`.
    * The response will be a JSON object containing the generated text.

* **Example Call (pseudocode):**
    ```python
    import requests

    api_url = "https://api-inference.huggingface.co/models/microsoft/phi-2"
    headers = {"Authorization": f"Bearer {HUGGING_FACE_API_KEY}"}
    
    payload = {
        "inputs": "[Your prompt from AI Agent Logic document]",
        "parameters": {
            "max_new_tokens": 100,
            "temperature": 0.7,
            "do_sample": True
        }
    }
    
    response = requests.post(api_url, headers=headers, json=payload)
    llm_output = response.json()
    ```

### 3.2. Faster-Whisper (STT)

**Purpose:** To transcribe the user's spoken audio into text.

* **Implementation:**
    * The Backend API will receive audio streams from LiveKit.
    * It will pass these audio streams to the `faster-whisper` library, which should be running as a service.
    * The library will return the transcribed text, which is then used to generate the LLM prompt.

### 3.3. Coqui TTS (TTS)

**Purpose:** To convert the LLM's text responses into a natural-sounding audio for the AI patient.

* **Implementation:**
    * The Backend API will receive the LLM's text output.
    * It will call the `Coqui TTS` service (which should be self-hosted) with the text as input.
    * The service will return a byte stream of the generated audio file.
    * The Backend API will then stream this audio back into the LiveKit room.

---

**Notes & Safety:**
- All API keys/secrets must be stored in secure environment variable stores and never committed to source control.
- All third-party integrations must be mocked or stubbed in tests. Webhook endpoints must validate signatures (e.g., Stripe signatures) before processing.
- Ensure admin review is required for any AI-generated scenario before publishing to users.

**Change Log**

| Date | Version | Description |
|------|---------|-------------|
| 2025-09-21 | 1.0 | Initial integrations document |

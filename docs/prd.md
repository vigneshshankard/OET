# Product Requirements Document: OET Praxis

Document Version: 1.1  
Date: May 11, 2024

## 1. Product Vision Statement

To become the most trusted and effective digital platform for healthcare professionals worldwide to achieve confidence and proficiency in the OET speaking exam, by providing a safe, realistic, and endlessly patient practice environment.

## 2. The Problem

Healthcare professionals seeking to pass the OET exam face three significant barriers in their speaking test preparation:

1. Lack of Practice Partners: It is challenging to find a willing, consistent, and qualified partner for realistic role-play practice.
2. Prohibitive Cost: Personalized tutoring from OET experts is expensive and often not accessible to all candidates.
3. Absence of Actionable Feedback: Without expert evaluation, test-takers cannot identify their specific weaknesses in language fundamentals (grammar, pronunciation) and clinical communication skills (empathy, structure).

## 3. Target User Persona

### Primary Users
- Internationally-educated nurses, doctors, dentists, and physiotherapists preparing for the OET exam.

### Key Characteristics
- Time-poor, often studying while working
- Highly motivated by a clear goal (passing the exam)
- May experience anxiety around speaking English in a clinical setting

## 4. Solution Overview

OET Praxis is a web and mobile application that provides a comprehensive, AI-powered speaking simulation platform. Its core is a dynamic role-play engine that allows users to practice profession-specific scenarios with an AI-powered "patient," receiving immediate, detailed, and actionable feedback on their performance.

## 5. Core Value Proposition

### For the User
An affordable, always-available, and private OET speaking tutor that delivers a realistic exam experience and pinpoints exactly what to improve.

### For the Business
A scalable, high-value SaaS solution addressing a global need in the healthcare education market.

## 6. Detailed Product Description

### 6.1. The User Journey
The user journey is designed to follow a direct path to value, minimizing friction and getting the user to the core experience as quickly as possible.

**Note:** The following features are explicitly out of scope for the current release, as agreed:
- S3 storage or any external file storage service
- PDF report generation
- Achievement system or gamification features

### Audio and Feedback (explicit behavior)
- Audio streams are processed transiently during practice sessions and are not persisted or stored in any object storage.
- No raw audio files will be retained after processing; storage of audio recordings is out of scope for this release.
- All feedback to users is derived from the transcribed text (STT output). Transcripts and AI-generated feedback reports (text) are stored in the system and displayed to the user after each session.
 - Ephemeral real-time AI audio (TTS) is allowed for live role-play only; TTS audio is streamed to the client and must not be persisted, returned as URLs, or stored after the session ends.

### 6.2. Content Strategy
- A core library of 100-200 meticulously curated and validated role-play scenarios across all major healthcare professions
- Scenarios are generated with the assistance of LLMs but are personally reviewed, edited, and approved by an admin to guarantee medical accuracy, contextual appropriateness, and adherence to the OET exam format
- Scenarios are tagged by profession, difficulty, and clinical category for easy discoverability

## 7. Monetization Model

### Freemium Model

#### Free Tier
- Users get a one-time allocation of 3 free practice sessions
- These sessions include the full experience of real-time role-play and a comprehensive feedback report

#### Paid Tier (Subscription)
- After exhausting their free trials, users will be prompted to subscribe
- Unlimited practice sessions
- Access to the full library of scenarios
# Mock Data Specification

Version: 1.0  
Last Updated: September 23, 2025

## Overview

This document defines comprehensive mock data for the OET Praxis platform to enable realistic frontend development and prevent AI hallucinations during development. All mock data reflects authentic healthcare scenarios and professional contexts.

## 1. User Profiles

### 1.1 Free Trial Users

#### Doctor Profile
```json
{
  "id": "user-doc-001",
  "email": "sarah.johnson@email.com",
  "fullName": "Dr. Sarah Johnson",
  "profession": "doctor",
  "isEmailVerified": true,
  "subscription": {
    "plan": "free",
    "status": "active",
    "sessionsUsed": 2,
    "sessionsLimit": 3,
    "expiresAt": null
  },
  "stats": {
    "sessionsCompleted": 2,
    "averageScore": 78,
    "totalPracticeTime": 45
  },
  "createdAt": "2025-09-15T10:30:00Z",
  "lastLoginAt": "2025-09-23T14:20:00Z"
}
```

#### Nurse Profile
```json
{
  "id": "user-nurse-001",
  "email": "maria.santos@email.com",
  "fullName": "Maria Santos",
  "profession": "nurse",
  "isEmailVerified": true,
  "subscription": {
    "plan": "free",
    "status": "active",
    "sessionsUsed": 3,
    "sessionsLimit": 3,
    "expiresAt": null
  },
  "stats": {
    "sessionsCompleted": 3,
    "averageScore": 82,
    "totalPracticeTime": 65
  },
  "createdAt": "2025-09-10T08:15:00Z",
  "lastLoginAt": "2025-09-22T16:45:00Z"
}
```

#### Dentist Profile
```json
{
  "id": "user-dentist-001", 
  "email": "james.wilson@email.com",
  "fullName": "Dr. James Wilson",
  "profession": "dentist",
  "isEmailVerified": true,
  "subscription": {
    "plan": "free",
    "status": "active",
    "sessionsUsed": 1,
    "sessionsLimit": 3,
    "expiresAt": null
  },
  "stats": {
    "sessionsCompleted": 1,
    "averageScore": 85,
    "totalPracticeTime": 18
  },
  "createdAt": "2025-09-20T12:00:00Z",
  "lastLoginAt": "2025-09-23T09:30:00Z"
}
```

#### Physiotherapist Profile
```json
{
  "id": "user-physio-001",
  "email": "emma.thompson@email.com", 
  "fullName": "Emma Thompson",
  "profession": "physiotherapist",
  "isEmailVerified": true,
  "subscription": {
    "plan": "free",
    "status": "active",
    "sessionsUsed": 0,
    "sessionsLimit": 3,
    "expiresAt": null
  },
  "stats": {
    "sessionsCompleted": 0,
    "averageScore": 0,
    "totalPracticeTime": 0
  },
  "createdAt": "2025-09-23T11:00:00Z",
  "lastLoginAt": "2025-09-23T11:00:00Z"
}
```

### 1.2 Paid Subscribers

#### Premium Doctor Profile
```json
{
  "id": "user-doc-premium-001",
  "email": "michael.chen@email.com",
  "fullName": "Dr. Michael Chen",
  "profession": "doctor", 
  "isEmailVerified": true,
  "subscription": {
    "plan": "monthly",
    "status": "active",
    "sessionsUsed": 23,
    "sessionsLimit": -1,
    "currentPeriodStart": "2025-09-01T00:00:00Z",
    "currentPeriodEnd": "2025-10-01T00:00:00Z",
    "stripeCustomerId": "cus_mock123"
  },
  "stats": {
    "sessionsCompleted": 23,
    "averageScore": 89,
    "totalPracticeTime": 420
  },
  "createdAt": "2025-08-15T14:30:00Z",
  "lastLoginAt": "2025-09-23T18:45:00Z"
}
```

## 2. Practice Scenarios

### 2.1 Doctor Scenarios

#### Scenario 1: Emergency Consultation
```json
{
  "id": "scenario-doc-001",
  "title": "Emergency Consultation - Chest Pain",
  "description": "A 45-year-old male patient presents to the emergency department with acute chest pain that started 2 hours ago.",
  "targetProfession": "doctor",
  "difficulty": "intermediate",
  "clinicalArea": "emergency",
  "duration": 15,
  "patientPersona": {
    "age": 45,
    "gender": "male",
    "name": "Robert Mitchell",
    "background": "Construction worker, married with two children",
    "mainComplaint": "Sudden onset chest pain, radiating to left arm",
    "medicalHistory": "Hypertension, family history of heart disease",
    "emotionalState": "Anxious and worried about heart attack",
    "communicationStyle": "Direct but concerned, asks many questions"
  },
  "learningObjectives": [
    "Assess chest pain systematically",
    "Provide reassurance while gathering information", 
    "Explain examination procedures clearly",
    "Communicate next steps and follow-up care"
  ],
  "status": "published",
  "createdAt": "2025-09-01T10:00:00Z"
}
```

#### Scenario 2: Routine Check-up
```json
{
  "id": "scenario-doc-002",
  "title": "Annual Health Check - Diabetes Management",
  "description": "A 58-year-old female patient with Type 2 diabetes comes for her annual review appointment.",
  "targetProfession": "doctor",
  "difficulty": "beginner", 
  "clinicalArea": "general",
  "duration": 12,
  "patientPersona": {
    "age": 58,
    "gender": "female",
    "name": "Margaret Thompson",
    "background": "Retired teacher, lives alone",
    "mainComplaint": "Annual diabetes review, concerned about recent weight gain",
    "medicalHistory": "Type 2 diabetes (5 years), mild hypertension",
    "emotionalState": "Slightly embarrassed about weight gain",
    "communicationStyle": "Polite but reserved, needs encouragement to share concerns"
  },
  "learningObjectives": [
    "Review diabetes management comprehensively",
    "Address patient concerns with empathy",
    "Provide practical lifestyle advice",
    "Schedule appropriate follow-up care"
  ],
  "status": "published",
  "createdAt": "2025-09-02T14:30:00Z"
}
```

### 2.2 Nurse Scenarios

#### Scenario 1: Post-Operative Care
```json
{
  "id": "scenario-nurse-001",
  "title": "Post-Operative Patient Education",
  "description": "A patient who underwent knee replacement surgery needs discharge education and wound care instructions.",
  "targetProfession": "nurse",
  "difficulty": "intermediate",
  "clinicalArea": "surgical",
  "duration": 18,
  "patientPersona": {
    "age": 68,
    "gender": "female", 
    "name": "Dorothy Williams",
    "background": "Retired librarian, lives with daughter",
    "mainComplaint": "Ready for discharge, anxious about managing at home",
    "medicalHistory": "Osteoarthritis, knee replacement surgery 3 days ago",
    "emotionalState": "Nervous about going home, wants to do everything correctly",
    "communicationStyle": "Detailed questions, takes notes, appreciates step-by-step instructions"
  },
  "learningObjectives": [
    "Provide clear wound care instructions",
    "Explain medication schedule and side effects",
    "Demonstrate mobility exercises", 
    "Address concerns about home recovery"
  ],
  "status": "published",
  "createdAt": "2025-09-03T09:15:00Z"
}
```

### 2.3 Dentist Scenarios

#### Scenario 1: Routine Dental Examination
```json
{
  "id": "scenario-dentist-001",
  "title": "Routine Dental Check-up - Anxiety Management",
  "description": "A patient with dental anxiety comes for a routine check-up and cleaning appointment.",
  "targetProfession": "dentist",
  "difficulty": "beginner",
  "clinicalArea": "general",
  "duration": 10,
  "patientPersona": {
    "age": 32,
    "gender": "male",
    "name": "Alex Rodriguez",
    "background": "Software engineer, avoids dental visits",
    "mainComplaint": "Routine check-up, last visit was 3 years ago",
    "medicalHistory": "No significant medical history, dental anxiety",
    "emotionalState": "Nervous and tense, fidgets in chair",
    "communicationStyle": "Short responses, needs reassurance and explanation"
  },
  "learningObjectives": [
    "Build rapport with anxious patient",
    "Explain procedures to reduce anxiety",
    "Provide gentle examination technique",
    "Encourage regular dental care"
  ],
  "status": "published",
  "createdAt": "2025-09-04T11:20:00Z"
}
```

### 2.4 Physiotherapist Scenarios

#### Scenario 1: Back Pain Assessment
```json
{
  "id": "scenario-physio-001",
  "title": "Lower Back Pain - Initial Assessment",
  "description": "A patient presents with chronic lower back pain affecting daily activities and work performance.",
  "targetProfession": "physiotherapist",
  "difficulty": "intermediate",
  "clinicalArea": "musculoskeletal", 
  "duration": 20,
  "patientPersona": {
    "age": 42,
    "gender": "female",
    "name": "Lisa Parker",
    "background": "Office manager, sits at desk most of the day",
    "mainComplaint": "Lower back pain for 6 months, worse in mornings",
    "medicalHistory": "No previous back injuries, sedentary lifestyle",
    "emotionalState": "Frustrated with pain, motivated to improve",
    "communicationStyle": "Detailed about symptoms, asks practical questions"
  },
  "learningObjectives": [
    "Conduct thorough pain assessment",
    "Explain relationship between posture and pain",
    "Demonstrate initial exercises",
    "Set realistic treatment goals"
  ],
  "status": "published",
  "createdAt": "2025-09-05T15:45:00Z"
}
```

## 3. Session Progress Data

### 3.1 Progress Charts Data

#### Score Progress Over Time
```json
{
  "scoreProgressData": [
    {"date": "2025-09-10", "score": 72, "sessionId": "session-001"},
    {"date": "2025-09-12", "score": 76, "sessionId": "session-002"},
    {"date": "2025-09-15", "score": 78, "sessionId": "session-003"},
    {"date": "2025-09-18", "score": 82, "sessionId": "session-004"},
    {"date": "2025-09-20", "score": 85, "sessionId": "session-005"},
    {"date": "2025-09-22", "score": 89, "sessionId": "session-006"}
  ]
}
```

#### Skill Radar Data
```json
{
  "skillRadarData": [
    {"skill": "Communication", "level": 85, "maxLevel": 100},
    {"skill": "Diagnosis", "level": 78, "maxLevel": 100}, 
    {"skill": "Patient Care", "level": 92, "maxLevel": 100},
    {"skill": "Clinical Knowledge", "level": 88, "maxLevel": 100},
    {"skill": "Empathy", "level": 94, "maxLevel": 100},
    {"skill": "Professional Skills", "level": 82, "maxLevel": 100}
  ]
}
```

#### Practice Frequency Data
```json
{
  "practiceFrequencyData": [
    {"week": "2025-W36", "sessions": 3, "totalTime": 65},
    {"week": "2025-W37", "sessions": 5, "totalTime": 120},
    {"week": "2025-W38", "sessions": 4, "totalTime": 95},
    {"week": "2025-W39", "sessions": 6, "totalTime": 140}
  ]
}
```

### 3.2 Feedback Report Examples

#### High-Performing Session
```json
{
  "id": "feedback-001",
  "sessionId": "session-006",
  "overallScore": 89,
  "transcript": "Doctor: Good morning, Mr. Mitchell. I'm Dr. Johnson. I understand you're experiencing chest pain. Can you tell me when this started?\n\nPatient: It started about 2 hours ago, doctor. It's a sharp pain right here in my chest, and it's going down my left arm.\n\nDoctor: I can understand how concerning that must be for you. Let me ask you a few more questions to help us figure out what's going on. On a scale of 1 to 10, how would you rate the pain?",
  "feedback": {
    "summary": "Excellent session demonstrating strong clinical communication skills. You showed appropriate empathy while systematically gathering crucial information about the patient's chest pain.",
    "strengths": [
      "Professional introduction and clear identification",
      "Excellent use of empathy when acknowledging patient concern", 
      "Systematic approach to pain assessment",
      "Clear, simple language appropriate for patient understanding"
    ],
    "improvements": [
      "Consider asking about radiation to other areas beyond the arm",
      "Could explore precipitating factors earlier in the conversation"
    ]
  },
  "detailedScores": {
    "grammar": 92,
    "pronunciation": 88,
    "clinicalCommunication": 91,
    "empathy": 95,
    "vocabulary": 86,
    "patientEducation": 87
  },
  "createdAt": "2025-09-22T16:30:00Z"
}
```

## 4. Subscription & Billing Data

### 4.1 Subscription Plans
```json
{
  "subscriptionPlans": [
    {
      "id": "plan-free",
      "name": "Free Trial",
      "price": 0,
      "interval": null,
      "features": [
        "3 practice sessions",
        "Basic feedback reports",
        "Access to beginner scenarios",
        "Mobile app access"
      ],
      "limitations": [
        "Limited to 3 sessions total",
        "No progress analytics",
        "No advanced scenarios"
      ]
    },
    {
      "id": "plan-monthly",
      "name": "Monthly Pro",
      "price": 29.99,
      "interval": "month",
      "features": [
        "Unlimited practice sessions",
        "Comprehensive feedback reports",
        "All difficulty levels",
        "Progress analytics and charts",
        "Priority customer support",
        "Mobile app access"
      ]
    },
    {
      "id": "plan-annual",
      "name": "Annual Pro",
      "price": 299.99,
      "interval": "year",
      "features": [
        "All Monthly Pro features",
        "2 months free (save 17%)",
        "Exclusive advanced scenarios",
        "Priority support with faster response"
      ]
    }
  ]
}
```

### 4.2 Billing History
```json
{
  "billingHistory": [
    {
      "id": "inv-001",
      "date": "2025-09-01T00:00:00Z",
      "amount": 29.99,
      "description": "Monthly Pro Subscription",
      "status": "successful",
      "invoiceUrl": "/invoices/inv-001.pdf",
      "paymentMethod": "****4242"
    },
    {
      "id": "inv-002", 
      "date": "2025-08-01T00:00:00Z",
      "amount": 29.99,
      "description": "Monthly Pro Subscription",
      "status": "successful", 
      "invoiceUrl": "/invoices/inv-002.pdf",
      "paymentMethod": "****4242"
    }
  ]
}
```

## 5. Admin Analytics Data

### 5.1 User Metrics
```json
{
  "userAnalytics": {
    "timeframe": {
      "start": "2025-09-01T00:00:00Z",
      "end": "2025-09-23T23:59:59Z"
    },
    "metrics": {
      "totalUsers": 1247,
      "activeUsers": 892,
      "newSignups": 156,
      "conversionRate": 23.5
    },
    "breakdown": [
      {"date": "2025-09-01", "signups": 12, "conversions": 3},
      {"date": "2025-09-02", "signups": 8, "conversions": 2},
      {"date": "2025-09-03", "signups": 15, "conversions": 4}
    ],
    "professionBreakdown": {
      "doctor": 445,
      "nurse": 523, 
      "dentist": 156,
      "physiotherapist": 123
    }
  }
}
```

### 5.2 Content Analytics
```json
{
  "contentAnalytics": {
    "popularScenarios": [
      {
        "id": "scenario-doc-001",
        "title": "Emergency Consultation - Chest Pain",
        "completions": 234,
        "averageScore": 82,
        "averageRating": 4.7
      },
      {
        "id": "scenario-nurse-001", 
        "title": "Post-Operative Patient Education",
        "completions": 189,
        "averageScore": 85,
        "averageRating": 4.6
      }
    ],
    "difficultyDistribution": {
      "beginner": 45,
      "intermediate": 32,
      "advanced": 23
    }
  }
}
```

## 6. Settings & Preferences Data

### 6.1 User Settings
```json
{
  "userSettings": {
    "preferences": {
      "language": "en",
      "timezone": "America/New_York",
      "theme": "light"
    },
    "notifications": {
      "email": {
        "practiceReminders": true,
        "feedbackReports": true,
        "newScenarios": false
      },
      "inApp": {
        "practiceReminders": true,
        "feedbackReady": true,
        "systemUpdates": false
      }
    },
    "accessibility": {
      "fontSize": "16px",
      "highContrast": false,
      "screenReader": false
    }
  }
}
```

## 7. System Status Data

### 7.1 Service Health
```json
{
  "systemStatus": {
    "status": "operational",
    "components": {
      "api": "operational",
      "websocket": "operational", 
      "storage": "operational",
      "ai": "operational"
    },
    "performance": {
      "latency": 145,
      "uptime": 99.9,
      "lastIncident": "2025-09-15T03:22:00Z"
    },
    "message": "All systems operational"
  }
}
```

## Implementation Guidelines

### Mock Data Usage
1. **Development Environment**: Use all mock data for frontend development
2. **Testing**: Ensure realistic healthcare scenarios for user testing
3. **AI Training**: Use mock scenarios to train AI without medical inaccuracies
4. **Demo Purposes**: Professional data suitable for stakeholder presentations

### Data Consistency Rules
1. **Timestamps**: All dates should be recent (within last 30 days)
2. **Medical Accuracy**: All scenarios reviewed for clinical appropriateness  
3. **Professional Context**: Language and situations appropriate for healthcare professionals
4. **Progress Logic**: Ensure score improvements follow realistic learning curves

## Traceability to PRD

This mock data specification supports:
- Section 6.2: Content Strategy (realistic healthcare scenarios)
- Section 7: Monetization Model (subscription states and billing data)
- User Progress Tracking (realistic practice session data)
- Professional User Experience (healthcare-appropriate content)

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-09-23 | 1.0 | Initial mock data specification |
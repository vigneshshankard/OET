# User Journeys Specification

Version: 1.0  
Last Updated: September 21, 2025

## Overview

This document specifies the complete user journeys for the OET Praxis platform, detailing the interactions, screens, and flows for each user type. All journeys are designed to optimize for the platform's core value proposition while maintaining simplicity and clarity.

## User Types

1. Free Trial User
2. Paid Subscriber
3. Administrator

## 1. Free Trial User Journey

### 1.1 Discovery and Signup Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth Service
    participant E as Email Service
    
    U->>F: Visits landing page
    F->>U: Display value proposition
    U->>F: Clicks "Start Free Trial"
    F->>U: Show signup form
    U->>F: Submits user details
    F->>A: Create account request
    A->>E: Send verification email
    E->>U: Email with verification link
    U->>F: Clicks verification link
    F->>A: Verify email
    A->>F: Account activated
    F->>U: Redirect to onboarding
```

#### Required Information
- Email address
- Password (8+ characters, 1 uppercase, 1 number)
- Full name
- Healthcare profession
- Agreement to terms of service

### 1.2 First Practice Session

```mermaid
graph TD
    A[Dashboard] -->|Select Scenario| B[Scenario Preview]
    B -->|Start Practice| D[Practice Interface with Smart Audio Monitoring]
    D -->|Complete Session| E[Feedback Report]
    E -->|View Results| F[Upgrade Prompt]
    
    D -->|Audio Issues Detected| G[Contextual Troubleshooting Overlay]
    G -->|Issue Resolved| D
```

#### Key Interactions
1. Scenario Selection
   - Auto-filtered to user's specific profession (doctor, nurse, dentist, physiotherapist)
   - Only profession-relevant scenarios displayed
   - Difficulty clearly marked
   - Expected duration shown

2. Practice Interface
   - Clear role-play instructions
   - Audio recording indicators with smart monitoring
   - Real-time audio quality detection
   - Time tracking
   - Emergency stop option
   - Contextual audio troubleshooting when needed

3. Feedback Report
   - Overall score
   - Detailed breakdown
   - Improvement suggestions
   - Sample correct responses

## 2. Paid Subscriber Journey

### 2.1 Subscription Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant P as Payment Service
    participant S as Subscription Service
    
    U->>F: Clicks "Upgrade"
    F->>P: Fetch plans
    P->>F: Available plans
    U->>F: Selects plan
    F->>P: Initialize payment
    P->>U: Payment form
    U->>P: Submits payment
    P->>S: Confirm subscription
    S->>F: Update user status
    F->>U: Show success page
```

#### Subscription Options
1. Monthly Plan
   - Instant access
   - Cancel anytime
   - All features included

2. Annual Plan
   - 20% discount
   - Instant access
   - All features included

### 2.2 Advanced Practice Features

```mermaid
graph TD
    A[Dashboard] -->|Browse Library| B[Scenario Library]
    A -->|View Progress| C[Progress Tracking]
    A -->|Account| D[Account Management]
    
    B -->|Filter Scenarios| E[Filtered Results]
    E -->|Start Practice| F[Practice Interface]
    
   C -->|View Details| G[Detailed Analytics]
    
    D -->|Manage Subscription| I[Subscription Settings]
    D -->|Update Profile| J[Profile Editor]
```

#### Available Features
1. Scenario Library
   - Profession-specific content only
   - Advanced filters (difficulty, clinical area, duration)
   - Difficulty progression tracking
   - Practice history for user's profession

2. Progress Tracking
   - Score trends
   - Improvement areas
   - Practice frequency

3. Account Management
   - Subscription status
   - Payment history
   - Profile settings
   - Notification preferences

## 3. Administrator Journey

### 3.1 Content Management

```mermaid
graph TD
    A[Admin Dashboard] -->|Content Management| B[Scenario Manager]
    B -->|Create New| C[Scenario Editor]
    B -->|Edit Existing| D[Edit Interface]
    B -->|Review Queue| E[Review Interface]
    
    C -->|AI Assist| F[AI Generation]
    F -->|Review| G[Review Interface]
    G -->|Approve| H[Publication]
    G -->|Edit| C
```

#### Content Management Features
1. Scenario Creation
   - AI-assisted generation
   - Template system
   - Medical accuracy check
   - Format validation

2. Review Process
   - Quality checklist
   - Medical review
   - Language review
   - Final approval

### 3.2 System Monitoring

```mermaid
sequenceDiagram
    participant A as Admin
    participant D as Dashboard
    participant M as Monitoring Service
    participant AL as Audit Logs
    
    A->>D: Access monitoring
    D->>M: Fetch metrics
    M->>D: System status
    D->>AL: Fetch recent logs
    AL->>D: Activity logs
    D->>A: Display overview
    
    A->>D: View details
    D->>M: Fetch specifics
    M->>D: Detailed metrics
    D->>A: Show detailed view
```

#### Monitoring Features
1. System Health
   - Service status
   - Error rates
   - Performance metrics
   - Capacity utilization

2. User Analytics
   - Active users
   - Session completion rates
   - Conversion metrics
   - Retention data

3. Content Analytics
   - Popular scenarios
   - Difficulty distribution
   - Completion rates
   - Feedback effectiveness

## UI/UX Guidelines

### 1. Navigation Structure
- shadcn/ui Navigation Menu component
- Consistent breadcrumbs using Breadcrumb component  
- Logical grouping with Card containers
- Quick actions via Command palette

### 2. Error Handling
- Alert components for clear error messages
- Toast notifications for user feedback
- Recovery instructions in Dialog components
- Automatic error reporting via form validation

### 3. Loading States
- Skeleton components for content loading
- Spinner animations for processing states
- Progress components for long operations
- Background operations with Toast updates

### 4. Responsive Design
- Mobile-first Tailwind CSS approach
- Touch-friendly Button components (min 48px)
- Responsive Grid and Flex layouts
- Adaptive Sheet components for mobile navigation

## Accessibility Requirements

1. WCAG 2.1 Compliance
   - Color contrast
   - Keyboard navigation
   - Screen reader support
   - Focus management

2. Audio Alternatives
   - Captions
   - Transcripts
   - Visual indicators
   - Volume controls

## Performance Targets

1. Page Load Times
   - First contentful paint: < 1.5s
   - Time to interactive: < 2s
   - Full page load: < 3s

2. Interactive Features
   - Button response: < 100ms
   - Form submission: < 500ms
   - Audio processing: < 1s
   - Feedback generation: < 3s

## Traceability to PRD

These user journeys directly implement:
- Section 6.1: User Journey specifications
- Section 6.2: Content Strategy implementation
- Section 7: Monetization Model execution

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-09-21 | 1.0 | Initial specification |
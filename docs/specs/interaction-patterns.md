# Interaction Patterns - OET Application

Version: 1.0  
Last Updated: September 21, 2025

## Core Philosophy

The interaction patterns are designed to create a natural, human-centric conversation experience. The UI acts as a facilitative mediator, not a technical interface. Every interaction upholds our principles of **Clarity, Calm Confidence, and Context**.

## 1. Real-time Conversation Flow

### 1.1 Conversation States

#### Active Listening (User's Turn)
- **Visual Indicator:** 
  - Calm, open circle microphone icon
  - Gentle pulsing animation using `Primary Blue` or `Teal`
  - Label: "Your turn" or "Listening..."
- **Audio State:**
  - Complete silence from AI
  - No background audio or static

#### AI Processing
- **Visual Indicator:**
  - Three horizontally aligned, softly pulsing dots (`· · ·`)
  - Label: "Thinking..."
  - No progress bars or technical indicators
- **State Management:**
  - Automatic transition from listening state
  - Maintains calm, confident appearance

#### AI Speaking
- **Visual Elements:**
  - Modern avatar or sound wave icon
  - Subtle amplitude animation
  - Label: "Responding..."
  - Real-time transcript display
- **Accessibility:**
  - Dual modality (audio + text)
  - High contrast transcript

### 1.2 Conversation Management

#### Turn Taking
- Automatic transition based on natural speech pauses
- No manual submission buttons
- Seamless state changes
- Natural conversation flow

#### Speech Detection
- Smart pause detection (1.5-2 second threshold)
- Visual feedback through animation
- 3-4 second grace period
- Gentle AI prompting if needed

#### Scenario Transitions
- Clear visual state change
- Conversation view minimization
- Animated transition to feedback
- Distinct context shift

## 2. WebRTC Connection Management

### 2.1 Connection States

#### Normal Operation
- No persistent connection indicators
- Invisible technology principle
- Focus on conversation
- Automatic quality management

#### Connection Issues
- Clear, non-technical messages
- Automatic recovery attempts
- Empathetic error handling
- User-focused solutions

### 2.2 Connection Handling

#### Initial Setup
- Background connection during loading
- Skeleton screen during setup
- Clear retry options if needed
- Simple error messages

#### Interruption Handling
- Immediate visual feedback
- Non-technical overlay
- Clear status messages
- Automatic recovery

#### Reconnection Flow
- Automatic reconnection attempts
- 15-second timeout
- Clear user options:
  - "Reconnect"
  - "Exit to Dashboard"
- Progress preservation

## 3. Session Management

### 3.1 Session Controls

#### Session Boundaries
- Explicit start action
- Two-step end process
- Clear confirmation
- Progress preservation

#### Time Management
- Numeric countdown timer
- Color-coded time states:
  - Normal: Default color
  - Warning: `Warning Amber` (< 30 seconds)
  - Critical: `Error Red` (< 10 seconds)
- Minimalist progress bar

### 3.2 Interruption Handling

#### System Interruptions
- Automatic session pause
- Clear status message
- Automatic resume when resolved
- Progress preservation

#### Browser Management
- Immediate pause on tab change
- Clear resume prompt
- Anti-cheating measures
- Session integrity maintenance

#### Audio Device Changes
- Automatic detection
- Clear user guidance
- Automatic resume
- Device flexibility

## Implementation Notes

1. **Technical Requirements**
   - WebRTC real-time audio streaming
   - LiveKit room management
   - Automatic connection recovery
   - Session state preservation

2. **Performance Targets**
   - Immediate state transitions
   - No perceivable latency
   - Smooth animations
   - Reliable connection handling

3. **Error Prevention**
   - Proactive connection monitoring
   - Automatic quality adjustment
   - Clear user feedback
   - Graceful degradation
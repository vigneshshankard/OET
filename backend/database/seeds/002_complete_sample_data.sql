-- Sample data for new tables to complete the microservice data mapping

-- Insert dialogues for the existing scenario
DO $$
DECLARE
    scenario_uuid UUID;
BEGIN
    SELECT id INTO scenario_uuid FROM scenarios WHERE title = 'Emergency Room Patient Assessment' LIMIT 1;
    
    IF scenario_uuid IS NOT NULL THEN
        -- Insert dialogues for the scenario
        INSERT INTO dialogues (scenario_id, speaker, message, expected_response, order_number) VALUES
        (scenario_uuid, 'patient', 'Doctor, I have been having severe chest pain for the past hour.', 'I understand you are experiencing chest pain. Can you describe the pain for me?', 1),
        (scenario_uuid, 'user', 'Can you describe the pain? Is it sharp, dull, or crushing?', 'It feels like someone is sitting on my chest, very heavy and tight.', 2),
        (scenario_uuid, 'patient', 'It feels like someone is sitting on my chest, very heavy and tight.', 'When did this pain start? Was it sudden or gradual?', 3),
        (scenario_uuid, 'user', 'When did this pain start? Was it sudden or gradual?', 'It started about an hour ago, very suddenly while I was watching TV.', 4),
        (scenario_uuid, 'patient', 'It started about an hour ago, very suddenly while I was watching TV.', 'Are you experiencing any shortness of breath, nausea, or sweating?', 5),
        (scenario_uuid, 'user', 'Are you experiencing any other symptoms like shortness of breath?', 'Yes, I am having trouble breathing and I feel nauseous.', 6),
        (scenario_uuid, 'patient', 'Yes, I am having trouble breathing and I feel nauseous.', 'Do you have any history of heart problems or take any medications?', 7),
        (scenario_uuid, 'user', 'Do you have any history of heart problems?', 'My father had a heart attack when he was 55, and I take blood pressure medication.', 8);
    END IF;
END $$;

-- Insert user progress for the test user
DO $$
DECLARE
    user_uuid UUID;
    scenario_uuid UUID;
    first_dialogue_uuid UUID;
BEGIN
    SELECT id INTO user_uuid FROM users WHERE email = 'test@example.com' LIMIT 1;
    SELECT id INTO scenario_uuid FROM scenarios WHERE title = 'Emergency Room Patient Assessment' LIMIT 1;
    SELECT id INTO first_dialogue_uuid FROM dialogues WHERE scenario_id = scenario_uuid ORDER BY order_number LIMIT 1;
    
    IF user_uuid IS NOT NULL AND scenario_uuid IS NOT NULL THEN
        INSERT INTO user_progress (user_id, scenario_id, status, current_dialogue_id, score, time_spent, attempts, metadata) VALUES
        (user_uuid, scenario_uuid, 'in_progress', first_dialogue_uuid, 85.5, 1200, 2, '{"notes": "Good communication skills, needs work on follow-up questions"}');
    END IF;
END $$;

-- Insert sample session data
DO $$
DECLARE
    user_uuid UUID;
    session_uuid UUID;
BEGIN
    SELECT id INTO user_uuid FROM users WHERE email = 'test@example.com' LIMIT 1;
    
    IF user_uuid IS NOT NULL THEN
        INSERT INTO session_data (id, user_id, user_email, user_role, device_id, device_info, ip_address, user_agent, expires_at, metadata) VALUES
        (gen_random_uuid(), user_uuid, 'test@example.com', 'student', 'device-001', 
         '{"platform": "web", "browser": "Chrome", "version": "91.0", "mobile": false}',
         '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
         CURRENT_TIMESTAMP + INTERVAL '24 hours',
         '{"login_method": "email", "remember_me": true}')
        RETURNING id INTO session_uuid;
        
        -- Insert session activity
        INSERT INTO session_activity (session_id, action, ip_address, user_agent, details) VALUES
        (session_uuid, 'login', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '{"success": true, "method": "email"}'),
        (session_uuid, 'activity', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '{"page": "dashboard", "action": "view"}');
    END IF;
END $$;

-- Insert sample practice session
DO $$
DECLARE
    user_uuid UUID;
    scenario_uuid UUID;
    practice_session_uuid UUID;
    room_uuid UUID;
BEGIN
    SELECT id INTO user_uuid FROM users WHERE email = 'test@example.com' LIMIT 1;
    SELECT id INTO scenario_uuid FROM scenarios WHERE title = 'Emergency Room Patient Assessment' LIMIT 1;
    
    IF user_uuid IS NOT NULL AND scenario_uuid IS NOT NULL THEN
        -- Create LiveKit room
        INSERT INTO livekit_rooms (name, sid, metadata) VALUES
        ('room-emergency-assessment-001', 'RM_abc123def456', '{"scenario_type": "assessment", "max_participants": 2}')
        RETURNING id INTO room_uuid;
        
        -- Create practice session
        INSERT INTO practice_sessions (user_id, scenario_id, status, livekit_room_name, livekit_token, metadata) VALUES
        (user_uuid, scenario_uuid, 'active', 'room-emergency-assessment-001', 
         'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 
         '{"quality": "high", "recording_enabled": true}')
        RETURNING id INTO practice_session_uuid;
        
        -- Add LiveKit participant
        INSERT INTO livekit_participants (room_id, user_id, participant_id, identity, metadata) VALUES
        (room_uuid, user_uuid, 'participant_001', 'test_user', '{"role": "student", "permissions": ["audio", "video"]}');
        
        -- Insert sample session messages
        INSERT INTO session_messages (session_id, user_id, message_type, data, sequence_number, metadata) VALUES
        (practice_session_uuid, user_uuid, 'session_start', '{"timestamp": "2024-01-15T10:00:00Z", "room": "room-emergency-assessment-001"}', 1, '{}'),
        (practice_session_uuid, user_uuid, 'audio', '{"duration": 3.2, "quality": "high", "transcript": "Hello, I am here to help you."}', 2, '{"confidence": 0.95}'),
        (practice_session_uuid, user_uuid, 'response', '{"text": "Thank you doctor, I really need help.", "emotion": "anxious", "timing": 2.1}', 3, '{"ai_generated": true}'),
        (practice_session_uuid, user_uuid, 'audio_quality', '{"status": "good", "confidence": 0.87, "noise_level": "low"}', 4, '{}');
    END IF;
END $$;

-- Insert sample media files
DO $$
DECLARE
    user_uuid UUID;
    scenario_uuid UUID;
    dialogue_uuid UUID;
BEGIN
    SELECT id INTO user_uuid FROM users WHERE email = 'admin@oetpraxis.com' LIMIT 1;
    SELECT id INTO scenario_uuid FROM scenarios WHERE title = 'Emergency Room Patient Assessment' LIMIT 1;
    SELECT id INTO dialogue_uuid FROM dialogues WHERE scenario_id = scenario_uuid ORDER BY order_number LIMIT 1;
    
    IF user_uuid IS NOT NULL AND scenario_uuid IS NOT NULL THEN
        INSERT INTO media_files (filename, original_name, file_type, file_size, file_path, mime_type, uploaded_by, scenario_id, dialogue_id, metadata) VALUES
        ('audio_001.mp3', 'patient_response_chest_pain.mp3', 'audio', 245760, '/media/scenarios/emergency/audio_001.mp3', 'audio/mpeg', user_uuid, scenario_uuid, dialogue_uuid, '{"duration": 15.2, "quality": "high", "language": "en"}'),
        ('background_001.jpg', 'emergency_room_background.jpg', 'image', 1048576, '/media/scenarios/emergency/background_001.jpg', 'image/jpeg', user_uuid, scenario_uuid, NULL, '{"width": 1920, "height": 1080, "purpose": "background"}');
    END IF;
END $$;

-- Add some additional scenarios with dialogues
INSERT INTO scenarios (title, description, patient_persona, clinical_area, difficulty_level, profession, status) VALUES
('Dental Check-up Conversation', 
 'Practice routine dental examination communication with an anxious patient',
 '{"name": "Sarah Johnson", "age": 28, "background": "First dental visit in 3 years, very anxious", "concerns": ["pain sensitivity", "cost of treatment"], "personality": "nervous but cooperative"}',
 'General Dentistry',
 'beginner',
 'dentist',
 'published'),
('Physical Therapy Assessment', 
 'Conduct initial assessment for lower back pain patient',
 '{"name": "Robert Chen", "age": 45, "background": "Office worker with chronic lower back pain", "concerns": ["mobility", "return to work"], "personality": "motivated but impatient"}',
 'Musculoskeletal',
 'intermediate', 
 'physiotherapist',
 'published');

COMMIT;
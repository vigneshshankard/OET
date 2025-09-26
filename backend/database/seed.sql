-- Seed data based on mock-data-specification.md

-- Insert admin user
INSERT INTO users (id, email, hashed_password, full_name, role, profession, is_email_verified, created_at)
VALUES (
    'admin-001',
    'admin@oetpraxis.com',
    'admin-hashed-password-change-in-production',
    'OET Admin',
    'admin',
    'doctor',
    true,
    CURRENT_TIMESTAMP
);

-- Insert sample users from mock data specification
INSERT INTO users (id, email, hashed_password, full_name, role, profession, is_email_verified, created_at, last_login_at)
VALUES 
    (
        'user-doc-001',
        'sarah.johnson@email.com',
        'hashed-password-sarah',
        'Dr. Sarah Johnson',
        'user',
        'doctor',
        true,
        '2025-09-15 10:30:00',
        '2025-09-23 14:20:00'
    ),
    (
        'user-nurse-001',
        'maria.santos@email.com',
        'hashed-password-maria',
        'Maria Santos',
        'user',
        'nurse',
        true,
        '2025-09-10 08:15:00',
        '2025-09-22 16:45:00'
    ),
    (
        'user-dentist-001',
        'james.wilson@email.com',
        'hashed-password-james',
        'Dr. James Wilson',
        'user',
        'dentist',
        true,
        '2025-09-20 12:00:00',
        '2025-09-23 09:30:00'
    ),
    (
        'user-physio-001',
        'emma.thompson@email.com',
        'hashed-password-emma',
        'Emma Thompson',
        'user',
        'physiotherapist',
        true,
        '2025-09-18 14:30:00',
        '2025-09-22 11:15:00'
    );

-- Insert subscriptions for users
INSERT INTO subscriptions (id, user_id, plan_name, status, created_at)
VALUES 
    ('sub-doc-001', 'user-doc-001', 'free', 'active', '2025-09-15 10:30:00'),
    ('sub-nurse-001', 'user-nurse-001', 'free', 'active', '2025-09-10 08:15:00'),
    ('sub-dentist-001', 'user-dentist-001', 'free', 'active', '2025-09-20 12:00:00'),
    ('sub-physio-001', 'user-physio-001', 'paid', 'active', '2025-09-18 14:30:00');

-- Insert sample scenarios
INSERT INTO scenarios (id, title, description, patient_persona, clinical_area, difficulty_level, profession, status, created_by_admin_id, created_at)
VALUES 
    (
        'scenario-doc-001',
        'Acute Chest Pain Assessment',
        'A 45-year-old male presents to the emergency department with acute chest pain. You need to conduct a thorough history and physical examination to rule out cardiac causes.',
        '{
            "name": "Robert Miller",
            "age": 45,
            "gender": "male",
            "medicalHistory": ["Hypertension", "Type 2 Diabetes"],
            "currentSymptoms": ["Chest pain", "Shortness of breath", "Sweating"],
            "personality": "Anxious and worried about heart attack",
            "communicationStyle": "Direct but concerned",
            "anxietyLevel": "high"
        }'::jsonb,
        'Cardiology',
        'intermediate',
        'doctor',
        'published',
        'admin-001',
        '2025-09-01 10:00:00'
    ),
    (
        'scenario-nurse-001',
        'Post-Operative Care Discussion',
        'You need to explain post-operative care instructions to a patient who has just had knee replacement surgery. The patient is elderly and has some hearing difficulties.',
        '{
            "name": "Margaret Thompson",
            "age": 72,
            "gender": "female",
            "medicalHistory": ["Osteoarthritis", "Mild hearing loss"],
            "currentSymptoms": ["Post-surgical pain", "Limited mobility"],
            "personality": "Pleasant but worried about recovery",
            "communicationStyle": "Speaks slowly, needs repetition",
            "anxietyLevel": "medium"
        }'::jsonb,
        'Orthopedics',
        'beginner',
        'nurse',
        'published',
        'admin-001',
        '2025-09-01 11:00:00'
    ),
    (
        'scenario-dentist-001',
        'Routine Dental Check-up',
        'Conduct a routine dental examination for a 28-year-old patient who has not visited a dentist in 3 years. Address their concerns about potential dental problems.',
        '{
            "name": "Alex Chen",
            "age": 28,
            "gender": "male",
            "medicalHistory": ["No significant medical history"],
            "currentSymptoms": ["Occasional tooth sensitivity"],
            "personality": "Nervous about dental procedures",
            "communicationStyle": "Asks many questions",
            "anxietyLevel": "medium"
        }'::jsonb,
        'General Dentistry',
        'beginner',
        'dentist',
        'published',
        'admin-001',
        '2025-09-01 12:00:00'
    ),
    (
        'scenario-physio-001',
        'Lower Back Pain Assessment',
        'Assess and create a treatment plan for a 35-year-old office worker presenting with chronic lower back pain. The patient is frustrated with ongoing discomfort.',
        '{
            "name": "David Park",
            "age": 35,
            "gender": "male",
            "medicalHistory": ["No significant medical history"],
            "currentSymptoms": ["Lower back pain", "Muscle stiffness", "Limited range of motion"],
            "personality": "Frustrated and impatient",
            "communicationStyle": "Direct, wants quick solutions",
            "anxietyLevel": "low"
        }'::jsonb,
        'Musculoskeletal',
        'intermediate',
        'physiotherapist',
        'published',
        'admin-001',
        '2025-09-01 13:00:00'
    );

-- Insert sample sessions
INSERT INTO sessions (id, user_id, scenario_id, status, duration_seconds, created_at)
VALUES 
    ('session-001', 'user-doc-001', 'scenario-doc-001', 'completed', 1080, '2025-09-20 09:00:00'),
    ('session-002', 'user-doc-001', 'scenario-doc-001', 'completed', 1200, '2025-09-22 14:30:00'),
    ('session-003', 'user-nurse-001', 'scenario-nurse-001', 'completed', 900, '2025-09-19 10:15:00'),
    ('session-004', 'user-nurse-001', 'scenario-nurse-001', 'completed', 1050, '2025-09-21 16:00:00'),
    ('session-005', 'user-nurse-001', 'scenario-nurse-001', 'completed', 840, '2025-09-23 11:30:00'),
    ('session-006', 'user-dentist-001', 'scenario-dentist-001', 'completed', 720, '2025-09-22 15:45:00');

-- Insert sample feedback reports
INSERT INTO feedback_reports (id, session_id, transcript, ai_summary, score_raw, strengths, areas_for_improvement, created_at)
VALUES 
    (
        'feedback-001',
        'session-001',
        'Doctor: Good morning, Mr. Miller. I understand you''re experiencing chest pain. Can you tell me when this started? Patient: It started about 2 hours ago while I was at work. It''s a sharp pain right here in the center of my chest.',
        'The candidate demonstrated good opening rapport and asked appropriate initial questions about symptom onset. Clear communication style with the patient.',
        78,
        'Good bedside manner, appropriate initial questioning, clear communication',
        'Could explore pain characteristics more thoroughly, consider asking about radiation and associated symptoms earlier',
        '2025-09-20 09:18:00'
    ),
    (
        'feedback-002',
        'session-002',
        'Doctor: Hello Mr. Miller, I see you''re back with chest pain. Let me ask you some detailed questions. Can you describe the pain for me? Is it sharp, dull, or crushing? Patient: It feels like pressure, like someone is sitting on my chest.',
        'Improved questioning technique with more specific symptom characterization. Good follow-up on pain quality.',
        82,
        'Excellent symptom characterization questions, professional demeanor, systematic approach',
        'Consider asking about timing and triggers more systematically, explore family history',
        '2025-09-22 14:48:00'
    );

-- Insert user progress snapshots
INSERT INTO user_progress_snapshots (user_id, snapshot_date, average_score, sessions_completed_count, strengths_topics)
VALUES 
    (
        'user-doc-001',
        '2025-09-22',
        80,
        2,
        '["History taking", "Communication skills", "Clinical reasoning"]'::jsonb
    ),
    (
        'user-nurse-001',
        '2025-09-23',
        85,
        3,
        '["Patient education", "Empathy", "Clear instructions"]'::jsonb
    ),
    (
        'user-dentist-001',
        '2025-09-22',
        85,
        1,
        '["Patient rapport", "Examination technique"]'::jsonb
    );
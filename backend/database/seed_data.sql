-- Seed data for OET Praxis development
-- Insert sample scenarios, users, and test data

-- Insert admin user
INSERT INTO users (email, hashed_password, full_name, role, profession, is_email_verified) 
VALUES (
    'admin@oetpraxis.com',
    '$2b$12$LQv3c1yqBwEFY4fgqJXFQ.OKRYyOruGdRzHxYT8e8B4OPnXBXnQ2i', -- password: 'admin123'
    'OET Admin',
    'admin',
    'doctor',
    true
) ON CONFLICT (email) DO NOTHING;

-- Get the admin user ID for foreign key references
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@oetpraxis.com';
    
    -- Insert sample scenarios
    INSERT INTO scenarios (
        title, description, patient_persona, clinical_area, 
        profession, difficulty_level, created_by_admin_id, status
    ) VALUES 
    (
        'Patient Consultation - Diabetes Management',
        'Conduct a follow-up consultation with a patient who has been managing Type 2 diabetes for 6 months. Review their current medication regimen, discuss lifestyle modifications, and address their concerns about blood sugar control.',
        '{
            "name": "Mrs. Sarah Chen",
            "age": 52,
            "occupation": "Accountant",
            "condition": "Type 2 Diabetes",
            "background": "Diagnosed 6 months ago, taking Metformin 500mg twice daily",
            "concerns": [
                "Worried about long-term complications",
                "Difficulty maintaining diet during busy work periods",
                "Questions about exercise recommendations"
            ]
        }'::jsonb,
        'Endocrinology',
        'doctor',
        'intermediate',
        admin_user_id,
        'published'
    ),
    (
        'Emergency Assessment - Chest Pain',
        'A 45-year-old patient presents to the emergency department with sudden onset chest pain. Conduct an initial assessment, gather relevant history, and explain the next steps in their care.',
        '{
            "name": "Mr. James Wilson",
            "age": 45,
            "occupation": "Construction Worker",
            "condition": "Acute Chest Pain",
            "background": "No previous cardiac history, smoker for 20 years",
            "concerns": [
                "Fear of having a heart attack",
                "Worried about work absence",
                "Anxious about medical procedures"
            ]
        }'::jsonb,
        'Emergency Medicine',
        'doctor',
        'advanced',
        admin_user_id,
        'published'
    ),
    (
        'Post-Surgery Follow-up - Knee Replacement',
        'Review progress with a patient who had total knee replacement surgery 2 weeks ago. Assess healing, discuss rehabilitation progress, and address any concerns about recovery.',
        '{
            "name": "Mrs. Margaret Thompson",
            "age": 68,
            "occupation": "Retired Teacher",
            "condition": "Post-operative knee replacement",
            "background": "Surgery 2 weeks ago, currently in physiotherapy",
            "concerns": [
                "Slower recovery than expected",
                "Pain management questions",
                "Concerns about returning to normal activities"
            ]
        }'::jsonb,
        'Orthopedics',
        'doctor',
        'beginner',
        admin_user_id,
        'published'
    ),
    (
        'Medication Administration - Hypertension',
        'Explain medication changes to an elderly patient with hypertension. Ensure they understand the new dosing schedule and potential side effects.',
        '{
            "name": "Mr. Robert Davies",
            "age": 74,
            "occupation": "Retired Engineer",
            "condition": "Hypertension",
            "background": "Long-term hypertension, medication adjustment needed",
            "concerns": [
                "Confusion about multiple medications",
                "Memory issues with dosing times",
                "Concern about side effects"
            ]
        }'::jsonb,
        'Cardiology',
        'nurse',
        'intermediate',
        admin_user_id,
        'published'
    ),
    (
        'Dental Examination - Routine Checkup',
        'Conduct a routine dental examination and cleaning for a patient who has anxiety about dental procedures. Explain findings and recommend treatment plan.',
        '{
            "name": "Ms. Lisa Parker",
            "age": 28,
            "occupation": "Graphic Designer",
            "condition": "Routine dental care",
            "background": "Last visit 18 months ago, dental anxiety",
            "concerns": [
                "Fear of dental procedures",
                "Sensitivity in back teeth",
                "Questions about cosmetic options"
            ]
        }'::jsonb,
        'General Dentistry',
        'dentist',
        'beginner',
        admin_user_id,
        'published'
    ),
    (
        'Physiotherapy Assessment - Back Pain',
        'Assess a patient with chronic lower back pain and develop a treatment plan. Educate them about exercises and lifestyle modifications.',
        '{
            "name": "Mr. David Kim",
            "age": 35,
            "occupation": "Office Manager",
            "condition": "Chronic lower back pain",
            "background": "Desk job, poor posture, pain for 6 months",
            "concerns": [
                "Impact on work performance",
                "Fear of worsening condition",
                "Questions about surgery necessity"
            ]
        }'::jsonb,
        'Musculoskeletal',
        'physiotherapist',
        'intermediate',
        admin_user_id,
        'published'
    ) ON CONFLICT DO NOTHING;
    
    -- Insert a test user
    INSERT INTO users (email, hashed_password, full_name, role, profession, is_email_verified)
    VALUES (
        'test@oetpraxis.com',
        '$2b$12$LQv3c1yqBwEFY4fgqJXFQ.OKRYyOruGdRzHxYT8e8B4OPnXBXnQ2i', -- password: 'test123'
        'Test User',
        'user',
        'doctor',
        true
    ) ON CONFLICT (email) DO NOTHING;
    
END $$;
-- Seed data for quick local testing (PostgreSQL)
-- Creates 1 ADMIN, 6 DOCTOR, 1 USER and wires doctor profile/application.
-- Passwords:
--   ADMIN  -> Admin12345!
--   DOCTOR -> Doctor12345!
--   USER   -> User12345!
--
-- Note: Uses pgcrypto's crypt/gen_salt to generate bcrypt hashes in DB.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_admin_id UUID := '11111111-1111-4111-8111-111111111111';
    v_doctor_id UUID := '22222222-2222-4222-8222-222222222222';
    v_doctor2_id UUID := '22222222-2222-4222-8222-222222222223';
    v_doctor3_id UUID := '22222222-2222-4222-8222-222222222224';
    v_doctor4_id UUID := '22222222-2222-4222-8222-222222222225';
    v_doctor5_id UUID := '22222222-2222-4222-8222-222222222226';
    v_doctor6_id UUID := '22222222-2222-4222-8222-222222222227';
    v_user_id UUID := '33333333-3333-4333-8333-333333333333';
    v_doctor_application_id UUID := '44444444-4444-4444-8444-444444444444';
    v_doctor2_application_id UUID := '44444444-4444-4444-8444-444444444445';
    v_doctor3_application_id UUID := '44444444-4444-4444-8444-444444444446';
    v_doctor4_application_id UUID := '44444444-4444-4444-8444-444444444447';
    v_doctor5_application_id UUID := '44444444-4444-4444-8444-444444444448';
    v_doctor6_application_id UUID := '44444444-4444-4444-8444-444444444449';
    v_doctor_profile_id UUID := '55555555-5555-4555-8555-555555555555';
    v_doctor2_profile_id UUID := '55555555-5555-4555-8555-555555555556';
    v_doctor3_profile_id UUID := '55555555-5555-4555-8555-555555555557';
    v_doctor4_profile_id UUID := '55555555-5555-4555-8555-555555555558';
    v_doctor5_profile_id UUID := '55555555-5555-4555-8555-555555555559';
    v_doctor6_profile_id UUID := '55555555-5555-4555-8555-555555555560';
BEGIN
    INSERT INTO users (id, email, phone, password_hash, role, status)
    VALUES (
        v_admin_id,
        'admin.test@sabina.dev',
        '+962790000001',
        crypt('Admin12345!', gen_salt('bf', 12)),
        'ADMIN',
        'ACTIVE'
    )
    ON CONFLICT (email) DO UPDATE
    SET
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        status = EXCLUDED.status
    RETURNING id INTO v_admin_id;

    INSERT INTO users (id, email, phone, password_hash, role, status)
    VALUES (
        v_doctor_id,
        'doctor.test@sabina.dev',
        '+962790000002',
        crypt('Doctor12345!', gen_salt('bf', 12)),
        'DOCTOR',
        'ACTIVE'
    )
    ON CONFLICT (email) DO UPDATE
    SET
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        status = EXCLUDED.status
    RETURNING id INTO v_doctor_id;

    INSERT INTO users (id, email, phone, password_hash, role, status)
    VALUES (
        v_user_id,
        'user.test@sabina.dev',
        '+962790000003',
        crypt('User12345!', gen_salt('bf', 12)),
        'USER',
        'ACTIVE'
    )
    ON CONFLICT (email) DO UPDATE
    SET
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        status = EXCLUDED.status
    RETURNING id INTO v_user_id;

    INSERT INTO users (id, email, phone, password_hash, role, status)
    VALUES (
        v_doctor2_id,
        'layla.hassan.test@sabina.dev',
        '+962790000004',
        crypt('Doctor12345!', gen_salt('bf', 12)),
        'DOCTOR',
        'ACTIVE'
    )
    ON CONFLICT (email) DO UPDATE
    SET
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        status = EXCLUDED.status
    RETURNING id INTO v_doctor2_id;

    INSERT INTO users (id, email, phone, password_hash, role, status)
    VALUES (
        v_doctor3_id,
        'omar.khalid.test@sabina.dev',
        '+962790000005',
        crypt('Doctor12345!', gen_salt('bf', 12)),
        'DOCTOR',
        'ACTIVE'
    )
    ON CONFLICT (email) DO UPDATE
    SET
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        status = EXCLUDED.status
    RETURNING id INTO v_doctor3_id;

    INSERT INTO users (id, email, phone, password_hash, role, status)
    VALUES (
        v_doctor4_id,
        'maya.nasser.test@sabina.dev',
        '+962790000006',
        crypt('Doctor12345!', gen_salt('bf', 12)),
        'DOCTOR',
        'ACTIVE'
    )
    ON CONFLICT (email) DO UPDATE
    SET
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        status = EXCLUDED.status
    RETURNING id INTO v_doctor4_id;

    INSERT INTO users (id, email, phone, password_hash, role, status)
    VALUES (
        v_doctor5_id,
        'yusuf.ali.test@sabina.dev',
        '+962790000007',
        crypt('Doctor12345!', gen_salt('bf', 12)),
        'DOCTOR',
        'ACTIVE'
    )
    ON CONFLICT (email) DO UPDATE
    SET
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        status = EXCLUDED.status
    RETURNING id INTO v_doctor5_id;

    INSERT INTO users (id, email, phone, password_hash, role, status)
    VALUES (
        v_doctor6_id,
        'jana.faris.test@sabina.dev',
        '+962790000008',
        crypt('Doctor12345!', gen_salt('bf', 12)),
        'DOCTOR',
        'ACTIVE'
    )
    ON CONFLICT (email) DO UPDATE
    SET
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        status = EXCLUDED.status
    RETURNING id INTO v_doctor6_id;

    INSERT INTO doctor_applications (
        id,
        doctor_user_id,
        status,
        display_name,
        headline,
        bio,
        languages,
        specialties,
        concerns,
        therapy_approaches,
        session_types,
        gender_identity,
        insurance_providers,
        location_country,
        location_city,
        years_experience,
        pricing_currency,
        pricing_per_session,
        pricing_notes,
        submitted_at,
        reviewed_at,
        reviewer_admin_id
    )
    VALUES (
        v_doctor_application_id,
        v_doctor_id,
        'APPROVED',
        'Dr. Kareem Nabil',
        'General Psychiatrist (Dummy)',
        'Dummy profile for local testing. Focused on general adult psychiatry and stress-related conditions.',
        '["Arabic","English"]'::jsonb,
        '["General Psychiatry","Mood Disorders","Stress Management"]'::jsonb,
        '["Stress","Depression","Anxiety"]'::jsonb,
        '["Supportive Psychotherapy","Medication Management","CBT-informed Care"]'::jsonb,
        '["VIDEO","IN_PERSON"]'::jsonb,
        'Male',
        '["MedNet","NatHealth"]'::jsonb,
        'Jordan',
        'Amman',
        11,
        'JOD',
        42.00,
        'Dummy doctor seed pricing.',
        now(),
        now(),
        v_admin_id
    )
    ON CONFLICT (doctor_user_id) DO UPDATE
    SET
        status = EXCLUDED.status,
        display_name = EXCLUDED.display_name,
        headline = EXCLUDED.headline,
        bio = EXCLUDED.bio,
        languages = EXCLUDED.languages,
        specialties = EXCLUDED.specialties,
        concerns = EXCLUDED.concerns,
        therapy_approaches = EXCLUDED.therapy_approaches,
        session_types = EXCLUDED.session_types,
        gender_identity = EXCLUDED.gender_identity,
        insurance_providers = EXCLUDED.insurance_providers,
        location_country = EXCLUDED.location_country,
        location_city = EXCLUDED.location_city,
        years_experience = EXCLUDED.years_experience,
        pricing_currency = EXCLUDED.pricing_currency,
        pricing_per_session = EXCLUDED.pricing_per_session,
        pricing_notes = EXCLUDED.pricing_notes,
        submitted_at = EXCLUDED.submitted_at,
        reviewed_at = EXCLUDED.reviewed_at,
        reviewer_admin_id = EXCLUDED.reviewer_admin_id;

    INSERT INTO doctor_profiles (
        id,
        doctor_user_id,
        slug,
        display_name,
        headline,
        bio,
        approach_text,
        photo_url,
        languages,
        specialties,
        concerns,
        therapy_approaches,
        session_types,
        gender_identity,
        insurance_providers,
        location_country,
        location_city,
        clinic_name,
        address_line,
        map_url,
        next_available_at,
        availability_timezone,
        availability_preview_slots,
        years_experience,
        rating,
        reviews_count,
        pricing_currency,
        pricing_per_session,
        follow_up_price,
        pricing_notes,
        certifications,
        verification_badges,
        is_top_doctor,
        is_public,
        published_at
    )
    VALUES (
        v_doctor_profile_id,
        v_doctor_id,
        'dr-kareem-nabil',
        'Dr. Kareem Nabil',
        'General Psychiatrist (Dummy)',
        'Dummy profile for local testing. Focused on general adult psychiatry and stress-related conditions.',
        'Integrative psychiatry with practical coping plans and short-term stabilization goals.',
        'https://placehold.co/512x512?text=Dr.+Kareem',
        '["Arabic","English"]'::jsonb,
        '["General Psychiatry","Mood Disorders","Stress Management"]'::jsonb,
        '["Stress","Depression","Anxiety"]'::jsonb,
        '["Supportive Psychotherapy","Medication Management","CBT-informed Care"]'::jsonb,
        '["VIDEO","IN_PERSON"]'::jsonb,
        'Male',
        '["MedNet","NatHealth"]'::jsonb,
        'Jordan',
        'Amman',
        'Amman Wellness Psychiatry Clinic',
        'Khalda, Amman (Dummy Address for Testing)',
        'https://maps.google.com/?q=Amman+Khalda',
        now() + interval '1 day',
        'Asia/Amman',
        '["2026-03-02T17:00:00+03:00","2026-03-03T12:30:00+03:00"]'::jsonb,
        11,
        4.60,
        41,
        'JOD',
        42.00,
        32.00,
        'Dummy doctor seed pricing.',
        '["Psychiatry Certification (Dummy)","CBT Training (Dummy)"]'::jsonb,
        '["VERIFIED_DOCTOR"]'::jsonb,
        false,
        true,
        now()
    )
    ON CONFLICT (doctor_user_id) DO UPDATE
    SET
        slug = EXCLUDED.slug,
        display_name = EXCLUDED.display_name,
        headline = EXCLUDED.headline,
        bio = EXCLUDED.bio,
        approach_text = EXCLUDED.approach_text,
        photo_url = EXCLUDED.photo_url,
        languages = EXCLUDED.languages,
        specialties = EXCLUDED.specialties,
        concerns = EXCLUDED.concerns,
        therapy_approaches = EXCLUDED.therapy_approaches,
        session_types = EXCLUDED.session_types,
        gender_identity = EXCLUDED.gender_identity,
        insurance_providers = EXCLUDED.insurance_providers,
        location_country = EXCLUDED.location_country,
        location_city = EXCLUDED.location_city,
        clinic_name = EXCLUDED.clinic_name,
        address_line = EXCLUDED.address_line,
        map_url = EXCLUDED.map_url,
        next_available_at = EXCLUDED.next_available_at,
        availability_timezone = EXCLUDED.availability_timezone,
        availability_preview_slots = EXCLUDED.availability_preview_slots,
        years_experience = EXCLUDED.years_experience,
        rating = EXCLUDED.rating,
        reviews_count = EXCLUDED.reviews_count,
        pricing_currency = EXCLUDED.pricing_currency,
        pricing_per_session = EXCLUDED.pricing_per_session,
        follow_up_price = EXCLUDED.follow_up_price,
        pricing_notes = EXCLUDED.pricing_notes,
        certifications = EXCLUDED.certifications,
        verification_badges = EXCLUDED.verification_badges,
        is_top_doctor = EXCLUDED.is_top_doctor,
        is_public = EXCLUDED.is_public,
        published_at = EXCLUDED.published_at;

    INSERT INTO doctor_applications (
        id,
        doctor_user_id,
        status,
        display_name,
        headline,
        bio,
        languages,
        specialties,
        concerns,
        therapy_approaches,
        session_types,
        gender_identity,
        insurance_providers,
        location_country,
        location_city,
        years_experience,
        pricing_currency,
        pricing_per_session,
        pricing_notes,
        submitted_at,
        reviewed_at,
        reviewer_admin_id
    )
    VALUES
    (
        v_doctor2_application_id,
        v_doctor2_id,
        'APPROVED',
        'Dr. Lina Sabri',
        'Clinical Psychologist (CBT/ACT)',
        'Dr. Lina Sabri is a clinical psychologist providing structured, compassionate therapy for anxiety, depression, and trauma-related concerns. She uses evidence-based approaches and focuses on practical skills, emotional regulation, and long-term resilience. (Dummy profile for testing only.)',
        '["Arabic","English"]'::jsonb,
        '["Anxiety","Depression","Trauma","Stress Management","Panic Disorder"]'::jsonb,
        '["Anxiety","Depression","Trauma","Stress Management","Panic Disorder"]'::jsonb,
        '["CBT","ACT"]'::jsonb,
        '["In-person","Online"]'::jsonb,
        'Female',
        '["MedNet","NatHealth"]'::jsonb,
        'Jordan',
        'Amman',
        9,
        'JOD',
        35.00,
        'Dummy profile for testing only.',
        now(),
        now(),
        v_admin_id
    ),
    (
        v_doctor3_application_id,
        v_doctor3_id,
        'APPROVED',
        'Dr. Omar Khalid',
        'Child & Adolescent Psychiatrist',
        'Dummy profile for local testing. Works with ADHD, behavioral challenges, and family support plans.',
        '["Arabic","English"]'::jsonb,
        '["Child Psychiatry","Adolescent Mental Health","ADHD","Family Guidance"]'::jsonb,
        '["ADHD","School Anxiety","Behavioral Challenges","Sleep Issues"]'::jsonb,
        '["Parent Guidance","CBT for Youth","Behavioral Interventions"]'::jsonb,
        '["VIDEO","IN_PERSON"]'::jsonb,
        'Male',
        '["NatHealth","GIG"]'::jsonb,
        'Jordan',
        'Irbid',
        10,
        'JOD',
        40.00,
        'Dummy doctor seed pricing.',
        now(),
        now(),
        v_admin_id
    ),
    (
        v_doctor4_application_id,
        v_doctor4_id,
        'APPROVED',
        'Dr. Maya Nasser',
        'Couples & Family Therapist',
        'Dummy profile for local testing. Focused on relationship repair, communication, and family systems.',
        '["Arabic","English","French"]'::jsonb,
        '["Couples Therapy","Family Counseling","Relationship Therapy"]'::jsonb,
        '["Relationship Conflict","Communication Issues","Parenting Stress","Premarital Counseling"]'::jsonb,
        '["Emotionally Focused Therapy (EFT)","Systemic Family Therapy","Solution-Focused Therapy"]'::jsonb,
        '["VIDEO","IN_PERSON"]'::jsonb,
        'Female',
        '["MedNet","NatHealth"]'::jsonb,
        'Jordan',
        'Amman',
        9,
        'JOD',
        55.00,
        'Dummy doctor seed pricing.',
        now(),
        now(),
        v_admin_id
    ),
    (
        v_doctor5_application_id,
        v_doctor5_id,
        'APPROVED',
        'Dr. Yusuf Ali',
        'Trauma & PTSD Specialist',
        'Dummy profile for local testing. Provides trauma-informed care for PTSD, grief, and crisis recovery.',
        '["Arabic","English"]'::jsonb,
        '["Trauma Therapy","PTSD Care","Grief Counseling"]'::jsonb,
        '["Trauma","PTSD","Grief","Insomnia"]'::jsonb,
        '["Trauma-Focused CBT","EMDR-Informed Care","Grounding Techniques"]'::jsonb,
        '["VIDEO","IN_PERSON"]'::jsonb,
        'Male',
        '["GIG","MetLife"]'::jsonb,
        'Jordan',
        'Aqaba',
        14,
        'JOD',
        48.00,
        'Dummy doctor seed pricing.',
        now(),
        now(),
        v_admin_id
    ),
    (
        v_doctor6_application_id,
        v_doctor6_id,
        'APPROVED',
        'Dr. Jana Faris',
        'Anxiety & Mood Therapist',
        'Dummy profile for local testing. Specializes in anxiety management, mood regulation, and stress recovery.',
        '["Arabic","English"]'::jsonb,
        '["Anxiety Therapy","Mood Disorders","Women Mental Health"]'::jsonb,
        '["Social Anxiety","Depression","Stress","Burnout"]'::jsonb,
        '["Cognitive Behavioral Therapy (CBT)","Acceptance and Commitment Therapy (ACT)","Behavioral Activation"]'::jsonb,
        '["VIDEO","CHAT"]'::jsonb,
        'Female',
        '["NatHealth","MedNet"]'::jsonb,
        'Jordan',
        'Zarqa',
        8,
        'JOD',
        35.00,
        'Dummy doctor seed pricing.',
        now(),
        now(),
        v_admin_id
    )
    ON CONFLICT (doctor_user_id) DO UPDATE
    SET
        status = EXCLUDED.status,
        display_name = EXCLUDED.display_name,
        headline = EXCLUDED.headline,
        bio = EXCLUDED.bio,
        languages = EXCLUDED.languages,
        specialties = EXCLUDED.specialties,
        concerns = EXCLUDED.concerns,
        therapy_approaches = EXCLUDED.therapy_approaches,
        session_types = EXCLUDED.session_types,
        gender_identity = EXCLUDED.gender_identity,
        insurance_providers = EXCLUDED.insurance_providers,
        location_country = EXCLUDED.location_country,
        location_city = EXCLUDED.location_city,
        years_experience = EXCLUDED.years_experience,
        pricing_currency = EXCLUDED.pricing_currency,
        pricing_per_session = EXCLUDED.pricing_per_session,
        pricing_notes = EXCLUDED.pricing_notes,
        submitted_at = EXCLUDED.submitted_at,
        reviewed_at = EXCLUDED.reviewed_at,
        reviewer_admin_id = EXCLUDED.reviewer_admin_id;

    INSERT INTO doctor_profiles (
        id,
        doctor_user_id,
        slug,
        display_name,
        headline,
        bio,
        approach_text,
        photo_url,
        languages,
        specialties,
        concerns,
        therapy_approaches,
        session_types,
        gender_identity,
        insurance_providers,
        location_country,
        location_city,
        clinic_name,
        address_line,
        map_url,
        next_available_at,
        availability_timezone,
        availability_preview_slots,
        years_experience,
        rating,
        reviews_count,
        education,
        certifications,
        pricing_currency,
        pricing_per_session,
        follow_up_price,
        pricing_notes,
        verification_badges,
        is_top_doctor,
        is_public,
        published_at
    )
    VALUES
    (
        v_doctor2_profile_id,
        v_doctor2_id,
        'dr-lina-sabri',
        'Dr. Lina Sabri',
        'Clinical Psychologist (CBT/ACT)',
        'Dr. Lina Sabri is a clinical psychologist providing structured, compassionate therapy for anxiety, depression, and trauma-related concerns. She uses evidence-based approaches and focuses on practical skills, emotional regulation, and long-term resilience. (Dummy profile for testing only.)',
        'Integrative CBT + ACT approach. Sessions are goal-oriented: we define the problem, build coping skills, and practice tools between sessions. Emphasis on safety, confidentiality, and measurable progress.',
        'https://placehold.co/512x512?text=Dr.+Lina',
        '["Arabic","English"]'::jsonb,
        '["Anxiety","Depression","Trauma","Stress Management","Panic Disorder"]'::jsonb,
        '["Anxiety","Depression","Trauma","Stress Management","Panic Disorder"]'::jsonb,
        '["CBT","ACT"]'::jsonb,
        '["In-person","Online"]'::jsonb,
        'Female',
        '["MedNet","NatHealth"]'::jsonb,
        'Jordan',
        'Amman',
        'Sabina Therapy Center',
        'Khalda, near the main circle (Fake Address for Testing)',
        'https://maps.google.com/?q=Amman+Khalda',
        '2026-03-02T17:00:00+03:00'::timestamptz,
        'Asia/Amman',
        '["2026-03-02T17:00:00+03:00","2026-03-03T12:30:00+03:00","2026-03-04T19:00:00+03:00"]'::jsonb,
        9,
        4.90,
        128,
        '["MSc Clinical Psychology – University of Jordan (Dummy)","BA Psychology – Yarmouk University (Dummy)"]'::jsonb,
        '["CBT Certification (Dummy)","Trauma-Informed Care Training (Dummy)"]'::jsonb,
        'JOD',
        35.00,
        25.00,
        'Dummy profile for testing only.',
        '["VERIFIED_DOCTOR"]'::jsonb,
        true,
        true,
        now()
    ),
    (
        v_doctor3_profile_id,
        v_doctor3_id,
        'dr-omar-khalid',
        'Dr. Omar Khalid',
        'Child & Adolescent Psychiatrist',
        'Dummy profile for local testing. Works with ADHD, behavioral challenges, and family support plans.',
        'Structured adolescent care with family-informed planning and behavioral tools.',
        'https://randomuser.me/api/portraits/men/54.jpg',
        '["Arabic","English"]'::jsonb,
        '["Child Psychiatry","Adolescent Mental Health","ADHD","Family Guidance"]'::jsonb,
        '["ADHD","School Anxiety","Behavioral Challenges","Sleep Issues"]'::jsonb,
        '["Parent Guidance","CBT for Youth","Behavioral Interventions"]'::jsonb,
        '["VIDEO","IN_PERSON"]'::jsonb,
        'Male',
        '["NatHealth","GIG"]'::jsonb,
        'Jordan',
        'Irbid',
        'Irbid Child Wellness Clinic',
        'Irbid Downtown (Fake Address for Testing)',
        'https://maps.google.com/?q=Irbid',
        now() + interval '3 days',
        'Asia/Amman',
        '["2026-03-03T11:00:00+03:00","2026-03-04T16:00:00+03:00"]'::jsonb,
        10,
        4.80,
        89,
        '["MSc Child Psychiatry (Dummy)"]'::jsonb,
        '["Child Behavioral Therapy Training (Dummy)"]'::jsonb,
        'JOD',
        40.00,
        30.00,
        'Dummy doctor seed pricing.',
        '["VERIFIED_DOCTOR"]'::jsonb,
        false,
        true,
        now()
    ),
    (
        v_doctor4_profile_id,
        v_doctor4_id,
        'dr-maya-nasser',
        'Dr. Maya Nasser',
        'Couples & Family Therapist',
        'Dummy profile for local testing. Focused on relationship repair, communication, and family systems.',
        'Emotion-focused and systems-informed sessions for couples and families.',
        'https://randomuser.me/api/portraits/women/52.jpg',
        '["Arabic","English","French"]'::jsonb,
        '["Couples Therapy","Family Counseling","Relationship Therapy"]'::jsonb,
        '["Relationship Conflict","Communication Issues","Parenting Stress","Premarital Counseling"]'::jsonb,
        '["Emotionally Focused Therapy (EFT)","Systemic Family Therapy","Solution-Focused Therapy"]'::jsonb,
        '["VIDEO","IN_PERSON"]'::jsonb,
        'Female',
        '["MedNet","NatHealth"]'::jsonb,
        'Jordan',
        'Amman',
        'Amman Family Care Center',
        'Abdoun, Amman (Fake Address for Testing)',
        'https://maps.google.com/?q=Amman+Abdoun',
        now() + interval '4 days',
        'Asia/Amman',
        '["2026-03-04T18:00:00+03:00","2026-03-05T14:00:00+03:00"]'::jsonb,
        9,
        4.85,
        102,
        '["MA Family Therapy (Dummy)"]'::jsonb,
        '["EFT Certification (Dummy)"]'::jsonb,
        'JOD',
        55.00,
        45.00,
        'Dummy doctor seed pricing.',
        '["VERIFIED_DOCTOR"]'::jsonb,
        false,
        true,
        now()
    ),
    (
        v_doctor5_profile_id,
        v_doctor5_id,
        'dr-yusuf-ali',
        'Dr. Yusuf Ali',
        'Trauma & PTSD Specialist',
        'Dummy profile for local testing. Provides trauma-informed care for PTSD, grief, and crisis recovery.',
        'Trauma-informed sessions emphasizing safety, pacing, and stabilization skills.',
        'https://randomuser.me/api/portraits/men/63.jpg',
        '["Arabic","English"]'::jsonb,
        '["Trauma Therapy","PTSD Care","Grief Counseling"]'::jsonb,
        '["Trauma","PTSD","Grief","Insomnia"]'::jsonb,
        '["Trauma-Focused CBT","EMDR-Informed Care","Grounding Techniques"]'::jsonb,
        '["VIDEO","IN_PERSON"]'::jsonb,
        'Male',
        '["GIG","MetLife"]'::jsonb,
        'Jordan',
        'Aqaba',
        'Aqaba Resilience Clinic',
        'Aqaba Center (Fake Address for Testing)',
        'https://maps.google.com/?q=Aqaba',
        now() + interval '5 days',
        'Asia/Amman',
        '["2026-03-05T10:30:00+03:00","2026-03-06T13:30:00+03:00"]'::jsonb,
        14,
        4.75,
        76,
        '["MSc Trauma Psychology (Dummy)"]'::jsonb,
        '["Trauma-Informed Care Advanced (Dummy)"]'::jsonb,
        'JOD',
        48.00,
        38.00,
        'Dummy doctor seed pricing.',
        '["VERIFIED_DOCTOR"]'::jsonb,
        false,
        true,
        now()
    ),
    (
        v_doctor6_profile_id,
        v_doctor6_id,
        'dr-jana-faris',
        'Dr. Jana Faris',
        'Anxiety & Mood Therapist',
        'Dummy profile for local testing. Specializes in anxiety management, mood regulation, and stress recovery.',
        'Practical therapy plans focused on anxiety reduction and daily functioning improvements.',
        'https://randomuser.me/api/portraits/women/33.jpg',
        '["Arabic","English"]'::jsonb,
        '["Anxiety Therapy","Mood Disorders","Women Mental Health"]'::jsonb,
        '["Social Anxiety","Depression","Stress","Burnout"]'::jsonb,
        '["Cognitive Behavioral Therapy (CBT)","Acceptance and Commitment Therapy (ACT)","Behavioral Activation"]'::jsonb,
        '["VIDEO","CHAT"]'::jsonb,
        'Female',
        '["NatHealth","MedNet"]'::jsonb,
        'Jordan',
        'Zarqa',
        'Zarqa MindCare Clinic',
        'Zarqa Center (Fake Address for Testing)',
        'https://maps.google.com/?q=Zarqa',
        now() + interval '2 days',
        'Asia/Amman',
        '["2026-03-02T15:00:00+03:00","2026-03-03T18:30:00+03:00"]'::jsonb,
        8,
        4.70,
        64,
        '["MSc Clinical Psychology (Dummy)"]'::jsonb,
        '["ACT Practitioner Training (Dummy)"]'::jsonb,
        'JOD',
        35.00,
        28.00,
        'Dummy doctor seed pricing.',
        '["VERIFIED_DOCTOR"]'::jsonb,
        false,
        true,
        now()
    )
    ON CONFLICT (doctor_user_id) DO UPDATE
    SET
        slug = EXCLUDED.slug,
        display_name = EXCLUDED.display_name,
        headline = EXCLUDED.headline,
        bio = EXCLUDED.bio,
        approach_text = EXCLUDED.approach_text,
        photo_url = EXCLUDED.photo_url,
        languages = EXCLUDED.languages,
        specialties = EXCLUDED.specialties,
        concerns = EXCLUDED.concerns,
        therapy_approaches = EXCLUDED.therapy_approaches,
        session_types = EXCLUDED.session_types,
        gender_identity = EXCLUDED.gender_identity,
        insurance_providers = EXCLUDED.insurance_providers,
        location_country = EXCLUDED.location_country,
        location_city = EXCLUDED.location_city,
        clinic_name = EXCLUDED.clinic_name,
        address_line = EXCLUDED.address_line,
        map_url = EXCLUDED.map_url,
        next_available_at = EXCLUDED.next_available_at,
        availability_timezone = EXCLUDED.availability_timezone,
        availability_preview_slots = EXCLUDED.availability_preview_slots,
        years_experience = EXCLUDED.years_experience,
        rating = EXCLUDED.rating,
        reviews_count = EXCLUDED.reviews_count,
        education = EXCLUDED.education,
        certifications = EXCLUDED.certifications,
        pricing_currency = EXCLUDED.pricing_currency,
        pricing_per_session = EXCLUDED.pricing_per_session,
        follow_up_price = EXCLUDED.follow_up_price,
        pricing_notes = EXCLUDED.pricing_notes,
        verification_badges = EXCLUDED.verification_badges,
        is_top_doctor = EXCLUDED.is_top_doctor,
        is_public = EXCLUDED.is_public,
        published_at = EXCLUDED.published_at;

    RAISE NOTICE 'Seed complete. admin=%, doctors=6, user=%', v_admin_id, v_user_id;
END $$;

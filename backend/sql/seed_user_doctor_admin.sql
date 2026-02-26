-- Seed data for quick local testing (PostgreSQL)
-- Creates 1 ADMIN, 1 DOCTOR, 1 USER and wires doctor profile/application.
-- Passwords:
--   ADMIN  -> Admin12345!
--   DOCTOR -> Doctor12345!
--   USER   -> User12345!
--
-- Note: Uses pgcrypto's crypt/gen_salt to generate bcrypt hashes in DB.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_admin_id UUID;
    v_doctor_id UUID;
    v_user_id UUID;
BEGIN
    INSERT INTO users (email, phone, password_hash, role, status)
    VALUES (
        'admin.test@sabina.local',
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

    INSERT INTO users (email, phone, password_hash, role, status)
    VALUES (
        'doctor.test@sabina.local',
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

    INSERT INTO users (email, phone, password_hash, role, status)
    VALUES (
        'user.test@sabina.local',
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

    INSERT INTO doctor_applications (
        doctor_user_id,
        status,
        display_name,
        headline,
        bio,
        languages,
        specialties,
        session_types,
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
        v_doctor_id,
        'APPROVED',
        'Dr. Test Doctor',
        'Clinical Psychologist',
        'Seeded doctor profile for QA and local static/API testing.',
        '["English","Arabic"]'::jsonb,
        '["Anxiety","CBT"]'::jsonb,
        '["VIDEO","IN_PERSON"]'::jsonb,
        'Jordan',
        'Amman',
        7,
        'JOD',
        30.00,
        'Seeded price',
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
        session_types = EXCLUDED.session_types,
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
        doctor_user_id,
        display_name,
        headline,
        bio,
        languages,
        specialties,
        session_types,
        location_country,
        location_city,
        years_experience,
        pricing_currency,
        pricing_per_session,
        pricing_notes,
        verification_badges,
        is_public,
        published_at
    )
    VALUES (
        v_doctor_id,
        'Dr. Test Doctor',
        'Clinical Psychologist',
        'Public seeded doctor profile.',
        '["English","Arabic"]'::jsonb,
        '["Anxiety","CBT"]'::jsonb,
        '["VIDEO","IN_PERSON"]'::jsonb,
        'Jordan',
        'Amman',
        7,
        'JOD',
        30.00,
        'Seeded by SQL',
        '["VERIFIED_DOCTOR"]'::jsonb,
        true,
        now()
    )
    ON CONFLICT (doctor_user_id) DO UPDATE
    SET
        display_name = EXCLUDED.display_name,
        headline = EXCLUDED.headline,
        bio = EXCLUDED.bio,
        languages = EXCLUDED.languages,
        specialties = EXCLUDED.specialties,
        session_types = EXCLUDED.session_types,
        location_country = EXCLUDED.location_country,
        location_city = EXCLUDED.location_city,
        years_experience = EXCLUDED.years_experience,
        pricing_currency = EXCLUDED.pricing_currency,
        pricing_per_session = EXCLUDED.pricing_per_session,
        pricing_notes = EXCLUDED.pricing_notes,
        verification_badges = EXCLUDED.verification_badges,
        is_public = EXCLUDED.is_public,
        published_at = EXCLUDED.published_at;

    RAISE NOTICE 'Seed complete. admin=%, doctor=%, user=%', v_admin_id, v_doctor_id, v_user_id;
END $$;


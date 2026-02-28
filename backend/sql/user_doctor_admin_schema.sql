-- Core schema for USER / DOCTOR / ADMIN flows (PostgreSQL)
-- Matches this project's FastAPI + SQLAlchemy model structure.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('ADMIN', 'DOCTOR', 'USER');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
        CREATE TYPE application_status AS ENUM (
            'PENDING',
            'DRAFT',
            'SUBMITTED',
            'IN_REVIEW',
            'APPROVED',
            'REJECTED',
            'NEEDS_CHANGES'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE appointment_status AS ENUM (
            'REQUESTED',
            'CONFIRMED',
            'CANCELLED',
            'COMPLETED',
            'NO_SHOW'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(32),
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    status user_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);

CREATE TABLE IF NOT EXISTS doctor_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status application_status NOT NULL DEFAULT 'DRAFT',
    display_name VARCHAR(255),
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(32),
    photo_url VARCHAR(1000),
    national_id VARCHAR(100),
    license_number VARCHAR(120),
    headline VARCHAR(255),
    specialty VARCHAR(120),
    sub_specialties JSONB,
    bio TEXT,
    short_bio TEXT,
    about TEXT,
    languages JSONB,
    specialties JSONB,
    concerns JSONB,
    therapy_approaches JSONB,
    session_types JSONB,
    gender_identity VARCHAR(40),
    insurance_providers JSONB,
    location_country VARCHAR(120),
    location_city VARCHAR(120),
    online_available BOOLEAN,
    years_experience INTEGER,
    consultation_fee NUMERIC(10, 2),
    education JSONB,
    licenses JSONB,
    schedule JSONB,
    license_document_url VARCHAR(1000),
    pricing_currency VARCHAR(10) NOT NULL DEFAULT 'JOD',
    pricing_per_session NUMERIC(10, 2),
    pricing_notes TEXT,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewer_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    admin_note TEXT,
    internal_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_doctor_application_doctor UNIQUE (doctor_user_id)
);

CREATE TABLE IF NOT EXISTS doctor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    headline VARCHAR(255),
    bio TEXT,
    approach_text TEXT,
    photo_url VARCHAR(1000),
    languages JSONB,
    specialties JSONB,
    concerns JSONB,
    therapy_approaches JSONB,
    session_types JSONB,
    gender_identity VARCHAR(40),
    insurance_providers JSONB,
    location_country VARCHAR(120),
    location_city VARCHAR(120),
    clinic_name VARCHAR(255),
    address_line VARCHAR(255),
    map_url VARCHAR(1000),
    next_available_at TIMESTAMPTZ,
    availability_timezone VARCHAR(64),
    availability_preview_slots JSONB,
    years_experience INTEGER,
    rating NUMERIC(3,2),
    reviews_count INTEGER NOT NULL DEFAULT 0,
    education JSONB,
    certifications JSONB,
    licenses_public JSONB,
    pricing_currency VARCHAR(10) NOT NULL DEFAULT 'JOD',
    pricing_per_session NUMERIC(10, 2),
    follow_up_price NUMERIC(10, 2),
    pricing_notes TEXT,
    verification_badges JSONB,
    is_top_doctor BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_doctor_profile_doctor UNIQUE (doctor_user_id)
);

CREATE INDEX IF NOT EXISTS ix_doctor_profiles_slug ON doctor_profiles (slug);
CREATE INDEX IF NOT EXISTS ix_doctor_profiles_concerns_gin ON doctor_profiles USING GIN (concerns);
CREATE INDEX IF NOT EXISTS ix_doctor_profiles_therapy_approaches_gin ON doctor_profiles USING GIN (therapy_approaches);
CREATE INDEX IF NOT EXISTS ix_doctor_profiles_insurance_providers_gin ON doctor_profiles USING GIN (insurance_providers);
CREATE INDEX IF NOT EXISTS ix_doctor_profiles_gender_identity ON doctor_profiles (gender_identity);
CREATE INDEX IF NOT EXISTS ix_doctor_profiles_next_available_at ON doctor_profiles (next_available_at);

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(64) NOT NULL,
    status appointment_status NOT NULL DEFAULT 'REQUESTED',
    meeting_link VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_appointments_doctor_user_id ON appointments (doctor_user_id);
CREATE INDEX IF NOT EXISTS ix_appointments_user_id ON appointments (user_id);
CREATE INDEX IF NOT EXISTS ix_appointments_start_at ON appointments (start_at);
CREATE INDEX IF NOT EXISTS ix_appointments_doctor_range ON appointments (doctor_user_id, start_at, end_at);

CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(120) NOT NULL,
    target_id UUID NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_admin_actions_admin_user_id ON admin_actions (admin_user_id);

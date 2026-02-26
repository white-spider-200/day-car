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
    doctor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status application_status NOT NULL DEFAULT 'DRAFT',
    display_name VARCHAR(255),
    headline VARCHAR(255),
    bio TEXT,
    languages JSONB,
    specialties JSONB,
    session_types JSONB,
    location_country VARCHAR(120),
    location_city VARCHAR(120),
    years_experience INTEGER,
    education JSONB,
    licenses JSONB,
    pricing_currency VARCHAR(10) NOT NULL DEFAULT 'JOD',
    pricing_per_session NUMERIC(10, 2),
    pricing_notes TEXT,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewer_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    internal_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_doctor_application_doctor UNIQUE (doctor_user_id)
);

CREATE TABLE IF NOT EXISTS doctor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(255) NOT NULL,
    headline VARCHAR(255),
    bio TEXT,
    photo_url VARCHAR(1000),
    languages JSONB,
    specialties JSONB,
    session_types JSONB,
    location_country VARCHAR(120),
    location_city VARCHAR(120),
    years_experience INTEGER,
    education JSONB,
    licenses_public JSONB,
    pricing_currency VARCHAR(10) NOT NULL DEFAULT 'JOD',
    pricing_per_session NUMERIC(10, 2),
    pricing_notes TEXT,
    verification_badges JSONB,
    is_public BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_doctor_profile_doctor UNIQUE (doctor_user_id)
);

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

# Project Architecture

This diagram illustrates the flow of data and the structural relationship between the Frontend, Backend, and Database layers of the Doctor Booking platform.

```mermaid
graph TD
    subgraph "Frontend (React + Vite)"
        UI[User Interface - Pages/Components]
        Framer[Framer Motion - Animations]
        Context[Language Context - i18n/RTL]
        Data[Static Mock Data - homeData.ts]
    end

    subgraph "Backend (FastAPI)"
        API[API Routes - Auth, Doctors, Appointments]
        Schemas[Pydantic Schemas - Data Validation]
        Services[Business Logic - Booking, Approval, Storage]
        Auth[Security - JWT Authentication]
    end

    subgraph "Database (PostgreSQL)"
        Models[SQLAlchemy Models]
        UsersTable[(Users Table)]
        DoctorsTable[(Doctor Profiles)]
        ApptTable[(Appointments)]
        Alembic[Alembic - Migrations]
    end

    %% Flow Relationships
    UI --> Framer
    UI --> Context
    UI -.->|Future API Calls| API
    Data -.->|Current State| UI
    
    API --> Schemas
    API --> Services
    API --> Auth
    
    Services --> Models
    Models --> UsersTable
    Models --> DoctorsTable
    Models --> ApptTable
    Alembic --> Models
```

### Component Breakdown

1.  **Frontend**: 
    *   **React & TypeScript**: Providing a type-safe, component-based UI.
    *   **Framer Motion**: Handling all the smooth staggered entries and hover effects implemented.
    *   **Tailwind CSS**: Managing the "Calm-tech" design system and RTL support.

2.  **Backend**:
    *   **FastAPI**: Asynchronous Python framework for high-performance API endpoints.
    *   **Services Layer**: Separates business logic (like checking doctor availability) from the API routing.

3.  **Data Layer**:
    *   **PostgreSQL**: Reliable relational storage for patient and doctor records.
    *   **SQLAlchemy**: ORM for mapping Python classes to database tables.

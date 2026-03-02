# Sabina Therapy (Next.js + Prisma)

Therapy / psychiatry doctor booking platform with RBAC dashboards and Zoom (live or mock mode).

## Stack
- Next.js App Router + TypeScript + Tailwind
- NextAuth Credentials + JWT session
- PostgreSQL + Prisma
- Zod validation
- TanStack Query
- Minimal API tests with Vitest

## Quick Start
1. Copy env values:
   ```bash
   cp .env.example .env
   ```
2. Start PostgreSQL:
   ```bash
   docker compose up -d
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Generate Prisma client and run migration:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate -- --name init
   ```
5. Seed data:
   ```bash
   npm run prisma:seed
   ```
6. Start app:
   ```bash
   npm run dev
   ```

## Seeded Accounts
Password for all seeded users: `Passw0rd!`

- Admin: `admin@sabina.dev`
- Doctor: `doctor.lina@sabina.dev`
- Doctor: `doctor.omar@sabina.dev`
- User: `user.maya@sabina.dev`
- User: `user.sami@sabina.dev`

## Run tests
```bash
npm test
```

# MindCare Frontend

Clean React + Vite + TypeScript + Tailwind frontend for MindCare with a full Doctor Profile UI and preserved additional pages:
- Doctor profile page (`/` or `/doctor-profile`)
- Home page (`/home`)
- Dashboard page (`/dashboard`)
- Admin page (`/admin`)

## Stack
- React 18
- Vite 5
- TypeScript
- Tailwind CSS

## Run
```bash
npm install
npm start
```

Alternative:
```bash
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Edit content
- Main app routing: `src/App.tsx`
- Doctor profile page layout: `src/pages/DoctorProfilePage.tsx`
- Main home page layout: `src/pages/MainHomePage.tsx`
- Dashboard page: `src/pages/DashboardPage.tsx`
- Admin page shell + workflow: `src/pages/AdminPage.tsx`
- Reusable profile components: `src/components/profile/*`
- Reusable home components: `src/components/*`
- Doctor profile data arrays: `src/data/doctorProfileData.ts`
- Home data arrays: `src/data/homeData.ts`
- Admin doctors dummy dataset: `src/data/adminDoctorsData.ts`
- Theme/base styles: `src/index.css` and `tailwind.config.ts`

## MindCare Admin Workflow
- URL: `/admin`
- Exactly two pages (UI views):
  - Doctors List page
  - Doctor Review page
- Data and local state:
  - Edit dummy doctors/documents/history in `src/data/adminDoctorsData.ts`
  - Status updates (Approve / Reject / Needs changes) and history entries are local state in `src/pages/AdminPage.tsx`
  - No backend or API calls are used
- Important:
  - Pricing transparency is intentionally not implemented in admin review UI yet

## Admin run checklist
1. Start app: `npm run dev`
2. Open `http://localhost:5173/admin`
3. Test flows:
   - Search + filters + sort
   - Open Doctor Review from list
   - Verification checklist updates
   - Approve / Reject / Needs changes modals
   - History timeline updates after decisions

## Notes
- UI only (no backend).
- Buttons and links use placeholder navigation behavior.

# MindCare Home Page (UI Only)

Responsive, production-ready home page UI for a psychology/therapist listing platform built with React + Vite + TypeScript + Tailwind CSS.

## Stack
- React 18
- Vite 5
- TypeScript
- Tailwind CSS

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Edit content
- Categories and doctors data: `src/data/homeData.ts`
- Layout composition: `src/App.tsx`
- Reusable sections:
  - `src/components/Header.tsx`
  - `src/components/HeroSearch.tsx`
  - `src/components/CategoryGrid.tsx`
  - `src/components/DoctorCard.tsx`
  - `src/components/HowItWorks.tsx`
  - `src/components/CTAForDoctors.tsx`
  - `src/components/Footer.tsx`
- Theme tokens and base styles: `src/index.css` and `tailwind.config.ts`

## Notes
- UI only (no backend integration).
- Buttons and links point to placeholders.

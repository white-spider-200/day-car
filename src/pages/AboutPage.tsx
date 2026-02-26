import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { founderInfo } from '../data/founderData';

const aboutNavItems = [
  { labelKey: 'nav.doctors', href: '/home#featured-doctors' },
  { labelKey: 'nav.howVerificationWorks', href: '#verification' },
  { labelKey: 'nav.forDoctors', href: '#for-doctors' },
  { labelKey: 'nav.about', href: '/about' }
];

const trustPills = ['Verified doctors', 'Privacy-first', 'Transparent pricing'];

const missionPromises = [
  'Simple search and comparison so people can find a good fit faster.',
  'Clear profile details, pricing, and session options before booking.',
  'A respectful support experience when users or doctors need help.'
];

const howItWorksSteps = [
  {
    title: 'Search',
    description: 'Find psychologists by specialty, city, language, and online availability.'
  },
  {
    title: 'Compare',
    description: 'Review profile details, pricing, and ratings to choose with confidence.'
  },
  {
    title: 'Book',
    description: 'Pick online or in-person sessions and confirm your appointment.'
  },
  {
    title: 'Follow up',
    description: 'Manage upcoming sessions and contact support if you need assistance.'
  }
];

const trustSafetyItems = [
  {
    title: 'Doctor verification',
    description: 'Applications are reviewed by admins and credentials are checked before approval.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m8 12 2.4 2.4L16 8.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 3.5 5 6.5V12c0 4.5 3 7.5 7 8.5 4-1 7-4 7-8.5V6.5l-7-3Z" />
      </svg>
    )
  },
  {
    title: 'Privacy-first approach',
    description: 'We aim to collect only what is needed for booking and use reasonable safeguards for handling data.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 10V8a5 5 0 0 1 10 0v2" />
        <rect x="5" y="10" width="14" height="10" rx="2" />
      </svg>
    )
  },
  {
    title: 'Clear pricing & details',
    description: 'Session pricing, duration, and mode are displayed so users can compare transparently.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 8.5v7M10 10.2c.5-.8 1.2-1.2 2-1.2a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 1 0 0 3.8c.8 0 1.5-.4 2-1.2" />
      </svg>
    )
  },
  {
    title: 'Reporting and reviews',
    description: 'Ratings, feedback, and reporting tools help us maintain quality and community trust.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3.8 14.4 8.7l5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.5l5.4-.8L12 3.8Z" strokeLinejoin="round" />
      </svg>
    )
  }
];

const faqs = [
  {
    question: 'How are doctors verified?',
    answer:
      'Doctors submit credentials and license information during application. Admin review is required before a profile is marked verified.'
  },
  {
    question: 'Is my information private?',
    answer:
      'MindCare follows a privacy-first approach. We aim to minimize collected data and use reasonable safeguards for handling it.'
  },
  {
    question: 'Online vs in-person sessions?',
    answer: 'Both options may be available depending on each doctor profile, city, and listed availability.'
  },
  {
    question: 'Can I reschedule or cancel?',
    answer: 'Rescheduling and cancellation depend on doctor policy shown during booking. Please review details before confirming.'
  },
  {
    question: 'Are prices fixed?',
    answer: 'Pricing is set by each doctor and shown on the profile. Rates may vary by service type or session duration.'
  },
  {
    question: 'How do I choose the right doctor?',
    answer: 'Use filters, compare specialties, read profile information, and check ratings/reviews to find your best match.'
  },
  {
    question: 'What if I need urgent help?',
    answer:
      'MindCare is not an emergency service. If you are in immediate danger, contact local emergency services right away.'
  },
  {
    question: 'How can doctors apply?',
    answer: 'Doctors can apply through the doctor onboarding flow. Admin approval is required before profiles go live.'
  }
];

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-3xl font-extrabold tracking-tight text-textMain sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">{subtitle}</p> : null}
    </div>
  );
}

export default function AboutPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/40 via-white to-white text-textMain">
      <Header brandHref="/home" navItems={aboutNavItems} />

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-primaryBg/50 to-primaryBg/80 py-16 sm:py-24">
          <div className="section-shell">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black leading-tight tracking-tight text-textMain sm:text-6xl">
                A safe space <br />
                <span className="text-primary">to be heard.</span>
              </h1>
              <p className="mt-6 text-base leading-relaxed text-muted sm:text-xl">
                At MindCare, we believe everyone deserves access to compassionate, professional support. 
                We've built a bridge between clinical excellence and the human need for connection.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="/home#featured-doctors"
                  className="focus-outline inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-8 text-base font-bold text-white transition-all hover:bg-primaryDark hover:shadow-lg"
                >
                  Find Support Now
                </a>
                <a
                  href="#verification"
                  className="focus-outline inline-flex h-14 items-center justify-center rounded-2xl border border-primary/20 bg-white px-8 text-base font-bold text-primary transition-all hover:bg-primaryBg"
                >
                  How we protect you
                </a>
              </div>

              <ul className="mt-8 flex flex-wrap gap-4" aria-label="Trust indicators">
                {trustPills.map((pill) => (
                  <li
                    key={pill}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted/60"
                  >
                    <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    {pill}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="section-shell py-14 sm:py-16" aria-labelledby="mission-title">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <article className="rounded-hero border border-borderGray bg-white p-6 shadow-card sm:p-8">
              <SectionHeading
                title="Our commitment to you"
                subtitle="MindCare isn't just a platform; it's a safe haven. We exist to make mental health support easier to access with more clarity, trust, and empathy. We bring verified psychologists together with the simple goal of helping you heal."
              />
            </article>

            <article className="rounded-hero border border-borderGray bg-white p-6 shadow-card sm:p-8">
              <h3 className="text-xl font-bold text-textMain sm:text-2xl">What we promise</h3>
              <ul className="mt-4 space-y-3">
                {missionPromises.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-muted sm:text-base">
                    <span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primaryBg text-primary">
                      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m4.5 10 3 3L15.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section id="how-it-works" className="section-shell py-14 sm:py-16" aria-labelledby="how-title">
          <SectionHeading
            title="How MindCare works"
            subtitle="A simple, step-by-step journey designed to help users feel informed, safe, and ready to book."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {howItWorksSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-hero border border-borderGray bg-white p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-soft"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold text-textMain">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-14 sm:py-16" aria-labelledby="impact-title">
          <div className="section-shell">
            <div className="rounded-hero border border-primary-100 bg-gradient-to-r from-primary-50 to-white p-6 shadow-soft sm:p-8">
              <SectionHeading title="Our Collective Impact" subtitle="A quick snapshot of the growing MindCare community and our shared progress." />
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Licensed Professionals', value: '128+' },
                  { label: 'Moments of Connection', value: '2,400+' },
                  { label: 'Average Support Rating', value: '4.9/5' },
                  { label: 'Always Here For You', value: '24/7' }
                ].map((item) => (
                  <article key={item.label} className="rounded-card border border-borderGray bg-white p-5 text-center shadow-card transition-all hover:shadow-soft">
                    <p className="text-3xl font-black text-textMain sm:text-4xl">{item.value}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-widest text-primary/60">{item.label}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="founder" className="section-shell py-14 sm:py-20" aria-labelledby="founder-title">
          {/* Founder Hero Card */}
          <div className="rounded-hero border border-borderGray bg-white p-6 shadow-card sm:p-10 lg:p-14 overflow-hidden relative mb-12">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primaryBg/40 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

            <div className="grid gap-12 lg:grid-cols-[1fr_1.8fr] lg:items-start relative z-10">
              <div className="space-y-8">
                <div className="relative group">
                  <div className="aspect-[4/5] w-full max-w-sm mx-auto overflow-hidden rounded-[40px] border-4 border-white shadow-soft relative z-10 bg-primaryBg/20">
                    <img
                      src={founderInfo.photos[0]}
                      alt={founderInfo.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-700"
                    />
                  </div>
                  <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-3xl -z-10 animate-pulse" />
                  <div className="absolute -top-6 -right-6 w-20 h-20 bg-primaryBg rounded-full -z-10" />
                </div>

                <div className="space-y-6 hidden lg:block">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-primary/60 mb-3 flex items-center gap-2">
                      <span className="h-px w-6 bg-primary/30" /> Education
                    </h4>
                    <ul className="space-y-2">
                      {founderInfo.education.map((edu, idx) => (
                        <li key={idx} className="text-sm font-semibold text-textMain/80 flex items-start gap-2 leading-tight">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40 flex-none" />
                          {edu}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-primary/60 mb-3 flex items-center gap-2">
                      <span className="h-px w-6 bg-primary/30" /> Career Highlights
                    </h4>
                    <ul className="space-y-2">
                      {founderInfo.careerHighlights.map((high, idx) => (
                        <li key={idx} className="text-sm font-semibold text-textMain/80 flex items-start gap-2 leading-tight">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40 flex-none" />
                          {high}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="lg:pt-4">
                <div className="flex flex-col gap-2 mb-8">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary w-fit">
                    Platform Founder
                  </span>
                  <div className="flex flex-col gap-1 mt-2">
                    <h2 id="founder-title" className="text-4xl font-black text-textMain sm:text-5xl tracking-tight">{founderInfo.name}</h2>
                    <div className="flex flex-col gap-2 mt-2">
                      <p className="text-2xl font-bold text-primary/80" dir="rtl">{founderInfo.nameArabic}</p>
                      <p className="text-lg font-bold text-muted">{founderInfo.title}</p>
                      <p className="text-sm text-muted/70">📍 {founderInfo.location}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="relative">
                    <svg className="absolute -top-4 -left-6 h-12 w-12 text-primary/10 -z-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3L14.017 3C14.017 1.89543 14.9124 1 16.017 1H19.017C21.2261 1 23.017 2.79086 23.017 5V15C23.017 18.3137 20.3307 21 17.017 21H14.017ZM1.017 21L1.017 18C1.017 16.8954 1.91243 16 3.017 16H6.017C6.56928 16 7.017 15.5523 7.017 15V9C7.017 8.44772 6.56928 8 6.017 8H3.017C1.91243 8 1.017 7.10457 1.017 6V3L1.017 3C1.017 1.89543 1.91243 1 3.017 1H6.017C8.22614 1 10.017 2.79086 10.017 5V15C10.017 18.3137 7.33072 21 4.017 21H1.017Z" />
                    </svg>
                    <p className="text-lg leading-relaxed text-muted sm:text-2xl font-medium">
                      "{founderInfo.bio}"
                    </p>
                  </div>

                  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 pt-8 border-t border-borderGray/60">
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-widest text-primary/60">Clinical Experience</p>
                      <p className="text-xl font-black text-textMain">{founderInfo.experience}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <p className="text-xs font-black uppercase tracking-widest text-primary/60 mb-2">Primary Specializations</p>
                      <div className="flex flex-wrap gap-2">
                        {founderInfo.specialties.map(spec => (
                          <span key={spec} className="inline-flex items-center rounded-lg bg-primaryBg px-3 py-1 text-sm font-bold text-primary">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mobile-only detail lists */}
                  <div className="space-y-8 lg:hidden pt-8">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-primary/60 mb-3">Education</h4>
                      <ul className="space-y-2">
                        {founderInfo.education.map((edu, idx) => (
                          <li key={idx} className="text-sm font-semibold text-textMain/80 flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40 flex-none" />
                            {edu}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-primary/60 mb-3">Career History</h4>
                      <ul className="space-y-2">
                        {founderInfo.careerHighlights.map((high, idx) => (
                          <li key={idx} className="text-sm font-semibold text-textMain/80 flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40 flex-none" />
                            {high}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Why He Founded MindCare */}
          <div className="rounded-hero border border-primary-100 bg-gradient-to-br from-primary-50/50 to-white p-6 shadow-soft sm:p-8 mb-12">
            <div className="max-w-4xl">
              <h3 className="text-2xl sm:text-3xl font-black text-textMain mb-4">Why MindCare?</h3>
              <p className="text-base sm:text-lg leading-relaxed text-muted mb-6">
                {founderInfo.mission}
              </p>
              <div className="rounded-lg bg-white border border-primary/20 p-4 sm:p-6 relative">
                <svg className="absolute -top-4 -right-4 h-16 w-16 text-primary/5 -z-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8m3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5m-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11m3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
                <p className="text-base sm:text-lg font-semibold text-primary italic">
                  "{founderInfo.philosophy}"
                </p>
              </div>
            </div>
          </div>

          {/* What Users Get */}
          <div className="mb-12">
            <h3 className="text-2xl sm:text-3xl font-black text-textMain mb-8">What You Get From Treatment</h3>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              {founderInfo.userBenefits.map((benefit) => (
                <article
                  key={benefit.title}
                  className="rounded-hero border border-borderGray bg-white p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-soft"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">✓</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-textMain mb-2">{benefit.title}</h4>
                      <p className="text-sm leading-relaxed text-muted">{benefit.description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Professional Credentials & Certifications */}
          <div className="rounded-hero border border-borderGray bg-white p-6 shadow-card sm:p-8 mb-12">
            <h3 className="text-2xl sm:text-3xl font-black text-textMain mb-8">Professional Credentials</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">📋</span>
                  </div>
                  <h4 className="font-bold text-textMain">Board Certification</h4>
                </div>
                <p className="text-sm text-muted ml-10">{founderInfo.boardCertification}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">📅</span>
                  </div>
                  <h4 className="font-bold text-textMain">Practice Timeline</h4>
                </div>
                <p className="text-sm text-muted ml-10">{founderInfo.practiceStart}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">🌍</span>
                  </div>
                  <h4 className="font-bold text-textMain">Languages</h4>
                </div>
                <p className="text-sm text-muted ml-10">{founderInfo.languages.join(', ')}</p>
              </div>
            </div>
          </div>

          {/* Clinical Focus Areas */}
          <div className="rounded-hero border border-primary-100 bg-gradient-to-br from-primary-50/50 to-white p-6 shadow-soft sm:p-8 mb-12">
            <h3 className="text-2xl sm:text-3xl font-black text-textMain mb-8">Areas of Focus & Expertise</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {founderInfo.clinicalFocus.map((focus) => (
                <div key={focus} className="flex items-start gap-3">
                  <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold mt-0.5">+</span>
                  <span className="text-base text-muted font-medium">{focus}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Media Presence & Recognition */}
          <div className="rounded-hero border border-borderGray bg-white p-6 shadow-card sm:p-8 mb-12">
            <h3 className="text-2xl sm:text-3xl font-black text-textMain mb-8">Recognition & Media Appearances</h3>
            <p className="text-sm text-muted mb-6 leading-relaxed">
              Dr. Mizher has been featured in leading regional publications, sharing clinical insights on mental health, addiction recovery, and the psychological impact of contemporary challenges.
            </p>
            <ul className="space-y-4">
              {founderInfo.mediaPresence.appearances.map((appearance, idx) => (
                <li key={idx} className="flex items-start gap-3 pb-4 border-b border-borderGray/50 last:border-b-0">
                  <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-primary text-xs font-bold">✓</span>
                  <span className="text-sm text-muted leading-relaxed">{appearance}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="verification" className="section-shell py-14 sm:py-16" aria-labelledby="trust-title">
          <div className="rounded-hero border border-primary-100 bg-gradient-to-br from-white via-primary-50/50 to-primary-50/80 p-6 shadow-soft sm:p-8">
            <SectionHeading
              title="Your safety is our priority"
              subtitle="Trust is built through empathy, careful clinical review, and transparent platform behavior. We protect you so you can focus on healing."
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {trustSafetyItems.map((item) => (
                <article
                  key={item.title}
                  className="rounded-card border border-borderGray bg-white p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-soft"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primaryBg text-primary">{item.icon}</span>
                  <h3 className="mt-4 text-base font-bold text-textMain">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="for-doctors" className="section-shell py-14 sm:py-16" aria-labelledby="for-doctors-title">
          <div className="rounded-hero border border-borderGray bg-white p-6 shadow-card sm:p-8">
            <SectionHeading
              title="For doctors"
              subtitle="MindCare helps psychologists reach more clients with clear profile presentation, simple scheduling, and a trusted verified badge."
            />
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
              Applications are reviewed by admins before profiles are approved and listed on the platform.
            </p>
            <a
              href="#"
              className="focus-outline mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primaryDark"
            >
              Apply to join
            </a>
          </div>
        </section>

        <section className="section-shell py-14 sm:py-16" aria-labelledby="faq-title">
          <SectionHeading
            title="Frequently asked questions"
            subtitle="Quick answers to common questions from users and doctors."
          />
          <div className="mt-8 space-y-3">
            {faqs.map((item, index) => {
              const isOpen = openFaqIndex === index;

              return (
                <article key={item.question} className="rounded-card border border-borderGray bg-white shadow-card">
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                      className="focus-outline flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-sm font-semibold text-textMain sm:text-base">{item.question}</span>
                      <span
                        className={`inline-flex h-6 w-6 flex-none items-center justify-center rounded-full border border-borderGray text-muted transition ${
                          isOpen ? 'rotate-45' : ''
                        }`}
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </button>
                  </h3>
                  <div className={`grid transition-all duration-200 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                      <p className="border-t border-borderGray px-5 pb-4 pt-3 text-sm leading-relaxed text-muted">{item.answer}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="section-shell pb-16 pt-6 sm:pb-20" aria-labelledby="final-cta-title">
          <div className="rounded-[26px] bg-gradient-to-r from-primary to-primaryDark px-6 py-8 text-white shadow-soft sm:px-10 sm:py-10">
            <h2 id="final-cta-title" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Start your search today
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-primary-50 sm:text-base">
              Discover verified psychologists and book confidently, or apply as a doctor to join the MindCare network.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/home#featured-doctors"
                className="focus-outline inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-primary transition hover:bg-primary-50"
              >
                Find a doctor
              </a>
              <a
                href="#for-doctors"
                className="focus-outline inline-flex h-11 items-center justify-center rounded-xl border border-white/40 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Apply as a doctor
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import therapyBlackManConsultationVideo from '../assets/media/therapy-black-man-consultation.mp4';
import therapyDoctorOnlineVideo from '../assets/media/therapy-doctor-online.mp4';
import therapyElderlyCareVideo from '../assets/media/therapy-elderly-care.mp4';
import therapyManPsychiatristVideo from '../assets/media/therapy-man-psychiatrist.mp4';
import therapyOnlineLaptopVideo from '../assets/media/therapy-online-laptop.mp4';
import therapyPregnantWomanVideo from '../assets/media/therapy-pregnant-woman.mp4';
import therapyStressConceptVideo from '../assets/media/therapy-stress-concept.mp4';
import therapyWomanMentalHealthVideo from '../assets/media/therapy-woman-mental-health.mp4';
import { useLanguage } from '../context/LanguageContext';

const HERO_VIDEOS = [
  therapyDoctorOnlineVideo,
  therapyManPsychiatristVideo,
  therapyPregnantWomanVideo,
  therapyBlackManConsultationVideo,
  therapyElderlyCareVideo,
  therapyOnlineLaptopVideo,
  therapyStressConceptVideo,
  therapyWomanMentalHealthVideo
];

export default function HeroSearch() {
  const { t, lang, setLang } = useLanguage();
  const isAr = lang === 'ar';
  const doctorPreviewSide = isAr ? 'left-0 -translate-x-4' : 'right-0 translate-x-4';
  const statCardSide = isAr ? 'right-0 translate-x-4' : 'left-0 -translate-x-4';
  const [videoIndex, setVideoIndex] = useState(0);
  const [isVideoVisible, setIsVideoVisible] = useState(true);
  const transitionTimeoutRef = useRef<number | null>(null);

  const scheduleNextVideo = () => {
    if (HERO_VIDEOS.length <= 1) {
      return;
    }
    setIsVideoVisible(false);
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
    }
    transitionTimeoutRef.current = window.setTimeout(() => {
      setVideoIndex((current) => (current + 1) % HERO_VIDEOS.length);
      setIsVideoVisible(true);
    }, 420);
  };

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <video
          key={HERO_VIDEOS[videoIndex]}
          className={`h-full w-full object-cover transition-opacity duration-700 ${isVideoVisible ? 'opacity-100' : 'opacity-0'} brightness-[0.95] contrast-[1.08] saturate-[1.08]`}
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={scheduleNextVideo}
          onError={scheduleNextVideo}
        >
          <source src={HERO_VIDEOS[videoIndex]} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(240,250,250,0.28)_0%,rgba(244,248,251,0.34)_52%,rgba(247,251,255,0.38)_100%)]" />
      </div>

      <div className="sticky top-0 z-40 border-b border-[#e5edf2] bg-white/95 shadow-[0_2px_12px_rgba(13,31,60,0.06)] backdrop-blur">
        <div className="section-shell">
          <div className="relative flex items-center justify-between py-4">
            <a href="/home" className="flex items-center gap-2">
              <span className="text-3xl font-black tracking-tight text-[#0D1F3C]">SABINA</span>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#00B8A0]/10 text-[#00B8A0]">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 3l7 3v5c0 4.2-2.6 7.7-7 10-4.4-2.3-7-5.8-7-10V6l7-3Z" />
                  <path d="m8.5 12 2.2 2.2 4.8-4.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </a>

            <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 text-[19px] font-semibold text-[#2f425d] md:flex">
              <a href="#featured-doctors" className="transition hover:text-[#00B8A0]">
                {t('nav.doctors')}
              </a>
              <a href="#how-it-works" className="transition hover:text-[#00B8A0]">
                {t('nav.howItWorks')}
              </a>
              <a href="#for-doctors" className="transition hover:text-[#00B8A0]">
                {t('nav.forDoctors')}
              </a>
              <a href="/about" className="transition hover:text-[#00B8A0]">
                {t('nav.about')}
              </a>
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLang(isAr ? 'en' : 'ar')}
                className="focus-outline inline-flex h-10 items-center gap-2 rounded-xl border border-[#d7e3ea] px-3 text-sm font-bold text-[#00B8A0] transition hover:border-[#00B8A0]/40 hover:bg-[#00B8A0]/5"
                aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
                </svg>
                {isAr ? 'EN' : 'AR'}
              </button>
              <a
                href="/login"
                className="focus-outline inline-flex h-10 items-center rounded-xl border border-[#d7e3ea] bg-white px-5 text-sm font-extrabold text-[#0D1F3C] transition hover:bg-[#f6fafc]"
              >
                {t('auth.signIn')}
              </a>
              <a
                href="/signup"
                className="focus-outline inline-flex h-10 items-center rounded-xl bg-[#00B8A0] px-5 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(0,184,160,0.22)] transition hover:-translate-y-0.5 hover:bg-[#00a18c]"
              >
                {t('auth.signUp')}
              </a>
            </div>

          </div>
        </div>
      </div>

      <div className="section-shell relative py-12 sm:py-16">
        <div
          className={`pointer-events-none absolute inset-y-0 hidden w-[420px] rounded-full bg-[#00B8A0]/8 blur-3xl lg:block ${
            isAr ? 'left-0' : 'right-0'
          }`}
        />

        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="animate-fade-slide-up-soft">
            <span className="inline-flex rounded-full border border-[#9ddfd5] bg-[#dff7f2] px-5 py-2 text-[13px] font-bold text-[#008d7d]">
              {t('hero.badge')}
            </span>

            <h1 className="mt-5 text-[42px] font-black leading-[1.18] tracking-tight text-[#0D1F3C] sm:text-[48px]">
              {t('hero.title')}{' '}
              <span className="text-[#00B8A0]">
                {t('hero.titleAccent')}
              </span>
            </h1>

            <p className="mt-5 max-w-[62ch] text-[17px] leading-[1.9] text-[#6B7280]">{t('hero.subtitle')}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#featured-doctors"
                className="focus-outline inline-flex h-14 items-center rounded-2xl bg-[#00B8A0] px-8 text-base font-extrabold text-white shadow-[0_12px_24px_rgba(0,184,160,0.2)] transition hover:-translate-y-1 hover:bg-[#00a18c]"
              >
                {t('hero.findSupport')}
              </a>
              <a
                href="#how-it-works"
                className="focus-outline inline-flex h-14 items-center rounded-2xl border border-[#cad8e2] bg-white px-8 text-base font-extrabold text-[#0D1F3C] transition hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(13,31,60,0.08)]"
              >
                {t('hero.howProtect')}
              </a>
            </div>
          </div>

          <div className="animate-fade-slide-up-soft [animation-delay:120ms]">
            <div className="relative mx-auto max-w-[460px]">
              <article className="group relative overflow-hidden rounded-[26px] border border-[#dbe8ef] bg-white p-3 shadow-[0_16px_34px_rgba(13,31,60,0.1)] transition duration-300 hover:-translate-y-1">
                <img
                  src="https://lh3.googleusercontent.com/gps-cs-s/AHVAweoQoTHslLTqlg2ImLSt9ojJMaAFpIY_RzhR8a0xS4TCWK0qfmCFurOnzViOYWF851dAWe9YL7iSz0RcSuq5m489lRyzTVIFLUQmK8nq8tJlMKKPvghBmgpO5gKvmf1XCkW1UWMbOw=s680-w680-h510"
                  alt={isAr ? 'طبيب نفسي' : 'Therapist'}
                  loading="lazy"
                  className="h-[350px] w-full rounded-[20px] object-cover"
                />
              </article>

              <article
                className={`group absolute ${doctorPreviewSide} top-5 w-[220px] rounded-[22px] border border-[#dbe8ef] bg-white p-4 shadow-[0_16px_34px_rgba(13,31,60,0.12)] transition duration-300 hover:-translate-y-1`}
              >
                <p className="text-sm font-black text-[#0D1F3C]">
                  {isAr ? 'د. عبد الرحمن مزهر' : 'Dr. Abdulrahman Muzher'}
                </p>
                <p className="mt-1 text-xs font-medium text-[#6B7280]">
                  {isAr ? 'مؤسس منصة صابينا' : 'Founder of SABINA'}
                </p>
                <a
                  href="/founder"
                  className="mt-3 inline-flex h-9 items-center rounded-lg bg-[#00B8A0] px-4 text-sm font-bold text-white transition hover:bg-[#00a18c]"
                >
                  {isAr ? 'عرض الملف' : 'View profile'}
                </a>
              </article>

              <article
                className={`absolute ${statCardSide} -bottom-6 rounded-[22px] border border-[#dbe8ef] bg-white px-8 py-5 text-center shadow-[0_16px_34px_rgba(13,31,60,0.12)] transition duration-300 hover:-translate-y-1`}
              >
                <p className="text-[38px] font-black leading-none text-[#00B8A0]">+500</p>
                <p className="mt-2 text-sm font-medium text-[#6B7280]">{isAr ? 'جلسة معتمدة' : 'Verified Sessions'}</p>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

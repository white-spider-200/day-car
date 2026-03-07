import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { vrExamples } from '../data/vrExamples';
import { apiJson, getBackendOrigin } from '../utils/api';
import { navigateTo } from '../utils/auth';

type Doctor = {
  doctor_user_id: string;
  slug: string;
  display_name: string;
  headline: string | null;
  photo_url: string | null;
  specialties: string[] | null;
  rating: number | string | null;
  reviews_count: number;
  verification_badges: string[] | null;
};

const pageNavItems = [
  { labelKey: 'nav.doctors', href: '/home#featured-doctors' },
  { labelKey: 'nav.howItWorks', href: '/home#how-it-works' },
  { labelKey: 'nav.forDoctors', href: '/apply-doctor' },
  { labelKey: 'nav.about', href: '/about' }
];

function resolveMediaUrl(url: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const base = getBackendOrigin();
  return `${base}${path}`;
}

export default function VRSelectionPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDoctors() {
      try {
        // Fetching top doctors to show as options
        const data = await apiJson<Doctor[]>('/public/doctors/top?limit=6');
        setDoctors(data);
      } catch (err) {
        console.error('Failed to load doctors:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDoctors();
  }, []);

  const handleVrClick = (id: string) => {
    // Navigate to demo with specific ID
    window.location.href = `/vr-demo?id=${id}`;
  };

  const handleDoctorClick = (slug: string) => {
    navigateTo(`/doctors/${slug}`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,rgba(48,213,200,0.15),transparent_40%),linear-gradient(180deg,#f8fcff_0%,#f0fdfa_100%)]">
      <Header brandHref="/home" navItems={pageNavItems} />

      <main className="section-shell py-12 sm:py-16" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            {isAr ? 'بدء تجربة الواقع الافتراضي الخاص بك' : 'Start Your VR Experience'}
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            {isAr 
              ? 'اختر الطريقة التي تفضلها لبدء رحلتك العلاجية. يمكنك البدء بسيناريو محدد أو اختيار طبيب ليقود تجربتك.'
              : 'Choose how you want to start your therapeutic journey. You can start with a specific scenario or pick a doctor to lead your experience.'}
          </p>
        </div>

        {/* Section 1: Choose Scenario */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold">1</div>
            <h2 className="text-2xl font-black text-slate-800">
              {isAr ? 'عما تبحث؟ اختر التصنيف' : 'What are you searching for? Choose a category'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {vrExamples.map((example) => (
              <button
                key={example.id}
                onClick={() => handleVrClick(example.id)}
                className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/40 p-1 shadow-sm transition hover:shadow-xl hover:-translate-y-1 text-left"
              >
                <div className={`h-40 w-full rounded-2xl bg-gradient-to-br ${example.palette} flex items-center justify-center`}>
                   <span className="text-4xl opacity-80 group-hover:scale-110 transition duration-300">
                     {example.id === 'heights' ? '🏔️' : example.id === 'spiders' ? '🕷️' : example.id === 'flying' ? '✈️' : '👥'}
                   </span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-primary transition">
                    {isAr ? example.titleAr : example.titleEn}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed line-clamp-2">
                    {isAr ? example.descriptionAr : example.descriptionEn}
                  </p>
                  <div className="mt-4 flex items-center text-xs font-bold text-primary">
                    {isAr ? 'ابدأ الآن' : 'Start Now'} 
                    <span className={`mx-1 transition-transform group-hover:translate-x-1 ${isAr ? 'rotate-180' : ''}`}>→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Section 2: Choose Doctor */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold">2</div>
            <h2 className="text-2xl font-black text-slate-800">
              {isAr ? 'اختر المختص الخاص بك' : 'Choose Your Professional'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              [1,2,3].map(i => (
                <div key={i} className="h-64 rounded-3xl bg-slate-100 animate-pulse" />
              ))
            ) : (
              doctors.map((doctor) => (
                <button
                  key={doctor.doctor_user_id}
                  onClick={() => handleDoctorClick(doctor.slug)}
                  className="group flex items-start gap-4 rounded-3xl border border-white/60 bg-white/60 p-5 shadow-sm transition hover:shadow-lg hover:border-primary/20 text-left"
                >
                  {resolveMediaUrl(doctor.photo_url) ? (
                    <img src={resolveMediaUrl(doctor.photo_url)} alt={doctor.display_name} className="h-20 w-20 rounded-2xl object-cover shadow-sm" />
                  ) : (
                    <div className="h-20 w-20 rounded-2xl bg-slate-200 flex items-center justify-center font-bold text-slate-400">
                      {doctor.display_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-slate-900 group-hover:text-primary transition">
                        {doctor.display_name}
                      </h3>
                      {doctor.rating && (
                        <div className="flex items-center text-xs font-bold text-amber-500">
                          ★ {Number(doctor.rating).toFixed(1)}
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-bold text-primary uppercase tracking-wide">
                      {doctor.specialties?.[0] || (isAr ? 'طبيب' : 'Doctor')}
                    </p>
                    <p className="mt-2 text-sm text-slate-500 line-clamp-2 italic">
                      "{doctor.headline || (isAr ? 'مستعد لمساعدتك في رحلتك العلاجية.' : 'Ready to help you in your journey.')}"
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
          
          <div className="mt-10 text-center">
            <button 
              onClick={() => navigateTo('/home#featured-doctors')}
              className="px-8 py-4 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 transition shadow-lg"
            >
              {isAr ? 'عرض جميع الأطباء' : 'View All Doctors'}
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

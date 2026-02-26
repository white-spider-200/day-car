import Header from '../components/Header';
import HeroSearch from '../components/HeroSearch';
import DoctorCard from '../components/DoctorCard';
import HowItWorks from '../components/HowItWorks';
import CTAForDoctors from '../components/CTAForDoctors';
import FounderSection from '../components/FounderSection';
import Footer from '../components/Footer';
import { featuredDoctors } from '../data/homeData';
import { useLanguage } from '../context/LanguageContext';

export default function MainHomePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/40 via-white to-white text-textMain">
      <Header
        brandHref="/home"
        navItems={[
          { labelKey: 'nav.doctors', href: '#featured-doctors' },
          { labelKey: 'nav.howItWorks', href: '#how-it-works' },
          { labelKey: 'nav.forDoctors', href: '#for-doctors' },
          { labelKey: 'nav.about', href: '/about' }
        ]}
      />

      <main>
        <HeroSearch />

        <section id="featured-doctors" className="section-shell py-14 sm:py-16" aria-labelledby="featured-title">
          <h2 id="featured-title" className="section-title">
            {t('home.featuredTitle')}
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredDoctors.map((doctor, idx) => (
              <DoctorCard key={doctor.name} doctor={doctor} index={idx} />
            ))}
          </div>
        </section>

        <FounderSection />

        <HowItWorks />
        <CTAForDoctors />
      </main>

      <Footer />
    </div>
  );
}

import Header from './components/Header';
import HeroSearch from './components/HeroSearch';
import CategoryGrid from './components/CategoryGrid';
import DoctorCard from './components/DoctorCard';
import HowItWorks from './components/HowItWorks';
import CTAForDoctors from './components/CTAForDoctors';
import Footer from './components/Footer';
import { categories, featuredDoctors } from './data/homeData';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 via-white to-white text-textMain">
      <Header />

      <main>
        <HeroSearch />

        <CategoryGrid categories={categories} />

        <section id="featured-doctors" className="section-shell py-14 sm:py-16" aria-labelledby="featured-title">
          <h2 id="featured-title" className="section-title">
            Featured doctors
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredDoctors.map((doctor) => (
              <DoctorCard key={doctor.name} doctor={doctor} />
            ))}
          </div>
        </section>

        <HowItWorks />
        <CTAForDoctors />
      </main>

      <Footer />
    </div>
  );
}

import { useLanguage } from '../context/LanguageContext';

export default function CTAForDoctors() {
  const { t } = useLanguage();

  return (
    <section id="for-doctors" className="section-shell pb-16 pt-4 sm:pb-20">
      <div className="rounded-[26px] bg-gradient-to-r from-primary to-primaryDark px-6 py-8 text-white shadow-soft sm:px-10 sm:py-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t('about.ctaApply')}?</h2>
            <p className="mt-2 max-w-2xl text-sm text-primary-50 sm:text-base">
              {t('about.ctaSubtitle')}
            </p>
          </div>

          <a
            href="#"
            className="focus-outline inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-primary transition hover:bg-primary-50"
          >
            {t('about.ctaApply')}
          </a>
        </div>
      </div>
    </section>
  );
}

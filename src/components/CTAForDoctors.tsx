export default function CTAForDoctors() {
  return (
    <section id="for-doctors" className="section-shell pb-16 pt-4 sm:pb-20">
      <div className="rounded-[26px] bg-gradient-to-r from-primary to-primaryDark px-6 py-8 text-white shadow-soft sm:px-10 sm:py-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Are you a doctor?</h2>
            <p className="mt-2 max-w-2xl text-sm text-blue-50 sm:text-base">
              Apply to join. Admin approval keeps the platform trusted and verified.
            </p>
          </div>

          <a
            href="#"
            className="focus-outline inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-primary transition hover:bg-blue-50"
          >
            Apply now
          </a>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';

const navItems = [
  { label: 'Doctors', href: '#featured-doctors' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'For Doctors', href: '#for-doctors' }
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-transparent transition-all duration-300 ${
        isScrolled
          ? 'border-borderGray/70 bg-white/90 shadow-card backdrop-blur-md'
          : 'bg-white/75 backdrop-blur-sm'
      }`}
    >
      <div className="section-shell flex h-20 items-center justify-between gap-4">
        <a href="#" className="focus-outline inline-flex items-center gap-3 rounded-xl" aria-label="MindCare home">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primaryDark text-white shadow-sm">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 20c5-3.4 8-6.2 8-10a4.8 4.8 0 0 0-8-3.5A4.8 4.8 0 0 0 4 10c0 3.8 3 6.6 8 10Z" />
              <path d="M12 8.7v6.6" />
              <path d="M8.7 12h6.6" />
            </svg>
          </span>
          <span className="text-lg font-extrabold tracking-tight text-textMain">MindCare</span>
        </a>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="focus-outline rounded-lg px-2 py-1 text-sm font-medium text-muted transition hover:text-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <a
            href="#"
            className="focus-outline rounded-xl border border-borderGray px-4 py-2 text-sm font-semibold text-textMain transition hover:border-primary/30 hover:text-primary"
          >
            Sign in
          </a>
          <a
            href="#"
            className="focus-outline rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primaryDark"
          >
            Sign up
          </a>
        </div>

        <button
          type="button"
          aria-label="Open navigation menu"
          className="focus-outline inline-flex h-10 w-10 items-center justify-center rounded-xl border border-borderGray text-muted transition hover:border-primary/30 hover:text-primary md:hidden"
        >
          <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}

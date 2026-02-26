import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { logout } from '../utils/auth';

type HeaderNavItem = {
  labelKey: string;
  href: string;
};

type HeaderProps = {
  brandHref?: string;
  navItems?: HeaderNavItem[];
  signInHref?: string;
  signUpHref?: string;
  accent?: 'blue' | 'teal';
};

const defaultNavItems: HeaderNavItem[] = [
  { labelKey: 'nav.doctors', href: '/home#featured-doctors' },
  { labelKey: 'nav.howItWorks', href: '/home#how-it-works' },
  { labelKey: 'nav.forDoctors', href: '/home#for-doctors' },
  { labelKey: 'nav.about', href: '/about' }
];

export default function Header({
  brandHref = '/home',
  navItems,
  signInHref = '/login',
  signUpHref = '/signup',
  accent = 'teal'
}: HeaderProps) {
  const { lang, setLang, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [authRole, setAuthRole] = useState<string | null>(() => localStorage.getItem('auth_role'));

  const navigateTo = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const items = useMemo(() => navItems ?? defaultNavItems, [navItems]);
  const isTeal = accent === 'teal';

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onAuthChanged = () => {
      setAuthRole(localStorage.getItem('auth_role'));
    };

    window.addEventListener('auth-changed', onAuthChanged);
    return () => window.removeEventListener('auth-changed', onAuthChanged);
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
        <a 
          href={brandHref} 
          onClick={(e) => navigateTo(e, brandHref)}
          className="focus-outline inline-flex items-center gap-3 rounded-xl" 
          aria-label="MindCare home"
        >
          <span
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${
              isTeal ? 'from-cyan-500 to-teal-600' : 'from-primary to-primaryDark'
            }`}
          >
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
          {items.map((item) => (
            <a
              key={item.labelKey}
              href={item.href}
              className={`focus-outline rounded-lg px-2 py-1 text-sm font-medium text-muted transition ${
                isTeal ? 'hover:text-teal-600' : 'hover:text-primary'
              }`}
            >
              {t(item.labelKey)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="focus-outline flex h-10 w-10 items-center justify-center rounded-xl border border-borderGray text-sm font-bold text-primary transition hover:bg-primaryBg"
          >
            {lang === 'en' ? 'AR' : 'EN'}
          </button>

          {authRole ? (
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full border border-borderGray bg-white px-3 py-1 text-xs font-semibold text-muted sm:inline-flex">
                {authRole}
              </span>
              <button
                type="button"
                onClick={() => logout('/login')}
                className={`focus-outline rounded-xl border border-borderGray px-4 py-2 text-sm font-semibold text-textMain transition ${
                  isTeal ? 'hover:border-teal-300 hover:text-teal-700' : 'hover:border-primary/30 hover:text-primary'
                }`}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-3 sm:flex">
              <a
                href={signInHref}
                onClick={(e) => navigateTo(e, signInHref)}
                className={`focus-outline rounded-xl border border-borderGray px-4 py-2 text-sm font-semibold text-textMain transition ${
                  isTeal ? 'hover:border-teal-300 hover:text-teal-700' : 'hover:border-primary/30 hover:text-primary'
                }`}
              >
                {t('auth.signIn')}
              </a>
              <a
                href={signUpHref}
                onClick={(e) => navigateTo(e, signUpHref)}
                className={`focus-outline rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
                  isTeal ? 'bg-teal-600 hover:bg-teal-700' : 'bg-primary hover:bg-primaryDark'
                }`}
              >
                {t('auth.signUp')}
              </a>
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label="Open navigation menu"
          className={`focus-outline inline-flex h-10 w-10 items-center justify-center rounded-xl border border-borderGray text-muted transition md:hidden ${
            isTeal ? 'hover:border-teal-300 hover:text-teal-700' : 'hover:border-primary/30 hover:text-primary'
          }`}
        >
          <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getStoredAuthRole, logout, roleHomePath, type AuthRole } from '../utils/auth';
import { apiJson } from '../utils/api';
import sabinaLogo from '../assets/sabina-logo.png';

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

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  sent_at: string;
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
  const [authRole, setAuthRole] = useState<AuthRole | null>(() => getStoredAuthRole());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const navigateTo = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const items = useMemo(() => {
    const baseItems = navItems ?? defaultNavItems;
    if (!authRole) {
      return baseItems;
    }

    const hasDashboardItem = baseItems.some((item) => item.labelKey === 'nav.dashboard');
    if (hasDashboardItem) {
      return baseItems;
    }

    return [{ labelKey: 'nav.dashboard', href: roleHomePath(authRole) }, ...baseItems];
  }, [navItems, authRole]);
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
      setAuthRole(getStoredAuthRole());
    };
    const onStorage = () => {
      setAuthRole(getStoredAuthRole());
    };

    window.addEventListener('auth-changed', onAuthChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('auth-changed', onAuthChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const loadNotifications = async () => {
    if (!authRole) {
      setNotifications([]);
      return;
    }
    setIsLoadingNotifications(true);
    try {
      const payload = await apiJson<NotificationItem[]>(
        '/notifications',
        undefined,
        true,
        'Failed to load notifications'
      );
      setNotifications(payload);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, [authRole]);

  const unreadCount = notifications.filter((item) => !item.is_read).length;

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
          className="focus-outline inline-flex items-center gap-3 rounded-xl transition-transform hover:scale-105" 
          aria-label="Sabina Therapy home"
        >
          <div className="h-10 w-10 overflow-hidden rounded-lg bg-slate-950 flex items-center justify-center p-0.5 shadow-sm">
            <img 
              src={sabinaLogo} 
              alt="Sabina Logo" 
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">Sabina</span>
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
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    const nextOpen = !isNotificationsOpen;
                    setIsNotificationsOpen(nextOpen);
                    if (nextOpen) {
                      void apiJson('/notifications/read', { method: 'POST' }, true, 'Failed to mark notifications');
                      setNotifications((previous) => previous.map((item) => ({ ...item, is_read: true })));
                    }
                  }}
                  className="focus-outline relative flex h-10 w-10 items-center justify-center rounded-xl border border-borderGray bg-white text-sm font-semibold text-textMain transition hover:border-primary/30 hover:text-primary"
                  aria-label="Notifications"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 17a3 3 0 0 0 6 0" strokeLinecap="round" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-borderGray bg-white p-3 shadow-card">
                    <p className="text-xs font-black uppercase tracking-wide text-muted">Notifications</p>
                    {isLoadingNotifications ? (
                      <p className="mt-2 text-xs text-muted">Loading...</p>
                    ) : notifications.length === 0 ? (
                      <p className="mt-2 text-xs text-muted">No notifications yet.</p>
                    ) : (
                      <ul className="mt-2 max-h-64 space-y-2 overflow-auto">
                        {notifications.map((item) => (
                          <li key={item.id} className="rounded-lg border border-borderGray bg-slate-50 p-2">
                            <p className="text-xs font-semibold text-textMain">{item.title}</p>
                            <p className="mt-0.5 text-xs text-muted">{item.body}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
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

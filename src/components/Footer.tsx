import { useLanguage } from '../context/LanguageContext';

const footerLinks = [
  { labelKey: 'nav.about', href: '/about' },
  { labelKey: 'Contact', href: '#' },
  { labelKey: 'Terms', href: '#' },
  { labelKey: 'Privacy', href: '#' }
];

export default function Footer() {
  return <BaseFooter accent="teal" />;
}

type FooterProps = {
  accent?: 'blue' | 'teal';
};

export function BaseFooter({ accent = 'teal' }: FooterProps) {
  const { t } = useLanguage();
  const isTeal = accent === 'teal';

  return (
    <footer className="border-t border-borderGray bg-white py-8 sm:py-12">
      <div className="section-shell flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primaryDark text-white">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 20c5-3.4 8-6.2 8-10a4.8 4.8 0 0 0-8-3.5A4.8 4.8 0 0 0 4 10c0 3.8 3 6.6 8 10Z" />
              <path d="M12 8.7v6.6" />
              <path d="M8.7 12h6.6" />
            </svg>
          </span>
          <span className="text-base font-extrabold tracking-tight text-textMain">MindCare</span>
        </div>

        <nav aria-label="Footer links" className="flex flex-wrap items-center gap-6">
          {footerLinks.map((link) => (
            <a
              key={link.labelKey}
              href={link.href}
              className={`text-sm font-medium text-muted transition ${isTeal ? 'hover:text-teal-600' : 'hover:text-primary'}`}
            >
              {t(link.labelKey)}
            </a>
          ))}
        </nav>

        <p className="text-sm font-medium text-muted">{t('footer.rights')}</p>
      </div>
    </footer>
  );
}

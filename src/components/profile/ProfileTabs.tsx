import type { RefObject } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export type ProfileTabKey = 'about' | 'services' | 'availability' | 'reviews';

type ProfileTabsProps = {
  activeTab: ProfileTabKey;
  sectionRefs: Record<ProfileTabKey, RefObject<HTMLElement>>;
};

export default function ProfileTabs({ activeTab, sectionRefs }: ProfileTabsProps) {
  const { t } = useLanguage();

  const tabs: { key: ProfileTabKey; label: string }[] = [
    { key: 'about', label: t('profile.about') },
    { key: 'services', label: t('profile.services') },
    { key: 'availability', label: t('profile.availability') },
    { key: 'reviews', label: t('profile.reviews') }
  ];

  const scrollToSection = (tabKey: ProfileTabKey) => {
    const element = sectionRefs[tabKey].current;

    if (!element) {
      return;
    }

    const fixedOffset = 148;
    const y = element.getBoundingClientRect().top + window.scrollY - fixedOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  return (
    <nav className="sticky top-20 z-40 mt-6 border-y border-borderGray bg-white/95 backdrop-blur" aria-label="Profile sections">
      <div className="section-shell flex items-center gap-2 overflow-x-auto py-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => scrollToSection(tab.key)}
            className={`focus-outline whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key ? 'bg-primaryBg text-primary' : 'text-muted hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

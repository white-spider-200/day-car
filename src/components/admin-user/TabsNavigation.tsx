export type TabType = 'sessions' | 'progress' | 'notes' | 'activity';

type TabsNavigationProps = {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
};

const tabs: { id: TabType; label: string; icon: string }[] = [
  { id: 'sessions', label: 'Sessions', icon: '📅' },
  { id: 'progress', label: 'Progress', icon: '📈' },
  { id: 'notes', label: 'Notes', icon: '📝' },
  { id: 'activity', label: 'Activity', icon: '⏱️' }
];

export default function TabsNavigation({ activeTab, onTabChange }: TabsNavigationProps) {
  return (
    <div className="border-b border-borderGray bg-gradient-to-r from-primaryBg/40 to-white">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-primaryBg/30'
                : 'border-transparent text-muted hover:text-textMain hover:bg-primaryBg/10'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

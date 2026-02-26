import { useState, useMemo } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getAllUsers, getUserDataById } from '../data/userProfileData';
import UserListView from '../components/admin-user/UserListView';
import HeaderSection from '../components/admin-user/HeaderSection';
import UserInfoCard from '../components/admin-user/UserInfoCard';
import IntakeAssessmentCard from '../components/admin-user/IntakeAssessmentCard';
import PaymentCard from '../components/admin-user/PaymentCard';
import TabsNavigation, { TabType } from '../components/admin-user/TabsNavigation';
import SessionsTab from '../components/admin-user/SessionsTab';
import ProgressTab from '../components/admin-user/ProgressTab';
import NotesTab from '../components/admin-user/NotesTab';
import ActivityTab from '../components/admin-user/ActivityTab';

type ViewMode = 'list' | 'detail';

export default function AdminUserProfilePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('sessions');

  const allUsers = useMemo(() => getAllUsers(), []);
  const selectedUserData = useMemo(
    () => (selectedUserId ? getUserDataById(selectedUserId) : null),
    [selectedUserId]
  );

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setViewMode('detail');
    setActiveTab('sessions');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedUserId(null);
  };

  const renderTabContent = () => {
    if (!selectedUserData) return null;

    switch (activeTab) {
      case 'sessions':
        return <SessionsTab sessions={selectedUserData.sessions} timezone={selectedUserData.user.timezone} />;
      case 'progress':
        return <ProgressTab treatmentPlan={selectedUserData.treatmentPlan} />;
      case 'notes':
        return <NotesTab adminNotes={selectedUserData.adminNotes} />;
      case 'activity':
        return <ActivityTab activityLogs={selectedUserData.activityLogs} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/40 via-white to-white text-textMain">
      <Header
        brandHref="/home"
        navItems={[
          { labelKey: 'nav.doctors', href: '/admin' },
          { labelKey: 'nav.users', href: '/admin/users' },
          { labelKey: 'nav.dashboard', href: '/dashboard' }
        ]}
      />

      <main>
        {viewMode === 'list' ? (
          <UserListView users={allUsers} onSelectUser={handleSelectUser} />
        ) : selectedUserData ? (
          <section className="section-shell py-8">
            {/* Back Button */}
            <button
              onClick={handleBackToList}
              className="mb-6 flex items-center gap-2 text-primary hover:text-primaryDark transition"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Users
            </button>

            {/* Header Section */}
            <HeaderSection user={selectedUserData.user} />

            {/* Main Content Grid */}
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_2.5fr]">
              {/* Left Column - Info Cards */}
              <div className="space-y-6">
                <UserInfoCard user={selectedUserData.user} />
                <IntakeAssessmentCard intake={selectedUserData.intake} />
                <PaymentCard payment={selectedUserData.payment} />
              </div>

              {/* Right Column - Tabs */}
              <div className="rounded-hero border border-borderGray bg-white shadow-card overflow-hidden">
                <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />
                <div className="p-6">
                  {renderTabContent()}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

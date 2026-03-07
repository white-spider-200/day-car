import { useEffect, useState } from 'react';
import MainHomePage from './pages/MainHomePage';
import DashboardPage from './pages/DashboardPage';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import DoctorPrescriptionPage from './pages/DoctorPrescriptionPage';
import AdminPage from './pages/AdminPage';
import AdminUserProfilePage from './pages/AdminUserProfilePage';
import ApplyDoctorPage from './pages/ApplyDoctorPage';
import DoctorProfilePage from './pages/DoctorProfilePage';
import TherapistProfilePage from './pages/TherapistProfilePage';
import DoctorDetailsPage from './pages/DoctorDetailsPage';
import AboutPage from './pages/AboutPage';
import FounderProfilePage from './pages/FounderProfilePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminFinancialReportsPage from './pages/AdminFinancialReportsPage';
import AdminComplaintsPage from './pages/AdminComplaintsPage';
import DoctorSurveyPage from './pages/DoctorSurveyPage';
import DoctorChatsPage from './pages/DoctorChatsPage';
import UserChatsPage from './pages/UserChatsPage';
import ComplaintPage from './pages/ComplaintPage';
import VRDemoPage from './pages/VRDemoPage';
import VRSelectionPage from './pages/VRSelectionPage';
import DoctorVRSessionPage from './pages/DoctorVRSessionPage';
import PatientVRPage from './pages/PatientVRPage';
import BookingConfirmPage from './pages/BookingConfirmPage';
import PrescriptionVerifyPage from './pages/PrescriptionVerifyPage';
import { getStoredAuthRole, isDoctorLikeRole, navigateTo, roleHomePath, type AuthRole } from './utils/auth';

type AppPage =
  | 'profile'
  | 'therapist-profile'
  | 'doctor-details'
  | 'main'
  | 'dashboard'
  | 'doctor-dashboard'
  | 'doctor-prescriptions'
  | 'doctor-chats'
  | 'user-chats'
  | 'admin'
  | 'admin-applications'
  | 'admin-users'
  | 'admin-financial'
  | 'admin-complaints'
  | 'complaints'
  | 'apply-doctor'
  | 'about'
  | 'founder'
  | 'login'
  | 'signup'
  | 'find-doctor'
  | 'vr-demo'
  | 'vr-selection'
  | 'doctor-vr-session'
  | 'patient-vr-session'
  | 'booking-confirm'
  | 'prescription-verify';

function pageFromPath(pathname: string): AppPage {
  if (pathname === '/home' || pathname === '/home/') {
    return 'main';
  }

  if (pathname === '/login' || pathname === '/login/') {
    return 'login';
  }

  if (pathname === '/signup' || pathname === '/signup/') {
    return 'signup';
  }

  if (pathname === '/apply-doctor' || pathname === '/apply-doctor/') {
    return 'apply-doctor';
  }

  if (pathname === '/doctor-dashboard' || pathname === '/doctor-dashboard/') {
    return 'doctor-dashboard';
  }
  if (pathname === '/doctor/prescriptions' || pathname === '/doctor/prescriptions/') {
    return 'doctor-prescriptions';
  }
  if (pathname === '/doctor-chats' || pathname === '/doctor-chats/') {
    return 'doctor-chats';
  }
  if (pathname === '/user-chats' || pathname === '/user-chats/') {
    return 'user-chats';
  }

  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return 'dashboard';
  }

  if (pathname.startsWith('/admin/users') || pathname === '/admin/users/') {
    return 'admin-users';
  }

  if (pathname === '/admin/financial-reports' || pathname === '/admin/financial-reports/') {
    return 'admin-financial';
  }
  if (pathname === '/admin/complaints' || pathname === '/admin/complaints/') {
    return 'admin-complaints';
  }

  if (pathname === '/admin/applications' || pathname === '/admin/applications/') {
    return 'admin-applications';
  }

  if (pathname === '/admin' || pathname === '/admin/') {
    return 'admin-applications';
  }

  if (pathname === '/find-doctor' || pathname === '/find-doctor/') {
    return 'find-doctor';
  }
  if (pathname === '/complaints' || pathname === '/complaints/') {
    return 'complaints';
  }

  if (pathname === '/about' || pathname === '/about/') {
    return 'about';
  }

  if (pathname === '/vr-demo' || pathname === '/vr-demo/') {
    return 'vr-demo';
  }
  if (pathname === '/vr-selection' || pathname === '/vr-selection/') {
    return 'vr-selection';
  }

  if (pathname === '/doctor/vr-session' || pathname === '/doctor/vr-session/') {
    return 'doctor-vr-session';
  }

  if (pathname.startsWith('/vr-session/')) {
    const parts = pathname.split('/');
    if (parts.includes('patient')) return 'patient-vr-session';
    if (parts.includes('doctor')) return 'doctor-vr-session';
  }
  if (pathname === '/booking/confirm' || pathname === '/booking/confirm/') {
    return 'booking-confirm';
  }
  if (pathname.startsWith('/prescriptions/verify/')) {
    return 'prescription-verify';
  }

  if (pathname === '/founder' || pathname === '/founder/') {
    return 'founder';
  }

  if (pathname.startsWith('/doctors/')) {
    return 'doctor-details';
  }

  if (pathname.startsWith('/therapists/')) {
    return 'therapist-profile';
  }

  if (pathname === '/') {
    return 'main';
  }

  if (pathname === '/doctor-profile' || pathname === '/doctor-profile/') {
    return 'profile';
  }

  return 'profile';
}

function isProtectedPage(page: AppPage): boolean {
  return (
    page === 'dashboard' ||
    page === 'doctor-dashboard' ||
    page === 'doctor-prescriptions' ||
    page === 'doctor-chats' ||
    page === 'user-chats' ||
    page === 'admin' ||
    page === 'admin-applications' ||
    page === 'admin-users' ||
    page === 'admin-financial' ||
    page === 'admin-complaints' ||
    page === 'complaints'
  );
}

function hasAccess(role: AuthRole | null, page: AppPage): boolean {
  if (page === 'dashboard') {
    return role === 'USER';
  }
  if (page === 'doctor-dashboard') {
    return isDoctorLikeRole(role);
  }
  if (page === 'doctor-prescriptions') {
    return isDoctorLikeRole(role);
  }
  if (page === 'doctor-chats') {
    return isDoctorLikeRole(role);
  }
  if (page === 'user-chats') {
    return role === 'USER';
  }
  if (
    page === 'admin' ||
    page === 'admin-applications' ||
    page === 'admin-users' ||
    page === 'admin-financial' ||
    page === 'admin-complaints'
  ) {
    return role === 'ADMIN';
  }
  if (page === 'complaints') {
    return role === 'USER' || isDoctorLikeRole(role);
  }
  return true;
}

export default function App() {
  const [page, setPage] = useState<AppPage>(() => pageFromPath(window.location.pathname));
  const [authRole, setAuthRole] = useState<AuthRole | null>(() => getStoredAuthRole());

  useEffect(() => {
    const onPopState = () => {
      setPage(pageFromPath(window.location.pathname));
    };

    const onAuthChanged = () => {
      setAuthRole(getStoredAuthRole());
    };

    window.addEventListener('popstate', onPopState);
    window.addEventListener('auth-changed', onAuthChanged);

    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('auth-changed', onAuthChanged);
    };
  }, []);

  useEffect(() => {
    if (!authRole) {
      return;
    }

    if (page === 'login' || page === 'signup') {
      navigateTo(roleHomePath(authRole));
      return;
    }

    if (!hasAccess(authRole, page) && isProtectedPage(page)) {
      navigateTo(roleHomePath(authRole));
    }
  }, [authRole, page]);

  if (isProtectedPage(page) && (!authRole || !hasAccess(authRole, page))) {
    return <LoginPage />;
  }

  if (page === 'main') {
    return <MainHomePage />;
  }

  if (page === 'login') {
    return <LoginPage />;
  }

  if (page === 'signup') {
    return <SignupPage />;
  }

  if (page === 'apply-doctor') {
    return <ApplyDoctorPage />;
  }

  if (page === 'dashboard') {
    return <DashboardPage />;
  }

  if (page === 'doctor-dashboard') {
    return <DoctorDashboardPage />;
  }
  if (page === 'doctor-prescriptions') {
    return <DoctorPrescriptionPage />;
  }
  if (page === 'doctor-chats') {
    return <DoctorChatsPage />;
  }
  if (page === 'user-chats') {
    return <UserChatsPage />;
  }

  if (page === 'admin-users') {
    return <AdminUserProfilePage />;
  }

  if (page === 'admin-financial') {
    return <AdminFinancialReportsPage />;
  }
  if (page === 'admin-complaints') {
    return <AdminComplaintsPage />;
  }

  if (page === 'admin' || page === 'admin-applications') {
    return <AdminPage />;
  }
  if (page === 'complaints') {
    return <ComplaintPage />;
  }

  if (page === 'find-doctor') {
    return <DoctorSurveyPage />;
  }

  if (page === 'about') {
    return <AboutPage />;
  }

  if (page === 'founder') {
    return <FounderProfilePage />;
  }

  if (page === 'vr-demo') {
    return <VRDemoPage />;
  }

  if (page === 'vr-selection') {
    return <VRSelectionPage />;
  }

  if (page === 'doctor-vr-session') {
    return <DoctorVRSessionPage />;
  }

  if (page === 'patient-vr-session') {
    return <PatientVRPage />;
  }
  if (page === 'booking-confirm') {
    return <BookingConfirmPage />;
  }
  if (page === 'prescription-verify') {
    return <PrescriptionVerifyPage />;
  }

  if (page === 'therapist-profile') {
    return <TherapistProfilePage />;
  }

  if (page === 'doctor-details') {
    return <DoctorDetailsPage />;
  }

  return <DoctorProfilePage />;
}

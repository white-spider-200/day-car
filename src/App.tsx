import { useEffect, useState } from 'react';
import MainHomePage from './pages/MainHomePage';
import DashboardPage from './pages/DashboardPage';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import AdminPage from './pages/AdminPage';
import AdminUserProfilePage from './pages/AdminUserProfilePage';
import ApplyDoctorPage from './pages/ApplyDoctorPage';
import DoctorProfilePage from './pages/DoctorProfilePage';
import TherapistProfilePage from './pages/TherapistProfilePage';
import DoctorDetailsPage from './pages/DoctorDetailsPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { getStoredAuthRole, navigateTo, roleHomePath, type AuthRole } from './utils/auth';

type AppPage =
  | 'profile'
  | 'therapist-profile'
  | 'doctor-details'
  | 'main'
  | 'dashboard'
  | 'doctor-dashboard'
  | 'admin'
  | 'admin-applications'
  | 'admin-users'
  | 'apply-doctor'
  | 'about'
  | 'login'
  | 'signup';

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

  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return 'dashboard';
  }

  if (pathname.startsWith('/admin/users') || pathname === '/admin/users/') {
    return 'admin-users';
  }

  if (pathname === '/admin/applications' || pathname === '/admin/applications/') {
    return 'admin-applications';
  }

  if (pathname === '/admin' || pathname === '/admin/') {
    return 'admin-applications';
  }

  if (pathname === '/about' || pathname === '/about/') {
    return 'about';
  }

  if (pathname.startsWith('/doctors/')) {
    return 'doctor-details';
  }

  if (pathname.startsWith('/therapists/')) {
    return 'therapist-profile';
  }

  if (pathname === '/' || pathname === '/doctor-profile' || pathname === '/doctor-profile/') {
    return 'profile';
  }

  return 'profile';
}

function isProtectedPage(page: AppPage): boolean {
  return (
    page === 'dashboard' ||
    page === 'doctor-dashboard' ||
    page === 'admin' ||
    page === 'admin-applications' ||
    page === 'admin-users'
  );
}

function hasAccess(role: AuthRole | null, page: AppPage): boolean {
  if (page === 'dashboard') {
    return role === 'USER';
  }
  if (page === 'doctor-dashboard') {
    return role === 'DOCTOR';
  }
  if (page === 'admin' || page === 'admin-applications' || page === 'admin-users') {
    return role === 'ADMIN';
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

  if (page === 'admin-users') {
    return <AdminUserProfilePage />;
  }

  if (page === 'admin' || page === 'admin-applications') {
    return <AdminPage />;
  }

  if (page === 'about') {
    return <AboutPage />;
  }

  if (page === 'therapist-profile') {
    return <TherapistProfilePage />;
  }

  if (page === 'doctor-details') {
    return <DoctorDetailsPage />;
  }

  return <DoctorProfilePage />;
}

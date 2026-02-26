import { useEffect, useState } from 'react';
import MainHomePage from './pages/MainHomePage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import AdminUserProfilePage from './pages/AdminUserProfilePage';
import DoctorProfilePage from './pages/DoctorProfilePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

type AppPage = 'profile' | 'main' | 'dashboard' | 'admin' | 'admin-users' | 'about' | 'login' | 'signup';

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

  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return 'dashboard';
  }

  if (pathname.startsWith('/admin/users') || pathname === '/admin/users/') {
    return 'admin-users';
  }

  if (pathname === '/admin' || pathname === '/admin/') {
    return 'admin';
  }

  if (pathname === '/about' || pathname === '/about/') {
    return 'about';
  }

  if (pathname === '/' || pathname === '/doctor-profile' || pathname === '/doctor-profile/') {
    return 'profile';
  }

  return 'profile';
}

export default function App() {
  const [page, setPage] = useState<AppPage>(() => pageFromPath(window.location.pathname));

  useEffect(() => {
    const onPopState = () => {
      setPage(pageFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (page === 'main') {
    return <MainHomePage />;
  }

  if (page === 'login') {
    return <LoginPage />;
  }

  if (page === 'signup') {
    return <SignupPage />;
  }

  if (page === 'dashboard') {
    return <DashboardPage />;
  }

  if (page === 'admin-users') {
    return <AdminUserProfilePage />;
  }

  if (page === 'admin') {
    return <AdminPage />;
  }

  if (page === 'about') {
    return <AboutPage />;
  }

  return <DoctorProfilePage />;
}

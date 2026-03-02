export type Lang = "en" | "ar";

type Dictionary = {
  appName: string;
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  topDoctors: string;
  viewDoctors: string;
  bookNow: string;
  login: string;
  register: string;
  logout: string;
  dashboard: string;
  userDashboard: string;
  doctorDashboard: string;
  adminDashboard: string;
};

const dictionaries: Record<Lang, Dictionary> = {
  en: {
    appName: "Sabina Therapy",
    heroTitle: "Find trusted therapy and psychiatry doctors",
    heroSubtitle: "Book secure online or in-clinic sessions in Jordan.",
    searchPlaceholder: "Search by doctor, specialty, or location",
    topDoctors: "Top Doctors",
    viewDoctors: "View Doctors",
    bookNow: "Book Now",
    login: "Login",
    register: "Register",
    logout: "Logout",
    dashboard: "Dashboard",
    userDashboard: "User Dashboard",
    doctorDashboard: "Doctor Dashboard",
    adminDashboard: "Admin Dashboard"
  },
  ar: {
    appName: "سابينا للعلاج",
    heroTitle: "ابحث عن أفضل أطباء العلاج النفسي والطب النفسي",
    heroSubtitle: "احجز جلسات آمنة أونلاين أو في العيادة داخل الأردن.",
    searchPlaceholder: "ابحث باسم الطبيب أو التخصص أو الموقع",
    topDoctors: "أفضل الأطباء",
    viewDoctors: "عرض الأطباء",
    bookNow: "احجز الآن",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    logout: "تسجيل الخروج",
    dashboard: "لوحة التحكم",
    userDashboard: "لوحة المستخدم",
    doctorDashboard: "لوحة الطبيب",
    adminDashboard: "لوحة المشرف"
  }
};

export function t(lang: Lang) {
  return dictionaries[lang];
}

export function locationLabel(location: string) {
  const labels: Record<string, string> = {
    AMMAN: "Amman",
    IRBID: "Irbid",
    ZARQA: "Zarqa",
    ONLINE: "Online"
  };
  return labels[location] ?? location;
}

export function specialtyLabel(specialty: string) {
  return specialty.replaceAll("_", " ").toLowerCase();
}

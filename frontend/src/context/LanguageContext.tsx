import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'ta';

type Dictionary = {
  [key: string]: {
    en: string;
    ta: string;
  };
};

const dictionary: Dictionary = {
  title: { en: 'CampusFlow', ta: 'கேம்பஸ்ப்ளோ' },
  dashboard: { en: 'Dashboard', ta: 'டாஷ்போர்டு' },
  events: { en: 'Events', ta: 'நிகழ்வுகள்' },
  clubs: { en: 'Departments', ta: 'மன்றங்கள்' },
  registrations: { en: 'Registrations', ta: 'பதிவுகள்' },
  profile: { en: 'Profile', ta: 'சுயவிவரம்' },
  admin: { en: 'Admin', ta: 'நிர்வாகி' },
  login: { en: 'Login', ta: 'உள்நுழை' },
  register: { en: 'Register', ta: 'பதிவுசெய்' },
  logout: { en: 'Logout', ta: 'வெளியேறு' },
  language: { en: 'Language', ta: 'மொழி' },
  search: { en: 'Search', ta: 'தேடு' },
  filters: { en: 'Filters', ta: 'வடிகட்டிகள்' },
  notifications: { en: 'Notifications', ta: 'அறிவிப்புகள்' },
  theme: { en: 'Theme', ta: 'தீம்' },
  createEvent: { en: 'Create Event', ta: 'நிகழ்வை உருவாக்கு' },
  auditLogs: { en: 'Audit Logs', ta: 'தணிக்கை பதிவுகள்' },
  stats: { en: 'Stats', ta: 'புள்ளிவிவரங்கள்' },
  welcome: { en: 'Welcome back', ta: 'நல்வரவு' },
  onDuty: { en: 'On-Duty', ta: 'வகுப்பு மாற்று (OD)' },
  myODs: { en: 'My OD Letters', ta: 'எனது OD கடிதங்கள்' },
  verified: { en: 'Verified', ta: 'சரிபார்க்கப்பட்டது' },
  actions: { en: 'Actions', ta: 'செயல்கள்' },
  status: { en: 'Status', ta: 'நிலை' },
  exportCSV: { en: 'Export CSV', ta: 'CSV ஏற்றுமதி' },
  bulkImport: { en: 'Bulk Import', ta: 'மொத்த இறக்குமதி' },
  calendar: { en: 'Calendar', ta: 'நாட்காட்டி' },
  gridView: { en: 'Grid View', ta: 'கட்டக் காட்சி' },
  announcements: { en: 'Announcements', ta: 'அறிவிப்புகள்' },
  submit: { en: 'Submit', ta: 'சமர்ப்பி' },
  cancel: { en: 'Cancel', ta: 'ரத்துசெய்' },
  close: { en: 'Close', ta: 'மூடு' },
  loading: { en: 'Loading...', ta: 'ஏற்றுகிறது...' },
  save: { en: 'Save', ta: 'சேமி' },
  role: { en: 'Role', ta: 'பங்கு' },
  department: { en: 'Department', ta: 'துறை' },
  name: { en: 'Name', ta: 'பெயர்' },
  email: { en: 'Email', ta: 'மின்னஞ்சல்' },
  password: { en: 'Password', ta: 'கடவுச்சொல்' },
  rollNumber: { en: 'Roll Number', ta: 'பதிவு எண்' },
  class: { en: 'Class', ta: 'வகுப்பு' },
  section: { en: 'Section', ta: 'பிரிவு' },
  allEvents: { en: 'All Events', ta: 'அனைத்து நிகழ்வுகள்' },
  active: { en: 'Active', ta: 'செயலில்' },
  pending: { en: 'Pending', ta: 'நிலுவையில்' },
  waitlisted: { en: 'Waitlisted', ta: 'காத்திருப்போர் பட்டியல்' },
  cancelled: { en: 'Cancelled', ta: 'ரத்து செய்யப்பட்டது' },
  aboutEvent: { en: 'About Event', ta: 'நிகழ்வு பற்றி' },
  announcementsUpdates: { en: 'Announcements & Updates', ta: 'அறிவிப்புகள் மற்றும் புதுப்பிப்புகள்' },
  freeEvent: { en: 'Free Event', ta: 'இலவச நிகழ்வு' },
  searchEvents: { en: 'Search Events', ta: 'நிகழ்வுகளைத் தேடு' },
  feeType: { en: 'Fee Type', ta: 'கட்டண வகை' },
  fromDate: { en: 'From Date', ta: 'தொடக்க தேதி' },
  toDate: { en: 'To Date', ta: 'இறுதி தேதி' },
  previous: { en: 'Previous', ta: 'முந்தைய' },
  next: { en: 'Next', ta: 'அடுத்தது' },
  allDepartments: { en: 'All Departments', ta: 'அனைத்து துறைகள்' },
  allFeeTypes: { en: 'All Fee Types', ta: 'அனைத்து கட்டண வகைகள்' },
  allStatuses: { en: 'All Statuses', ta: 'அனைத்து நிலைகள்' },
  availableSeatsOnly: { en: 'Available seats only', ta: 'காலி இருக்கைகள் மட்டும்' },
  noEventsFound: { en: 'No events found matching your criteria.', ta: 'உங்கள் அளவுகோல்களுடன் பொருந்தும் நிகழ்வுகள் எதுவும் இல்லை.' },
  registerNow: { en: 'Register Now', ta: 'இப்போது பதிவுசெய்' },
  joinWaitlist: { en: 'Join Waitlist', ta: 'காத்திருப்போர் பட்டியலில் சேர்' },
  capacityFull: { en: 'Capacity Full', ta: 'இடம் நிரம்பியது' }
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    if (!dictionary[key]) return key;
    return dictionary[key][language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};

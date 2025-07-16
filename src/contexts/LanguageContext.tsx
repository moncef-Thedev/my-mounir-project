import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'fr' | 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.about': 'À propos',
    'nav.courses': 'Cours',
    'nav.calendar': 'Calendrier',
    'nav.contact': 'Contact',
    'nav.login': 'Connexion',
    'nav.register': 'S\'inscrire',
    'nav.logout': 'Déconnexion',
    
    // Home page
    'home.title': 'Mounir Ben Yahia',
    'home.subtitle': 'Enseignant retraité spécialisé dans le soutien scolaire primaire',
    'home.description': 'Je suis enseignant retraité, je propose des cours de soutien pour les élèves au primaire. J\'utilise les nouvelles pédagogies et les techniques innovantes pour améliorer le niveau d\'apprentissage de vos enfants (programme national et mission). L\'enseignement est mon métier, n\'hésitez pas à me contacter, je suis disponible à Casablanca.',
    'home.discover_courses': 'Découvrir mes cours',
    'home.contact_me': 'Me contacter',
    'home.students_helped': 'Élèves accompagnés',
    'home.subjects_taught': 'outils pédagogiques maîtrisés',
    'home.years_experience': 'Années d\'expérience',
    'home.modern_approach': 'Mon Approche Pédagogique Moderne',
    'home.approach_description': 'J\'utilise les nouvelles pédagogies et les techniques innovantes pour améliorer le niveau d\'apprentissage de vos enfants (programme national et mission). L\'enseignement est mon métier. Des techniques innovantes et personnalisées pour l\'apprentissage au primaire.',
    
    // About page
    'about.title': 'À Propos',
    'about.subtitle': 'Découvrez mon parcours, mes valeurs et mon engagement envers l\'enseignement primaire',
    
    // Courses page
    'courses.title': 'Mes Cours',
    'courses.subtitle': 'Découvrez notre catalogue de cours complets, adaptés à tous les niveaux d\'apprentissage',
    'courses.enroll': 'S\'inscrire',
    'courses.login_required': 'Veuillez vous connecter pour vous inscrire à un cours',
    
    // Calendar page
    'calendar.title': 'Calendrier des Cours',
    'calendar.subtitle': 'Consultez les prochaines sessions de cours et inscrivez-vous aux créneaux qui vous conviennent',
    'calendar.upcoming_courses': 'Prochains Cours',
    'calendar.no_sessions': 'Aucune session programmée',
    'calendar.no_sessions_desc': 'Les prochaines sessions seront bientôt disponibles.',
    
    // Contact page
    'contact.title': 'Contact',
    'contact.whatsapp': 'Contacter sur WhatsApp',
    
    // Common
    'loading': 'Chargement...',
    'error': 'Erreur',
    'success': 'Succès',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.courses': 'Courses',
    'nav.calendar': 'Calendar',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',
    
    // Home page
    'home.title': 'Mounir Ben Yahia',
    'home.subtitle': 'Retired teacher specialized in primary education support',
    'home.description': 'I am a retired teacher, I offer tutoring courses for primary school students. I use new pedagogies and innovative techniques to improve your children\'s learning level (national program and mission). Teaching is my profession, do not hesitate to contact me, I am available in Casablanca.',
    'home.discover_courses': 'Discover my courses',
    'home.contact_me': 'Contact me',
    'home.students_helped': 'Students helped',
    'home.subjects_taught': 'Subjects taught',
    'home.years_experience': 'Years of experience',
    'home.modern_approach': 'My Modern Pedagogical Approach',
    'home.approach_description': 'I use new pedagogies and innovative techniques to improve your children\'s learning level (national program and mission). Teaching is my profession. Innovative and personalized techniques for primary learning.',
    
    // About page
    'about.title': 'About',
    'about.subtitle': 'Discover my journey, my values and my commitment to primary education',
    
    // Courses page
    'courses.title': 'My Courses',
    'courses.subtitle': 'Discover our catalog of comprehensive courses, adapted to all learning levels',
    'courses.enroll': 'Enroll',
    'courses.login_required': 'Please log in to enroll in a course',
    
    // Calendar page
    'calendar.title': 'Course Calendar',
    'calendar.subtitle': 'Check upcoming course sessions and register for time slots that suit you',
    'calendar.upcoming_courses': 'Upcoming Courses',
    'calendar.no_sessions': 'No scheduled sessions',
    'calendar.no_sessions_desc': 'Upcoming sessions will be available soon.',
    
    // Contact page
    'contact.title': 'Contact',
    'contact.whatsapp': 'Contact on WhatsApp',
    
    // Common
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
  },
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.about': 'حول',
    'nav.courses': 'الدورات',
    'nav.calendar': 'التقويم',
    'nav.contact': 'اتصل',
    'nav.login': 'تسجيل الدخول',
    'nav.register': 'التسجيل',
    'nav.logout': 'تسجيل الخروج',
    
    // Home page
    'home.title': 'منير بن يحيى',
    'home.subtitle': 'مدرس متقاعد متخصص في دعم التعليم الابتدائي',
    'home.description': 'أنا مدرس متقاعد، أقدم دروس الدعم لطلاب المرحلة الابتدائية. أستخدم الطرق التعليمية الجديدة والتقنيات المبتكرة لتحسين مستوى تعلم أطفالكم (البرنامج الوطني والمهمة). التدريس هو مهنتي، لا تترددوا في الاتصال بي، أنا متاح في الدار البيضاء.',
    'home.discover_courses': 'اكتشف دوراتي',
    'home.contact_me': 'اتصل بي',
    'home.students_helped': 'طالب تم مساعدتهم',
    'home.subjects_taught': 'المواد المدرسة',
    'home.years_experience': 'سنوات الخبرة',
    'home.modern_approach': 'منهجي التعليمي الحديث',
    'home.approach_description': 'أستخدم الطرق التعليمية الجديدة والتقنيات المبتكرة لتحسين مستوى تعلم أطفالكم (البرنامج الوطني والمهمة). التدريس هو مهنتي. تقنيات مبتكرة وشخصية للتعلم الابتدائي.',
    
    // About page
    'about.title': 'حول',
    'about.subtitle': 'اكتشف رحلتي وقيمي والتزامي بالتعليم الابتدائي',
    
    // Courses page
    'courses.title': 'دوراتي',
    'courses.subtitle': 'اكتشف كتالوج دوراتنا الشاملة، المتكيفة مع جميع مستويات التعلم',
    'courses.enroll': 'التسجيل',
    'courses.login_required': 'يرجى تسجيل الدخول للتسجيل في الدورة',
    
    // Calendar page
    'calendar.title': 'تقويم الدورات',
    'calendar.subtitle': 'تحقق من جلسات الدورات القادمة وسجل في الأوقات التي تناسبك',
    'calendar.upcoming_courses': 'الدورات القادمة',
    'calendar.no_sessions': 'لا توجد جلسات مجدولة',
    'calendar.no_sessions_desc': 'ستكون الجلسات القادمة متاحة قريباً.',
    
    // Contact page
    'contact.title': 'اتصل',
    'contact.whatsapp': 'اتصل عبر واتساب',
    
    // Common
    'loading': 'جاري التحميل...',
    'error': 'خطأ',
    'success': 'نجح',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('fr');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['fr', 'en', 'ar'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    
    // Update document direction for Arabic
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
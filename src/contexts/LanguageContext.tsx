import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'fr' | 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
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
    'nav.dashboard': 'Tableau de bord',
    'nav.profile': 'Profil',
    'nav.settings': 'Paramètres',
    
    // Home page
    'home.title': 'Mounir Ben Yahia',
    'home.subtitle': 'Enseignant retraité spécialisé dans le soutien scolaire primaire',
    'home.description': 'Je suis enseignant retraité, je propose des cours de soutien pour les élèves au primaire. J\'utilise les nouvelles pédagogies et les techniques innovantes pour améliorer le niveau d\'apprentissage de vos enfants (programme national et mission). L\'enseignement est mon métier, n\'hésitez pas à me contacter, je suis disponible à Casablanca.',
    'home.discover_courses': 'Découvrir mes cours',
    'home.contact_me': 'Me contacter',
    'home.students_helped': 'Élèves accompagnés',
    'home.subjects_taught': 'Outils pédagogiques maîtrisés',
    'home.years_experience': 'Années d\'expérience',
    'home.modern_approach': 'Mon Approche Pédagogique Moderne',
    'home.approach_description': 'J\'utilise les nouvelles pédagogies et les techniques innovantes pour améliorer le niveau d\'apprentissage de vos enfants (programme national et mission). L\'enseignement est mon métier. Des techniques innovantes et personnalisées pour l\'apprentissage au primaire.',
    
    // About page
    'about.title': 'À Propos',
    'about.subtitle': 'Découvrez mon parcours, mes valeurs et mon engagement envers l\'enseignement primaire',
    'about.my_journey': 'Mon Parcours',
    'about.experience_diplomas': 'Expérience & Diplômes',
    'about.my_values': 'Mes Valeurs',
    'about.my_commitment': 'Mon Engagement',
    'about.academic_training': 'Formation Académique',
    'about.professional_experience': 'Expérience Professionnelle',
    'about.kindness': 'Bienveillance',
    'about.openness': 'Ouverture',
    'about.authenticity': 'Authenticité',
    
    // Courses page
    'courses.title': 'Mes Cours',
    'courses.subtitle': 'Découvrez notre catalogue de cours complets, adaptés à tous les niveaux d\'apprentissage',
    'courses.enroll': 'S\'inscrire',
    'courses.login_required': 'Veuillez vous connecter pour vous inscrire à un cours',
    'courses.available_courses': 'Cours disponibles',
    'courses.enrolled_students': 'Étudiants inscrits',
    'courses.average_months': 'Mois moyenne',
    'courses.satisfaction_rate': 'Taux de satisfaction',
    'courses.beginner': 'Débutant',
    'courses.intermediate': 'Intermédiaire',
    'courses.advanced': 'Avancé',
    'courses.duration': 'Durée',
    'courses.places': 'places',
    'courses.months': 'mois',
    
    // Calendar page
    'calendar.title': 'Calendrier des Cours',
    'calendar.subtitle': 'Consultez les prochaines sessions de cours et inscrivez-vous aux créneaux qui vous conviennent',
    'calendar.upcoming_courses': 'Prochains Cours',
    'calendar.no_sessions': 'Aucune session programmée',
    'calendar.no_sessions_desc': 'Les prochaines sessions seront bientôt disponibles.',
    'calendar.statistics': 'Statistiques',
    'calendar.courses_this_week': 'Cours cette semaine',
    'calendar.available_places': 'Places disponibles',
    'calendar.online_courses': 'Cours en ligne',
    'calendar.in_person_courses': 'Cours présentiels',
    'calendar.legend': 'Légende',
    'calendar.online': 'En ligne',
    'calendar.in_person': 'Présentiel',
    'calendar.hybrid': 'Hybride',
    'calendar.limited_places': 'Places limitées',
    'calendar.full': 'Complet',
    'calendar.join_video_call': 'Rejoindre l\'appel vidéo',
    'calendar.video_call_scheduled': 'Appel vidéo programmé',
    
    // Contact page
    'contact.title': 'Contact',
    'contact.subtitle': 'N\'hésitez pas à me contacter pour toute question ou pour discuter de vos besoins d\'apprentissage',
    'contact.whatsapp': 'Contacter sur WhatsApp',
    'contact.contact_info': 'Informations de Contact',
    'contact.phone': 'Téléphone',
    'contact.email': 'Email',
    'contact.address': 'Adresse',
    'contact.hours': 'Horaires',
    'contact.send_message': 'Envoyez-moi un message',
    'contact.full_name': 'Nom complet',
    'contact.subject': 'Sujet',
    'contact.message': 'Message',
    'contact.send': 'Envoyer le message',
    'contact.quick_response': 'Réponse rapide garantie',
    
    // Dashboard
    'dashboard.title': 'Tableau de bord',
    'dashboard.welcome': 'Bienvenue',
    'dashboard.overview': 'Vue d\'ensemble',
    'dashboard.my_courses': 'Mes Cours',
    'dashboard.schedule': 'Planning',
    'dashboard.notifications': 'Notifications',
    'dashboard.profile': 'Profil',
    'dashboard.enrolled_courses': 'Cours inscrits',
    'dashboard.upcoming_sessions': 'Prochaines sessions',
    'dashboard.unread_notifications': 'Notifications non lues',
    'dashboard.recent_notifications': 'Notifications récentes',
    'dashboard.no_courses': 'Aucun cours inscrit',
    'dashboard.no_sessions': 'Aucune session programmée',
    'dashboard.no_notifications': 'Aucune notification',
    'dashboard.access': 'Accéder',
    'dashboard.download': 'Télécharger',
    'dashboard.mark_all_read': 'Tout marquer comme lu',
    
    // Video calls
    'video.join_call': 'Rejoindre l\'appel',
    'video.start_call': 'Démarrer l\'appel',
    'video.end_call': 'Terminer l\'appel',
    'video.call_in_progress': 'Appel en cours',
    'video.call_scheduled': 'Appel programmé',
    'video.call_ended': 'Appel terminé',
    'video.meeting_link': 'Lien de réunion',
    'video.meeting_password': 'Mot de passe',
    'video.platform': 'Plateforme',
    'video.duration': 'Durée',
    'video.participants': 'Participants',
    
    // Authentication
    'auth.login': 'Connexion',
    'auth.register': 'Inscription',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.confirm_password': 'Confirmer le mot de passe',
    'auth.full_name': 'Nom complet',
    'auth.forgot_password': 'Mot de passe oublié ?',
    'auth.no_account': 'Pas encore de compte ?',
    'auth.have_account': 'Déjà un compte ?',
    'auth.sign_in': 'Se connecter',
    'auth.sign_up': 'S\'inscrire',
    'auth.reset_password': 'Réinitialiser le mot de passe',
    'auth.send_reset_link': 'Envoyer le lien',
    'auth.back_to_login': 'Retour à la connexion',
    
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.view': 'Voir',
    'common.close': 'Fermer',
    'common.yes': 'Oui',
    'common.no': 'Non',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.sort': 'Trier',
    'common.date': 'Date',
    'common.time': 'Heure',
    'common.status': 'Statut',
    'common.actions': 'Actions',
    'common.details': 'Détails',
    'common.description': 'Description',
    'common.title': 'Titre',
    'common.category': 'Catégorie',
    'common.level': 'Niveau',
    'common.price': 'Prix',
    'common.free': 'Gratuit',
    'common.required': 'Requis',
    'common.optional': 'Optionnel',
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
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    
    // Home page
    'home.title': 'Mounir Ben Yahia',
    'home.subtitle': 'Retired teacher specialized in primary education support',
    'home.description': 'I am a retired teacher, I offer tutoring courses for primary school students. I use new pedagogies and innovative techniques to improve your children\'s learning level (national program and mission). Teaching is my profession, do not hesitate to contact me, I am available in Casablanca.',
    'home.discover_courses': 'Discover my courses',
    'home.contact_me': 'Contact me',
    'home.students_helped': 'Students helped',
    'home.subjects_taught': 'Pedagogical tools mastered',
    'home.years_experience': 'Years of experience',
    'home.modern_approach': 'My Modern Pedagogical Approach',
    'home.approach_description': 'I use new pedagogies and innovative techniques to improve your children\'s learning level (national program and mission). Teaching is my profession. Innovative and personalized techniques for primary learning.',
    
    // About page
    'about.title': 'About',
    'about.subtitle': 'Discover my journey, my values and my commitment to primary education',
    'about.my_journey': 'My Journey',
    'about.experience_diplomas': 'Experience & Diplomas',
    'about.my_values': 'My Values',
    'about.my_commitment': 'My Commitment',
    'about.academic_training': 'Academic Training',
    'about.professional_experience': 'Professional Experience',
    'about.kindness': 'Kindness',
    'about.openness': 'Openness',
    'about.authenticity': 'Authenticity',
    
    // Courses page
    'courses.title': 'My Courses',
    'courses.subtitle': 'Discover our catalog of comprehensive courses, adapted to all learning levels',
    'courses.enroll': 'Enroll',
    'courses.login_required': 'Please log in to enroll in a course',
    'courses.available_courses': 'Available courses',
    'courses.enrolled_students': 'Enrolled students',
    'courses.average_months': 'Average months',
    'courses.satisfaction_rate': 'Satisfaction rate',
    'courses.beginner': 'Beginner',
    'courses.intermediate': 'Intermediate',
    'courses.advanced': 'Advanced',
    'courses.duration': 'Duration',
    'courses.places': 'places',
    'courses.months': 'months',
    
    // Calendar page
    'calendar.title': 'Course Calendar',
    'calendar.subtitle': 'Check upcoming course sessions and register for time slots that suit you',
    'calendar.upcoming_courses': 'Upcoming Courses',
    'calendar.no_sessions': 'No scheduled sessions',
    'calendar.no_sessions_desc': 'Upcoming sessions will be available soon.',
    'calendar.statistics': 'Statistics',
    'calendar.courses_this_week': 'Courses this week',
    'calendar.available_places': 'Available places',
    'calendar.online_courses': 'Online courses',
    'calendar.in_person_courses': 'In-person courses',
    'calendar.legend': 'Legend',
    'calendar.online': 'Online',
    'calendar.in_person': 'In-person',
    'calendar.hybrid': 'Hybrid',
    'calendar.limited_places': 'Limited places',
    'calendar.full': 'Full',
    'calendar.join_video_call': 'Join video call',
    'calendar.video_call_scheduled': 'Video call scheduled',
    
    // Contact page
    'contact.title': 'Contact',
    'contact.subtitle': 'Feel free to contact me for any questions or to discuss your learning needs',
    'contact.whatsapp': 'Contact on WhatsApp',
    'contact.contact_info': 'Contact Information',
    'contact.phone': 'Phone',
    'contact.email': 'Email',
    'contact.address': 'Address',
    'contact.hours': 'Hours',
    'contact.send_message': 'Send me a message',
    'contact.full_name': 'Full name',
    'contact.subject': 'Subject',
    'contact.message': 'Message',
    'contact.send': 'Send message',
    'contact.quick_response': 'Quick response guaranteed',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome',
    'dashboard.overview': 'Overview',
    'dashboard.my_courses': 'My Courses',
    'dashboard.schedule': 'Schedule',
    'dashboard.notifications': 'Notifications',
    'dashboard.profile': 'Profile',
    'dashboard.enrolled_courses': 'Enrolled courses',
    'dashboard.upcoming_sessions': 'Upcoming sessions',
    'dashboard.unread_notifications': 'Unread notifications',
    'dashboard.recent_notifications': 'Recent notifications',
    'dashboard.no_courses': 'No enrolled courses',
    'dashboard.no_sessions': 'No scheduled sessions',
    'dashboard.no_notifications': 'No notifications',
    'dashboard.access': 'Access',
    'dashboard.download': 'Download',
    'dashboard.mark_all_read': 'Mark all as read',
    
    // Video calls
    'video.join_call': 'Join call',
    'video.start_call': 'Start call',
    'video.end_call': 'End call',
    'video.call_in_progress': 'Call in progress',
    'video.call_scheduled': 'Call scheduled',
    'video.call_ended': 'Call ended',
    'video.meeting_link': 'Meeting link',
    'video.meeting_password': 'Password',
    'video.platform': 'Platform',
    'video.duration': 'Duration',
    'video.participants': 'Participants',
    
    // Authentication
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirm_password': 'Confirm password',
    'auth.full_name': 'Full name',
    'auth.forgot_password': 'Forgot password?',
    'auth.no_account': 'Don\'t have an account?',
    'auth.have_account': 'Already have an account?',
    'auth.sign_in': 'Sign in',
    'auth.sign_up': 'Sign up',
    'auth.reset_password': 'Reset password',
    'auth.send_reset_link': 'Send reset link',
    'auth.back_to_login': 'Back to login',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.close': 'Close',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.date': 'Date',
    'common.time': 'Time',
    'common.status': 'Status',
    'common.actions': 'Actions',
    'common.details': 'Details',
    'common.description': 'Description',
    'common.title': 'Title',
    'common.category': 'Category',
    'common.level': 'Level',
    'common.price': 'Price',
    'common.free': 'Free',
    'common.required': 'Required',
    'common.optional': 'Optional',
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
    'nav.dashboard': 'لوحة التحكم',
    'nav.profile': 'الملف الشخصي',
    'nav.settings': 'الإعدادات',
    
    // Home page
    'home.title': 'منير بن يحيى',
    'home.subtitle': 'مدرس متقاعد متخصص في دعم التعليم الابتدائي',
    'home.description': 'أنا مدرس متقاعد، أقدم دروس الدعم لطلاب المرحلة الابتدائية. أستخدم الطرق التعليمية الجديدة والتقنيات المبتكرة لتحسين مستوى تعلم أطفالكم (البرنامج الوطني والمهمة). التدريس هو مهنتي، لا تترددوا في الاتصال بي، أنا متاح في الدار البيضاء.',
    'home.discover_courses': 'اكتشف دوراتي',
    'home.contact_me': 'اتصل بي',
    'home.students_helped': 'طالب تم مساعدتهم',
    'home.subjects_taught': 'الأدوات التعليمية المتقنة',
    'home.years_experience': 'سنوات الخبرة',
    'home.modern_approach': 'منهجي التعليمي الحديث',
    'home.approach_description': 'أستخدم الطرق التعليمية الجديدة والتقنيات المبتكرة لتحسين مستوى تعلم أطفالكم (البرنامج الوطني والمهمة). التدريس هو مهنتي. تقنيات مبتكرة وشخصية للتعلم الابتدائي.',
    
    // About page
    'about.title': 'حول',
    'about.subtitle': 'اكتشف رحلتي وقيمي والتزامي بالتعليم الابتدائي',
    'about.my_journey': 'رحلتي',
    'about.experience_diplomas': 'الخبرة والشهادات',
    'about.my_values': 'قيمي',
    'about.my_commitment': 'التزامي',
    'about.academic_training': 'التدريب الأكاديمي',
    'about.professional_experience': 'الخبرة المهنية',
    'about.kindness': 'اللطف',
    'about.openness': 'الانفتاح',
    'about.authenticity': 'الأصالة',
    
    // Courses page
    'courses.title': 'دوراتي',
    'courses.subtitle': 'اكتشف كتالوج دوراتنا الشاملة، المتكيفة مع جميع مستويات التعلم',
    'courses.enroll': 'التسجيل',
    'courses.login_required': 'يرجى تسجيل الدخول للتسجيل في الدورة',
    'courses.available_courses': 'الدورات المتاحة',
    'courses.enrolled_students': 'الطلاب المسجلين',
    'courses.average_months': 'متوسط الأشهر',
    'courses.satisfaction_rate': 'معدل الرضا',
    'courses.beginner': 'مبتدئ',
    'courses.intermediate': 'متوسط',
    'courses.advanced': 'متقدم',
    'courses.duration': 'المدة',
    'courses.places': 'أماكن',
    'courses.months': 'أشهر',
    
    // Calendar page
    'calendar.title': 'تقويم الدورات',
    'calendar.subtitle': 'تحقق من جلسات الدورات القادمة وسجل في الأوقات التي تناسبك',
    'calendar.upcoming_courses': 'الدورات القادمة',
    'calendar.no_sessions': 'لا توجد جلسات مجدولة',
    'calendar.no_sessions_desc': 'ستكون الجلسات القادمة متاحة قريباً.',
    'calendar.statistics': 'الإحصائيات',
    'calendar.courses_this_week': 'دورات هذا الأسبوع',
    'calendar.available_places': 'الأماكن المتاحة',
    'calendar.online_courses': 'دورات عبر الإنترنت',
    'calendar.in_person_courses': 'دورات حضورية',
    'calendar.legend': 'وسيلة الإيضاح',
    'calendar.online': 'عبر الإنترنت',
    'calendar.in_person': 'حضوري',
    'calendar.hybrid': 'مختلط',
    'calendar.limited_places': 'أماكن محدودة',
    'calendar.full': 'مكتمل',
    'calendar.join_video_call': 'انضم للمكالمة المرئية',
    'calendar.video_call_scheduled': 'مكالمة مرئية مجدولة',
    
    // Contact page
    'contact.title': 'اتصل',
    'contact.subtitle': 'لا تتردد في الاتصال بي لأي أسئلة أو لمناقشة احتياجاتك التعليمية',
    'contact.whatsapp': 'اتصل عبر واتساب',
    'contact.contact_info': 'معلومات الاتصال',
    'contact.phone': 'الهاتف',
    'contact.email': 'البريد الإلكتروني',
    'contact.address': 'العنوان',
    'contact.hours': 'ساعات العمل',
    'contact.send_message': 'أرسل لي رسالة',
    'contact.full_name': 'الاسم الكامل',
    'contact.subject': 'الموضوع',
    'contact.message': 'الرسالة',
    'contact.send': 'إرسال الرسالة',
    'contact.quick_response': 'استجابة سريعة مضمونة',
    
    // Dashboard
    'dashboard.title': 'لوحة التحكم',
    'dashboard.welcome': 'مرحباً',
    'dashboard.overview': 'نظرة عامة',
    'dashboard.my_courses': 'دوراتي',
    'dashboard.schedule': 'الجدول',
    'dashboard.notifications': 'الإشعارات',
    'dashboard.profile': 'الملف الشخصي',
    'dashboard.enrolled_courses': 'الدورات المسجلة',
    'dashboard.upcoming_sessions': 'الجلسات القادمة',
    'dashboard.unread_notifications': 'الإشعارات غير المقروءة',
    'dashboard.recent_notifications': 'الإشعارات الحديثة',
    'dashboard.no_courses': 'لا توجد دورات مسجلة',
    'dashboard.no_sessions': 'لا توجد جلسات مجدولة',
    'dashboard.no_notifications': 'لا توجد إشعارات',
    'dashboard.access': 'الوصول',
    'dashboard.download': 'تحميل',
    'dashboard.mark_all_read': 'تحديد الكل كمقروء',
    
    // Video calls
    'video.join_call': 'انضم للمكالمة',
    'video.start_call': 'ابدأ المكالمة',
    'video.end_call': 'أنهِ المكالمة',
    'video.call_in_progress': 'مكالمة جارية',
    'video.call_scheduled': 'مكالمة مجدولة',
    'video.call_ended': 'انتهت المكالمة',
    'video.meeting_link': 'رابط الاجتماع',
    'video.meeting_password': 'كلمة المرور',
    'video.platform': 'المنصة',
    'video.duration': 'المدة',
    'video.participants': 'المشاركون',
    
    // Authentication
    'auth.login': 'تسجيل الدخول',
    'auth.register': 'التسجيل',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.confirm_password': 'تأكيد كلمة المرور',
    'auth.full_name': 'الاسم الكامل',
    'auth.forgot_password': 'نسيت كلمة المرور؟',
    'auth.no_account': 'ليس لديك حساب؟',
    'auth.have_account': 'لديك حساب بالفعل؟',
    'auth.sign_in': 'تسجيل الدخول',
    'auth.sign_up': 'التسجيل',
    'auth.reset_password': 'إعادة تعيين كلمة المرور',
    'auth.send_reset_link': 'إرسال رابط الإعادة',
    'auth.back_to_login': 'العودة لتسجيل الدخول',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.view': 'عرض',
    'common.close': 'إغلاق',
    'common.yes': 'نعم',
    'common.no': 'لا',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.sort': 'ترتيب',
    'common.date': 'التاريخ',
    'common.time': 'الوقت',
    'common.status': 'الحالة',
    'common.actions': 'الإجراءات',
    'common.details': 'التفاصيل',
    'common.description': 'الوصف',
    'common.title': 'العنوان',
    'common.category': 'الفئة',
    'common.level': 'المستوى',
    'common.price': 'السعر',
    'common.free': 'مجاني',
    'common.required': 'مطلوب',
    'common.optional': 'اختياري',
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
    
    // Update body class for language-specific styling
    document.body.className = document.body.className.replace(/lang-\w+/g, '');
    document.body.classList.add(`lang-${lang}`);
  };

  const t = (key: string): string => {
    const translation = translations[language][key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key} in language: ${language}`);
      return key;
    }
    return translation;
  };

  const isRTL = language === 'ar';

  // Set initial direction and language
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.body.classList.add(`lang-${language}`);
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, isRTL }}>
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
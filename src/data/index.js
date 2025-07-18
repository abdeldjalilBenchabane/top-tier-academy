import { FaSignInAlt, FaChalkboardTeacher, FaShoppingCart, FaRocket} from "react-icons/fa";

// Utility function to format dates
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const cards = [
  {
    title: "  ابدأ و تعلّم",
    description: "انضم للحصة بعد تفعيل الإشتراك وانطلق في رحلة التعلم",
    color: "bg-cyan-400",
    IconComponent: FaRocket,
    iconColor: "text-cyan-400",
  },
  {
    title: " شراء الحصص",
    description: `ضغط على "اشترِ الحصة" لتأكيد الحجز ادفع الكترونياً عبر البطاقة  الذهبية `,
    color: "bg-orange-500", 
    IconComponent: FaShoppingCart,
    iconColor: "text-orange-500",
  },
  {
    title: "الدخول إلى المنصة",
    description: "أنشئ حساب طالب جديد أو سجل الدخول  إذا كان لديك حساب",
    color: "bg-blue-500",
    IconComponent: FaSignInAlt,
    iconColor: "text-blue-500",
  },
  {
    title: "اختيار الحصة",
    description: "اختَر الدورة المثالية مع الأستاذ الذي يُناسبك  في جميع المواد ",
    color: "bg-[#00CBB8]",
    IconComponent: FaChalkboardTeacher,
    iconColor: "text-[#00CBB8]",
  }

];

export const courseData = [
  {
    id: 1,
    image: "/images/img_image_16.png",
    duration: "3 ساعات",
    subject: "علوم تجريبية",
    title: "تركيب البروتين",
    description: "الية الاستنساخ + حل تمارين حول تركيب البروتين",
    price: "2000دج"
  },
  {
    id: 2,
    image: "/images/img_image_16.png",
    duration: "3 ساعات",
    subject: "علوم تجريبية",
    title: "تركيب البروتين",
    description: "الية الاستنساخ + حل تمارين حول تركيب البروتين",
    price: "2000دج"
  },
  {
    id: 3,
    image: "/images/img_image_16.png",
    duration: "3 ساعات",
    subject: "علوم تجريبية",
    title: "تركيب البروتين",
    description: "الية الاستنساخ + حل تمارين حول تركيب البروتين",
    price: "2000دج"
  },
  {
    id: 4,
    image: "/images/img_image_16.png",
    duration: "3 ساعات",
    subject: "علوم تجريبية",
    title: "تركيب البروتين",
    description: "الية الاستنساخ + حل تمارين حول تركيب البروتين",
    price: "2000دج"
  },
  {
    id: 5,
    image: "/images/img_image_16.png",
    duration: "3 ساعات",
    subject: "علوم تجريبية",
    title: "تركيب البروتين",
    description: "الية الاستنساخ + حل تمارين حول تركيب البروتين",
    price: "2000دج"
  },
  {
    id: 6,
    image: "/images/img_image_16.png",
    duration: "3 ساعات",
    subject: "علوم تجريبية",
    title: "تركيب البروتين",
    description: "الية الاستنساخ + حل تمارين حول تركيب البروتين",
    price: "2000دج"
  },
  {
    id: 7,
    image: "/images/img_image_16.png",
    title: "الرياضيات المتقدمة",
    subject: "الرياضيات",
    duration: "12 أسبوع",
    description: "تعلم الرياضيات المتقدمة والجبر والهندسة مع أفضل الأساتذة والطرق الحديثة في التعليم.",
    price: "2000 دج"
  },
  {
    id: 8,
    image: "/images/img_image_16.png",
    duration: "3 ساعات",
    subject: "علوم تجريبية",
    title: "تركيب البروتين",
    description: "الية الاستنساخ + حل تمارين حول تركيب البروتين",
    price: "2000دج"
  }
];

// Private Classes Data with normal date format
export const privateClassesData = [
  {
    id: 1,
    subject: 'لغة عربية',
    sessions: 'حصتين',
    date: 'Apr 17, 2024',
    grade: 'الأولى إبتدائي',
    description: 'اريد استادة خاصة لي ابنتي',
    details: 'عرض التفاصيل',
    teacher: 'azzouz',
    teacherId: 3,
    time: '14:00 - 15:30',
    status: 'مؤكد'
  },
  {
    id: 2,
    subject: 'رياضيات',
    sessions: '3 حصص',
    date: 'Apr 18, 2024',
    grade: 'الثالثة متوسط',
    description: 'دعم في الجبر والمعادلات',
    details: 'عرض التفاصيل',
    teacher: 'roli',
    teacherId: 20,
    time: '16:00 - 17:30',
    status: 'في الانتظار'
  },
  {
    id: 3,
    subject: 'علوم طبيعية',
    sessions: 'حصتين',
    date: 'Apr 19, 2024',
    grade: 'الثانية ثانوي',
    description: 'شرح مفصل في الكيمياء',
    details: 'عرض التفاصيل',
    teacher: 'teachers',
    teacherId: 5,
    time: '10:00 - 11:30',
    status: 'مؤكد'
  },
  {
    id: 4,
    subject: 'لغة فرنسية',
    sessions: 'حصتين',
    date: 'Apr 20, 2024',
    grade: 'الخامسة ابتدائي',
    description: 'تحسين النطق والمحادثة',
    details: 'عرض التفاصيل',
    teacher: 'Test Teacher',
    teacherId: 6,
    time: '13:00 - 14:30',
    status: 'مؤكد'
  },
  {
    id: 5,
    subject: 'لغة إنجليزية',
    sessions: 'حصتين',
    date: 'Apr 21, 2024',
    grade: 'الرابعة متوسط',
    description: 'تحسين مهارات المحادثة والكتابة',
    details: 'عرض التفاصيل',
    teacher: 'azzouz',
    teacherId: 3,
    time: '15:00 - 16:30',
    status: 'مؤكد'
  },
  {
    id: 6,
    subject: 'فيزياء',
    sessions: '3 حصص',
    date: 'Apr 22, 2024',
    grade: 'الثالثة ثانوي',
    description: 'شرح مفصل في الميكانيكا والديناميكا',
    details: 'عرض التفاصيل',
    teacher: 'roli',
    teacherId: 20,
    time: '09:00 - 10:30',
    status: 'في الانتظار'
  },
  {
    id: 7,
    subject: 'كيمياء',
    sessions: 'حصتين',
    date: 'Apr 23, 2024',
    grade: 'الثانية ثانوي',
    description: 'شرح مفصل في التفاعلات الكيميائية',
    details: 'عرض التفاصيل',
    teacher: 'teachers',
    teacherId: 5,
    time: '11:00 - 12:30',
    status: 'مؤكد'
  },
  {
    id: 8,
    subject: 'تاريخ',
    sessions: 'حصتين',
    date: 'Apr 24, 2024',
    grade: 'الأولى متوسط',
    description: 'شرح مفصل في التاريخ الإسلامي',
    details: 'عرض التفاصيل',
    teacher: 'Test Teacher',
    teacherId: 6,
    time: '14:00 - 15:30',
    status: 'مؤكد'
  }
];

// Function to get unique teachers
export const getUniqueTeachers = () => {
  const teachers = privateClassesData.map(session => ({
    id: session.teacherId,
    name: session.teacher
  }));
  
  // Remove duplicates based on teacherId
  const uniqueTeachers = teachers.filter((teacher, index, self) => 
    index === self.findIndex(t => t.id === teacher.id)
  );
  
  return uniqueTeachers;
};

export const gradeOptions = [
  { 
    label: 'ابتدائي', 
    years: ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'], 
    subjects: ['اللغة العربية', 'الرياضيات', 'التربية الإسلامية', 'التربية العلمية', 'التربية المدنية', 'اللغة الفرنسية', 'اللغة الإنجليزية'] 
  },
  { 
    label: 'متوسط', 
    years: ['الأولى', 'الثانية', 'الثالثة', 'الرابعة'], 
    subjects: ['اللغة العربية', 'الرياضيات', 'العلوم الطبيعية', 'الفيزياء', 'التاريخ والجغرافيا', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'التربية الإسلامية'] 
  },
  { 
    label: 'ثانوي', 
    years: ['الأولى', 'الثانية', 'الثالثة'], 
    subjects: ['اللغة العربية', 'الرياضيات', 'العلوم الطبيعية', 'الفيزياء', 'الكيمياء', 'التاريخ والجغرافيا', 'الفلسفة', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'العلوم الإسلامية'] 
  },
];

export const languageCourses = [
  {
    id: 1,
    image: "/images/img_image_16.png",
    duration: "10 أسابيع",
    subject: "الإنجليزية",
    level: "A1",
    title: "الإنجليزية للمبتدئين (A1)",
    description: "ابدأ رحلتك في تعلم اللغة الإنجليزية من الصفر مع هذا الكورس التفاعلي.",
    price: "2500 دج"
  },
  {
    id: 2,
    image: "/images/img_image_16.png",
    duration: "12 أسبوع",
    subject: "الفرنسية",
    level: "A2",
    title: "الفرنسية للمبتدئين (A2)",
    description: "تعلم أساسيات اللغة الفرنسية وتحدث بثقة في مواقف الحياة اليومية.",
    price: "2500 دج"
  },
  {
    id: 3,
    image: "/images/img_image_16.png",
    duration: "8 أسابيع",
    subject: "العربية",
    level: "B1",
    title: "العربية للناطقين بغيرها (B1)",
    description: "طور مهاراتك في اللغة العربية مع تمارين وأنشطة تفاعلية.",
    price: "2000 دج"
  },
  {
    id: 4,
    image: "/images/img_image_16.png",
    duration: "14 أسبوع",
    subject: "الإنجليزية",
    level: "B2",
    title: "الإنجليزية المتقدمة (B2)",
    description: "ارتقِ بمستواك في اللغة الإنجليزية مع دروس متقدمة ومحادثات واقعية.",
    price: "3000 دج"
  },
  {
    id: 5,
    image: "/images/img_image_16.png",
    duration: "10 أسابيع",
    subject: "الإسبانية",
    level: "A1",
    title: "الإسبانية للمبتدئين (A1)",
    description: "تعلم اللغة الإسبانية من البداية مع تمارين تفاعلية وأمثلة عملية.",
    price: "2500 دج"
  }
]; 
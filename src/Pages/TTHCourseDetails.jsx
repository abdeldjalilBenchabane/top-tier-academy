import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Download, FileText, Star, Clock, Globe, CheckCircle, BookOpen, Award } from "lucide-react";
import { Button } from "../components/ui/Button";
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";

// import { VideoCard } from "../components/VideoCard";
// SECTION À REMPLACER
const fakeVideos = [
    {
        id: 1,
        title: "دروس الجمع والطرح",
        level: "primaire",
        subject: "math",
        thumbnail: "/placeholder.svg",
        description: "شرح مفصل لجميع عمليات الجمع والطرح مع أمثلة تطبيقية مبسطة. هذا الدرس سيساعدك على فهم أساسيات الرياضيات بطريقة سهلة ومفهومة.",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        pdfUrl: "/sample-lesson.pdf",
        exoUrl: "/sample-exo.pdf",
        instructor: "أ. محمد الأحمد",
        duration: "45 دقيقة",
        students: "1,234",
        rating: 4.8,
        language: "العربية",
        learningObjectives: [
            "فهم مبادئ الجمع والطرح الأساسية",
            "حل مسائل الجمع والطرح بثقة",
            "تطبيق العمليات الحسابية في الحياة اليومية",
            "استخدام الأدوات المساعدة في الحساب"
        ],
        prerequisites: [
            "معرفة الأرقام من 1 إلى 100",
            "القدرة على القراءة والكتابة",
            "لا حاجة لخبرة سابقة في الرياضيات"
        ],
        curriculum: [
            {
                title: "مقدمة في الأرقام",
                duration: "10 دقائق",
                lessons: ["التعرف على الأرقام", "كتابة الأرقام", "قراءة الأرقام"]
            },
            {
                title: "عمليات الجمع",
                duration: "20 دقيقة",
                lessons: ["مفهوم الجمع", "جمع الأرقام الصغيرة", "جمع الأرقام الكبيرة", "تمارين عملية"]
            },
            {
                title: "عمليات الطرح",
                duration: "15 دقيقة",
                lessons: ["مفهوم الطرح", "طرح الأرقام الصغيرة", "طرح الأرقام الكبيرة", "حل المشاكل"]
            }
        ],
        reviews: [
            {
                name: "أم سارة",
                rating: 5,
                comment: "درس ممتاز! ابنتي تحسنت كثيراً في الرياضيات بعد مشاهدة هذا الدرس.",
                date: "منذ أسبوعين"
            },
            {
                name: "أحمد علي",
                rating: 4,
                comment: "شرح واضح ومفهوم. أنصح به لجميع الطلاب.",
                date: "منذ شهر"
            },
            {
                name: "فاطمة محمد",
                rating: 5,
                comment: "المدرس يشرح بطريقة سهلة ومبسطة. شكراً لكم.",
                date: "منذ 3 أسابيع"
            }
        ]
    },

];

// SECTION À REMPLACER
const relatedCourses = [
    {
        id: 4,
        title: "الضرب والقسمة للمبتدئين",
        level: "primaire",
        subject: "math",
        thumbnail: "/placeholder.svg",
        instructor: "أ. ليلى أحمد",
        duration: "50 دقيقة",
        students: "890",
        rating: 4.7
    },
    {
        id: 5,
        title: "العلوم الحاسوبية",
        level: "college",
        subject: "science",
        thumbnail: "/placeholder.svg",
        instructor: "أ. سارة محمد",
        duration: "75 دقيقة",
        students: "1,234",
        rating: 4.9
    }
];


const levelLabels = {
    "primaire": "ابتدائي",
    "college": "إعدادي",
    "lycee": "ثانوي"
};

const subjectLabels = {
    "arabe": "اللغة العربية",
    "math": "الرياضيات",
    "science": "العلوم",
    "francais": "اللغة الفرنسية",
    "anglais": "اللغة الإنقليزية",
};

export default function CourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });
    const [reviews, setReviews] = useState(fakeVideos.find(v => v.id === 1)?.reviews || []);

    // SECTION À REMPLACER
    // À remplacer par un appel API (ex: fetch(`/api/courses/${id}`))
    const course = fakeVideos.find(v => v.id === 1);

    if (!course) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">الدرس غير موجود</h1>
                    <Button onClick={() => navigate("/elearning-ar")}>العودة للصفحة الرئيسية</Button>
                </div>
            </div>
        );
    }

    const handleReviewChange = (e) => {
        const { name, value } = e.target;
        setNewReview((prev) => ({ ...prev, [name]: value }));
    };

    const handleRatingChange = (rating) => {
        setNewReview((prev) => ({ ...prev, rating }));
    };

    const handleReviewSubmit = (e) => {
        e.preventDefault();
        if (!newReview.name.trim() || !newReview.comment.trim()) return;
        setReviews([
            { ...newReview, date: 'الآن' },
            ...reviews,
        ]);
        setNewReview({ name: '', rating: 5, comment: '' });
    };

    return (
        <div dir="rtl" className="min-h-screen bg-gray-50">
            {/* Header */}
            <Navbar />
            <div className="border-b border-blue-100" /> {/* Thin divider line between Navbar and hero section */}
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 shadow-lg ">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-10">
                    {/* Video Preview */}
                    <div className="w-full lg:w-1/2 order-2 lg:order-1 mt-8 lg:mt-0">
                        <div className="bg-black rounded-2xl overflow-hidden shadow-xl border-4 border-white/20">
                            <div className="relative aspect-video">
                                {course.videoUrl ? (
                                    <video
                                        controls
                                        src={course.videoUrl}
                                        className="w-full h-full rounded-2xl"
                                        poster={course.thumbnail}
                                        onPlay={() => setIsVideoPlaying(true)}
                                        onPause={() => setIsVideoPlaying(false)}
                                    >
                                        <source src={course.videoUrl} type="video/mp4" />
                                        متصفحك لا يدعم عرض الفيديو.
                                    </video>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                            <Play size={64} className="text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Course Info */}
                    <div className="w-full lg:w-1/2 order-1 lg:order-2">
                        <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg">{course.title}</h1>
                        <p className="text-xl text-blue-100 mb-6 font-medium drop-shadow-sm">{course.description}</p>
                        <div className="flex flex-wrap items-center gap-6 mb-6">
                            <div className="flex items-center gap-1">
                                <Star className="text-yellow-400 fill-current" size={22} />
                                <span className="font-bold text-lg">{course.rating}</span>
                                <span className="text-blue-100">({course.students} طالب)</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock size={20} />
                                <span>{course.duration}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Globe size={20} />
                                <span>{course.language}</span>
                            </div>
                        </div>
                        <p className="text-blue-100 font-semibold">
                            من إعداد <span className="text-white font-bold">{course.instructor}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="lg:grid lg:grid-cols-3 gap-10">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Tabs */}
                        <div className="bg-white rounded-xl  shadow-lg mb-8 border border-blue-100">
                            <div className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-purple-50 rounded-t-3xl">
                                <nav className="flex  px-8">
                                    {[
                                        { id: "overview", label: "نظرة عامة" },
                                        { id: "curriculum", label: "المنهج" },
                                        { id: "reviews", label: "التقييمات" }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`py-5 ml-9 px-2 border-b-4 font-bold text-base transition-all duration-200 ${activeTab === tab.id
                                                ? "border-purple-500 text-purple-700 bg-purple-50 rounded-t-2xl shadow"
                                                : "border-transparent text-purple-400 hover:text-purple-700 hover:border-purple-200"
                                                }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                            <div className="p-8">
                                {activeTab === "overview" && (
                                    <div className="space-y-8">
                                        {/* Learning Objectives */}
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <Award className="text-blue-600" size={24} />
                                                ما ستتعلمه
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {course.learningObjectives?.map((objective, index) => (
                                                    <div key={index} className="flex items-start gap-3">
                                                        <CheckCircle className="text-cyan-500 mt-0.5 flex-shrink-0" size={18} />
                                                        <span className="text-gray-700">{objective}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Prerequisites */}
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <BookOpen className="text-purple-400" size={24} />
                                                المتطلبات المسبقة
                                            </h3>
                                            <ul className="space-y-2">
                                                {course.prerequisites?.map((prereq, index) => (
                                                    <li key={index} className="flex items-start gap-3">
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                                        <span className="text-gray-700">{prereq}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Course Description */}
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4">وصف الدرس</h3>
                                            <p className="text-gray-700 leading-relaxed">{course.description}</p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "curriculum" && (
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6">محتوى الدرس</h3>
                                        {course.curriculum?.map((section, index) => (
                                            <div key={index} className="border border-gray-200 rounded-lg">
                                                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                                                    <h4 className="font-semibold text-gray-900">{section.title}</h4>
                                                    <span className="text-sm text-gray-600">{section.duration}</span>
                                                </div>
                                                <div className="p-4">
                                                    <ul className="space-y-2">
                                                        {section.lessons.map((lesson, lessonIndex) => (
                                                            <li key={lessonIndex} className="flex items-center gap-3 text-gray-700">
                                                                <Play size={16} className="text-blue-600" />
                                                                <span>{lesson}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === "reviews" && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-bold text-blue-900">تقييمات الطلاب</h3>
                                            <div className="flex items-center gap-2">
                                                <Star className="text-yellow-400 fill-current" size={20} />
                                                <span className="font-bold text-lg">{course.rating}</span>
                                                <span className="text-gray-400">({course.students} تقييم)</span>
                                            </div>
                                        </div>

                                        {/* Add Review Form */}
                                        <form onSubmit={handleReviewSubmit} className="bg-gray-100 rounded-xl p-4 mb-6 shadow flex flex-col gap-4">
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={newReview.name}
                                                    onChange={handleReviewChange}
                                                    placeholder="اسمك"
                                                    className="flex-1 rounded-lg border border-blue-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 text-right"
                                                    required
                                                />
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <button
                                                            type="button"
                                                            key={i}
                                                            onClick={() => handleRatingChange(i + 1)}
                                                            className="focus:outline-none"
                                                        >
                                                          
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <textarea
                                                name="comment"
                                                value={newReview.comment}
                                                onChange={handleReviewChange}
                                                placeholder="اكتب تعليقك هنا..."
                                                className="rounded-lg border border-blue-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 text-right min-h-[60px]"
                                                required
                                            />
                                            <div className="flex justify-end">
                                                <button
                                                    type="submit"
                                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-normal py-2   px-6 rounded-sm shadow transition"
                                                >
                                                    أضف تقييمك
                                                </button>
                                            </div>
                                        </form>

                                        <div className="space-y-4">
                                            {reviews.map((review, index) => (
                                                <div key={index} className="border-b border-gray-200 pb-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                                                {review.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-blue-900">{review.name}</p>
                                                                <div className="flex items-center gap-1">
                                                                    {Array.from({ length: review.rating }).map((_, i) => (
                                                                        <Star key={i} className="text-yellow-400 fill-current" size={14} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm text-gray-400">{review.date}</span>
                                                    </div>
                                                    <p className="text-gray-700 pr-13">{review.comment}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        {/* Action Card */}
                        <Card className="mb-6  top-4">
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div className="flex items-center pt-4  gap-3">
                                        {course.pdfUrl && (
                                            <Button className="flex-1 flex justify-center items-center bg-blue-600 text-white font-normal shadow hover:bg-blue-700 transition">
                                                <a href={course.pdfUrl} download target="_blank" rel="noopener noreferrer">
                                                    <FileText size={18} className="absolute mr-[-1rem]" />
                                                    ملخص الدرس PDF
                                                </a>
                                            </Button>
                                        )}
                                        {course.exoUrl && (
                                            <Button variant="outline" className="flex-1 text-blue-900 hover:bg-gray-50" asChild>
                                                <a href={course.exoUrl} download target="_blank" rel="noopener noreferrer">
                                                    <Download size={18} className="absolute mr-[-8.35rem]" />
                                                     حلول سلسلة تمارين
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Instructor Card */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="text-lg">اسأل الأستاذ</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purpule-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                        {course.instructor.charAt(course.instructor.indexOf('.') + 2)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-lg">{course.instructor}</h3>
                                        <p className="text-gray-600">مدرس {subjectLabels[course.subject]}</p>
                                    </div>
                                </div>

                            </CardContent>
                        </Card>

                        {/* Related Courses */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">دروس مشابهة</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {relatedCourses.map((relatedCourse) => (
                                        <div
                                            key={relatedCourse.id}
                                            className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => navigate(`/course/${relatedCourse.id}`)}
                                        >
                                            <img
                                                src={relatedCourse.thumbnail}
                                                alt={relatedCourse.title}
                                                className="w-16 h-12 object-cover rounded"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-sm text-gray-900 line-clamp-2 leading-tight">
                                                    {relatedCourse.title}
                                                </h4>
                                                <p className="text-xs text-gray-600 mt-1">{relatedCourse.instructor}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex items-center gap-1">
                                                        <Star className="text-yellow-400 fill-current" size={12} />
                                                        <span className="text-xs font-medium">{relatedCourse.rating}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">{relatedCourse.duration}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
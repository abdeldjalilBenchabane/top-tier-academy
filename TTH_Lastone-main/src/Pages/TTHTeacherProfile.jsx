import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Star, BookOpen, Users, Award, MessageCircle, Calendar } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Textarea } from "../components/ui/Textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";

const teachersData = {
    "محمد الأحمد": {
        name: "أ. محمد الأحمد",
        subject: "الرياضيات",
        bio: "مدرس رياضيات مع خبرة تزيد عن 15 سنة في التدريس. متخصص في تبسيط المفاهيم الصعبة وجعل الرياضيات ممتعة للطلاب.",
        experience: "15 سنة",
        students: "2,500+",
        rating: 4.8,
        courses: 45,
        education: [
            "ماجستير في الرياضيات - جامعة القاهرة",
            "بكالوريوس في التربية - كلية التربية"
        ],
        specialties: [
            "الجبر والهندسة",
            "حساب التفاضل والتكامل",
            "الإحصاء والاحتمالات",
            "الرياضيات التطبيقية"
        ],
        achievements: [
            "جائزة أفضل مدرس للعام 2023",
            "شهادة في التعليم الرقمي",
            "مؤلف كتاب 'الرياضيات المبسطة'"
        ],
        availability: "الأحد - الخميس: 2:00 - 8:00 مساءً"
    },
    "فاطمة السيد": {
        name: "د. فاطمة السيد",
        subject: "العلوم",
        bio: "دكتورة في علم الأحياء مع شغف كبير لتعليم العلوم الطبيعية. أؤمن بأن العلم يجب أن يكون متاحاً للجميع بطريقة مفهومة.",
        experience: "12 سنة",
        students: "1,800+",
        rating: 4.6,
        courses: 32,
        education: [
            "دكتوراه في علم الأحياء - جامعة عين شمس",
            "ماجستير في البيولوجيا الجزيئية"
        ],
        specialties: [
            "علم الأحياء",
            "الكيمياء العضوية",
            "علم البيئة",
            "علم الوراثة"
        ],
        achievements: [
            "أفضل باحثة في العلوم 2022",
            "نشر 20+ بحث علمي",
            "خبيرة في المناهج التعليمية"
        ],
        availability: "السبت - الأربعاء: 10:00 ص - 6:00 مساءً"
    }
};

export default function TeacherProfile() {
    const { teacherName } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("about");
    const [questionText, setQuestionText] = useState("");
    const [lessonRequest, setLessonRequest] = useState("");
    const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
    const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);

    const decodedTeacherName = decodeURIComponent(teacherName || "");
    const teacher = teachersData[decodedTeacherName];

    if (!teacher) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">المدرس غير موجود</h1>
                    <Button onClick={() => navigate("/elearning-ar")}>العودة للصفحة الرئيسية</Button>
                </div>
            </div>
        );
    }

    const handleSendQuestion = () => {
        console.log("Sending question:", questionText);
        setQuestionText("");
        setIsQuestionDialogOpen(false);
        // Here you would typically send the question to a backend
    };

    const handleRequestLesson = () => {
        console.log("Requesting lesson:", lessonRequest);
        setLessonRequest("");
        setIsLessonDialogOpen(false);
        // Here you would typically send the lesson request to a backend
    };

    return (
        <div dir="rtl" className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Button
                            variant="ghost"
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft size={20} />
                            العودة
                        </Button>
                        <div className="flex items-center gap-4">
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                {teacher.subject}
                            </Badge>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-8">
                        <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center text-6xl font-bold">
                            {teacher.name.charAt(teacher.name.indexOf('.') + 2)}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold mb-2">{teacher.name}</h1>
                            <p className="text-xl text-blue-100 mb-4">مدرس {teacher.subject}</p>
                            <p className="text-lg text-blue-50 mb-6">{teacher.bio}</p>

                            <div className="flex items-center gap-6 mb-6">
                                <div className="flex items-center gap-1">
                                    <Star className="text-yellow-400 fill-current" size={20} />
                                    <span className="font-bold text-lg">{teacher.rating}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users size={18} />
                                    <span>{teacher.students} طالب</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <BookOpen size={18} />
                                    <span>{teacher.courses} دورة</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Award size={18} />
                                    <span>{teacher.experience} خبرة</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-white text-blue-600 hover:bg-gray-100">
                                            <MessageCircle size={18} className="ml-2" />
                                            اسأل سؤال
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]" dir="rtl">
                                        <DialogHeader>
                                            <DialogTitle>اسأل {teacher.name}</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <Textarea
                                                placeholder="اكتب سؤالك هنا..."
                                                value={questionText}
                                                onChange={(e) => setQuestionText(e.target.value)}
                                                className="min-h-[100px]"
                                            />
                                            <div className="flex gap-2">
                                                <Button onClick={handleSendQuestion} className="flex-1">
                                                    إرسال السؤال
                                                </Button>
                                                <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                                                    إلغاء
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="border-white text-white hover:bg-white/10">
                                            <Calendar size={18} className="ml-2" />
                                            طلب درس خاص
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]" dir="rtl">
                                        <DialogHeader>
                                            <DialogTitle>طلب درس خاص مع {teacher.name}</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <Textarea
                                                placeholder="اشرح ما تريد تعلمه والوقت المناسب لك..."
                                                value={lessonRequest}
                                                onChange={(e) => setLessonRequest(e.target.value)}
                                                className="min-h-[100px]"
                                            />
                                            <div className="flex gap-2">
                                                <Button onClick={handleRequestLesson} className="flex-1">
                                                    إرسال الطلب
                                                </Button>
                                                <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>
                                                    إلغاء
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Tabs */}
                        <div className="bg-white rounded-lg shadow-sm mb-6">
                            <div className="border-b border-gray-200">
                                <nav className="flex space-x-8 px-6">
                                    {[
                                        { id: "about", label: "نبذة" },
                                        { id: "education", label: "التعليم" },
                                        { id: "achievements", label: "الإنجازات" }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                                ? "border-blue-500 text-blue-600"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                                }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            <div className="p-6">
                                {activeTab === "about" && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4">عن المدرس</h3>
                                            <p className="text-gray-700 leading-relaxed mb-6">{teacher.bio}</p>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4">التخصصات</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {teacher.specialties.map((specialty, index) => (
                                                    <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                                        <BookOpen className="text-blue-600" size={20} />
                                                        <span>{specialty}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4">أوقات التوفر</h3>
                                            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                                                <Calendar className="text-green-600" size={20} />
                                                <span className="text-green-800">{teacher.availability}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "education" && (
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6">المؤهلات التعليمية</h3>
                                        {teacher.education.map((edu, index) => (
                                            <div key={index} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                                                <Award className="text-blue-600 mt-1" size={20} />
                                                <span className="text-gray-700">{edu}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === "achievements" && (
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6">الإنجازات والجوائز</h3>
                                        {teacher.achievements.map((achievement, index) => (
                                            <div key={index} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                                                <Star className="text-yellow-500 mt-1" size={20} />
                                                <span className="text-gray-700">{achievement}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        {/* Contact Card */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="text-lg">معلومات الاتصال</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Mail className="text-gray-600" size={18} />
                                        <span className="text-sm text-gray-700">متاح عبر النظام</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Phone className="text-gray-600" size={18} />
                                        <span className="text-sm text-gray-700">للدروس الخاصة فقط</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stats Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">إحصائيات المدرس</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">سنوات الخبرة:</span>
                                        <span className="font-medium">{teacher.experience}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">عدد الطلاب:</span>
                                        <span className="font-medium">{teacher.students}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">عدد الدورات:</span>
                                        <span className="font-medium">{teacher.courses}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">التقييم:</span>
                                        <div className="flex items-center gap-1">
                                            <Star className="text-yellow-400 fill-current" size={16} />
                                            <span className="font-medium">{teacher.rating}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
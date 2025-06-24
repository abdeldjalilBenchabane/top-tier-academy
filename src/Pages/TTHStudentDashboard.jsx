import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './../components/ui/TTHCard';
import { Badge } from './../components/ui/TTHBadge';
import { Button } from './../components/ui/TTHButton';
import { Progress } from './../components/ui/TTHprogress';
import { Avatar, AvatarFallback, AvatarImage } from './../components/ui/TTHAvatar';
import {
    BookOpen,
    Calendar,
    Clock,
    Play,
    CheckCircle,
    Star,
    MessageSquare,
    Video,
    Users,
    Trophy,
    TrendingUp,
    User
} from 'lucide-react';
import CoursesSection from '../components/TTHCoursesSection';
import CalendarSection from '../components/TTHCalendarSection';
import CommentsSection from '../components/TTHCommentsSection';
import ProfileSection from '../components/TTHProfileSection';

const StudentDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const studentStats = {
        totalCourses: 12,
        completedCourses: 8,
        inProgressCourses: 4,
        totalHours: 48,
        completedHours: 32,
        upcomingLives: 3
    };

    const recentActivities = [
        {
            id: 1,
            type: 'course_completed',
            title: 'أكملت دورة البرمجة بـ JavaScript',
            time: 'منذ ساعتين',
            icon: CheckCircle,
            color: 'text-green-600'
        },
        {
            id: 2,
            type: 'live_session',
            title: 'جلسة مباشرة: أساسيات قواعد البيانات',
            time: 'غداً الساعة 3:00 م',
            icon: Video,
            color: 'text-blue-600'
        },
        {
            id: 3,
            type: 'comment_added',
            title: 'أضفت تعليق على درس React Hooks',
            time: 'منذ يوم واحد',
            icon: MessageSquare,
            color: 'text-purple-600'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 rtl" dir="rtl">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 space-x-reverse">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src="/placeholder.svg" />
                                <AvatarFallback className="bg-education-blue text-white font-bold">
                                    أح
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">أهلاً أحمد!</h1>
                                <p className="text-gray-600">استمر في رحلتك التعليمية</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Navigation Tabs */}
                <div className="flex space-x-1 space-x-reverse bg-white rounded-lg p-1 mb-8 shadow-sm">
                    {[
                        { id: 'overview', label: 'نظرة عامة', icon: TrendingUp },
                        { id: 'courses', label: 'دوراتي', icon: BookOpen },
                        { id: 'calendar', label: 'التقويم', icon: Calendar },
                        { id: 'comments', label: 'تعليقاتي', icon: MessageSquare },
                        { id: 'profile', label: 'الملف الشخصي', icon: User }
                    ].map((tab) => (
                        <Button
                            key={tab.id}
                            variant={activeTab === tab.id ? "default" : "ghost"}
                            className={`flex-1 justify-center gap-2 ${activeTab === tab.id
                                    ? 'bg-education-blue text-white'
                                    : 'text-gray-600 hover:text-education-blue'
                                }`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </Button>
                    ))}
                </div>

                {/* Content based on active tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-100">إجمالي الدورات</p>
                                            <p className="text-3xl font-bold">{studentStats.totalCourses}</p>
                                        </div>
                                        <BookOpen className="w-8 h-8 text-blue-200" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-green-100">الدورات المكتملة</p>
                                            <p className="text-3xl font-bold">{studentStats.completedCourses}</p>
                                        </div>
                                        <CheckCircle className="w-8 h-8 text-green-200" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-purple-100">قيد التقدم</p>
                                            <p className="text-3xl font-bold">{studentStats.inProgressCourses}</p>
                                        </div>
                                        <Clock className="w-8 h-8 text-purple-200" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-orange-100">جلسات مباشرة قادمة</p>
                                            <p className="text-3xl font-bold">{studentStats.upcomingLives}</p>
                                        </div>
                                        <Video className="w-8 h-8 text-orange-200" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Progress Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-education-yellow" />
                                        تقدمك الأكاديمي
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span>إكمال الدورات</span>
                                            <span>{Math.round((studentStats.completedCourses / studentStats.totalCourses) * 100)}%</span>
                                        </div>
                                        <Progress
                                            value={(studentStats.completedCourses / studentStats.totalCourses) * 100}
                                            className="h-2"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span>ساعات الدراسة</span>
                                            <span>{studentStats.completedHours} من {studentStats.totalHours} ساعة</span>
                                        </div>
                                        <Progress
                                            value={(studentStats.completedHours / studentStats.totalHours) * 100}
                                            className="h-2"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-education-blue" />
                                        النشاطات الحديثة
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {recentActivities.map((activity) => (
                                            <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                                <activity.icon className={`w-5 h-5 ${activity.color}`} />
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{activity.title}</p>
                                                    <p className="text-xs text-gray-500">{activity.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'courses' && <CoursesSection />}
                {activeTab === 'calendar' && <CalendarSection />}
                {activeTab === 'comments' && <CommentsSection />}
                {activeTab === 'profile' && <ProfileSection />}
            </div>
        </div>
    );
};

export default StudentDashboard;
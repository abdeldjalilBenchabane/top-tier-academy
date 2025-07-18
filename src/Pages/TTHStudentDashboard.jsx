import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './../components/ui/TTHCard';
import { Badge } from './../components/ui/TTHBadge';
import { Button } from './../components/ui/TTHButton';
import { Progress } from './../components/ui/TTHprogress';
import { Avatar, AvatarFallback, AvatarImage } from './../components/ui/TTHAvatar';
import TTHCourseCard from '../components/ui/TTHCourseCard';

import {
    BookOpen,
    Calendar,
    BadgeDollarSign,
    CheckCircle,
    MessageSquare,
    Video,
    Trophy,
    TrendingUp,
    User
} from 'lucide-react';
import CoursesSection from '../components/TTHCoursesSection';
import CalendarSection from '../components/TTHCalendarSection';
import CommentsSection from '../components/TTHCommentsSection';
import ProfileSection from '../components/TTHProfileSection';
import { pointsAPI } from '@/services/api';

// Fonction utilitaire pour calculer le nombre total d'heures passées sur la plateforme
function calculateTotalHours(activities) {
    if (!activities || !Array.isArray(activities)) return 0;
    // Supposons que chaque activité a un champ 'hours' ou 'duration' en heures
    return activities.reduce((sum, act) => sum + (act.hours || act.duration || 0), 0);
}

const StudentDashboard = () => {
    const location = useLocation();
    const getInitialTab = () => {
      const params = new URLSearchParams(location.search);
      return params.get('tab') || 'profile';
    };
    const [activeTab, setActiveTab] = useState(getInitialTab());
    const [studentStats, setStudentStats] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [purchasedCourses, setPurchasedCourses] = useState([]);
    const [pointsBalance, setPointsBalance] = useState(0);
    const navigate = useNavigate();
    const [editMode, setEditMode] = useState(false);

    const studentProfile = {
        name: 'أحمد محمد علي',
        email: 'ahmed.mohamed@example.com',
        phone: '+966 50 123 4567',
        location: 'الرياض، السعودية',
        joinDate: 'Sep 2023',
        level: 'متوسط',
        totalCourses: 12,
        completedCourses: 8,
        certificates: 6,
        studyHours: 145,
        streak: 23
    };

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                // Fetch overview
                const statsRes = await fetch('/api/users/student/overview', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const stats = await statsRes.json();
                // Fetch activities
                const actRes = await fetch('/api/users/student/activities', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const activities = await actRes.json();
                // Fetch profile
                const profRes = await fetch('/api/users/student/profile', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const prof = await profRes.json();
                // Fetch purchased course IDs
                let purchasedIds = [];
                try {
                  const purchasedRes = await pointsAPI.getMyCourses();
                  purchasedIds = purchasedRes.courses || purchasedRes.courseIds || [];
                } catch (e) { purchasedIds = []; }
                // Fetch all approved courses (like TTHCourses.jsx)
                let allCourses = [];
                try {
                  const res = await fetch('/api/courses?status=approved');
                  let data = await res.json();
                  // Only keep courses WITHOUT a language_level_id (education path)
                  data = data.filter(course => !course.language_level_id || course.language_level_id === null || course.language_level_id === undefined);
                  // For education courses, fetch price from materials table
                  try {
                    const materialsRes = await fetch('/api/courses/materials/list');
                    if (materialsRes.ok) {
                      const materialsData = await materialsRes.json();
                      data = data.map(course => {
                        const material = materialsData.find(m => m.name === course.material_name);
                        return material ? { ...course, price: material.price } : course;
                      });
                    }
                  } catch (e) { /* ignore */ }
                  allCourses = data;
                } catch (e) { allCourses = []; }
                // Filter to only purchased courses (full objects)
                const purchased = allCourses
                  .filter(course => purchasedIds.includes(course.id))
                  .map(course => ({ ...course, purchased: true }));
                // Fetch points balance
                let balance = 0;
                try {
                  const balanceRes = await pointsAPI.getBalance();
                  balance = balanceRes.points || balanceRes.balance || 0;
                } catch (e) { balance = 0; }
                setStudentStats(stats);
                setRecentActivities(activities);
                setProfile(prof);
                setPurchasedCourses(purchased);
                setPointsBalance(balance);
            } catch (e) {
                setError('Erreur lors du chargement des données');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
      // Update tab if URL changes
      const params = new URLSearchParams(location.search);
      const tab = params.get('tab');
      if (tab && tab !== activeTab) {
        setActiveTab(tab);
      }
    }, [location.search]);

    if (loading) return <div className="p-8 text-center">Chargement...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    const totalHoursSpent = calculateTotalHours(recentActivities);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 rtl" dir="rtl">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">


                    <div className="flex items-center space-x-4 space-x-reverse">
                        
                        <div className="relative">
                            <Avatar className="h-14 w-14 border-4 border-blue-200 shadow-lg">
                                {profile?.avatar_url ? (
                                    <AvatarImage src={profile.avatar_url} alt={profile.name} />
                                ) : (
                                    <AvatarFallback className="bg-education-blue text-white font-bold text-xl flex items-center justify-center">
                                        <User className="w-7 h-7 mr-1 inline-block align-middle" />
                                        {profile?.name ? profile.name.charAt(0) : '?'}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            {/* Cercle de statut en ligne (optionnel) */}
                            <span className="absolute bottom-1 right-1 block h-3 w-3 rounded-full bg-green-400 border-2 border-white"></span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {profile ? `أهلاً ${profile.name} !` : "أهلاً !"}
                            </h1>
                            <p className="text-gray-600">استمر في رحلتك التعليمية</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium shadow-sm border border-gray-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        رجوع
                    </button>
                </div>
            </div>

            <div className="max-w-7xl bg-gray-100 mx-auto px-6 py-8">
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
                                ? 'bg-blue-400 text-white'
                                : 'text-blue-600 hover:text-blue-3bg-blue-300'
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
                            <Card className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
                                <CardContent className="p-8 mt-2 ">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-100">إجمالي الدورات</p>
                                            <p className="text-3xl mt-2 font-bold">{purchasedCourses.length}</p>
                                        </div>
                                        <BookOpen className="w-8 h-8 text-blue-200" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-r from-purple-400 to-purple-700 text-white">
                                <CardContent className="p-8">
                                    <div className="flex items-center mt-2 justify-between">
                                        <div>
                                            <p className="text-purple-100">الدورات المكتملة</p>
                                            <p className="text-3xl mt-2 font-bold">{studentStats?.completedCourses ?? 0}</p>
                                        </div>
                                        <CheckCircle className="w-8 h-8 text-purple-200" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-r from-yellow-400  to-yellow-600 text-white cursor-pointer">
                                <CardContent className="p-8">
                                    <Link to="/points">
                                        <div className="flex mt-2 items-center justify-between">
                                            <div>
                                                <p className="text-yellow-100"> رصيد النقاط</p>
                                                <p className="text-3xl font-bold mt-2">{pointsBalance}</p>
                                            </div>
                                            <BadgeDollarSign className="w-8 h-8 text-yellow-200" />
                                        </div>
                                        <div className="text-sm">دج</div>
                                    </Link>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-r from-orange-500 to-orange-700 text-white">
                                <CardContent className="p-8">
                                    <div className="flex mt-2 items-center justify-between">
                                        <div>
                                            <p className="text-orange-100">جلسات مباشرة قادمة</p>
                                            <p className="text-3xl mt-2 font-bold">{studentStats?.upcomingLives ?? 0}</p>
                                        </div>
                                        <Video className="w-8 h-8 text-orange-200" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        {/* Purchased Courses Preview */}
                        {purchasedCourses.length > 0 && (
                                    <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">دوراتك الأخيرة</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                              {purchasedCourses.slice(0, 4).map((course) => (
                                <TTHCourseCard key={course.id} course={course} />
                                        ))}
                                    </div>
                            {purchasedCourses.length > 4 && (
                              <div className="text-center mt-4">
                                <Link to="#" onClick={() => setActiveTab('courses')} className="text-blue-600 underline font-bold">عرض كل الدورات</Link>
                              </div>
                            )}
                        </div>
                        )}
                    </div>
                )}

                {activeTab === 'courses' && (
                  <CoursesSection purchasedCourses={purchasedCourses} />
                )}
                {activeTab === 'calendar' && <CalendarSection />}
                {activeTab === 'comments' && <CommentsSection />}
                {activeTab === 'profile' && <ProfileSection />}
            </div>
        </div>
    );
};

export default StudentDashboard;
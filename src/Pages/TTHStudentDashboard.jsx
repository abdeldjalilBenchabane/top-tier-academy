import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './../components/ui/TTHCard';
import { Badge } from './../components/ui/TTHBadge';
import { Button } from './../components/ui/TTHButton';
import { Progress } from './../components/ui/TTHprogress';
import { Avatar, AvatarFallback, AvatarImage } from './../components/ui/TTHAvatar';

import {
    BookOpen,
    BadgeDollarSign,
    CheckCircle,
    MessageSquare,
    Video,
    Trophy,
    TrendingUp,
    User
} from 'lucide-react';
import PrivateClassesSection from '../components/TTHPrivateClassesSection';
import StudentCommentsSection from '../components/TTHStudentCommentsSection';
import ProfileSection from '../components/TTHProfileSection';
import { pointsAPI } from '@/services/api';
import { useAuth } from '../contexts/AuthContext';

// Fonction utilitaire pour calculer le nombre total d'heures passées sur la plateforme
function calculateTotalHours(activities) {
    if (!activities || !Array.isArray(activities)) return 0;
    // Supposons que chaque activité a un champ 'hours' ou 'duration' en heures
    return activities.reduce((sum, act) => sum + (act.hours || act.duration || 0), 0);
}

const StudentDashboard = () => {
    const { user } = useAuth();
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
    const [purchasedLiveSessions, setPurchasedLiveSessions] = useState([]);
    const [pointsBalance, setPointsBalance] = useState(0);
    const [myPendingRequests, setMyPendingRequests] = useState([]);
    const navigate = useNavigate();
    const [editMode, setEditMode] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [sessionTimers, setSessionTimers] = useState({});

    // Function to refresh student stats
    const refreshStudentStats = async () => {
        try {
            const statsRes = await fetch('/api/users/student/overview', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const stats = await statsRes.json();
            setStudentStats(stats);
        } catch (error) {
            console.error('Error refreshing student stats:', error);
        }
    };

    // Timer effect for live sessions countdown
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Calculate session timers
    useEffect(() => {
        const timers = {};
        purchasedLiveSessions.forEach(session => {
            if (!session.start_time) {
                timers[session.id] = '';
                return;
            }

            const sessionTime = new Date(session.start_time);
            const sessionEndTime = new Date(sessionTime.getTime() + (session.duration || 60) * 60 * 1000);

            if (session.status === 'ended' || session.is_ended) {
                timers[session.id] = 'منتهي';
                return;
            }

            if (currentTime < sessionTime) {
                // Session hasn't started yet
                const timeDiff = sessionTime.getTime() - currentTime.getTime();
                const hours = Math.floor(timeDiff / (1000 * 60 * 60));
                const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

                if (hours > 0) {
                    timers[session.id] = `${hours}h ${minutes}m`;
                } else if (minutes > 0) {
                    timers[session.id] = `${minutes}m ${seconds}s`;
                } else {
                    timers[session.id] = `${seconds}s`;
                }
            } else if (currentTime >= sessionTime && currentTime <= sessionEndTime) {
                // Session is live
                timers[session.id] = 'مباشر الآن';
            } else {
                // Session has ended
                timers[session.id] = 'منتهي';
            }
        });
        setSessionTimers(timers);
    }, [currentTime, purchasedLiveSessions]);

    // Function to fetch private class requests
    const fetchPrivateClassRequests = useCallback(async () => {
        if (!user?.id) {
            console.log('No user ID available');
            return;
        }
        try {
            console.log('Fetching private class requests for user:', user.id);
            const requestsRes = await fetch(`/api/private-class-requests/student/${user.id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (requestsRes.ok) {
                const data = await requestsRes.json();
                console.log('Private class requests data:', data);
                const filteredRequests = data.requests.filter(request => request.status !== 'مرفوض');
                console.log('Filtered requests:', filteredRequests);
                setMyPendingRequests(filteredRequests);
            } else {
                console.error('Failed to fetch requests:', requestsRes.status);
            }
        } catch (e) { 
            console.error('Error fetching private class requests:', e);
            setMyPendingRequests([]); 
        }
    }, [user?.id]);

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
                  console.log('[DEBUG] All courses from API:', data);
                  // Only keep courses WITHOUT a language_level_id (education path)
                  data = data.filter(course => !course.language_level_id || course.language_level_id === null || course.language_level_id === undefined);
                  console.log('[DEBUG] Filtered education courses:', data);
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
                console.log('[DEBUG] Purchased courses:', purchased);

                // Fetch purchased live sessions (only individual sessions from TTHLiveClasses)
                let purchasedIndividualLiveSessions = [];
                
                try {
                  // Fetch individual live sessions (from /TTHLiveClasses)
                  const purchasedIndividualLiveSessionsRes = await pointsAPI.getMyIndividualLiveSessions();
                  purchasedIndividualLiveSessions = purchasedIndividualLiveSessionsRes.liveSessions || [];
                  console.log('[DEBUG] Purchased individual live sessions from API:', purchasedIndividualLiveSessions);
                } catch (e) { 
                  console.error('[DEBUG] Error fetching individual live sessions:', e);
                  purchasedIndividualLiveSessions = []; 
                }

                // Use only individual live sessions
                const allPurchasedLiveSessions = purchasedIndividualLiveSessions.map(session => ({ ...session, type: 'individual_session' }));

                // Fetch points balance
                let balance = 0;
                try {
                  const balanceRes = await pointsAPI.getBalance();
                  balance = balanceRes.balance || 0
                } catch (e) { balance = 0; }

                // Fetch private class requests
                await fetchPrivateClassRequests();

                setStudentStats(stats);
                setRecentActivities(activities);
                setProfile(prof);
                setPurchasedCourses(purchased);
                setPurchasedLiveSessions(allPurchasedLiveSessions);
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

    // Polling for real-time updates of private class requests
    useEffect(() => {
        if (!user?.id) return;
        
        // Initial fetch
        fetchPrivateClassRequests();
        
        // Set up polling every 30 seconds
        const interval = setInterval(fetchPrivateClassRequests, 30000);
        
        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, [user?.id]);

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
                <div className="bg-white rounded-lg p-1 mb-8 shadow-sm">
                    {/* Desktop Tabs */}
                    <div className="hidden md:flex space-x-1 space-x-reverse">
                        {[
                            { id: 'overview', label: 'نظرة عامة', icon: TrendingUp },
                            { id: 'courses', label: 'الحصص الخاصة', icon: BookOpen },
                            { id: 'live-sessions', label: 'حصص مباشرة', icon: Video },
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
                    
                    {/* Mobile Tabs */}
                    <div className="md:hidden grid grid-cols-3 gap-2">
                        {[
                            { id: 'overview', label: 'نظرة عامة', icon: TrendingUp },
                            { id: 'courses', label: 'الحصص الخاصة', icon: BookOpen },
                            { id: 'live-sessions', label: 'حصص مباشرة', icon: Video },
                            { id: 'comments', label: 'تعليقاتي', icon: MessageSquare },
                            { id: 'profile', label: 'الملف الشخصي', icon: User }
                        ].map((tab) => (
                            <Button
                                key={tab.id}
                                variant={activeTab === tab.id ? "default" : "ghost"}
                                className={`flex flex-col items-center justify-center gap-1 py-3 px-2 text-xs ${activeTab === tab.id
                                    ? 'bg-blue-400 text-white'
                                    : 'text-blue-600 hover:bg-blue-50'
                                    }`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="text-center leading-tight">{tab.label}</span>
                            </Button>
                        ))}
                    </div>
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
                            <Card className="bg-gradient-to-r from-purple-400 to-purple-700 text-white cursor-pointer hover:shadow-lg transition-all duration-300" onClick={fetchPrivateClassRequests}>
                                <CardContent className="p-8">
                                    <div className="flex items-center mt-2 justify-between">
                                        <div>
                                            <p className="text-purple-100">الحصص الخاصة</p>
                                            <p className="text-3xl mt-2 font-bold">
                                                {(() => {
                                                    const count = myPendingRequests?.filter(req => req.status === 'مؤكد').length ?? 0;
                                                    console.log('Confirmed requests count:', count, 'Total requests:', myPendingRequests?.length);
                                                    return count;
                                                })()}
                                            </p>
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
                            <Card className="bg-gradient-to-r from-orange-500 to-orange-700 text-white cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => setActiveTab('live-sessions')}>
                                <CardContent className="p-8">
                                    <div className="flex mt-2 items-center justify-between">
                                        <div>
                                            <p className="text-orange-100">حصصي المباشرة</p>
                                            <p className="text-3xl mt-2 font-bold">{purchasedLiveSessions.length}</p>
                                        </div>
                                        <Video className="w-8 h-8 text-orange-200" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Purchased Courses Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">دوراتي المشتراة</h2>
                                <Link to="/TTHCourses">
                                    <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                                        عرض جميع الدورات
                                    </Button>
                                </Link>
                            </div>
                            
                            {purchasedCourses.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {purchasedCourses.map((course) => {
                                        console.log('[DEBUG] Course cover URL:', course.cover_url, 'for course:', course.title);
                                        return (
                                        <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                                            <div className="relative">
                                                {course.cover_url ? (
                                                    <img
                                                        src={course.cover_url}
                                                        alt={course.title}
                                                        className="w-full h-48 object-cover"
                                                        onError={(e) => {
                                                            console.error('[DEBUG] Failed to load image:', course.cover_url);
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'block';
                                                        }}
                                                        onLoad={() => {
                                                            console.log('[DEBUG] Successfully loaded image:', course.cover_url);
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                                                        <BookOpen className="w-12 h-12 text-white" />
                                                    </div>
                                                )}
                                                <div className="absolute top-3 right-3">
                                                    <Badge className="bg-green-500 text-white">
                                                        تم الشراء
                                                    </Badge>
                                                </div>
                                            </div>
                                            <CardContent className="p-6">
                                                <CardTitle className="text-lg font-semibold mb-3 overflow-hidden text-ellipsis whitespace-nowrap">
                                                    {course.title}
                                                </CardTitle>
                                                <p className="text-gray-600 text-sm mb-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                                    {course.description}
                                                </p>
                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-700">المادة:</span>
                                                        <span className="text-sm text-gray-600">{course.material_name || 'غير محدد'}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-700">السعر:</span>
                                                        <span className="text-sm font-semibold text-green-600">
                                                            {course.price ? `${course.price.toLocaleString()} دج` : 'مجاناً'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button 
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                                    onClick={() => navigate(`/coursesList/courses/${course.id}`)}
                                                >
                                                    عرض الدورة
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                                </div>
                            ) : (
                                <Card className="p-8 text-center">
                                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد دورات مشتراة</h3>
                                    <p className="text-gray-500 mb-4">ابدأ رحلتك التعليمية بشراء دورات من متجرنا</p>
                                    <Link to="/TTHCourses">
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                            استكشف الدورات
                                        </Button>
                                    </Link>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'courses' && (
                  <PrivateClassesSection />
                )}
                {activeTab === 'live-sessions' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900">حصصي المباشرة</h2>
                      <div className="flex gap-2">
                        <Link to="/TTHLiveClasses">
                          <Button variant="outline" className="text-purple-600 border-purple-600 hover:bg-purple-50">
                            الجلسات الفردية
                          </Button>
                        </Link>
                      </div>
                    </div>
                    
                    {purchasedLiveSessions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {purchasedLiveSessions.map((session) => (
                                <Card key={`${session.type}-${session.id}`} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                                    <div className="relative">
                                        {session.cover_image_url ? (
                                            <img
                                                src={session.cover_image_url}
                                                alt={session.title}
                                                className="w-full h-48 object-cover"
                                                onError={(e) => {
                                                    console.error('[DEBUG] Failed to load image:', session.cover_image_url);
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'block';
                                                }}
                                                onLoad={() => {
                                                    console.log('[DEBUG] Successfully loaded image:', session.cover_image_url);
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                                                <Video className="w-12 h-12 text-white" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            <Badge className="bg-green-500 text-white">
                                                تم الشراء
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <CardTitle className="text-lg font-semibold mb-3 overflow-hidden text-ellipsis whitespace-nowrap">
                                            {session.title}
                                        </CardTitle>
                                        <p className="text-gray-600 text-sm mb-4 overflow-hidden text-ellipsis whitespace-nowrap">
                                            {session.description}
                                        </p>
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">المادة:</span>
                                                <span className="text-sm text-gray-600">{session.material_name || 'غير محدد'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">السعر:</span>
                                                <span className="text-sm font-semibold text-green-600">
                                                    {session.price ? `${session.price.toLocaleString()} دج` : 'مجاناً'}
                                                </span>
                                            </div>
                                            {session.start_time && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-700">التاريخ:</span>
                                                    <span className="text-sm text-gray-600">
                                                        {new Date(session.start_time).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                            {session.start_time && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-700">الوقت:</span>
                                                    <span className={`text-sm font-semibold ${
                                                        sessionTimers[session.id] === 'مباشر الآن' 
                                                            ? 'text-green-600' 
                                                            : sessionTimers[session.id] === 'منتهي' 
                                                            ? 'text-red-600' 
                                                            : 'text-blue-600'
                                                    }`}>
                                                        {sessionTimers[session.id] || new Date(session.start_time).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <Button 
                                            className={`w-full font-semibold ${
                                                sessionTimers[session.id] === 'مباشر الآن'
                                                    ? 'bg-green-600 hover:bg-green-700 text-white animate-pulse'
                                                    : sessionTimers[session.id] === 'منتهي'
                                                    ? 'bg-gray-400 hover:bg-gray-500 text-white cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                            }`}
                                            onClick={() => {
                                                if (sessionTimers[session.id] !== 'منتهي') {
                                                    navigate(`/streaming/${session.id}`);
                                                }
                                            }}
                                            disabled={sessionTimers[session.id] === 'منتهي'}
                                        >
                                            {sessionTimers[session.id] === 'مباشر الآن' 
                                                ? 'انضم الآن - مباشر' 
                                                : sessionTimers[session.id] === 'منتهي'
                                                ? 'انتهى البث'
                                                : sessionTimers[session.id] && sessionTimers[session.id] !== ''
                                                ? `انتظار البداية - ${sessionTimers[session.id]}`
                                                : 'انضم الآن'
                                            }
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-8 text-center">
                            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد حصص مباشرة مشتراة</h3>
                            <p className="text-gray-500 mb-4">اشترِ حصص مباشرة من صفحة الجلسات الفردية للانضمام إلى البث المباشر</p>
                            <Link to="/TTHLiveClasses">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                    استكشف الجلسات الفردية
                                </Button>
                            </Link>
                        </Card>
                    )}
                  </div>
                )}
                {activeTab === 'comments' && <StudentCommentsSection />}
                {activeTab === 'profile' && <ProfileSection />}
            </div>
        </div>
    );
};

export default StudentDashboard;
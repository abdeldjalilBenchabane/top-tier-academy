import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, User, Video, Calendar, MapPin, BookOpen, ArrowLeft, Star, Play, CheckCircle, Award, Users, Globe, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../components/NavBar';
import Footer from '../components/TTHFooter';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { toast } from '@/lib/toast';

// Telegram icon component
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.05-.2-.06-.06-.14-.04-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06-.01.13-.02.2z"/>
  </svg>
);

interface LiveSection {
  id: number;
  title: string;
  description: string;
  price: number;
  cover_image_url: string;
  professor_name: string;
  status: string;
  scheduled_date?: string;
  scheduled_time?: string;
  duration_minutes?: number;
  telegram_channel?: string;
  created_at: string;
  updated_at: string;
}

interface LiveSession {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  price: number;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
  status?: string;
  is_ended?: boolean;
}

const LiveSessionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liveSection, setLiveSection] = useState<LiveSection | null>(null);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionTimers, setSessionTimers] = useState<{[key: string]: string}>({});

  // Real-time timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate timers for all sessions
  useEffect(() => {
    const timers: {[key: string]: string} = {};
    liveSessions.forEach(session => {
      if (!session.scheduledAt) {
        timers[session.id] = '';
        return;
      }
      
      const sessionTime = new Date(session.scheduledAt);
      const sessionEndTime = new Date(sessionTime.getTime() + (session.duration || 60) * 60 * 1000);
      
      // Check if session is manually ended
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
  }, [currentTime, liveSessions]);

  // Helper function to check if session can be joined
  const canJoinSession = (session: LiveSession) => {
    if (!session.scheduledAt) return false;
    
    const sessionTime = new Date(session.scheduledAt);
    const now = new Date();
    const timeDiff = sessionTime.getTime() - now.getTime();
    const minutesUntilStart = timeDiff / (1000 * 60);
    
    // Can join 15 minutes before start and during the session
    return minutesUntilStart <= 15 && minutesUntilStart >= -session.duration;
  };

  // Helper function to get session status
  const getSessionStatus = (session: LiveSession) => {
    if (!session.scheduledAt) return 'scheduled';
    
    const sessionTime = new Date(session.scheduledAt);
    const sessionEndTime = new Date(sessionTime.getTime() + (session.duration || 60) * 60 * 1000);
    
    // Check if session is manually ended
    if (session.status === 'ended' || session.is_ended) {
      return 'ended';
    }
    
    if (currentTime < sessionTime) {
      return 'upcoming';
    } else if (currentTime >= sessionTime && currentTime <= sessionEndTime) {
      return 'live';
    } else {
      return 'ended';
    }
  };

  // Helper function to handle joining session
  const handleJoinSession = (session: LiveSession) => {
    console.log('[DEBUG] Join session clicked:', {
      sessionId: session.id,
      user: user?.id,
      hasPurchased: hasPurchased,
      isLoggedIn: !!user
    });
    
    if (!user) {
      toast.error('يجب تسجيل الدخول للانضمام إلى الجلسة المباشرة');
      return;
    }
    
    // Check if there's a Telegram channel link
    if (liveSection?.telegram_channel) {
      console.log('[DEBUG] Opening Telegram channel:', liveSection.telegram_channel);
      window.open(liveSection.telegram_channel, '_blank');
    } else {
      toast.error('لا يوجد رابط قناة تليجرام متاح');
    }
  };

  // Helper function to safely parse dates
  const parseDate = (dateString: string | null | undefined): Date | null => {
    console.log('[DEBUG] parseDate called with:', dateString, 'Type:', typeof dateString);
    
    if (!dateString) {
      console.log('[DEBUG] parseDate: dateString is null/undefined');
      return null;
    }
    
    try {
      // Try parsing as ISO string first
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        console.log('[DEBUG] parseDate: Successfully parsed as ISO string:', date);
        return date;
      }
      
      // If that fails, try parsing as datetime-local format
      if (dateString.includes('T')) {
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute] = timePart.split(':').map(Number);
        const parsedDate = new Date(year, month - 1, day, hour, minute);
        if (!isNaN(parsedDate.getTime())) {
          console.log('[DEBUG] parseDate: Successfully parsed as datetime-local:', parsedDate);
          return parsedDate;
        }
      }
      
      console.warn('[DEBUG] Could not parse date:', dateString);
      return null;
    } catch (error) {
      console.error('[DEBUG] Error parsing date:', dateString, error);
      return null;
    }
  };

  // Helper function to format date safely
  const formatDate = (dateString: string | null | undefined): string => {
    const date = parseDate(dateString);
    if (!date) return 'تاريخ غير محدد';
    
    try {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('[DEBUG] Error formatting date:', error);
      return 'تاريخ غير محدد';
    }
  };

  // Helper function to format time safely
  const formatTime = (dateString: string | null | undefined): string => {
    const date = parseDate(dateString);
    if (!date) return 'وقت غير محدد';
    
    try {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('[DEBUG] Error formatting time:', error);
      return 'وقت غير محدد';
    }
  };

  const fetchLiveSectionDetails = async () => {
    try {
      const response = await fetch(`/api/live-sections/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch live section details');
      }
      const data = await response.json();
      setLiveSection(data);
    } catch (error) {
      console.error('Error fetching live section details:', error);
      setError('Failed to load live section details');
    }
  };

  const fetchLiveSessions = async () => {
    try {
      const response = await fetch(`/api/live-sections/${id}/sessions`);
      if (!response.ok) {
        throw new Error('Failed to fetch live sessions');
      }
      const data = await response.json();
      console.log('[DEBUG] Fetched live sessions:', data);
      console.log('[DEBUG] First session scheduledAt:', data[0]?.scheduledAt);
      console.log('[DEBUG] First session status:', data[0]?.status);
      console.log('[DEBUG] All sessions scheduledAt values:', data.map(s => ({ id: s.id, scheduledAt: s.scheduledAt, type: typeof s.scheduledAt })));
      setLiveSessions(data);
    } catch (error) {
      console.error('Error fetching live sessions:', error);
      // Don't set error here, just log it - live sessions might not exist yet
    }
  };

  const checkPurchaseStatus = async () => {
    if (!user) return;
    
    try {
      console.log('[DEBUG] Checking purchase status for section:', id, 'User:', user.id);
      const response = await fetch(`/api/live-sections/${id}/access`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('[DEBUG] Purchase status response:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[DEBUG] Purchase status data:', data);
        setHasPurchased(data.hasPurchased);
      } else {
        console.error('[DEBUG] Purchase status check failed:', response.status);
      }
    } catch (error) {
      console.error('Error checking purchase status:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchLiveSectionDetails(),
        fetchLiveSessions(),
        checkPurchaseStatus()
      ]);
      setLoading(false);
    };

    loadData();
  }, [id, user]);

  // Refresh sessions every 30 seconds to get updated status
  useEffect(() => {
    if (!id) return;
    
    const refreshInterval = setInterval(() => {
      fetchLiveSessions();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [id]);

  const handlePurchase = async () => {
    if (!user) {
      alert('يجب تسجيل الدخول لشراء هذه الجلسة.');
      return;
    }
    
    setPurchaseLoading(true);
    try {
      const response = await fetch('/api/points/buy-live-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ sessionId: id })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setHasPurchased(true);
          alert('تم شراء الجلسة بنجاح!');
        } else {
          alert(data.error || 'حدث خطأ أثناء الشراء');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'حدث خطأ أثناء الشراء');
      }
    } catch (error) {
      console.error('Error purchasing live section:', error);
      alert('حدث خطأ أثناء الشراء');
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error || !liveSection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">الجلسة غير موجودة</h1>
          <button
            onClick={() => navigate('/TTHLanguages')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            العودة للغات
          </button>
        </div>
      </div>
    );
  }

  // Real statistics for live section
  const rating = 4.8;
  const studentsCount = "0";
  const sessionDuration = "جلسة لايف";

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Header */}
      <Navbar />
      <div className="border-b border-blue-100" />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Live Section Info */}
          <div className="w-full text-center">
            <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg">{liveSection.title}</h1>
            <p className="text-xl text-blue-100 mb-6 font-medium drop-shadow-sm">{liveSection.description}</p>
            
            <p className="text-blue-100 font-semibold">
              من إعداد <span className="text-white font-bold">{liveSection.professor_name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Live Section Statistics */}
            <div className="bg-white rounded-xl shadow-lg mb-8 p-6 border border-blue-100">
              <div className="grid grid-cols-1 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">جلسة لايف</div>
                  <div className="text-sm text-gray-600">جلسة مباشرة تفاعلية</div>
                </div>
              </div>
            </div>

            {/* Live Section Description - Free Card */}
            <div className="bg-white rounded-xl shadow-lg mb-8 border border-blue-100 p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">وصف الجلسة المباشرة</h3>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">مجاناً</span>
              </div>
              <p className="text-gray-700 leading-relaxed">{liveSection.description}</p>
              
              {/* Individual Live Sessions Cards */}
              {liveSessions.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">الجلسات المباشرة المتاحة:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {liveSessions.map((session) => {
                      console.log('[DEBUG] Session data:', {
                        id: session.id,
                        title: session.title,
                        scheduledAt: session.scheduledAt,
                        duration: session.duration,
                        status: session.status
                      });
                      
                      return (
                        <Card key={session.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-semibold text-gray-900 text-sm">{session.title}</h5>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                {session.duration} دقيقة
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{session.description}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(session.scheduledAt)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(session.scheduledAt)}</span>
                              </div>
                            </div>
                            
                            {/* Join Button and Status */}
                            <div className="mt-4 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {session.scheduledAt && session.scheduledAt !== 'تاريخ غير محدد' ? (
                                  <>
                                    {getSessionStatus(session) === 'upcoming' && (
                                      <button
                                        onClick={() => handleJoinSession(session)}
                                        disabled={!canJoinSession(session)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                                      >
                                        {sessionTimers[session.id] || 'قريباً'}
                                      </button>
                                    )}
                                    {getSessionStatus(session) === 'live' && (
                                      <button
                                        onClick={() => handleJoinSession(session)}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
                                      >
                                        انضم الآن
                                      </button>
                                    )}
                                    {getSessionStatus(session) === 'ended' && (
                                      <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                                        منتهي
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                                    في انتظار تحديد الوقت
                                  </span>
                                )}
                              </div>
                              
                              {/* Timer Display */}
                              {session.scheduledAt && session.scheduledAt !== 'تاريخ غير محدد' && (
                                <div className="text-xs text-gray-500">
                                  {sessionTimers[session.id] && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {sessionTimers[session.id]}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Live Session Info */}
              {liveSection.scheduled_date && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-600">التاريخ: {formatDate(liveSection.scheduled_date)}</span>
                    </div>
                    {liveSection.scheduled_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-gray-600">الوقت: {liveSection.scheduled_time}</span>
                      </div>
                    )}
                    {liveSection.duration_minutes && (
                      <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-gray-600">المدة: {liveSection.duration_minutes} دقيقة</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Action Card */}
            <Card className="mb-6 sticky top-4">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center pt-4 gap-3">
                    {/* Telegram Channel Button - Always visible */}
                    <button
                      onClick={handleJoinSession}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <TelegramIcon className="w-5 h-5 ml-2" />
                      {liveSection?.telegram_channel ? 'Join Telegram Channel' : 'Telegram Channel'}
                    </button>
                    
                    {/* Purchase Button - Only show if not purchased */}
                    {!hasPurchased && (
                      <button
                        onClick={handlePurchase}
                        disabled={purchaseLoading}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {purchaseLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                            جاري الشراء...
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-5 h-5 ml-2" />
                            شراء الجلسة
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructor Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">الأستاذ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {liveSection.professor_name ? liveSection.professor_name.charAt(0) : 'أ'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{liveSection.professor_name}</h3>
                    <p className="text-gray-600">أستاذ لايف محترف</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default LiveSessionDetails; 
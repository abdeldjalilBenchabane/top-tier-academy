import React, { useState, useEffect } from 'react';
import { useConfirmPurchase } from '@/components/ui/TTHPurchaseConfirm';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, User, Video, Calendar, MapPin, BookOpen, ArrowLeft, Star, Play, CheckCircle, Award, Users, Globe, Lock, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import Navbar from '../components/NavBar';
import Footer from '../components/TTHFooter';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import LiveSectionCommentsSection from '../components/ui/TTHLiveSectionCommentsSection';
import { toast } from '@/lib/toast';

import { parseSessionDate } from '@/lib/utils';
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

interface ContentBlock {
  id: number;
  type: 'text' | 'video' | 'image' | 'pdf';
  title?: string;
  content: string;
  fileUrl?: string;
  order: number;
}

interface ContentSection {
  id: number;
  title: string;
  order: number;
  blocks: ContentBlock[];
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
  const confirmPurchase = useConfirmPurchase();
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionTimers, setSessionTimers] = useState<{[key: string]: string}>({});
  const [contentSections, setContentSections] = useState<ContentSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

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
      
      // Parse datetime in LOCAL timezone (same as parseDate function)
      const sessionTime = parseDate(session.scheduledAt);
      if (!sessionTime) {
        timers[session.id] = '';
        return;
      }
      const sessionEndTime = new Date(sessionTime.getTime() + (session.duration || 60) * 60 * 1000);
      
      // Same precedence as the status above: say what the professor set.
      if (session.status === 'ended' || session.is_ended) {
        timers[session.id] = 'منتهي';
        return;
      }
      if (session.status === 'cancelled')        { timers[session.id] = 'ملغاة';         return; }
      if (session.status === 'paused')           { timers[session.id] = 'متوقفة مؤقتاً'; return; }
      if (session.status === 'technical_issues') { timers[session.id] = 'مشكلة تقنية';   return; }
      if (session.status === 'starting')         { timers[session.id] = 'على وشك البدء'; return; }
      if (session.status === 'live')             { timers[session.id] = 'مباشر الآن';    return; }
      
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
    
    const sessionTime = parseDate(session.scheduledAt);
    if (!sessionTime) return false;
    
    const now = new Date();
    const timeDiff = sessionTime.getTime() - now.getTime();
    const minutesUntilStart = timeDiff / (1000 * 60);
    
    // Can join 15 minutes before start and during the session
    return minutesUntilStart <= 15 && minutesUntilStart >= -session.duration;
  };

  // Helper function to get session status
  const getSessionStatus = (session: LiveSession) => {
    if (!session.scheduledAt) return 'scheduled';
    
    const sessionTime = parseDate(session.scheduledAt);
    if (!sessionTime) return 'scheduled';
    
    const sessionEndTime = new Date(sessionTime.getTime() + (session.duration || 60) * 60 * 1000);
    
        // What the professor set outranks the clock — it is the more recent and
    // more deliberate fact about the session.
    if (session.status === 'cancelled') return 'cancelled';
    if (session.status === 'ended' || session.is_ended) return 'ended';
    if (session.status === 'paused') return 'paused';
    if (session.status === 'technical_issues') return 'technical_issues';
    if (session.status === 'starting') return 'starting';

    // A stream the professor has actually started stays live however long it
    // runs. Previously the clock closed it at start + duration, which took the
    // join button away from students while the lesson was still going.
    if (session.status === 'live') return 'live';

    if (currentTime < sessionTime) {
      return 'upcoming';
    } else if (currentTime <= sessionEndTime) {
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
    
    // Navigate to streaming page
    navigate(`/streaming/${session.id}`);
  };

  // Helper function to safely parse dates WITHOUT timezone conversion
  // Wall-clock parsing lives in lib/utils now: this page used to roll its own,
  // and it only understood the 'YYYY-MM-DDTHH:MM' shape. The API sends
  // 'YYYY-MM-DD HH:MM:SS' — a space, not a T — so the private version returned
  // null for every session and took the countdown and the join button with it.
  const parseDate = (dateString: string | null | undefined): Date | null =>
    parseSessionDate(dateString);

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

  const fetchContentSections = async () => {
    try {
      const response = await fetch(`/api/live-sections/${id}/content`);
      if (!response.ok) {
        console.log('[DEBUG] No content sections found');
        return;
      }
      const data = await response.json();
      console.log('[DEBUG] Fetched content sections full response:', data);
      console.log('[DEBUG] data.sections:', data.sections);
      
      // Extract sections from the response
      const sections = data.sections || [];
      console.log('[DEBUG] Processed sections count:', sections.length);
      sections.forEach((section, idx) => {
        console.log(`[DEBUG] Section ${idx}:`, {
          id: section.id,
          title: section.title,
          blocksCount: section.blocks?.length || 0
        });
      });
      
      if (sections.length > 0) {
        setContentSections(sections);
      }
    } catch (error) {
      console.error('Error fetching content sections:', error);
      // Don't set error, just log it - content sections are optional
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
        fetchContentSections(),
        checkPurchaseStatus()
      ]);
      setLoading(false);
    };

    loadData();
  }, [id, user]);

  const toggleSection = (sectionId: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

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

    if (!(await confirmPurchase({
      title: (liveSection as any)?.title,
      price: (liveSection as any)?.price,
      kindLabel: 'شراء بالنقاط',
    }))) {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#194cbf] mx-auto mb-4"></div>
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
            className="bg-[#194cbf] text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
      
      {/* Hero Section - Compact */}
      <div className="bg-gradient-to-r from-[#194cbf] to-[#61a1ff] text-white py-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 drop-shadow-lg">{liveSection.title}</h1>
            <p className="text-base md:text-lg text-blue-100 font-medium drop-shadow-sm max-w-3xl mx-auto">{liveSection.description}</p>
          </div>
        </div>
      </div>

      {/* Content Sections - Card Style */}
      {contentSections && contentSections.length > 0 && (
        <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-[#194cbf] to-[#61a1ff] bg-clip-text text-transparent mb-2">
                المحتوى التعليمي
              </h2>
              <p className="text-gray-600">
                استكشف محتوى الجلسة التعليمي المتنوع
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contentSections.map((section, sectionIndex) => {
                const hasLockedContent = section.blocks?.some(
                  block => (block.type === 'video' || block.type === 'image' || block.type === 'pdf') && 
                  !hasPurchased && user?.role !== 'admin' && user?.role !== 'professor'
                );
                const textBlocksCount = section.blocks?.filter(b => b.type === 'text').length || 0;
                const mediaBlocksCount = section.blocks?.filter(b => b.type !== 'text').length || 0;

                return (
                  <div 
                    key={section.id} 
                    className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all group"
                  >
                    <div className="p-4">
                      {/* Header - Only this part is clickable */}
                      <div 
                        onClick={() => toggleSection(section.id)}
                        className="flex items-center justify-between mb-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-r from-[#194cbf] to-[#61a1ff] text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shadow-md">
                            {sectionIndex + 1}
                          </div>
                          <h5 className="font-semibold text-gray-900 text-sm">{section.title}</h5>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasLockedContent && (
                            <Lock className="w-4 h-4 text-amber-500" />
                          )}
                          {expandedSections.has(section.id) ? (
                            <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-[#194cbf] transition-colors" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#194cbf] transition-colors" />
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {section.blocks?.length || 0} عنصر
                        </span>
                        {textBlocksCount > 0 && (
                          <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
                            {textBlocksCount} نص مجاني
                          </span>
                        )}
                        {mediaBlocksCount > 0 && hasLockedContent && (
                          <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            {mediaBlocksCount} محتوى مميز
                          </span>
                        )}
                      </div>

                      {/* Expandable Content */}
                      {expandedSections.has(section.id) && (
                        <div 
                          className="border-t pt-4 mt-2 space-y-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {section.blocks?.map((block, blockIndex) => {
                        // Text blocks are always visible
                        if (block.type === 'text') {
                          return (
                            <div 
                              key={block.id} 
                              className="group bg-white p-6 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-start gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
                                  <BookOpen className="text-[#194cbf] w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                  {block.title && (
                                    <h4 className="font-bold text-gray-900 mb-3 text-lg">{block.title}</h4>
                                  )}
                                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">{block.content}</p>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        // Video, Image, PDF blocks - locked if not purchased
                        if (!hasPurchased && user?.role !== 'admin' && user?.role !== 'professor') {
                          return (
                            <div 
                              key={block.id} 
                              className="relative group bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border-2 border-gray-200 hover:border-amber-300 transition-all duration-300 overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Lock overlay effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-gray-100/50 to-amber-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              
                              <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="relative">
                                    <div className="bg-gradient-to-br from-gray-200 to-gray-300 p-4 rounded-xl">
                                      {block.type === 'video' && <Video className="text-gray-500 w-6 h-6" />}
                                      {block.type === 'image' && <ImageIcon className="text-gray-500 w-6 h-6" />}
                                      {block.type === 'pdf' && <BookOpen className="text-gray-500 w-6 h-6" />}
                                    </div>
                                    <div className="absolute -top-1 -right-1 bg-amber-500 p-1.5 rounded-full shadow-lg">
                                      <Lock className="text-white w-3 h-3" />
                                    </div>
                                  </div>
                                  
                                  <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 mb-2 text-lg">{block.title || `محتوى ${blockIndex + 1}`}</h4>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-semibold text-gray-600 bg-white px-3 py-1.5 rounded-full border border-gray-200 capitalize">
                                        {block.type === 'video' ? '🎥 فيديو' : block.type === 'image' ? '🖼️ صورة' : '📄 PDF'}
                                      </span>
                                      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200 flex items-center gap-1">
                                        <Lock className="w-3 h-3" />
                                        محتوى مغلق
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePurchase();
                                  }}
                                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                                >
                                  <Lock className="w-5 h-5" />
                                  فتح المحتوى
                                </button>
                              </div>
                            </div>
                          );
                        }
                        
                        // Unlocked blocks - show based on type
                        return (
                          <div 
                            key={block.id} 
                            className="group bg-white p-6 rounded-xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-start gap-4 mb-4">
                              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
                                {block.type === 'video' && <Video className="text-[#194cbf] w-6 h-6" />}
                                {block.type === 'image' && <ImageIcon className="text-[#194cbf] w-6 h-6" />}
                                {block.type === 'pdf' && <BookOpen className="text-[#194cbf] w-6 h-6" />}
                              </div>
                              <div className="flex-1">
                                {block.title && (
                                  <h4 className="font-bold text-gray-900 mb-1 text-lg">{block.title}</h4>
                                )}
                                <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 capitalize">
                                  ✓ {block.type === 'video' ? 'فيديو' : block.type === 'image' ? 'صورة' : 'PDF'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Content Display */}
                            <div 
                              className="relative"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {block.type === 'video' && block.fileUrl && (
                                <div 
                                  className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <video 
                                    src={block.fileUrl} 
                                    controls 
                                    controlsList="nodownload"
                                    playsInline
                                    webkit-playsinline="true"
                                    preload="metadata"
                                    className="w-full h-full"
                                    poster={block.thumbnail || ''}
                                    onClick={(e) => e.stopPropagation()}
                                    onPlay={(e) => e.stopPropagation()}
                                    onPause={(e) => e.stopPropagation()}
                                    style={{
                                      objectFit: 'contain',
                                      backgroundColor: '#000'
                                    }}
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              )}
                              {block.type === 'image' && block.fileUrl && (
                                <div className="relative rounded-xl overflow-hidden shadow-2xl">
                                  <img 
                                    src={block.fileUrl} 
                                    alt={block.title || 'Image'} 
                                    className="w-full h-auto object-contain max-h-[600px]"
                                  />
                                </div>
                              )}
                              {block.type === 'pdf' && block.fileUrl && (
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-4 rounded-xl">
                                        <BookOpen className="text-white w-8 h-8" />
                                      </div>
                                      <div>
                                        <h5 className="font-bold text-gray-900 mb-1">ملف PDF متاح</h5>
                                        <p className="text-sm text-gray-600">انقر على الزر لفتح الملف</p>
                                      </div>
                                    </div>
                                    <a 
                                      href={block.fileUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="bg-gradient-to-r from-[#194cbf] to-[#61a1ff] hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                                    >
                                      <BookOpen className="w-5 h-5" />
                                      فتح PDF
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          );
                        })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Live Sessions Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-[#194cbf] to-[#61a1ff] bg-clip-text text-transparent mb-4">
            جلسة لايف
          </h2>
          <p className="text-gray-600 text-lg">
            جلسة مباشرة تفاعلية
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2">

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
                                      <>
                                        {/* Show timer/join button only if purchased or admin/professor */}
                                        {(hasPurchased || user?.role === 'admin' || user?.role === 'professor') ? (
                                          <button
                                            onClick={() => handleJoinSession(session)}
                                            disabled={!canJoinSession(session)}
                                            className="bg-[#194cbf] text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                                          >
                                            {sessionTimers[session.id] || 'قريباً'}
                                          </button>
                                        ) : (
                                          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                            <Lock className="w-3 h-3" />
                                            يجب شراء الجلسة أولاً
                                          </span>
                                        )}
                                      </>
                                    )}
                                    {getSessionStatus(session) === 'live' && (
                                      <>
                                        {/* Show join button only if purchased or admin/professor */}
                                        {(hasPurchased || user?.role === 'admin' || user?.role === 'professor') ? (
                                          <button
                                            onClick={() => handleJoinSession(session)}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
                                          >
                                            انضم الآن
                                          </button>
                                        ) : (
                                          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                            <Lock className="w-3 h-3" />
                                            يجب شراء الجلسة أولاً
                                          </span>
                                        )}
                                      </>
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
                      <Calendar className="w-5 h-5 text-[#194cbf]" />
                      <span className="text-sm text-gray-600">التاريخ: {formatDate(liveSection.scheduled_date)}</span>
                    </div>
                    {liveSection.scheduled_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#194cbf]" />
                        <span className="text-sm text-gray-600">الوقت: {liveSection.scheduled_time}</span>
                      </div>
                    )}
                    {liveSection.duration_minutes && (
                      <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-[#194cbf]" />
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
                      onClick={() => {
                        if (liveSection?.telegram_channel) {
                          window.open(liveSection.telegram_channel, '_blank');
                        } else {
                          toast.error('Telegram channel not available');
                        }
                      }}
                      className="flex-1 bg-gradient-to-r from-[#194cbf] to-[#61a1ff] text-white py-3 px-4 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <TelegramIcon className="w-5 h-5 ml-2" />
                      {liveSection?.telegram_channel ? 'Join Telegram Channel' : 'Telegram Channel'}
                    </button>
                    
                    {/* Purchase Button - Only show if not purchased */}
                    {!hasPurchased && (
                      <button
                        onClick={handlePurchase}
                        disabled={purchaseLoading}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex flex-col items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {purchaseLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mb-1"></div>
                            <span>جاري الشراء...</span>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <BookOpen className="w-5 h-5" />
                              <span>شراء الجلسة</span>
                            </div>
                            <div className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                              {liveSection.price.toLocaleString('ar-DZ')} دج
                            </div>
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

      {/* Ask the professor — comments section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <LiveSectionCommentsSection sectionId={liveSection.id} />
      </div>

      <Footer />
    </div>
  );
};

export default LiveSessionDetails;
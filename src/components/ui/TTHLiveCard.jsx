import React, { useState, useEffect, useRef } from 'react';
import { FaVideo, FaUser, FaClock, FaUsers, FaPlay, FaStop, FaShoppingCart, FaCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const TTHLiveCard = ({ session, onStatusChange }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeUntilStart, setTimeUntilStart] = useState('');
  const [sessionStatus, setSessionStatus] = useState('upcoming');
  const [isLive, setIsLive] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render
  const [purchaseStatusLoading, setPurchaseStatusLoading] = useState(true); // NEW
  const prevSessionStatus = useRef(sessionStatus);
  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return timeString;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return 'bg-blue-100 text-blue-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  // Real-time timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check if user has purchased this session and get user points
  const checkPurchaseStatus = async () => {
    if (!user) return;
    setPurchaseStatusLoading(true); // NEW
    try {
      console.log(`[TTHLiveCard] Checking purchase status for session ${session.id}, user: ${user.id}`);
      
      // Check if user has purchased this session
      const accessResponse = await fetch(`/api/live-sessions/${session.id}/access`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`[TTHLiveCard] Access response status: ${accessResponse.status}`);

      if (accessResponse.ok) {
        const accessData = await accessResponse.json();
        console.log(`[TTHLiveCard] Access data for session ${session.id}:`, accessData);
        console.log(`[TTHLiveCard] hasPurchased property:`, accessData.hasPurchased);
        console.log(`[TTHLiveCard] Setting hasPurchased to: ${accessData.hasPurchased}`);
        setHasPurchased(accessData.hasPurchased);
        setForceUpdate(prev => prev + 1); // Force re-render
      } else {
        console.error(`[TTHLiveCard] Failed to check access for session ${session.id}:`, accessResponse.status);
        const errorText = await accessResponse.text();
        console.error(`[TTHLiveCard] Error response:`, errorText);
        
        // Fallback: Check if we have a local purchase record
        const localPurchases = JSON.parse(localStorage.getItem('userPurchases') || '[]');
        const hasLocalPurchase = localPurchases.includes(session.id);
        console.log(`[TTHLiveCard] Local purchase check:`, hasLocalPurchase);
        setHasPurchased(hasLocalPurchase);
      }

      // Get user points balance
      const pointsResponse = await fetch('/api/points/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (pointsResponse.ok) {
        const pointsData = await pointsResponse.json();
        setUserPoints(pointsData.balance || 0);
      } else {
        console.error('Failed to fetch user points');
      }
    } catch (error) {
      console.error('Error checking purchase status:', error);
      
      // Fallback: Check if we have a local purchase record
      const localPurchases = JSON.parse(localStorage.getItem('userPurchases') || '[]');
      const hasLocalPurchase = localPurchases.includes(session.id);
      console.log(`[TTHLiveCard] Fallback local purchase check:`, hasLocalPurchase);
      setHasPurchased(hasLocalPurchase);
    } finally {
      setPurchaseStatusLoading(false); // NEW
    }
  };

  // Initialize local purchases from database
  const initializeLocalPurchases = async () => {
    if (!user) return;
    
    try {
      // Get all purchases for this user
      const response = await fetch('/api/points/purchases', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const purchases = await response.json();
        const sessionIds = purchases.map(p => p.session_id);
        localStorage.setItem('userPurchases', JSON.stringify(sessionIds));
        console.log(`[TTHLiveCard] Initialized local purchases:`, sessionIds);
      }
    } catch (error) {
      console.error('Failed to initialize local purchases:', error);
    }
  };

  useEffect(() => {
    checkPurchaseStatus();
  }, [user, session.id]);

  // Initialize local purchases on mount
  useEffect(() => {
    initializeLocalPurchases();
  }, [user]);

  // Refresh purchase status when component mounts and when session changes
  useEffect(() => {
    if (user && session.id) {
      checkPurchaseStatus();
    }
  }, [user, session.id]);

  // Force re-render when purchase status changes
  useEffect(() => {
    console.log(`[TTHLiveCard] Force update triggered: ${forceUpdate}, hasPurchased: ${hasPurchased}`);
  }, [forceUpdate, hasPurchased]);

  // Calculate session status and countdown
  useEffect(() => {
    if (!session.start_time) {
      setSessionStatus('upcoming');
      setTimeUntilStart('');
      return;
    }

    const now = currentTime;
    const sessionTime = new Date(session.start_time);
    const sessionEndTime = new Date(sessionTime.getTime() + (session.duration || 60) * 60 * 1000);
    
    // Check if session is manually ended
    if (session.status === 'ended' || session.is_ended) {
      setSessionStatus('ended');
      setIsEnded(true);
      setIsLive(false);
      setTimeUntilStart('');
      return;
    }

    if (now < sessionTime) {
      // Session hasn't started yet
      const timeDiff = sessionTime - now;
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setTimeUntilStart(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeUntilStart(`${minutes}m ${seconds}s`);
      } else {
        setTimeUntilStart(`${seconds}s`);
      }
      
      setSessionStatus('upcoming');
      setIsLive(false);
      setIsEnded(false);
    } else if (now >= sessionTime && now <= sessionEndTime) {
      // Session is live
      setSessionStatus('live');
      setIsLive(true);
      setIsEnded(false);
      setTimeUntilStart('مباشر الآن');
    } else {
      // Session has ended
      setSessionStatus('ended');
      setIsLive(false);
      setIsEnded(true);
      setTimeUntilStart('منتهي');
    }

    // Only notify parent component of status change when status actually changes
    if (onStatusChange && sessionStatus !== prevSessionStatus.current) {
      prevSessionStatus.current = sessionStatus;
      onStatusChange(session.id, sessionStatus);
    }
  }, [currentTime, session.start_time, session.duration, session.status, session.is_ended, onStatusChange]);

  const getSessionStatus = () => {
    return sessionStatus;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'live':
        return 'مباشر الآن';
      case 'upcoming':
        return 'قريباً';
      case 'ended':
        return 'منتهي';
      default:
        return 'متاح';
    }
  };

  const handlePurchaseSession = async () => {
    if (!user) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }

    // For free live sessions, don't check points balance
    if (session.price && session.price > 0 && userPoints < session.price) {
      alert(`نقاطك غير كافية. تحتاج ${session.price} نقطة ولديك ${userPoints} نقطة.`);
      return;
    }

    console.log(`[TTHLiveCard] Starting purchase for session ${session.id}`);
    setIsPurchasing(true);
    try {
      const response = await fetch(`/api/live-sessions/${session.id}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log(`[TTHLiveCard] Purchase response status:`, response.status);

      if (response.ok) {
        const data = await response.json();
        console.log(`[TTHLiveCard] Purchase successful:`, data);
        setHasPurchased(true);
        setForceUpdate(prev => prev + 1); // Force re-render
        setUserPoints(data.newBalance);
        
        // Store purchase locally for fallback
        const localPurchases = JSON.parse(localStorage.getItem('userPurchases') || '[]');
        if (!localPurchases.includes(session.id)) {
          localPurchases.push(session.id);
          localStorage.setItem('userPurchases', JSON.stringify(localPurchases));
        }
        
        if (session.price && session.price > 0) {
          alert(`تم شراء البث المباشر بنجاح! تم خصم ${data.pointsDeducted} نقطة من رصيدك.`);
        } else {
          alert('تم الحصول على البث المباشر مجاناً بنجاح!');
        }
        
        // Trigger points update event to refresh navbar
        window.dispatchEvent(new CustomEvent('pointsUpdated', { 
          detail: { points: data.newBalance } 
        }));
        
        // Immediately check purchase status again to ensure UI is updated
        setTimeout(() => {
          checkPurchaseStatus();
        }, 500);
      } else {
        const errorData = await response.json();
        console.error(`[TTHLiveCard] Purchase failed:`, errorData);
        alert(`خطأ في الشراء: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error purchasing session:', error);
      alert('حدث خطأ أثناء الشراء. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleJoinSession = () => {
    const status = getSessionStatus();
    
    if (!hasPurchased) {
      alert('يجب شراء هذا البث المباشر أولاً');
      return;
    }
    
    if (status === 'live') {
      // Session is live, navigate to streaming
      navigate(`/streaming/${session.id}`);
    } else if (status === 'upcoming') {
      // Session is upcoming, show message
      alert('هذا البث المباشر سيبدأ قريباً. يرجى الانتظار.');
    } else {
      // Session has ended
      alert('انتهى هذا البث المباشر.');
    }
  };

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-200 overflow-hidden border border-white/30 group transform hover:scale-102">
      {/* Cover Image - Always show image section */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={session.cover_image_url || session.cover_image || session.image || '/images/module_icon.png'}
          alt={session.title || 'Live Session'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            e.target.src = '/images/module_icon.png';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
      
      {/* Header with status */}
      <div className="p-6 relative">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
              {session.title || 'بث مباشر'}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium shadow-sm ${getStatusColor(getSessionStatus())}`}>
              {getStatusText(getSessionStatus())}
            </span>
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-4 line-clamp-2 group-hover:text-gray-700 transition-colors duration-200">
            {session.description || 'انضم إلى هذا البث المباشر للتعلم مع أفضل الأساتذة'}
          </p>

          {/* Session details */}
          <div className="space-y-3 mb-6">
            {/* Teacher */}
            <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
              <FaUser className="text-blue-500 group-hover:text-blue-600 transition-colors duration-200" />
              <span>الأستاذ: {session.professor_name || 'أستاذ مباشر'}</span>
            </div>

            {/* Time with countdown */}
            {session.start_time && (
              <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                <FaClock className={`${isLive ? 'text-blue-500' : isEnded ? 'text-gray-500' : 'text-green-500'} group-hover:scale-110 transition-all duration-200`} />
                <span className={`font-medium ${isLive ? 'text-blue-600' : isEnded ? 'text-gray-600' : 'text-green-600'}`}>
                  {timeUntilStart || formatTime(session.start_time)}
                </span>
              </div>
            )}

            {/* Date */}
            {session.start_time && (
              <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                <FaClock className="text-purple-500 group-hover:text-purple-600 transition-colors duration-200" />
                <span>{formatDate(session.start_time)}</span>
              </div>
            )}

            {/* Expected viewers */}
            {session.expected_viewers && (
              <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                <FaUsers className="text-orange-500 group-hover:text-orange-600 transition-colors duration-200" />
                <span>{session.expected_viewers} متوقع</span>
              </div>
            )}
          </div>

          {/* Price and Points Info */}
          {session.price !== undefined && session.price !== null && (
            <div className="mb-4 p-3 bg-white/30 backdrop-blur-sm rounded-xl border border-white/50 group-hover:bg-white/40 transition-all duration-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-200">السعر:</span>
                  <span className="text-lg font-bold text-blue-600 group-hover:text-blue-700 transition-colors duration-200">
                    {session.price} نقطة
                  </span>
                </div>
                {user && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-200">نقاطك:</span>
                    <span className={`text-sm font-medium ${userPoints >= session.price ? 'text-blue-600' : 'text-gray-500'}`}>
                      {userPoints} نقطة
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Purchase/Join button */}
          {purchaseStatusLoading ? (
            <button
              className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-gray-300 to-gray-400 text-gray-500 cursor-not-allowed animate-pulse"
              disabled
            >
              <span className="loader mr-2" />
              جاري التحقق...
            </button>
          ) : hasPurchased ? (
            <button 
              onClick={handleJoinSession}
              className={`w-full py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-[1.02] shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                isLive 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 animate-pulse' 
                  : sessionStatus === 'upcoming'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                  : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
              }`}
              disabled={isEnded}
            >
              {isLive ? (
                <FaPlay className="text-lg group-hover:scale-110 transition-transform duration-200 animate-pulse" />
              ) : isEnded ? (
                <FaStop className="text-lg group-hover:scale-110 transition-transform duration-200" />
              ) : (
                <FaCheck className="text-lg group-hover:scale-110 transition-transform duration-200" />
              )}
              <span>
                {isLive ? 'انضم الآن - مباشر' : 
                 sessionStatus === 'upcoming' ? 'تم الشراء - انتظار البداية' : 'انتهى البث'}
              </span>
            </button>
          ) : (
            <button 
              onClick={handlePurchaseSession}
              disabled={isPurchasing || isEnded || (user && session.price && session.price > 0 && userPoints < session.price)}
              className={`w-full py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-[1.02] shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                isPurchasing
                  ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
                  : isEnded
                  ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
                  : user && session.price && session.price > 0 && userPoints < session.price
                  ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
              }`}
            >
              <FaShoppingCart className="text-lg group-hover:scale-110 transition-transform duration-200" />
              <span>
                {isPurchasing ? 'جاري الشراء...' : 
                 isEnded ? 'انتهى البث' :
                 user && session.price && session.price > 0 && userPoints < session.price ? 'نقاط غير كافية' : 
                 !session.price || session.price === 0 || session.price === '0' ? 'احصل عليه مجاناً' : 'شراء البث المباشر'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TTHLiveCard; 
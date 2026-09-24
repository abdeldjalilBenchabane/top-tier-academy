import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useConfirmPurchase } from './TTHPurchaseConfirm';
import { FaVideo, FaUser, FaClock, FaUsers, FaPlay, FaStop, FaShoppingCart, FaCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import { parseSessionDate } from '@/lib/utils';
const TTHLiveCard = ({ session, onStatusChange }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const confirmPurchase = useConfirmPurchase();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeUntilStart, setTimeUntilStart] = useState('');
  const [sessionStatus, setSessionStatus] = useState('upcoming');
  const [isLive, setIsLive] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [canJoin, setCanJoin] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(!!session.is_paid);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  // Only unknown when the list did not say. When it did, there is nothing to
  // wait for and no placeholder is ever shown.
  const [purchaseStatusLoading, setPurchaseStatusLoading] = useState(session.is_paid === undefined);
  const prevSessionStatus = useRef(sessionStatus);
  const lastCheckTime = useRef(0);
  const isCheckingPurchase = useRef(false);
  const hasCheckedOnce = useRef(false);

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      // Parse the time as local time
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
  // The clock drove a re-render every single second even when nothing on the
  // card changed, which is what made the badge and the points flicker. Now the
  // tick only lands when the text it produces would actually differ.
  const displayKeyRef = useRef(null);
  useEffect(() => {
    const displayKey = (now) => {
      if (!session.start_time) return 'none';
      if (session.status === 'ended' || session.is_ended) return 'ended';
      if (session.status === 'live') return 'live';
      const start = parseSessionDate(session.start_time) || new Date(0);
      const end = new Date(start.getTime() + (session.duration || 60) * 60 * 1000);
      if (now >= start && now <= end) return 'live';
      if (now > end) return 'ended';
      const diff = start - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      // Matches the strings rendered below, so the key changes exactly when
      // the visible countdown does — every second only in the final minute.
      const text = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;
      return `up:${text}:${now >= new Date(start.getTime() - 15 * 60 * 1000) ? 1 : 0}`;
    };

    displayKeyRef.current = displayKey(new Date());
    const timer = setInterval(() => {
      const now = new Date();
      const key = displayKey(now);
      if (key !== displayKeyRef.current) {
        displayKeyRef.current = key;
        setCurrentTime(now);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session.start_time, session.duration, session.status, session.is_ended]);

  // Memoized check purchase status function
  useEffect(() => {
    if (session.is_paid !== undefined) {
      setHasPurchased(!!session.is_paid);
      setPurchaseStatusLoading(false);
    }
  }, [session.is_paid]);

  const checkPurchaseStatus = useCallback(async () => {
    if (!user || isCheckingPurchase.current) return;
    
    // Prevent multiple simultaneous calls
    const now = Date.now();
    if (now - lastCheckTime.current < 2000) return; // Debounce to 2 seconds
    
    isCheckingPurchase.current = true;
    lastCheckTime.current = now;
    
    // Only show loading on the very first check, and never when the sessions
    // list already told us whether this was purchased.
    if (!hasCheckedOnce.current && session.is_paid === undefined) {
      setPurchaseStatusLoading(true);
    }
    
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
      setPurchaseStatusLoading(false);
      hasCheckedOnce.current = true;
      isCheckingPurchase.current = false;
    }
  }, [user?.id, session.id]);

  // Memoized initialize local purchases function
  const initializeLocalPurchases = useCallback(async () => {
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
  }, [user?.id]);

  // Single useEffect for purchase status check - only check when user or session.id changes
  useEffect(() => {
    if (user?.id && session.id) {
      // Do NOT reset hasCheckedOnce here: that flag is what stops the loading
      // placeholder from flashing on every re-check.
      checkPurchaseStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, session.id]);

  // Initialize local purchases on mount only
  useEffect(() => {
    if (user?.id) {
      initializeLocalPurchases();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Memoized session status calculation
  const sessionStatusData = useMemo(() => {
    if (!session.start_time) {
      return {
        status: 'upcoming',
        timeUntilStart: '',
        isLive: false,
        isEnded: false,
        canJoin: false
      };
    }

    const now = currentTime;
    const sessionTime = parseSessionDate(session.start_time) || new Date(0);
    const sessionEndTime = new Date(sessionTime.getTime() + (session.duration || 60) * 60 * 1000);
    // Students may enter this long before the scheduled start.
    const JOIN_EARLY_MS = 15 * 60 * 1000;
    const doorsOpen = new Date(sessionTime.getTime() - JOIN_EARLY_MS);

    // Check if session is manually ended
    if (session.status === 'ended' || session.is_ended) {
      return {
        status: 'ended',
        timeUntilStart: '',
        isLive: false,
        isEnded: true,
        canJoin: false
      };
    }

    // States the professor can set that students must be able to see.
    if (session.status === 'cancelled') {
      return { status: 'cancelled', timeUntilStart: 'ملغاة', isLive: false, isEnded: true, canJoin: false };
    }
    if (session.status === 'paused') {
      return { status: 'paused', timeUntilStart: 'متوقفة مؤقتاً', isLive: false, isEnded: false, canJoin: true };
    }
    if (session.status === 'technical_issues') {
      return { status: 'technical_issues', timeUntilStart: 'مشكلة تقنية', isLive: false, isEnded: false, canJoin: true };
    }
    if (session.status === 'starting') {
      return { status: 'starting', timeUntilStart: 'على وشك البدء', isLive: false, isEnded: false, canJoin: true };
    }

    // The professor started the stream: let students in regardless of the clock.
    if (session.status === 'live') {
      return {
        status: 'live',
        timeUntilStart: 'مباشر الآن',
        isLive: true,
        isEnded: false,
        canJoin: true
      };
    }

    if (now < sessionTime) {
      // Session hasn't started yet
      const timeDiff = sessionTime - now;
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      let timeText = '';
      if (hours > 0) {
        timeText = `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        timeText = `${minutes}m ${seconds}s`;
      } else {
        timeText = `${seconds}s`;
      }
      
      return {
        status: 'upcoming',
        timeUntilStart: timeText,
        isLive: false,
        isEnded: false,
        // Doors open a quarter of an hour early.
        canJoin: now >= doorsOpen
      };
    } else if (now >= sessionTime && now <= sessionEndTime) {
      // Session is live
      return {
        status: 'live',
        timeUntilStart: 'مباشر الآن',
        isLive: true,
        isEnded: false,
        canJoin: true
      };
    } else {
      // Session has ended
      return {
        status: 'ended',
        timeUntilStart: 'منتهي',
        isLive: false,
        isEnded: true,
        canJoin: false
      };
    }
  }, [currentTime, session.start_time, session.duration, session.status, session.is_ended]);

  // Update session status based on memoized calculation
  useEffect(() => {
    setSessionStatus(sessionStatusData.status);
    setTimeUntilStart(sessionStatusData.timeUntilStart);
    setIsLive(sessionStatusData.isLive);
    setIsEnded(sessionStatusData.isEnded);
    setCanJoin(!!sessionStatusData.canJoin);

    // Only notify parent component of status change when status actually changes
    if (onStatusChange && sessionStatusData.status !== prevSessionStatus.current) {
      prevSessionStatus.current = sessionStatusData.status;
      onStatusChange(session.id, sessionStatusData.status);
    }
  }, [sessionStatusData, onStatusChange, session.id]);

  const getSessionStatus = () => {
    return sessionStatus;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'live':
        return 'مباشر الآن';
      case 'starting':
        return 'على وشك البدء';
      case 'paused':
        return 'متوقفة مؤقتاً';
      case 'technical_issues':
        return 'مشكلة تقنية';
      case 'cancelled':
        return 'ملغاة';
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

    if (!(await confirmPurchase({
      title: session.title,
      price: session.price,
      balance: userPoints,
      kindLabel: 'شراء بث مباشر بالنقاط',
    }))) {
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
        }, 1000);
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
    
    if (canJoin) {
      // Live, or within the early-entry window.
      navigate(`/streaming/${session.id}`);
    } else if (status === 'upcoming') {
      // Session is upcoming, show message
      alert('يمكنك الدخول قبل 15 دقيقة من موعد البداية.');
    } else {
      // Session has ended
      alert('انتهى هذا البث المباشر.');
    }
  };

  return (
    <div className="relative flex h-full w-full max-w-[400px] flex-col bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
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
      <div className="flex flex-1 flex-col p-4 relative">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-800 group-hover:text-[#194cbf] transition-colors duration-200 line-clamp-2 min-h-[2.6rem]">
              {session.title || 'بث مباشر'}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium shadow-sm ${getStatusColor(getSessionStatus())}`}>
              {getStatusText(getSessionStatus())}
            </span>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-[13px] mb-3 line-clamp-2 min-h-[2.4rem] group-hover:text-gray-700 transition-colors duration-200">
            {session.description || 'انضم إلى هذا البث المباشر للتعلم مع أفضل الأساتذة'}
          </p>

          {/* Session details */}
          <div className="space-y-3 mb-6">
            {/* Teacher */}
            <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
              <FaUser className="text-blue-500 group-hover:text-[#194cbf] transition-colors duration-200" />
              <span>الأستاذ: {session.professor_name || 'أستاذ مباشر'}</span>
            </div>

            {/* Time with countdown */}
            {session.start_time && (
              <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                <FaClock className={`${isLive ? 'text-blue-500' : isEnded ? 'text-gray-500' : 'text-green-500'} group-hover:scale-110 transition-all duration-200`} />
                <span className={`font-medium ${isLive ? 'text-[#194cbf]' : isEnded ? 'text-gray-600' : 'text-green-600'}`}>
                  {timeUntilStart || formatTime(session.start_time)}
                </span>
              </div>
            )}

            {/* Date */}
            {session.start_time && (
              <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                <FaClock className="text-blue-500 group-hover:text-[#61a1ff] transition-colors duration-200" />
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
            <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-100 transition-all duration-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-200">السعر:</span>
                  <span className="text-lg font-bold text-[#194cbf] group-hover:text-blue-700 transition-colors duration-200">
                    {session.price} نقطة
                  </span>
                </div>
                {user && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-200">نقاطك:</span>
                    <span className={`text-sm font-medium ${userPoints >= session.price ? 'text-[#194cbf]' : 'text-gray-500'}`}>
                      {userPoints} نقطة
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Purchase/Join button — pushed to the bottom so cards in a row end
              at the same place whatever their description length. */}
          <div className="mt-auto" />

          {purchaseStatusLoading ? (
            /* Hold the layout while the purchase state loads, without showing
               a "checking" message that flashes past. */
            <div className="w-full py-3 rounded-xl bg-gray-100/70" aria-hidden="true" />
          ) : hasPurchased ? (
            <button 
              onClick={handleJoinSession}
              /* A slow pulse signals "live". The flashing you saw earlier was the
                 card remounting, not this animation. */
              style={isLive ? { animationDuration: '3.5s' } : undefined}
              className={`w-full py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-[1.02] shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                canJoin
                  ? `bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 ${isLive ? 'animate-pulse' : ''}`
                  : sessionStatus === 'upcoming'
                  ? 'bg-gradient-to-r from-[#194cbf] to-[#61a1ff] text-white hover:from-[#1340a0] hover:to-[#4a8de8]'
                  : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
              }`}
              disabled={isEnded}
            >
              {canJoin ? (
                <FaPlay className="text-lg group-hover:scale-110 transition-transform duration-200" />
              ) : isEnded ? (
                <FaStop className="text-lg group-hover:scale-110 transition-transform duration-200" />
              ) : (
                <FaCheck className="text-lg group-hover:scale-110 transition-transform duration-200" />
              )}
              {isLive && (
                <span className="inline-block h-2 w-2 rounded-full bg-white/90" aria-hidden="true" />
              )}
              <span>
                {sessionStatus === 'cancelled' ? 'تم إلغاء البث' :
                 sessionStatus === 'paused' ? 'متوقفة مؤقتاً - يمكنك الدخول' :
                 sessionStatus === 'technical_issues' ? 'مشكلة تقنية - يمكنك الدخول' :
                 isLive ? 'انضم الآن - مباشر' :
                 canJoin ? 'انضم الآن' :
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
                  : 'bg-gradient-to-r from-[#194cbf] to-[#61a1ff] text-white hover:from-[#1340a0] hover:to-[#4a8de8]'
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

// Compare only what the card renders. Without this, every parent refresh hands
// down brand new session objects and repaints all cards even when nothing changed.
const sameSession = (prev, next) => {
  const a = prev.session, b = next.session;
  return (
    a.id === b.id &&
    a.title === b.title &&
    a.description === b.description &&
    a.start_time === b.start_time &&
    a.duration === b.duration &&
    a.price === b.price &&
    a.status === b.status &&
    a.is_ended === b.is_ended &&
    a.is_paid === b.is_paid &&
    a.cover_image_url === b.cover_image_url &&
    a.professor_name === b.professor_name &&
    prev.onStatusChange === next.onStatusChange
  );
};

export default React.memo(TTHLiveCard, sameSession); 
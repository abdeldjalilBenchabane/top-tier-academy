import React, { useState, useEffect } from 'react';
import { FaVideo, FaUser, FaClock, FaUsers, FaPlay, FaStop } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const TTHLiveCard = ({ session, onStatusChange }) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeUntilStart, setTimeUntilStart] = useState('');
  const [sessionStatus, setSessionStatus] = useState('upcoming');
  const [isLive, setIsLive] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
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

    // Notify parent component of status change
    if (onStatusChange) {
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

  const handleJoinSession = () => {
    const status = getSessionStatus();
    
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
    <div className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white/30 group transform hover:scale-105">
      {/* Cover Image - Always show image section */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={session.cover_image || session.image || '/images/module_icon.png'}
          alt={session.title || 'Live Session'}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.target.src = '/images/module_icon.png';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Header with status */}
      <div className="p-6 relative">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
              {session.title || 'بث مباشر'}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium shadow-sm ${getStatusColor(getSessionStatus())}`}>
              {getStatusText(getSessionStatus())}
            </span>
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-4 line-clamp-2 group-hover:text-gray-700 transition-colors duration-300">
            {session.description || 'انضم إلى هذا البث المباشر للتعلم مع أفضل الأساتذة'}
          </p>

          {/* Session details */}
          <div className="space-y-3 mb-6">
            {/* Teacher */}
            <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
              <FaUser className="text-blue-500 group-hover:text-blue-600 transition-colors duration-300" />
              <span>الأستاذ: {session.professor_name || session.teacher || 'أستاذ مباشر'}</span>
            </div>

            {/* Time with countdown */}
            {session.start_time && (
              <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                <FaClock className={`${isLive ? 'text-blue-500' : isEnded ? 'text-gray-500' : 'text-green-500'} group-hover:scale-110 transition-all duration-300`} />
                <span className={`font-medium ${isLive ? 'text-blue-600' : isEnded ? 'text-gray-600' : 'text-green-600'}`}>
                  {timeUntilStart || formatTime(session.start_time)}
                </span>
              </div>
            )}

            {/* Date */}
            {session.start_time && (
              <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                <FaClock className="text-purple-500 group-hover:text-purple-600 transition-colors duration-300" />
                <span>{formatDate(session.start_time)}</span>
              </div>
            )}

            {/* Expected viewers */}
            {session.expected_viewers && (
              <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                <FaUsers className="text-orange-500 group-hover:text-orange-600 transition-colors duration-300" />
                <span>{session.expected_viewers} متوقع</span>
              </div>
            )}
          </div>

          {/* Price if available */}
          {session.price !== undefined && session.price !== null && (
            <div className="mb-4 p-3 bg-white/30 backdrop-blur-sm rounded-xl border border-white/50 group-hover:bg-white/40 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">السعر:</span>
                <span className="text-lg font-bold text-blue-600 group-hover:text-blue-700 transition-colors duration-300">
                  {session.price} {session.currency || 'دج'}
                </span>
              </div>
            </div>
          )}

          {/* Join button with live indicator */}
          <button 
            onClick={handleJoinSession}
            className={`w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-[1.02] shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
              isLive 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 animate-pulse' 
                : sessionStatus === 'upcoming'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
            }`}
            disabled={isEnded}
          >
            {isLive ? (
              <FaPlay className="text-lg group-hover:scale-110 transition-transform duration-300 animate-pulse" />
            ) : isEnded ? (
              <FaStop className="text-lg group-hover:scale-110 transition-transform duration-300" />
            ) : (
              <FaVideo className="text-lg group-hover:scale-110 transition-transform duration-300" />
            )}
            <span>
              {isLive ? 'انضم الآن - مباشر' : 
               sessionStatus === 'upcoming' ? 'انضم الآن' : 'انتهى البث'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TTHLiveCard; 
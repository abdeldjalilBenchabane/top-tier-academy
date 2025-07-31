import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaBookOpen, FaEye, FaUserTie, FaChalkboardTeacher, FaFileAlt, FaUser } from 'react-icons/fa';
import { formatDate } from '../../data/index';
import { useAuth } from '../../contexts/AuthContext';

const PrivateClassCard = ({ session, onDetailsClick, onAccept, onRefuse, actionLoading, showActions, studentName, onEditTime, onJoinLive, onPurchase, purchaseLoading, approvingRequest, rejectingRequest, editingTimeRequest }) => {
  const { isProfessor, user } = useAuth();
  
  // Check if this session belongs to the current user
  const isMySession = session.studentId === user?.id || !session.studentId;

  // Countdown logic
  const [timeLeft, setTimeLeft] = useState('');
  const [canJoin, setCanJoin] = useState(false);
  useEffect(() => {
    // Use scheduled_at if present, otherwise estimate from date and time
    let scheduled = null;
    if (session.scheduled_at) {
      scheduled = new Date(session.scheduled_at);
    } else if (session.date && session.time) {
      const startTime = session.time.split(' - ')[0];
      scheduled = new Date(`${session.date}T${startTime}:00`);
    }
    if (!scheduled) return;
    const interval = setInterval(() => {
      const now = new Date();
      const diff = scheduled - now;
      if (diff <= 0) {
        setTimeLeft('');
        setCanJoin(true);
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`);
        setCanJoin(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [session.scheduled_at, session.date, session.time]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'مؤكد':
        return {
          bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
          text: 'text-white',
          border: 'border-green-200'
        };
      case 'في الانتظار':
        return {
          bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
          text: 'text-white',
          border: 'border-yellow-200'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
          text: 'text-white',
          border: 'border-gray-200'
        };
    }
  };

  const statusColors = getStatusColor(session.status);

  // Format the date properly
  const formattedDate = session.date ? formatDate(session.date) : session.date;

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 hover:border-blue-200 transform hover:scale-105" dir="rtl">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                {isProfessor ? (
                  <FaUser className="text-white text-sm sm:text-base" />
                ) : (
                <FaChalkboardTeacher className="text-white text-sm sm:text-base" />
                )}
              </div>
              <span className="text-sm sm:text-base font-bold">
                {isProfessor ? 'الطالب' : 'الأستاذ'}
              </span>
            </div>
            <div className="text-left">
              <span className="text-xs sm:text-sm bg-white bg-opacity-20 px-2 py-1 rounded-full">
                {session.status}
              </span>
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-1">
            {isProfessor ? 'طلب حصة خاصة' : session.teacher}
          </h3>
                    <p className="text-sm sm:text-base opacity-90">
            {session.hierarchy_path ? (
              session.hierarchy_path
            ) : (
              `${session.subject} - ${session.grade}`
            )}
          </p>
          {session.price_per_session && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full">
                سعر الحصة: {session.price_per_session.toLocaleString()} د.ج
              </span>
              {session.session_duration && (
                <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full">
                  {session.session_duration} دقيقة
                </span>
              )}
            </div>
          )}
          {session.price_per_session && isProfessor && (
            <div className="mt-2 text-xs opacity-80">
              <p>سيتم إعلام الطالب بالسعر والمدة المحددة</p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Student Name (for professor view) */}
        {isProfessor && studentName && (
          <div className="text-sm text-gray-700 font-semibold mb-2">الطالب: {studentName}</div>
        )}
        
        {/* Complete Hierarchy Path */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <FaBookOpen className="text-indigo-600 text-sm sm:text-base" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-500">المسار الدراسي</p>
            <p className="text-sm sm:text-base font-semibold text-gray-900">
              {session.hierarchy_path ? (
                session.hierarchy_path
              ) : (
                <span className="text-orange-600">
                  {session.subject && session.grade ? `${session.subject} - ${session.grade}` : 'لم يتم تحديد المسار'}
                </span>
              )}
            </p>
          </div>
        </div>
        
        {/* Date and Time */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <FaCalendarAlt className="text-blue-600 text-sm sm:text-base" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-500">التاريخ والوقت</p>
            <p className="text-sm sm:text-base font-semibold text-gray-900">{formattedDate} - {session.time}</p>
          </div>
        </div>

        {/* Sessions Count */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
            <FaClock className="text-green-600 text-sm sm:text-base" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-500">عدد الحصص</p>
            <p className="text-sm sm:text-base font-semibold text-gray-900">{session.sessions} حصة</p>
          </div>
        </div>

        {/* Description */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center mt-1">
            <FaFileAlt className="text-purple-600 text-sm sm:text-base" />
          </div>
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">وصف الطلب</p>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{session.description}</p>
          </div>
        </div>

        {/* Action Buttons for Professors */}
        {isProfessor && showActions && session.status === 'في الانتظار' && (
          <div className="flex flex-row gap-2 mt-4 flex-nowrap">
            <button
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => onAccept && onAccept(session.id)}
              disabled={approvingRequest === session.id || rejectingRequest === session.id}
            >
              {approvingRequest === session.id ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري القبول...
                </>
              ) : (
                'قبول'
              )}
            </button>
            <button
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => onRefuse && onRefuse(session.id)}
              disabled={approvingRequest === session.id || rejectingRequest === session.id}
            >
              {rejectingRequest === session.id ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري الرفض...
                </>
              ) : (
                'رفض'
              )}
            </button>
          </div>
        )}

        {/* Status message for accepted/refused and Edit Time button */}
        {isProfessor && session.status === 'مؤكد' && (
          <>
            <div className="text-green-700 font-bold text-center mt-2">تم قبول الطلب</div>
            {/* Show edit button always for professors */}
            <button
              className="w-full mt-2 px-4 py-2 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => onEditTime && onEditTime(session)}
              disabled={editingTimeRequest === session.id}
            >
              {editingTimeRequest === session.id ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري التحديث...
                </>
              ) : (
                'تعديل التوقيت'
              )}
            </button>
            
            {/* Payment Status for Professors */}
            <div className="mt-2 text-center">
              {session.payment_status === 'paid' ? (
                <div className="text-green-600 font-semibold text-sm">
                  ✅ تم الدفع من الطالب ({session.points_used} نقطة)
                </div>
              ) : (
                <div className="text-orange-600 font-semibold text-sm">
                  ⏳ في انتظار دفع الطالب ({session.price_per_session} نقطة)
                </div>
              )}
            </div>
          </>
        )}
        {!isProfessor && session.status === 'مؤكد' && (
          <>
            <div className="text-green-700 font-bold text-center mt-2">تم قبول الطلب</div>
          </>
        )}
        {/* Payment Button for Students - Show only for user's own sessions and when not paid */}
        {!isProfessor && isMySession && session.payment_status !== 'paid' && (
              <div className="text-center mt-2">
                <div className="text-orange-600 font-semibold text-sm mb-2">
              💳 سعر الحصة: {session.price_per_session} نقطة
                </div>
                <button
              className={`w-full px-4 py-2 rounded-lg font-bold transition ${
                session.status === 'مؤكد' && !purchaseLoading?.[session.id]
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}
              disabled={session.status !== 'مؤكد' || purchaseLoading?.[session.id]}
              onClick={() => session.status === 'مؤكد' && !purchaseLoading?.[session.id] && onPurchase && onPurchase(session)}
                >
              {purchaseLoading?.[session.id] ? 'جاري الشراء...' : 'شراء هذه الحصة الخاصة'}
                </button>
            {session.status === 'في الانتظار' && (
              <div className="text-xs text-gray-500 mt-1">
                ⏳ سيتم تفعيل الدفع بعد قبول الأستاذ للطلب وتحديد التوقيت
              </div>
            )}
          </div>
        )}
        
        {/* Payment Success Message - Show only after payment */}
        {!isProfessor && isMySession && session.payment_status === 'paid' && (
          <div className="text-center mt-2">
            <div className="text-green-600 font-semibold text-sm">
              ✅ تم الدفع بنجاح ({session.points_used} نقطة)
            </div>
          </div>
        )}
        {isProfessor && session.status === 'مرفوض' && (
          <div className="text-red-700 font-bold text-center mt-2">تم رفض الطلب</div>
        )}
        {!isProfessor && session.status === 'مرفوض' && (
          <div className="text-center mt-2">
            <div className="text-red-700 font-bold">تم رفض الطلب</div>
            {session.rejection_reason && (
              <div className="text-red-600 text-sm mt-1 p-2 bg-red-50 rounded-lg border border-red-200">
                <strong>سبب الرفض:</strong> {session.rejection_reason}
              </div>
            )}
          </div>
        )}

        {/* Join/Start Live Button & Countdown - Show for all sessions but enable only when confirmed and time selected */}
        {(isProfessor || isMySession) && (
          <div className="mt-4 flex flex-col items-center gap-2">
            
            {/* Show button for all sessions but disable if not confirmed, no time selected, or not paid */}
                <button
              className={`w-full px-4 py-2 rounded-lg font-bold transition ${
                session.status === 'مؤكد' && session.time && session.time !== 'سيحدد الأستاذ التوقيت' && canJoin && (isProfessor || session.payment_status === 'paid')
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={session.status !== 'مؤكد' || !session.time || session.time === 'سيحدد الأستاذ التوقيت' || !canJoin || (!isProfessor && session.payment_status !== 'paid')}
              onClick={() => session.status === 'مؤكد' && session.time && session.time !== 'سيحدد الأستاذ التوقيت' && canJoin && (isProfessor || session.payment_status === 'paid') && onJoinLive && onJoinLive(session)}
                >
                  {isProfessor ? 'بدء البث المباشر' : 'دخول البث المباشر'}
                </button>
            
            {/* Show countdown only when confirmed and time is selected */}
            {session.status === 'مؤكد' && session.time && session.time !== 'سيحدد الأستاذ التوقيت' && !canJoin && (
              <div className="text-sm text-blue-600 font-semibold">الوقت المتبقي: {timeLeft}</div>
            )}
            

            
            {session.status === 'مؤكد' && (!session.time || session.time === 'سيحدد الأستاذ التوقيت') && (
              <div className="text-sm text-gray-500 font-semibold">لم يتم تحديد توقيت الحصة بعد</div>
            )}
          </div>
        )}





        {/* Show status for rejected requests - only for user's own sessions */}
        {session.status === 'مرفوض' && !isProfessor && isMySession && (
          <div className="text-red-700 font-bold text-center mt-2">تم رفض الطلب</div>
        )}

        {/* Action Button */}
        <button
          onClick={() => onDetailsClick(session)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 px-6 rounded-xl font-bold text-sm sm:text-base hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group-hover:scale-105"
        >
          <FaEye className="text-sm sm:text-base" />
          {isProfessor ? 'عرض التفاصيل' : 'عرض التفاصيل'}
        </button>
      </div>
    </div>
  );
};

export default PrivateClassCard; 
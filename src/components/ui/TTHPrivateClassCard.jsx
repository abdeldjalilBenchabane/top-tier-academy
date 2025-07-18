import React from 'react';
import { FaCalendarAlt, FaClock, FaBookOpen, FaEye, FaUserTie, FaChalkboardTeacher, FaFileAlt, FaUser } from 'react-icons/fa';
import { formatDate } from '../../data/index';
import { useAuth } from '../../contexts/AuthContext';

const PrivateClassCard = ({ session, onDetailsClick, onAccept, onRefuse, actionLoading, showActions, studentName }) => {
  const { isProfessor } = useAuth();

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
          <p className="text-sm sm:text-base opacity-90">{session.subject} - {session.grade}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Student Name (for professor view) */}
        {isProfessor && studentName && (
          <div className="text-sm text-gray-700 font-semibold mb-2">الطالب: {studentName}</div>
        )}
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
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition"
              onClick={() => onAccept && onAccept(session.id)}
              disabled={actionLoading}
            >
              قبول
            </button>
            <button
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition"
              onClick={() => onRefuse && onRefuse(session.id)}
              disabled={actionLoading}
            >
              رفض
            </button>
          </div>
        )}

        {/* Status message for accepted/refused */}
        {isProfessor && session.status === 'مؤكد' && (
          <div className="text-green-700 font-bold text-center mt-2">تم قبول الطلب</div>
        )}
        {isProfessor && session.status === 'مرفوض' && (
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
import React, { useState } from 'react';
import { FaTimes, FaChalkboardTeacher, FaBookOpen, FaCalendarAlt, FaClock, FaFileAlt, FaPaperPlane } from 'react-icons/fa';

const PrivateClassModal = ({ isOpen, onClose, session }) => {
  const [formData, setFormData] = useState({
    title: '',
    sessionsCount: '',
    requestText: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Request submitted:', formData);
    // Here you would typically send the data to your backend
    alert('تم إرسال طلبك بنجاح!');
    setFormData({ title: '', sessionsCount: '', requestText: '' });
    onClose();
  };

  if (!isOpen) return null;

  // If session exists, show details modal
  if (session && Object.keys(session).length > 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">تفاصيل الطلب</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* استاذ */}
            <div className="flex items-start space-x-4 space-x-reverse">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaChalkboardTeacher className="text-blue-600 text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">استاذ</h3>
                <p className="text-gray-700 text-lg">· {session.teacher}</p>
              </div>
            </div>

            {/* المادة */}
            <div className="flex items-start space-x-4 space-x-reverse">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FaBookOpen className="text-green-600 text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">المادة</h3>
                <p className="text-gray-700 text-lg">· {session.subject} {session.grade}</p>
              </div>
            </div>

            {/* تاريخ الطلب */}
            <div className="flex items-start space-x-4 space-x-reverse">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FaCalendarAlt className="text-purple-600 text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">تاريخ الطلب</h3>
                <p className="text-gray-700 text-lg">· {session.date}</p>
              </div>
            </div>

            {/* تاريخ الحصص */}
            <div className="flex items-start space-x-4 space-x-reverse">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <FaClock className="text-orange-600 text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">تاريخ الحصص</h3>
                <p className="text-gray-700 text-lg">· {session.time}</p>
              </div>
            </div>

            {/* عدد الحصص المطلوبة */}
            <div className="flex items-start space-x-4 space-x-reverse">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FaClock className="text-red-600 text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">عدد الحصص المطلوبة</h3>
                <p className="text-gray-700 text-lg">· {session.sessions}</p>
              </div>
            </div>

            {/* نص الطلب */}
            <div className="flex items-start space-x-4 space-x-reverse">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <FaFileAlt className="text-indigo-600 text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">نص الطلب</h3>
                <p className="text-gray-700 text-lg">· {session.description}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-lg font-semibold text-gray-900">الحالة:</span>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  session.status === 'مؤكد' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {session.status}
                </span>
              </div>
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no session, show request form modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">طلب حصة خاصة</h2>
          <button
            onClick={onClose}
            className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <FaTimes className="text-gray-600 text-sm sm:text-base" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Title */}
          <div>
            <label className="block text-gray-700 font-bold mb-2 text-right text-sm sm:text-base">
              العنوان
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-2 sm:py-3 px-3 sm:px-4 text-right focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-300 text-sm sm:text-base"
              placeholder="أدخل عنوان الطلب"
              required
            />
          </div>

          {/* Sessions Count */}
          <div>
            <label className="block text-gray-700 font-bold mb-2 text-right text-sm sm:text-base">
              كم عدد الحصص المطلوبة؟
            </label>
            <input
              type="number"
              name="sessionsCount"
              value={formData.sessionsCount}
              onChange={handleInputChange}
              min="1"
              max="20"
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-2 sm:py-3 px-3 sm:px-4 text-right focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-300 text-sm sm:text-base"
              placeholder="عدد الحصص"
              required
            />
          </div>

          {/* Request Text */}
          <div>
            <label className="block text-gray-700 font-bold mb-2 text-right text-sm sm:text-base">
              نص الطلب
            </label>
            <textarea
              name="requestText"
              value={formData.requestText}
              onChange={handleInputChange}
              rows="3"
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-2 sm:py-3 px-3 sm:px-4 text-right focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-300 resize-none text-sm sm:text-base"
              placeholder="أكتب هنا طلبك"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <FaPaperPlane className="text-sm sm:text-base" />
            ارسال
          </button>
        </form>
      </div>
    </div>
  );
};

export default PrivateClassModal; 
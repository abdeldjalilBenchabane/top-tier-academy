import React from 'react';
import { FaTimes, FaCalendarAlt, FaUserTie, FaBook, FaClock, FaInfoCircle, FaCheckCircle, FaSpinner, FaGraduationCap, FaLayerGroup } from 'react-icons/fa';

const PrivateClassModal = ({ 
  isOpen, 
  onClose, 
  session, 
  isRequestForm = false, 
  requestForm = {}, 
  onRequestFormChange = () => {}, 
  onSubmitRequest = () => {}, 
  selectedTeacher = '', 
  selectedDate = '', 
  selectedLevel = '', 
  selectedYear = '', 
  selectedSpeciality = '',
  selectedMaterial = '',
  levels = [],
  years = [],
  specialities = [],
  materials = [],
  pricingSettings = null
}) => {
  if (!isOpen) return null;

  // Helper function to get names from IDs
  const getLevelName = (levelId) => {
    const level = levels.find(l => l.id === parseInt(levelId));
    return level ? level.name : '';
  };

  const getYearName = (yearId) => {
    const year = years.find(y => y.id === parseInt(yearId));
    return year ? year.name : '';
  };

  const getSpecialityName = (specialityId) => {
    const speciality = specialities.find(s => s.id === parseInt(specialityId));
    return speciality ? speciality.name : '';
  };

  const getMaterialName = (materialId) => {
    const material = materials.find(m => m.id === parseInt(materialId));
    return material ? material.name : '';
  };

  if (isRequestForm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <FaBook className="text-white text-lg" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">طلب حصة خاصة</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <FaTimes className="text-gray-600" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Selected Info Display */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-3">المعلومات المحددة</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FaUserTie className="text-blue-600" />
                    <span className="text-gray-700">الأستاذ: <span className="font-semibold">{selectedTeacher || 'لم يتم الاختيار'}</span></span>
              </div>
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-600" />
                    <span className="text-gray-700">التاريخ: <span className="font-semibold">{selectedDate || 'لم يتم الاختيار'}</span></span>
              </div>
                  <div className="flex items-center gap-2">
                    <FaGraduationCap className="text-blue-600" />
                    <span className="text-gray-700">المرحلة: <span className="font-semibold">{getLevelName(selectedLevel) || 'لم يتم الاختيار'}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaBook className="text-blue-600" />
                    <span className="text-gray-700">السنة: <span className="font-semibold">{getYearName(selectedYear) || 'لم يتم الاختيار'}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaLayerGroup className="text-blue-600" />
                    <span className="text-gray-700">التخصص: <span className="font-semibold">{getSpecialityName(selectedSpeciality) || 'لم يتم الاختيار'}</span></span>
            </div>
                  <div className="flex items-center gap-2">
                    <FaBook className="text-blue-600" />
                    <span className="text-gray-700">المادة: <span className="font-semibold">{getMaterialName(selectedMaterial) || 'لم يتم الاختيار'}</span></span>
              </div>
            </div>
              </div>

              {/* Pricing Information */}
              {pricingSettings && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-3">معلومات التسعير والمواعيد</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-green-600" />
                      <span className="text-gray-700">سعر الحصة: <span className="font-semibold text-green-700">{pricingSettings.price_per_session?.toLocaleString()} دينار جزائري</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaClock className="text-green-600" />
                      <span className="text-gray-700">مدة الحصة: <span className="font-semibold text-green-700">{pricingSettings.session_duration} دقيقة</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaClock className="text-green-600" />
                      <span className="text-gray-700">المواعيد المتاحة: <span className="font-semibold text-green-700">{pricingSettings.available_start_time?.substring(0, 5)} - {pricingSettings.available_end_time?.substring(0, 5)}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaInfoCircle className="text-green-600" />
                      <span className="text-gray-700">سيختار الأستاذ الوقت المحدد</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Request Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-right">أدخل عنوان الطلب</label>
                  <input
                    type="text"
                    value={requestForm.title}
                    onChange={(e) => onRequestFormChange('title', e.target.value)}
                    placeholder="مثال: دعم في الجبر والمعادلات"
                    className="w-full bg-white border-2 border-gray-200 rounded-xl py-3 px-4 text-right focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
                    dir="rtl"
                  />
            </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-right">كم عدد الحصص المطلوبة؟</label>
                  <input
                    type="number"
                    value={requestForm.sessionsCount}
                    onChange={(e) => onRequestFormChange('sessionsCount', e.target.value)}
                    placeholder="مثال: 3"
                    min="1"
                    max="10"
                    className="w-full bg-white border-2 border-gray-200 rounded-xl py-3 px-4 text-right focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
                    dir="rtl"
                  />
            </div>

                {/* Dynamic Date Inputs */}
                {requestForm.sessionsCount && parseInt(requestForm.sessionsCount) > 0 && (
                  <div className="space-y-3">
                    <label className="block text-gray-700 font-semibold mb-2 text-right">مواعيد الحصص المطلوبة</label>
                    {Array.from({ length: parseInt(requestForm.sessionsCount) }, (_, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <label className="text-sm text-gray-600 font-medium whitespace-nowrap">
                          الحصة {index + 1}:
                        </label>
                        <input
                          type="date"
                          value={requestForm.dates?.[index] || ''}
                          onChange={(e) => {
                            const newDates = [...(requestForm.dates || [])];
                            newDates[index] = e.target.value;
                            onRequestFormChange('dates', newDates);
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          className="flex-1 bg-white border-2 border-gray-200 rounded-xl py-2 px-3 text-right focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
                          dir="rtl"
                        />
                      </div>
                    ))}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                      <p className="text-sm text-blue-800 text-right">
                        <strong>ملاحظة:</strong> سيختار الأستاذ التوقيت المناسب لكل يوم وسيرد عليك في أقرب وقت ممكن
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-right">نص الطلب</label>
                  <textarea
                    value={requestForm.description}
                    onChange={(e) => onRequestFormChange('description', e.target.value)}
                    placeholder="اشرح تفاصيل ما تحتاجه من الدعم..."
                    rows="4"
                    className="w-full bg-white border-2 border-gray-200 rounded-xl py-3 px-4 text-right focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all resize-none"
                    dir="rtl"
                  />
              </div>
              </div>
              </div>
            </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <button
                onClick={onClose}
              className="px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors"
              >
              إلغاء
            </button>
            <button
              onClick={onSubmitRequest}
              className="px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold transition-all hover:shadow-lg"
            >
              إرسال الطلب
              </button>
          </div>
        </div>
      </div>
    );
  }

  // Original session details modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <FaBook className="text-white text-lg" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">تفاصيل الحصة الخاصة</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <FaTimes className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {session ? (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  session.status === 'مؤكد' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {session.status === 'مؤكد' ? <FaCheckCircle className="inline mr-1" /> : <FaSpinner className="inline mr-1" />}
                  {session.status}
                </div>
              </div>

              {/* Session Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <FaUserTie className="text-blue-600 text-xl" />
                  <div>
                    <p className="text-sm text-gray-600">الأستاذ</p>
                    <p className="font-semibold text-gray-800">{session.teacher}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <FaBook className="text-purple-600 text-xl" />
                  <div>
                    <p className="text-sm text-gray-600">المادة</p>
                    <p className="font-semibold text-gray-800">{session.subject}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <FaCalendarAlt className="text-green-600 text-xl" />
          <div>
                    <p className="text-sm text-gray-600">التاريخ</p>
                    <p className="font-semibold text-gray-800">{session.date}</p>
                  </div>
          </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <FaClock className="text-orange-600 text-xl" />
                  <div>
                    <p className="text-sm text-gray-600">الوقت</p>
                    <p className="font-semibold text-gray-800">{session.time}</p>
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              {session.price_per_session && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-3">معلومات التسعير</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-green-600" />
                      <span className="text-gray-700">سعر الحصة: <span className="font-semibold text-green-700">{session.price_per_session.toLocaleString()} دينار جزائري</span></span>
                    </div>
                    {session.session_duration && (
                      <div className="flex items-center gap-2">
                        <FaClock className="text-green-600" />
                        <span className="text-gray-700">مدة الحصة: <span className="font-semibold text-green-700">{session.session_duration} دقيقة</span></span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Details */}
              <div className="space-y-4">
          <div>
                  <h3 className="font-semibold text-gray-800 mb-2">المرحلة الدراسية</h3>
                  <p className="text-gray-600">{session.grade}</p>
          </div>

          <div>
                  <h3 className="font-semibold text-gray-800 mb-2">عدد الحصص</h3>
                  <p className="text-gray-600">{session.sessions}</p>
          </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">وصف الطلب</h3>
                  <p className="text-gray-600">{session.description}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaInfoCircle className="text-gray-400 text-2xl" />
              </div>
              <p className="text-gray-500">لا توجد تفاصيل متاحة</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all hover:shadow-lg"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivateClassModal; 
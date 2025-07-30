import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PrivateClassCard from '../../components/ui/TTHPrivateClassCard';
import { useNavigate } from 'react-router-dom';

const ProfessorPrivateClasses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState('16:00 - 17:30');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  // New: store the session being edited (for edit time)
  const [editMode, setEditMode] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [pricingSettings, setPricingSettings] = useState(null);

  useEffect(() => {
    fetchRequests();
    fetchPricingSettings();
    // eslint-disable-next-line
  }, [user]);

  const fetchPricingSettings = async () => {
    try {
      const response = await fetch('/api/private-class-settings');
      if (response.ok) {
        const data = await response.json();
        setPricingSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching pricing settings:', error);
    }
  };

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/private-class-requests/teacher/${encodeURIComponent(user.name)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const transformed = data.requests.map(request => {
          return {
            id: request.id,
            title: request.title,
            sessions: `${request.sessions_count} حصص`,
            description: request.description,
            teacher: request.teacher_name,
            date: request.date,
            subject: request.subject,
            grade: request.grade,
            status: request.status,
            time: request.time || '',
            createdAt: request.created_at,
            studentId: request.student_id,
            studentName: request.student_name,
            hierarchy_path: request.hierarchy_path,
            scheduled_at: request.scheduled_at,
            agora_channel: request.agora_channel,
            price_per_session: request.price_per_session,
            session_duration: request.session_duration,
            payment_status: request.payment_status,
            payment_date: request.payment_date,
            points_used: request.points_used
          };
        });
        setRequests(transformed);
      }
    } catch (error) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (requestId: number) => {
    setSelectedRequestId(requestId);
    setShowTimeModal(true);
  };

  const handleEditTime = (session) => {
    setEditMode(true);
    setEditingSession(session);
    setSelectedRequestId(session.id);
    setSelectedTime(session.time || '16:00 - 17:30');
    setShowTimeModal(true);
  };

  const handleConfirmAccept = async () => {
    if (!selectedRequestId) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/private-class-requests/${selectedRequestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'مؤكد', time: selectedTime })
      });
      if (response.ok) {
        setShowTimeModal(false);
        setSelectedRequestId(null);
        fetchRequests();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmTime = async () => {
    if (!selectedRequestId) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/private-class-requests/${selectedRequestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editMode ? { time: selectedTime } : { status: 'مؤكد', time: selectedTime })
      });
      if (response.ok) {
        setShowTimeModal(false);
        setSelectedRequestId(null);
        setEditMode(false);
        setEditingSession(null);
        fetchRequests();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefuse = (requestId: number) => {
    setSelectedRequestId(requestId);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRequestId) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/private-class-requests/${selectedRequestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          status: 'مرفوض',
          rejection_reason: rejectionReason || 'تم رفض الطلب من قبل المدرس'
        })
      });
      if (response.ok) {
        setShowRejectionModal(false);
        setRejectionReason('');
        fetchRequests();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinLive = (session) => {
    const channel = `private_class_${session.id}`;
    navigate(`/streaming/${channel}`);
  };

  const handlePurchase = (session) => {
    // This function will be handled by the student's component
    // For professors, this is just a placeholder
    console.log('Purchase requested for session:', session.id);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">طلبات الحصص الخاصة الموجهة لي</h1>
      {loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-gray-500">جاري تحميل الطلبات...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد طلبات موجهة لك حالياً</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {requests.filter(r => r.status !== 'مرفوض').map((request, index) => (
            <div key={request.id} className="animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
              <PrivateClassCard
                session={request}
                onDetailsClick={() => {}}
                onAccept={handleAccept}
                onRefuse={handleRefuse}
                onEditTime={handleEditTime}
                onJoinLive={handleJoinLive}
                onPurchase={handlePurchase}
                actionLoading={actionLoading}
                showActions={true}
                studentName={request.studentName}
              />
            </div>
          ))}
        </div>
      )}

      {/* Time selection modal */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-blue-700">حدد توقيت الحصة</h2>
            
            {/* Pricing Information */}
            {pricingSettings && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-4 border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">معلومات الحصة</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>• سعر الحصة: <span className="font-semibold text-green-700">{pricingSettings.price_per_session?.toLocaleString()} دينار جزائري</span></p>
                  <p>• مدة الحصة: <span className="font-semibold text-green-700">{pricingSettings.session_duration} دقيقة</span></p>
                  <p>• المواعيد المتاحة: <span className="font-semibold text-green-700">{pricingSettings.available_start_time?.substring(0, 5)} - {pricingSettings.available_end_time?.substring(0, 5)}</span></p>
                </div>
              </div>
            )}
            
            <label className="block mb-2 text-gray-700">اختر التوقيت المناسب:</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
              value={selectedTime}
              onChange={e => setSelectedTime(e.target.value)}
            >
              {(() => {
                const options = [];
                if (pricingSettings) {
                  const startTime = pricingSettings.available_start_time;
                  const endTime = pricingSettings.available_end_time;
                  const duration = pricingSettings.session_duration;
                  
                  const startHour = parseInt(startTime.split(':')[0]);
                  const startMin = parseInt(startTime.split(':')[1]);
                  const endHour = parseInt(endTime.split(':')[0]);
                  const endMin = parseInt(endTime.split(':')[1]);
                  
                  let currentHour = startHour;
                  let currentMin = startMin;
                  
                  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
                    const startTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
                    
                    // Calculate end time based on duration
                    const endTimeDate = new Date();
                    endTimeDate.setHours(currentHour, currentMin + duration, 0);
                    const endHourCalc = endTimeDate.getHours();
                    const endMinCalc = endTimeDate.getMinutes();
                    const endTimeStr = `${endHourCalc.toString().padStart(2, '0')}:${endMinCalc.toString().padStart(2, '0')}`;
                    
                    const label = `${startTimeStr} - ${endTimeStr}`;
                    options.push(
                      <option key={label} value={label}>{label}</option>
                    );
                    
                    // Move to next 30-minute slot
                    currentMin += 30;
                    if (currentMin >= 60) {
                      currentHour += 1;
                      currentMin = 0;
                    }
                  }
                } else {
                  // Fallback to original 48 slots if no settings
                  Array.from({ length: 48 }).map((_, i) => {
                const startHour = Math.floor(i / 2);
                const startMin = i % 2 === 0 ? '00' : '30';
                const endHour = Math.floor((i + 1) / 2) % 24;
                const endMin = (i + 1) % 2 === 0 ? '00' : '30';
                const pad = n => n.toString().padStart(2, '0');
                const label = `${pad(startHour)}:${startMin} - ${pad(endHour)}:${endMin}`;
                    options.push(
                  <option key={label} value={label}>{label}</option>
                );
                  });
                }
                return options;
              })()}
            </select>
            
            <div className="text-sm text-gray-600 mb-4">
              <p>• سيتم إعلام الطالب بالتوقيت المحدد</p>
              <p>• مدة الحصة: {pricingSettings?.session_duration || 60} دقيقة</p>
            </div>
            
            <div className="flex gap-4 justify-end">
              <button
                className="px-4 py-2 bg-gray-300 rounded-lg font-bold"
                onClick={() => { setShowTimeModal(false); setEditMode(false); setEditingSession(null); }}
                disabled={actionLoading}
              >
                إلغاء
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition"
                onClick={handleConfirmTime}
                disabled={actionLoading}
              >
                {editMode ? 'تحديث التوقيت' : 'تأكيد القبول'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection reason modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-red-700">سبب رفض الطلب</h2>
            
            <div className="mb-4">
              <label className="block mb-2 text-gray-700">أدخل سبب الرفض (اختياري):</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-2 h-24 resize-none"
                placeholder="اكتب سبب رفض الطلب هنا..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              <p>• إذا لم تكتب سبباً، سيتم استخدام السبب الافتراضي</p>
              <p>• سيتم إعلام الطالب بذلك</p>
            </div>
            
            <div className="flex gap-4 justify-end">
              <button
                className="px-4 py-2 bg-gray-300 rounded-lg font-bold"
                onClick={() => { setShowRejectionModal(false); setRejectionReason(''); }}
                disabled={actionLoading}
              >
                إلغاء
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition"
                onClick={handleConfirmReject}
                disabled={actionLoading}
              >
                رفض الطلب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorPrivateClasses; 
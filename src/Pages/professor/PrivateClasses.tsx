import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PrivateClassCard from '../../components/ui/TTHPrivateClassCard';

const ProfessorPrivateClasses = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState('16:00 - 17:30');
  const [showTimeModal, setShowTimeModal] = useState(false);

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line
  }, [user]);

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
        const transformed = data.requests.map(request => ({
          id: request.id,
          title: request.title,
          sessions: `${request.sessions_count} حصص`,
          description: request.description,
          teacher: request.teacher_name,
          date: request.date,
          subject: request.subject,
          grade: request.grade,
          status: request.status,
          time: request.time,
          createdAt: request.created_at,
          studentId: request.student_id,
          studentName: request.student_name
        }));
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

  const handleRefuse = async (requestId: number) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/private-class-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'مرفوض' })
      });
      if (response.ok) {
        fetchRequests();
      }
    } finally {
      setActionLoading(false);
    }
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
            <label className="block mb-2 text-gray-700">اختر التوقيت المناسب:</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
              value={selectedTime}
              onChange={e => setSelectedTime(e.target.value)}
            >
              <option value="08:00 - 09:30">08:00 - 09:30</option>
              <option value="10:00 - 11:30">10:00 - 11:30</option>
              <option value="12:00 - 13:30">12:00 - 13:30</option>
              <option value="14:00 - 15:30">14:00 - 15:30</option>
              <option value="16:00 - 17:30">16:00 - 17:30</option>
              <option value="18:00 - 19:30">18:00 - 19:30</option>
            </select>
            <div className="flex gap-4 justify-end">
              <button
                className="px-4 py-2 bg-gray-300 rounded-lg font-bold"
                onClick={() => setShowTimeModal(false)}
                disabled={actionLoading}
              >
                إلغاء
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition"
                onClick={handleConfirmAccept}
                disabled={actionLoading}
              >
                تأكيد القبول
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorPrivateClasses; 
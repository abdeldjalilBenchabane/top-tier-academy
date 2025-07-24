import React, { useState, useEffect } from 'react';
import PrivateClassCard from './ui/TTHPrivateClassCard';
import PrivateClassModal from './ui/TTHPrivateClassModal';
import { useAuth } from '../contexts/AuthContext';

const PrivateClassesSection = () => {
  const { user } = useAuth();
  const [myPendingRequests, setMyPendingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Fetch current user's pending requests
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;
      try {
        setRequestsLoading(true);
        const response = await fetch(`/api/private-class-requests/student/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const transformedRequests = data.requests
            .filter(request => request.status !== 'مرفوض')
            .map(request => ({
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
              payment_status: request.payment_status,
              payment_date: request.payment_date,
              points_used: request.points_used,
              price_per_session: request.price_per_session
            }));
          setMyPendingRequests(transformedRequests);
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setRequestsLoading(false);
      }
    };
    fetchRequests();
  }, [user]);

  const handleDetailsClick = (session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
  };

  const handlePurchase = async (session) => {
    setPurchaseLoading(true);
    try {
      const response = await fetch(`/api/private-class-requests/${session.id}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`تم شراء الحصة بنجاح! تم خصم ${data.pointsDeducted} نقطة من رصيدك.`);
        // Refresh the requests to show updated payment status
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`خطأ في الشراء: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error purchasing private class:', error);
      alert('حدث خطأ أثناء الشراء. يرجى المحاولة مرة أخرى.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800">طلباتك</h2>
      </div>

      {/* Requests Grid */}
      {requestsLoading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-gray-500">جاري تحميل الطلبات...</p>
        </div>
      ) : myPendingRequests.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {myPendingRequests.map((request, index) => (
            <div 
              key={request.id} 
              className="animate-fadeIn"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <PrivateClassCard
                session={request}
                onDetailsClick={handleDetailsClick}
                onPurchase={handlePurchase}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد طلبات حالياً</h3>
          <p className="text-gray-500">قم بإنشاء طلب جديد للحصول على حصة خاصة</p>
          <a 
            href="/TTHPrivateClasses" 
            className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            طلب حصة خاصة
          </a>
        </div>
      )}

      {/* Session Details Modal */}
      <PrivateClassModal
        isOpen={isModalOpen}
        onClose={closeModal}
        session={selectedSession}
      />
    </div>
  );
};

export default PrivateClassesSection; 
import { useState, useEffect } from 'react';
import { privateClassesData, gradeOptions } from '../data/index';
import { useAuth } from '../contexts/AuthContext';

export const usePrivateClasses = () => {
  const { user, isProfessor } = useAuth();
  const [selectedGrade, setSelectedGrade] = useState(gradeOptions[0].label);
  const [selectedYear, setSelectedYear] = useState(gradeOptions[0].years[0]);
  const [selectedSubject, setSelectedSubject] = useState(gradeOptions[0].subjects[0]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Request form state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    title: '',
    sessionsCount: '',
    description: ''
  });
  const [myPendingRequests, setMyPendingRequests] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [allOrdersLoading, setAllOrdersLoading] = useState(false);

  // Fetch real teachers from database
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users/teachers', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableTeachers(data.teachers || []);
        } else {
          setAvailableTeachers([]);
        }
      } catch (error) {
        setAvailableTeachers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  // Fetch current user's pending requests
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user || isProfessor) return;
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
              agora_channel: request.agora_channel,
              scheduled_at: request.scheduled_at
            }));
          setMyPendingRequests(transformedRequests);
        }
      } catch (error) {
        //
      } finally {
        setRequestsLoading(false);
      }
    };
    fetchRequests();
  }, [user, isProfessor]);

  // Fetch all orders for the grid
  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        setAllOrdersLoading(true);
        const response = await fetch(`/api/private-class-requests`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const transformedOrders = data.requests.map(request => ({
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
            agora_channel: request.agora_channel,
            scheduled_at: request.scheduled_at
          }));
          setAllOrders(transformedOrders);
        }
      } catch (error) {
        //
      } finally {
        setAllOrdersLoading(false);
      }
    };
    fetchAllOrders();
  }, []);

  const handleGradeChange = (e) => {
    const newGrade = e.target.value;
    const gradeObj = gradeOptions.find(g => g.label === newGrade);
    setSelectedGrade(newGrade);
    setSelectedYear(gradeObj.years[0]);
    setSelectedSubject(gradeObj.subjects[0]);
  };

  const handleYearChange = (e) => setSelectedYear(e.target.value);
  const handleSubjectChange = (e) => setSelectedSubject(e.target.value);
  const handleDateChange = (e) => setSelectedDate(e.target.value);
  const handleTeacherChange = (e) => setSelectedTeacher(e.target.value);

  const handleSearch = () => {
    //
  };

  const handleRequestClick = () => {
    setIsRequestModalOpen(true);
  };

  const closeRequestModal = () => {
    setIsRequestModalOpen(false);
    setRequestForm({
      title: '',
      sessionsCount: '',
      description: ''
    });
  };

  const handleRequestFormChange = (field, value) => {
    setRequestForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.title || !requestForm.sessionsCount || !requestForm.description) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    if (!selectedTeacher || !selectedDate) {
      alert('يرجى اختيار الأستاذ والتاريخ');
      return;
    }
    try {
      const response = await fetch('/api/private-class-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          teacher_name: selectedTeacher,
          subject: selectedSubject,
          grade: `${selectedYear} ${selectedGrade}`,
          date: selectedDate,
          time: '16:00 - 17:30',
          sessions_count: parseInt(requestForm.sessionsCount),
          title: requestForm.title,
          description: requestForm.description
        })
      });
      if (response.ok) {
        const data = await response.json();
        // Add to both myPendingRequests and allOrders
        const newRequest = {
          id: data.request.id,
          title: data.request.title,
          sessions: `${data.request.sessions_count} حصص`,
          description: data.request.description,
          teacher: data.request.teacher_name,
          date: data.request.date,
          subject: data.request.subject,
          grade: data.request.grade,
          status: data.request.status,
          time: data.request.time,
          createdAt: data.request.created_at,
          studentId: data.request.student_id
        };
        setMyPendingRequests(prev => [newRequest, ...prev]);
        setAllOrders(prev => [newRequest, ...prev]);
        closeRequestModal();
        setSelectedTeacher('');
        setSelectedDate('');
        setSelectedSubject('');
        setSelectedGrade(gradeOptions[0].label);
        setSelectedYear(gradeOptions[0].years[0]);
        alert('تم إرسال طلبك بنجاح!');
      } else {
        const errorData = await response.json();
        alert(`خطأ في إرسال الطلب: ${errorData.error || 'حدث خطأ غير متوقع'}`);
      }
    } catch (error) {
      alert('حدث خطأ في إرسال الطلب');
    }
  };

  const handleDetailsClick = (sessionId) => {
    // Check if it's a pending request or existing session
    const pendingRequest = myPendingRequests.find(r => r.id === sessionId);
    if (pendingRequest) {
      setSelectedSession(pendingRequest);
    } else {
      const session = allOrders.find(s => s.id === sessionId) || privateClassesData.find(s => s.id === sessionId);
    setSelectedSession(session);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
  };

  // For the static grid, show allOrders + static data
  const filteredSessions = [...allOrders, ...privateClassesData];

  return {
    selectedGrade,
    selectedYear,
    selectedSubject,
    selectedDate,
    selectedTeacher,
    availableTeachers,
    filteredSessions,
    isModalOpen,
    selectedSession,
    isProfessor,
    loading,
    requestsLoading,
    allOrdersLoading,
    isRequestModalOpen,
    requestForm,
    myPendingRequests,
    handleGradeChange,
    handleYearChange,
    handleSubjectChange,
    handleDateChange,
    handleTeacherChange,
    handleSearch,
    handleRequestClick,
    closeRequestModal,
    handleRequestFormChange,
    handleSubmitRequest,
    handleDetailsClick,
    closeModal
  };
}; 
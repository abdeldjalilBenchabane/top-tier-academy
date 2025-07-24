import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const usePrivateClasses = () => {
  const { user, isProfessor } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSpeciality, setSelectedSpeciality] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Hierarchy data state
  const [levels, setLevels] = useState([]);
  const [years, setYears] = useState([]);
  const [specialities, setSpecialities] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  
  // Request form state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    title: '',
    sessionsCount: '1',
    description: '',
    dates: []
  });
  const [myPendingRequests, setMyPendingRequests] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [allOrdersLoading, setAllOrdersLoading] = useState(false);
  const [pricingSettings, setPricingSettings] = useState(null);

  // Fetch hierarchy data and pricing settings
  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        setHierarchyLoading(true);
        const response = await fetch('/api/public/hierarchy');
        if (response.ok) {
          const data = await response.json();
          setLevels(data);
        }
      } catch (error) {
        console.error('Error fetching hierarchy:', error);
      } finally {
        setHierarchyLoading(false);
      }
    };

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

    fetchHierarchy();
    fetchPricingSettings();
  }, []);

  // Fetch years when level changes
  useEffect(() => {
    if (selectedLevel) {
      const level = levels.find(l => l.id === parseInt(selectedLevel));
      if (level) {
        setYears(level.years || []);
        setSelectedYear('');
        setSelectedSpeciality('');
        setSelectedMaterial('');
      }
    } else {
      setYears([]);
      setSelectedYear('');
      setSelectedSpeciality('');
      setSelectedMaterial('');
    }
  }, [selectedLevel, levels]);

  // Fetch specialities when year changes
  useEffect(() => {
    if (selectedYear) {
      const year = years.find(y => y.id === parseInt(selectedYear));
      if (year) {
        setSpecialities(year.specialities || []);
        setSelectedSpeciality('');
        setSelectedMaterial('');
      }
    } else {
      setSpecialities([]);
      setSelectedSpeciality('');
      setSelectedMaterial('');
    }
  }, [selectedYear, years]);

  // Fetch materials when speciality changes
  useEffect(() => {
    if (selectedSpeciality) {
      const speciality = specialities.find(s => s.id === parseInt(selectedSpeciality));
      if (speciality) {
        setMaterials(speciality.materials || []);
        setSelectedMaterial('');
      }
    } else {
      setMaterials([]);
      setSelectedMaterial('');
    }
  }, [selectedSpeciality, specialities]);

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
              scheduled_at: request.scheduled_at,
              hierarchy_path: request.hierarchy_path,
              payment_status: request.payment_status,
              payment_date: request.payment_date,
              points_used: request.points_used,
              price_per_session: request.price_per_session
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
            scheduled_at: request.scheduled_at,
            hierarchy_path: request.hierarchy_path
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

  const handleLevelChange = (e) => {
    setSelectedLevel(e.target.value);
  };

  const handleYearChange = (e) => setSelectedYear(e.target.value);
  const handleSpecialityChange = (e) => setSelectedSpeciality(e.target.value);
  const handleMaterialChange = (e) => setSelectedMaterial(e.target.value);
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
      sessionsCount: '1',
      description: '',
      dates: []
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
    if (!selectedTeacher) {
      alert('يرجى اختيار الأستاذ');
      return;
    }
    
    // Validate dates
    const sessionsCount = parseInt(requestForm.sessionsCount);
    if (!requestForm.dates || requestForm.dates.length !== sessionsCount) {
      alert('يرجى تحديد مواعيد جميع الحصص المطلوبة');
      return;
    }
    
    // Check if all dates are selected
    for (let i = 0; i < sessionsCount; i++) {
      if (!requestForm.dates[i]) {
        alert(`يرجى تحديد موعد الحصة ${i + 1}`);
        return;
      }
    }
    
    // Get the selected material name for the subject
    const selectedMaterialObj = materials.find(m => m.id === parseInt(selectedMaterial));
    const subject = selectedMaterialObj ? selectedMaterialObj.name : '';
    
    // Get the selected level and year names
    const selectedLevelObj = levels.find(l => l.id === parseInt(selectedLevel));
    const selectedYearObj = years.find(y => y.id === parseInt(selectedYear));
    const grade = selectedLevelObj && selectedYearObj ? `${selectedYearObj.name} ${selectedLevelObj.name}` : '';
    
    try {
      // Create multiple requests for each date
      const requests = [];
      for (let i = 0; i < sessionsCount; i++) {
        const response = await fetch('/api/private-class-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            teacher_name: selectedTeacher,
            subject: subject,
            grade: grade,
            date: requestForm.dates[i],
            time: 'سيحدد الأستاذ التوقيت',
            sessions_count: 1,
            title: `${requestForm.title} - الحصة ${i + 1}`,
            description: requestForm.description,
            level_id: parseInt(selectedLevel),
            year_id: parseInt(selectedYear),
            speciality_id: parseInt(selectedSpeciality),
            material_id: parseInt(selectedMaterial)
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          requests.push(data.request);
        } else {
          const errorData = await response.json();
          throw new Error(`خطأ في إرسال طلب الحصة ${i + 1}: ${errorData.error || 'حدث خطأ غير متوقع'}`);
        }
      }
      
      // Add all new requests to the state
      const newRequests = requests.map((request, index) => ({
        id: request.id,
        title: request.title,
        sessions: '1 حصة',
        description: request.description,
        teacher: request.teacher_name,
        date: request.date,
        subject: request.subject,
        grade: request.grade,
        status: request.status,
        time: request.time,
        createdAt: request.created_at,
        studentId: request.student_id,
        hierarchy_path: request.hierarchy_path
      }));
      
      setMyPendingRequests(prev => [...newRequests, ...prev]);
      setAllOrders(prev => [...newRequests, ...prev]);
      closeRequestModal();
      setSelectedTeacher('');
      setSelectedLevel('');
      setSelectedYear('');
      setSelectedSpeciality('');
      setSelectedMaterial('');
      alert(`تم إرسال ${sessionsCount} طلب بنجاح!`);
    } catch (error) {
      alert(error.message || 'حدث خطأ في إرسال الطلبات');
    }
  };

  const handleDetailsClick = (sessionId) => {
    // Check if it's a pending request or existing session
    const pendingRequest = myPendingRequests.find(r => r.id === sessionId);
    if (pendingRequest) {
      setSelectedSession(pendingRequest);
    } else {
      const session = allOrders.find(s => s.id === sessionId);
      setSelectedSession(session);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
  };

  // Use only dynamic data from database
  const filteredSessions = allOrders;

  return {
    selectedLevel,
    selectedYear,
    selectedSpeciality,
    selectedMaterial,
    selectedTeacher,
    availableTeachers,
    filteredSessions,
    isModalOpen,
    selectedSession,
    isProfessor,
    loading,
    hierarchyLoading,
    requestsLoading,
    allOrdersLoading,
    isRequestModalOpen,
    requestForm,
    myPendingRequests,
    levels,
    years,
    specialities,
    materials,
    pricingSettings,
    handleLevelChange,
    handleYearChange,
    handleSpecialityChange,
    handleMaterialChange,
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
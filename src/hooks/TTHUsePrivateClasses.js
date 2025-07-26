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

  // Smart 3-path/4-path logic: Check year structure when year changes
  useEffect(() => {
    if (selectedYear) {
      checkYearStructure(selectedYear);
    } else {
      setSpecialities([]);
      setSelectedSpeciality('');
      setMaterials([]);
      setSelectedMaterial('');
    }
  }, [selectedYear]);

  // Fetch materials when speciality changes (4-path)
  useEffect(() => {
    if (selectedSpeciality) {
      fetchMaterialsForSpeciality(selectedSpeciality);
    } else {
      setMaterials([]);
      setSelectedMaterial('');
    }
  }, [selectedSpeciality, specialities]);

  // Helper function to check year structure (3-path vs 4-path)
  const checkYearStructure = async (yearId) => {
    try {
      setHierarchyLoading(true);
      
      // First, check if this year has specialities
      const specialitiesResponse = await fetch(`/api/public/years/${yearId}/specialities`);
      
      console.log('Specialities response status:', specialitiesResponse.status);
      
      if (specialitiesResponse.ok) {
        const specialitiesData = await specialitiesResponse.json();
        console.log('Specialities data:', specialitiesData);
        
        if (specialitiesData.length > 0) {
          // Year has specialities - 4-path structure
          console.log('Year has specialities:', specialitiesData);
          setSpecialities(specialitiesData);
          setSelectedSpeciality('');
          setSelectedMaterial('');
          setMaterials([]);
        } else {
          // Year has no specialities - check for materials directly
          console.log('Year has no specialities, checking for materials...');
          setSpecialities([]);
          setSelectedSpeciality('');
          await fetchMaterialsForYear(yearId);
        }
      } else {
        console.error('Failed to fetch specialities:', specialitiesResponse.status, specialitiesResponse.statusText);
        // Fallback to empty specialities
        setSpecialities([]);
        setSelectedSpeciality('');
        await fetchMaterialsForYear(yearId);
      }
    } catch (error) {
      console.error('Error checking year structure:', error);
      // Fallback to empty specialities
      setSpecialities([]);
      setSelectedSpeciality('');
      await fetchMaterialsForYear(yearId);
    } finally {
      setHierarchyLoading(false);
    }
  };

  // Helper function to fetch materials for a speciality (4-path)
  const fetchMaterialsForSpeciality = async (specialityId) => {
    try {
      setHierarchyLoading(true);
      
      const response = await fetch(`/api/public/specialities/${specialityId}/materials`);
      
      console.log('Materials for speciality response status:', response.status);
      
      if (response.ok) {
        const materialsData = await response.json();
        console.log('Materials for speciality data:', materialsData);
        setMaterials(materialsData);
        setSelectedMaterial('');
      } else {
        console.error('Failed to fetch materials for speciality:', response.status, response.statusText);
        setMaterials([]);
        setSelectedMaterial('');
      }
    } catch (error) {
      console.error('Error fetching materials for speciality:', error);
      setMaterials([]);
      setSelectedMaterial('');
    } finally {
      setHierarchyLoading(false);
    }
  };

  // Helper function to fetch materials for a year (3-path)
  const fetchMaterialsForYear = async (yearId) => {
    try {
      setHierarchyLoading(true);
      
      const response = await fetch(`/api/public/years/${yearId}/materials`);
      
      console.log('Materials for year response status:', response.status);
      
      if (response.ok) {
        const materialsData = await response.json();
        console.log('Materials for year data:', materialsData);
        setMaterials(materialsData);
        setSelectedMaterial('');
      } else {
        console.error('Failed to fetch materials for year:', response.status, response.statusText);
        setMaterials([]);
        setSelectedMaterial('');
      }
    } catch (error) {
      console.error('Error fetching materials for year:', error);
      setMaterials([]);
      setSelectedMaterial('');
    } finally {
      setHierarchyLoading(false);
    }
  };

  // Fetch real teachers from database
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('No token found, skipping teachers fetch');
          setAvailableTeachers([]);
          return;
        }
        
        console.log('Fetching teachers with token:', token.substring(0, 20) + '...');
        
        const response = await fetch('/api/users/teachers', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Teachers response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          setAvailableTeachers(data.teachers || []);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Teachers fetch failed:', response.status, errorData);
          setAvailableTeachers([]);
        }
      } catch (error) {
        console.error('Teachers fetch error:', error);
        setAvailableTeachers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  // Function to refresh requests data
  const refreshRequests = async () => {
    if (!user || isProfessor) return;
    try {
      setRequestsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, skipping student requests fetch');
        setMyPendingRequests([]);
        return;
      }
      
      console.log('Refreshing student requests with token:', token.substring(0, 20) + '...');
      
      const response = await fetch(`/api/private-class-requests/student/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Student requests refresh response status:', response.status);
      
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
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Student requests refresh failed:', response.status, errorData);
        setMyPendingRequests([]);
      }
    } catch (error) {
      console.error('Student requests refresh error:', error);
      setMyPendingRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Fetch current user's pending requests
  useEffect(() => {
    refreshRequests();
  }, [user, isProfessor]);

  // Function to refresh all orders data
  const refreshAllOrders = async () => {
    try {
      setAllOrdersLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, skipping all orders fetch');
        setAllOrders([]);
        return;
      }
      
      console.log('Refreshing all orders with token:', token.substring(0, 20) + '...');
      
      const response = await fetch(`/api/private-class-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('All orders refresh response status:', response.status);
      
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
          hierarchy_path: request.hierarchy_path,
          payment_status: request.payment_status,
          payment_date: request.payment_date,
          points_used: request.points_used,
          price_per_session: request.price_per_session
        }));
        setAllOrders(transformedOrders);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('All orders refresh failed:', response.status, errorData);
        setAllOrders([]);
      }
    } catch (error) {
      console.error('All orders refresh error:', error);
      setAllOrders([]);
    } finally {
      setAllOrdersLoading(false);
    }
  };

  // Fetch all orders for the grid
  useEffect(() => {
    refreshAllOrders();
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
      
      // Refresh both datasets to get the latest state from the server
      await Promise.all([
        refreshRequests(),
        refreshAllOrders()
      ]);
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
    closeModal,
    refreshRequests,
    refreshAllOrders
  };
}; 
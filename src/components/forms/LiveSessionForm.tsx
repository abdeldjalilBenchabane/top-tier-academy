import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';
import { FaGraduationCap, FaBook, FaLayerGroup, FaVideo, FaClock, FaMoneyBill } from 'react-icons/fa';

import { parseSessionDate } from '@/lib/utils';
interface LiveSessionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  /** Pass an existing session to edit it. Omit to create a new one. */
  editingSession?: any;
  /** Admins edit sessions they do not own, which needs the admin route. */
  asAdmin?: boolean;
  /** Already-resolved path and option lists. When the caller supplies these the
   *  selects have their options on the very first render, which is what makes
   *  the saved values actually display. */
  initialPath?: any;
  initialOptions?: { years?: any[]; specialities?: any[]; materials?: any[] };
}

const LiveSessionForm = ({ onSuccess, onCancel, editingSession, asAdmin, initialPath, initialOptions }: LiveSessionFormProps) => {
  const isEditing = !!editingSession;
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState(500);
  const [telegramChannel, setTelegramChannel] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to format datetime for datetime-local input
  const formatDateTimeForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  // Hierarchy data state
  const [levels, setLevels] = useState([]);
  const [years, setYears] = useState<any[]>(initialOptions?.years || []);
  const [specialities, setSpecialities] = useState<any[]>(initialOptions?.specialities || []);
  const [materials, setMaterials] = useState<any[]>(initialOptions?.materials || []);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  
  // Selected values
  const [selectedLevel, setSelectedLevel] = useState(initialPath?.level_id ? String(initialPath.level_id) : '');
  const [selectedYear, setSelectedYear] = useState(initialPath?.year_id ? String(initialPath.year_id) : '');
  const [selectedSpeciality, setSelectedSpeciality] = useState(initialPath?.speciality_id ? String(initialPath.speciality_id) : '');
  const [selectedMaterial, setSelectedMaterial] = useState(initialPath?.material_id ? String(initialPath.material_id) : '');
  // While restoring an existing session's path, the cascade below must apply
  // the saved values instead of clearing each level as its parent changes.
  const prefillPath = useRef<any>(initialPath || null);
  // The session's current path, shown as text so it is visible even if the
  // cascading selects below fail to populate for any reason.
  const [currentPath, setCurrentPath] = useState<any>(null);
  // A session can sit under an education material or a language level.
  const [pathType, setPathType] = useState<'education' | 'language'>(initialPath?.root_type === 'language' ? 'language' : 'education');
  const [languages, setLanguages] = useState<any[]>([]);
  const [languageLevels, setLanguageLevels] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState(initialPath?.language_id ? String(initialPath.language_id) : '');
  const [selectedLanguageLevel, setSelectedLanguageLevel] = useState(initialPath?.language_level_id ? String(initialPath.language_level_id) : '');

  // Load the existing values when editing.
  useEffect(() => {
    if (!editingSession) return;
    setTitle(editingSession.title || '');
    setDescription(editingSession.description || '');
    setDuration(Number(editingSession.duration) || 60);
    setPrice(Number(editingSession.price) || 0);
    setTelegramChannel(editingSession.telegram_channel || '');
    const start = editingSession.start_time || editingSession.startTime;
    // Wall clock, not UTC: the stored digits are the time the professor
    // picked, and `new Date` would add the viewer's offset to them.
    if (start) {
      const parsed = parseSessionDate(start);
      if (parsed) setScheduledAt(formatDateTimeForInput(parsed));
    }
    if (editingSession.cover_image_url) setImagePreview(editingSession.cover_image_url);

    // Pre-select the whole educational path. Ask by session id rather than
    // material id: a session created inside a دورة stores no material of its
    // own and inherits the section's, which the endpoint resolves for us.
    if (!editingSession.id || initialPath) return;
    (async () => {
      try {
        const res = await fetch(`/api/live-sessions/${editingSession.id}/path`);
        if (!res.ok) return;
        const path = await res.json();
        setCurrentPath(path);

        if (path.root_type === 'language' && path.language_level_id) {
          setPathType('language');
          if (path.language_id) setSelectedLanguage(String(path.language_id));
          setSelectedLanguageLevel(String(path.language_level_id));
          return;
        }

        const materialId = path.material_id;
        if (!materialId) return;
        setPathType('education');
        // Seed the whole path, then set only the level. Each cascade step reads
        // the ref and fills in the next value once its options have loaded —
        // setting them all here would just be cleared by those same effects.
        prefillPath.current = { ...path, material_id: materialId };

        // Populate the option lists straight from the public endpoints and set
        // all four values. The cascade effects still run, but prefillPath makes
        // them preserve these instead of clearing them.
        try {
          // Years were the one list not preloaded, so the year Select often had
          // no options yet and Radix showed its placeholder instead of the
          // value — which then left speciality and material disabled.
          if (path.level_id) {
            const yRes = await fetch(`/api/public/levels/${path.level_id}/years`);
            if (yRes.ok) {
              const y = await yRes.json();
              setYears(Array.isArray(y) ? y : (y.years || []));
            }
          }
          if (path.year_id) {
            const spRes = await fetch(`/api/public/years/${path.year_id}/specialities`);
            if (spRes.ok) setSpecialities(await spRes.json());
          }
          if (path.speciality_id) {
            const mRes = await fetch(`/api/public/specialities/${path.speciality_id}/materials`);
            if (mRes.ok) setMaterials(await mRes.json());
          } else if (path.year_id) {
            const mRes = await fetch(`/api/public/years/${path.year_id}/materials`);
            if (mRes.ok) setMaterials(await mRes.json());
          }
        } catch (e) {
          console.error('Could not preload the path options:', e);
        }

        if (path.level_id) setSelectedLevel(String(path.level_id));
        if (path.year_id) setSelectedYear(String(path.year_id));
        if (path.speciality_id) setSelectedSpeciality(String(path.speciality_id));
        setSelectedMaterial(String(materialId));
      } catch (e) {
        console.error('Could not resolve the session path:', e);
      }
    })();
  }, [editingSession]);

  const authHeaders = () => {
    const t = localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/languages', { headers: authHeaders() });
        if (res.ok) {
          const d = await res.json();
          setLanguages(Array.isArray(d) ? d : (d.languages || []));
        }
      } catch (e) { console.error('Could not load languages:', e); }
    })();
  }, []);

  useEffect(() => {
    if (!selectedLanguage) { setLanguageLevels([]); return; }
    (async () => {
      try {
        const res = await fetch(`/api/languages/${selectedLanguage}/levels`, { headers: authHeaders() });
        if (res.ok) {
          const d = await res.json();
          setLanguageLevels(Array.isArray(d) ? d : (d.levels || []));
        }
      } catch (e) { console.error('Could not load language levels:', e); }
    })();
  }, [selectedLanguage]);

  // Default to today. Before 10:00 that means 10:00; later in the day it means
  // the next half-hour slot, so the suggestion is never already in the past.
  useEffect(() => {
    if (isEditing) return;
    if (!scheduledAt) {
      const start = new Date();
      if (start.getHours() < 10) {
        start.setHours(10, 0, 0, 0);
      } else {
        start.setTime(start.getTime() + 15 * 60 * 1000);
        // setMinutes(60) rolls cleanly into the next hour.
        start.setMinutes(start.getMinutes() < 30 ? 30 : 60, 0, 0);
      }
      setScheduledAt(formatDateTimeForInput(start));
    }
  }, [scheduledAt]);

  // Fetch hierarchy data
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
        toast.error('Failed to load educational levels');
      } finally {
        setHierarchyLoading(false);
      }
    };

    fetchHierarchy();
  }, []);

  // Fetch years when level changes
  useEffect(() => {
    if (selectedLevel) {
      const level = levels.find(l => l.id === parseInt(selectedLevel));
      if (level) {
        const restoring = prefillPath.current;
        // Never replace a preloaded list with an empty one while restoring.
        const nextYears = level.years || [];
        if (!restoring || nextYears.length > 0) {
          setYears(nextYears);
        }
        if (restoring?.year_id) {
          setSelectedYear(String(restoring.year_id));
        } else {
          setSelectedYear('');
          setSelectedSpeciality('');
          setSelectedMaterial('');
        }
      }
    } else {
      setYears([]);
      setSelectedYear('');
      setSelectedSpeciality('');
      setSelectedMaterial('');
    }
  }, [selectedLevel, levels]);

  // Check year for specialities and materials when year changes
  useEffect(() => {
    if (selectedYear) {
      checkYearStructure(selectedYear);
    } else {
      setSpecialities([]);
      setSelectedSpeciality('');
      setSelectedMaterial('');
      setMaterials([]);
    }
  }, [selectedYear]);

  // Function to check year structure and fetch appropriate data
  const checkYearStructure = async (yearId: string) => {
    try {
      setHierarchyLoading(true);
      
      // Get auth token
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // First, check if this year has specialities
      const specialitiesResponse = await fetch(`/api/structure/years/${yearId}/specialities`, {
        headers
      });
      
      if (specialitiesResponse.ok) {
        const specialitiesData = await specialitiesResponse.json();
        const restoring = prefillPath.current;
        if (specialitiesData.length > 0) {
          // Year has specialities - 4-path structure
          setSpecialities(specialitiesData);
          if (restoring?.speciality_id) {
            setSelectedSpeciality(String(restoring.speciality_id));
          } else {
            setSelectedSpeciality('');
            setSelectedMaterial('');
            setMaterials([]);
          }
        } else {
          // Year has no specialities - check for materials directly
          setSpecialities([]);
          setSelectedSpeciality('');
          await fetchMaterialsForYear(yearId);
        }
      } else {
        toast.error('Failed to load year structure');
      }
    } catch (error) {
      toast.error('Failed to load year structure');
    } finally {
      setHierarchyLoading(false);
    }
  };

  // Fetch materials when speciality changes (4-path)
  useEffect(() => {
    if (selectedSpeciality) {
      fetchMaterialsForSpeciality(selectedSpeciality);
    } else {
      setMaterials([]);
      setSelectedMaterial('');
    }
  }, [selectedSpeciality]);

  // Function to fetch materials for a specific speciality
  const fetchMaterialsForSpeciality = async (specialityId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const response = await fetch(`/api/structure/specialities/${specialityId}/materials`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
        const restoring = prefillPath.current;
        if (restoring?.material_id) {
          setSelectedMaterial(String(restoring.material_id));
        } else {
          setSelectedMaterial('');
        }
      } else {
        toast.error('Failed to load materials for this speciality');
      }
    } catch (error) {
      toast.error('Failed to load materials for this speciality');
    }
  };

  // Function to fetch materials directly for a year (3-path)
  const fetchMaterialsForYear = async (yearId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const response = await fetch(`/api/structure/years/${yearId}/materials`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
        const restoring = prefillPath.current;
        if (restoring?.material_id) {
          setSelectedMaterial(String(restoring.material_id));
        } else {
          setSelectedMaterial('');
        }
      } else {
        toast.error('Failed to load materials for this year');
      }
    } catch (error) {
      toast.error('Failed to load materials for this year');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create a live session');
      return;
    }

    // Validate required fields based on path type. It used to demand the
    // education fields whatever the path was, so a language session — which
    // has no level, year or material — could never be submitted.
    const hasSpecialities = specialities.length > 0;
    const isLanguage = pathType === 'language';
    const requiredFields = {
      title: !title,
      description: !description,
      scheduledAt: !scheduledAt,
      level: !isLanguage && !selectedLevel,
      year: !isLanguage && !selectedYear,
      speciality: !isLanguage && hasSpecialities && !selectedSpeciality,
      material: !isLanguage && !selectedMaterial,
      language: isLanguage && !selectedLanguage,
      languageLevel: isLanguage && !selectedLanguageLevel
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, isMissing]) => isMissing)
      .map(([field]) => field);

    if (missingFields.length > 0) {
      const fieldNames = {
        title: 'العنوان',
        description: 'الوصف',
        scheduledAt: 'التاريخ والوقت',
        level: 'المرحلة الدراسية',
        year: 'السنة الدراسية',
        speciality: 'التخصص',
        material: 'المادة الدراسية',
        language: 'اللغة',
        languageLevel: 'مستوى اللغة'
      };
      
      const missingFieldNames = missingFields.map(field => fieldNames[field as keyof typeof fieldNames]).join('، ');
      toast.error(`يرجى ملء الحقول المطلوبة: ${missingFieldNames}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      // Send exactly what the field holds: 'YYYY-MM-DDTHH:mm', the wall clock
      // the professor chose. The column is `timestamp without time zone` and
      // stores these digits verbatim. Converting to UTC first only worked
      // before because the value had already been shifted an hour on the way
      // in — two errors cancelling, and the field displaying the wrong time.
      formData.append('start_time', scheduledAt);
      formData.append('duration', duration.toString());
      formData.append('price', price.toString());
      // Only send the path when one is actually chosen. When editing, leaving
      // the selects untouched must keep the session's existing path.
      if (pathType === 'language') {
        if (selectedLanguageLevel) {
          formData.append('root_type', 'language');
          formData.append('language_id', selectedLanguage);
          formData.append('language_level_id', selectedLanguageLevel);
        }
      } else if (selectedMaterial) {
        formData.append('root_type', 'education');
        formData.append('material_id', selectedMaterial);
      }
      formData.append('professorId', user.id);
      formData.append('telegram_channel', telegramChannel);
      

	console.log('[DEBUG] Form scheduledAt:', scheduledAt);
      if (scheduledAt) {
        const localDate = new Date(scheduledAt);
        console.log('[DEBUG] Local date object:', localDate);
        console.log('[DEBUG] Local date ISO string:', localDate.toISOString());
        console.log('[DEBUG] Local date local string:', localDate.toString());
      }
      if (coverImage) {
        formData.append('cover_image', coverImage);
      }

      // The professor route is ownership-locked, so an admin must use the
      // admin route or the update is rejected with 403.
      const endpoint = isEditing
        ? (asAdmin
            ? `/api/admin/live-sessions/${editingSession.id}`
            : `/api/live-sessions/${editingSession.id}`)
        : `/api/professors/${user.id}/live-sessions`;

      const response = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        let errorMessage = isEditing ? 'Failed to update live session' : 'Failed to create live session';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If response is not JSON (like HTML error page), get text
          const errorText = await response.text();
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      toast.success('Live session created successfully!');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create live session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setScheduledAt('');
    setDuration(60);
    setPrice(500);
    setTelegramChannel('');
    setCoverImage(null);
    setImagePreview('');
    setSelectedLevel('');
    setSelectedYear('');
    setSelectedSpeciality('');
    setSelectedMaterial('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FaVideo className="text-blue-500 text-xl" />
              <h3 className="text-lg font-semibold">معلومات البث المباشر</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  عنوان البث المباشر *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مقدمة في الرياضيات - الجبر"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  وصف البث المباشر *
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اشرح ما سيتم تغطيته في هذا البث المباشر..."
                  rows={4}
                  className="mt-1"
                  required
                />
              </div>

              {/* Cover Image Upload */}
              <div>
                <Label htmlFor="cover_image" className="text-sm font-medium">
                  صورة الغلاف
                </Label>
                <div className="mt-1 space-y-3">
                  <Input
                    id="cover_image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  {imagePreview && (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCoverImage(null);
                          setImagePreview('');
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Educational Path */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FaGraduationCap className="text-green-500 text-xl" />
              <h3 className="text-lg font-semibold">المسار التعليمي</h3>
            </div>

            {isEditing && currentPath && !currentPath.material_id && (
              <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
                لا يوجد مسار تعليمي محفوظ لهذا البث. اختر مسارًا من القوائم بالأسفل.
              </div>
            )}
            
            <div className="flex gap-2 mb-4">
              {([['education', 'مسار تعليمي'], ['language', 'مسار لغات']] as const).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => { prefillPath.current = null; setPathType(k); }}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                    pathType === k
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {pathType === 'language' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">اللغة *</Label>
                  <Select
                    value={selectedLanguage}
                    onValueChange={(v) => { prefillPath.current = null; setSelectedLanguage(v); setSelectedLanguageLevel(''); }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="اختر اللغة" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((l: any) => (
                        <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">المستوى *</Label>
                  <Select
                    value={selectedLanguageLevel}
                    onValueChange={(v) => { prefillPath.current = null; setSelectedLanguageLevel(v); }}
                    disabled={!selectedLanguage}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={selectedLanguage ? 'اختر المستوى' : 'اختر اللغة أولاً'} />
                    </SelectTrigger>
                    <SelectContent>
                      {languageLevels.map((l: any) => (
                        <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {pathType === 'education' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Level */}
              <div>
                <Label htmlFor="level" className="text-sm font-medium">
                  المرحلة الدراسية *
                </Label>
                <Select value={selectedLevel} onValueChange={(v) => { prefillPath.current = null; setSelectedLevel(v); }} disabled={hierarchyLoading}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={hierarchyLoading ? "جاري التحميل..." : "اختر المرحلة"} />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.length > 0 ? (
                      levels.map(level => (
                        <SelectItem key={level.id} value={level.id.toString()}>
                          {level.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        لا توجد مراحل دراسية متاحة
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Year */}
              <div>
                <Label htmlFor="year" className="text-sm font-medium">
                  السنة الدراسية *
                </Label>
                <Select value={selectedYear} onValueChange={(v) => { prefillPath.current = null; setSelectedYear(v); }} disabled={!selectedLevel}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="اختر السنة" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.length > 0 ? (
                      years.map(year => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          {year.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        لا توجد سنوات دراسية متاحة
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Speciality */}
              <div>
                <Label htmlFor="speciality" className="text-sm font-medium">
                  التخصص {specialities.length > 0 ? '*' : '(غير متوفر)'}
                </Label>
                <Select 
                  value={selectedSpeciality} 
                  onValueChange={(v) => { prefillPath.current = null; setSelectedSpeciality(v); }} 
                  disabled={!selectedYear || specialities.length === 0}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={
                      !selectedYear 
                        ? "اختر السنة أولاً" 
                        : specialities.length === 0 
                          ? "لا توجد تخصصات لهذه السنة" 
                          : "اختر التخصص"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {specialities.length > 0 ? (
                      specialities.map(speciality => (
                        <SelectItem key={speciality.id} value={speciality.id.toString()}>
                          {speciality.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        لا توجد تخصصات متاحة
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Material */}
              <div>
                <Label htmlFor="material" className="text-sm font-medium">
                  المادة الدراسية *
                </Label>
                <Select 
                  value={selectedMaterial} 
                  onValueChange={(v) => { prefillPath.current = null; setSelectedMaterial(v); }} 
                  disabled={!selectedYear || (specialities.length > 0 && !selectedSpeciality)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={
                      !selectedYear 
                        ? "اختر السنة أولاً" 
                        : specialities.length > 0 && !selectedSpeciality 
                          ? "اختر التخصص أولاً" 
                          : "اختر المادة"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.length > 0 ? (
                      materials.map(material => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        لا توجد مواد دراسية متاحة
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule & Pricing */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FaClock className="text-purple-500 text-xl" />
              <h3 className="text-lg font-semibold">الجدولة والتسعير</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="scheduledAt" className="text-sm font-medium">
                  التاريخ والوقت *
                </Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="duration" className="text-sm font-medium">
                  المدة (دقائق) *
                </Label>
                <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 دقيقة</SelectItem>
                    <SelectItem value="45">45 دقيقة</SelectItem>
                    <SelectItem value="60">60 دقيقة</SelectItem>
                    <SelectItem value="90">90 دقيقة</SelectItem>
                    <SelectItem value="120">120 دقيقة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price" className="text-sm font-medium">
                  السعر (دج) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="50"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="telegramChannel" className="text-sm font-medium">
                  رابط قناة التلغرام (اختياري)
                </Label>
                <Input
                  id="telegramChannel"
                  type="url"
                  placeholder="https://t.me/yourchannel"
                  value={telegramChannel}
                  onChange={(e) => setTelegramChannel(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel || resetForm}
          disabled={isSubmitting}
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            !title ||
            !description ||
            !scheduledAt ||
            // A new session must be filed under a path. An existing one already
            // has one, so the selects stay optional unless the user changes it.
            (!isEditing && (
              pathType === 'language'
                ? (!selectedLanguage || !selectedLanguageLevel)
                : (!selectedLevel ||
                   !selectedYear ||
                   (specialities.length > 0 && !selectedSpeciality) ||
                   !selectedMaterial)
            ))
          }
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isSubmitting
            ? (isEditing ? 'جاري الحفظ...' : 'جاري الإنشاء...')
            : (isEditing ? 'حفظ التعديلات' : 'إنشاء البث المباشر')}
        </Button>
      </div>
    </form>
  );
};

export default LiveSessionForm;
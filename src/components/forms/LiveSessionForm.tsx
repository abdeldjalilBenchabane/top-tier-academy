import React, { useState, useEffect } from 'react';
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

interface LiveSessionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const LiveSessionForm = ({ onSuccess, onCancel }: LiveSessionFormProps) => {
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
  
  // Hierarchy data state
  const [levels, setLevels] = useState([]);
  const [years, setYears] = useState([]);
  const [specialities, setSpecialities] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  
  // Selected values
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSpeciality, setSelectedSpeciality] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');

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
        if (specialitiesData.length > 0) {
          // Year has specialities - 4-path structure
          setSpecialities(specialitiesData);
          setSelectedSpeciality('');
          setSelectedMaterial('');
          setMaterials([]);
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
        setSelectedMaterial('');
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
        setSelectedMaterial('');
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

    // Validate required fields based on path type
    const hasSpecialities = specialities.length > 0;
    const requiredFields = {
      title: !title,
      description: !description,
      scheduledAt: !scheduledAt,
      level: !selectedLevel,
      year: !selectedYear,
      speciality: hasSpecialities && !selectedSpeciality,
      material: !selectedMaterial
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
        material: 'المادة الدراسية'
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
      formData.append('start_time', scheduledAt);
      formData.append('duration', duration.toString());
      formData.append('price', price.toString());
      formData.append('material_id', selectedMaterial);
      formData.append('professorId', user.id);
      formData.append('telegram_channel', telegramChannel);
      
      if (coverImage) {
        formData.append('cover_image', coverImage);
      }

      const response = await fetch(`/api/professors/${user.id}/live-sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create live session';
        
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Level */}
              <div>
                <Label htmlFor="level" className="text-sm font-medium">
                  المرحلة الدراسية *
                </Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel} disabled={hierarchyLoading}>
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
                <Select value={selectedYear} onValueChange={setSelectedYear} disabled={!selectedLevel}>
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
                  onValueChange={setSelectedSpeciality} 
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
                  onValueChange={setSelectedMaterial} 
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
            !selectedLevel ||
            !selectedYear ||
            (specialities.length > 0 && !selectedSpeciality) ||
            !selectedMaterial
          }
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء البث المباشر'}
        </Button>
      </div>
    </form>
  );
};

export default LiveSessionForm; 
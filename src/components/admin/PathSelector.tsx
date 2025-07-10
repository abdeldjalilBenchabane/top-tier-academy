
import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Level, Year, Speciality, Material, PendingCourse, Language, LanguageLevel } from '@/types';
import { toast } from '@/lib/toast';
import { DialogDescription } from '@/components/ui/dialog';

interface PathSelectorProps {
  pendingCourse: PendingCourse;
  onSuccess: () => void;
  onCancel: () => void;
}

const PathSelector = ({ 
  pendingCourse, 
  onSuccess, 
  onCancel 
}: PathSelectorProps) => {
  // State for each level of the hierarchy
  const [levels, setLevels] = useState<Level[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  
  // Selected values
  const [selectedLevelId, setSelectedLevelId] = useState<string>('');
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedSpecialityId, setSelectedSpecialityId] = useState<string>('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  
  const [rootType, setRootType] = useState<'structure' | 'language' | ''>('');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languageLevels, setLanguageLevels] = useState<LanguageLevel[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');
  const [selectedLanguageLevelId, setSelectedLanguageLevelId] = useState<string>('');
  const [price, setPrice] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load levels on component mount
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const data = await api.getLevels();
        setLevels(data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to fetch levels');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLevels();
  }, []);

  // Load years when level is selected
  useEffect(() => {
    if (selectedLevelId) {
      const fetchYears = async () => {
        try {
          const data = await api.getYears(selectedLevelId);
          setYears(data);
        } catch (error) {
          console.error(error);
          toast.error('Failed to fetch years');
        } finally {
          // Always reset downstream selections
          setSelectedYearId('');
          setSelectedSpecialityId('');
          setSelectedMaterialId('');
          setSpecialities([]);
          setMaterials([]);
        }
      };
      fetchYears();
    } else {
      setYears([]);
      setSelectedYearId('');
      setSelectedSpecialityId('');
      setSelectedMaterialId('');
      setSpecialities([]);
      setMaterials([]);
    }
  }, [selectedLevelId]);

  // Load specialities when year is selected
  useEffect(() => {
    if (selectedYearId) {
      const fetchSpecialities = async () => {
        try {
          const data = await api.getSpecialities(selectedYearId);
          setSpecialities(data);
        } catch (error) {
          console.error(error);
          toast.error('Failed to fetch specialities');
        } finally {
          setSelectedSpecialityId('');
          setSelectedMaterialId('');
          setMaterials([]);
        }
      };
      fetchSpecialities();
    } else {
      setSpecialities([]);
      setSelectedSpecialityId('');
      setSelectedMaterialId('');
      setMaterials([]);
    }
  }, [selectedYearId]);

  // Load materials when speciality is selected
  useEffect(() => {
    if (selectedSpecialityId) {
      const fetchMaterials = async () => {
        try {
          const data = await api.getMaterials(selectedSpecialityId);
          setMaterials(data);
        } catch (error) {
          console.error(error);
          toast.error('Failed to fetch materials');
        } finally {
          setSelectedMaterialId('');
        }
      };
      fetchMaterials();
    } else {
      setMaterials([]);
      setSelectedMaterialId('');
    }
  }, [selectedSpecialityId]);

  // Load languages if rootType is 'language'
  useEffect(() => {
    if (rootType === 'language') {
      const fetchLanguages = async () => {
        try {
          const data = await api.getLanguages();
          setLanguages(data);
        } catch (error) {
          toast.error('Failed to fetch languages');
        }
      };
      fetchLanguages();
    } else {
      setLanguages([]);
      setSelectedLanguageId('');
      setLanguageLevels([]);
      setSelectedLanguageLevelId('');
    }
  }, [rootType]);

  // Load language levels when language is selected
  useEffect(() => {
    if (rootType === 'language' && selectedLanguageId) {
      const fetchLevels = async () => {
        try {
          const data = await api.getLanguageLevels(selectedLanguageId);
          setLanguageLevels(data);
        } catch (error) {
          toast.error('Failed to fetch language levels');
        } finally {
          setSelectedLanguageLevelId('');
        }
      };
      fetchLevels();
    } else {
      setLanguageLevels([]);
      setSelectedLanguageLevelId('');
    }
  }, [rootType, selectedLanguageId]);

  const handleApprove = async () => {
    if (rootType === 'structure') {
      if (!selectedMaterialId) {
        toast.error('Please select a complete path for the course');
        return;
      }
      setIsSubmitting(true);
      try {
        await api.approveCourse(pendingCourse.id, selectedMaterialId);
        toast.success('Course path assigned successfully. Course is now pending admin approval.');
        onSuccess();
      } catch (error) {
        toast.error('Failed to assign course path');
      } finally {
        setIsSubmitting(false);
      }
    } else if (rootType === 'language') {
      if (!selectedLanguageLevelId) {
        toast.error('Please select a language and level');
        return;
      }
      if (!price || isNaN(Number(price)) || Number(price) < 0) {
        toast.error('Please enter a valid price for this language course');
        return;
      }
      setIsSubmitting(true);
      try {
        await api.approveLanguageCourseWithPrice(pendingCourse.id, selectedLanguageLevelId, price);
        toast.success('Course path and price assigned successfully. Course is now pending admin approval.');
        onSuccess();
      } catch (error) {
        toast.error('Failed to assign course path');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleReject = async () => {
    const reason = "Course not approved";
    
    setIsSubmitting(true);
    
    try {
      await api.rejectCourse(pendingCourse.id, reason);
      toast.success('Course rejected');
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Failed to reject course');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-4 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Assign Course Path</h3>
        <p className="text-sm text-gray-500">
          Choose where to place "{pendingCourse.title}" in the education hierarchy or languages. This will submit your course for admin approval.
        </p>
        
        <div className="space-y-4">
          {/* Root Type Select */}
          <div>
            <Select value={rootType} onValueChange={setRootType}>
              <SelectTrigger>
                <SelectValue placeholder="Select Root Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="structure">Educational Structure</SelectItem>
                <SelectItem value="language">Languages</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Educational Structure Path */}
          {rootType === 'structure' && (
            <>
              {/* Level Select */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Level</label>
                <Select value={selectedLevelId || ''} onValueChange={setSelectedLevelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {levels.length === 0 && (
                  <div className="text-xs text-red-500 mt-1">No levels available. Please ask the admin to create a level.</div>
                )}
              </div>
              {/* Year Select */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                <Select value={selectedYearId || ''} onValueChange={setSelectedYearId} disabled={!selectedLevelId || years.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedLevelId ? "Select Year" : "Select Level First"} />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedLevelId && years.length === 0 && (
                  <div className="text-xs text-red-500 mt-1">No years available for the selected level.</div>
                )}
              </div>
              {/* Speciality Select */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Speciality</label>
                <Select
                  value={selectedSpecialityId || ''}
                  onValueChange={setSelectedSpecialityId}
                  disabled={!selectedYearId || specialities.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedYearId ? "Select Speciality" : "Select Year First"} />
                  </SelectTrigger>
                  <SelectContent>
                    {specialities.map((speciality) => (
                      <SelectItem key={speciality.id} value={speciality.id}>{speciality.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedYearId && specialities.length === 0 && (
                  <div className="text-xs text-red-500 mt-1">No specialities available for the selected year.</div>
                )}
              </div>
              {/* Material Select */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Material</label>
                <Select
                  value={selectedMaterialId || ''}
                  onValueChange={setSelectedMaterialId}
                  disabled={!selectedSpecialityId || materials.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedSpecialityId ? "Select Material" : "Select Speciality First"} />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>{material.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSpecialityId && materials.length === 0 && (
                  <div className="text-xs text-red-500 mt-1">No materials available for the selected speciality.</div>
                )}
              </div>
            </>
          )}
          {/* Language Path */}
          {rootType === 'language' && (
            <>
              {/* Language Select */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Language</label>
                <Select value={selectedLanguageId || ''} onValueChange={setSelectedLanguageId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id}>{lang.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {languages.length === 0 && (
                  <div className="text-xs text-red-500 mt-1">No languages available. Please ask the admin to create a language.</div>
                )}
              </div>
              {/* Language Level Select */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Language Level</label>
                <Select
                  value={selectedLanguageLevelId || ''}
                  onValueChange={setSelectedLanguageLevelId}
                  disabled={!selectedLanguageId || languageLevels.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedLanguageId ? "Select Level" : "Select Language First"} />
                  </SelectTrigger>
                  <SelectContent>
                    {languageLevels.map((lvl) => (
                      <SelectItem key={lvl.id} value={lvl.id}>{lvl.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedLanguageId && languageLevels.length === 0 && (
                  <div className="text-xs text-red-500 mt-1">No levels available for the selected language.</div>
                )}
              </div>
              {rootType === 'language' && selectedLanguageLevelId && (
                <div className="space-y-2 mt-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Course Price (DZD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full border rounded p-2"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="Enter price for this language course"
                    required
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        
        <Button 
          type="button" 
          variant="destructive" 
          onClick={handleReject}
          disabled={isSubmitting}
        >
          Reject Course
        </Button>
        
        <Button 
          type="button" 
          onClick={handleApprove} 
          disabled={isSubmitting}
        >
          Assign Path
        </Button>
      </div>
    </div>
  );
};

export default PathSelector;

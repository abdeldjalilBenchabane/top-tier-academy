
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { Level, Year, Speciality, Language, LanguageLevel } from '@/types';
import { toast } from '@/lib/toast';

interface PathSelectorProps {
  pendingCourse: any;
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
  
  // Selected values
  const [selectedLevelId, setSelectedLevelId] = useState<string>('');
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedSpecialityId, setSelectedSpecialityId] = useState<string>('');
  const [materialName, setMaterialName] = useState('');
  const [materialPrice, setMaterialPrice] = useState('');
  
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
          // Reset downstream selections
          setSelectedYearId('');
          setSelectedSpecialityId('');
          setMaterialName('');
          setMaterialPrice('');
          setSpecialities([]);
        } catch (error) {
          console.error(error);
          toast.error('Failed to fetch years');
        }
      };

      fetchYears();
    }
  }, [selectedLevelId]);

  // Load specialities when year is selected (only if year has speciality_id)
  useEffect(() => {
    if (selectedYearId) {
      const selectedYear = years.find(y => y.id === selectedYearId);
      if (selectedYear && selectedYear.speciality_id) {
        const fetchSpecialities = async () => {
          try {
            const data = await api.getSpecialities(selectedYearId);
            setSpecialities(data);
            // Reset material selection
            setSelectedSpecialityId('');
            setMaterialName('');
            setMaterialPrice('');
          } catch (error) {
            console.error(error);
            toast.error('Failed to fetch specialities');
          }
        };

        fetchSpecialities();
      } else {
        // If year doesn't have speciality_id, reset specialities
        setSpecialities([]);
        setSelectedSpecialityId('');
      }
    }
  }, [selectedYearId, years]);

  // Load languages when root type is selected
  useEffect(() => {
    if (rootType === 'language') {
      const fetchLanguages = async () => {
        try {
          const data = await api.getLanguages();
          setLanguages(data);
        } catch (error) {
          console.error(error);
          toast.error('Failed to fetch languages');
        }
      };

      fetchLanguages();
    }
  }, [rootType]);

  // Load language levels when language is selected
  useEffect(() => {
    if (selectedLanguageId) {
      const fetchLanguageLevels = async () => {
        try {
          const data = await api.getLanguageLevels(selectedLanguageId);
          setLanguageLevels(data);
          setSelectedLanguageLevelId('');
        } catch (error) {
          console.error(error);
          toast.error('Failed to fetch language levels');
        }
      };

      fetchLanguageLevels();
    }
  }, [selectedLanguageId]);

  const handleApprove = async () => {
    if (rootType === 'structure') {
      if (!materialName.trim()) {
        toast.error('Please enter a material name');
        return;
      }
      setIsSubmitting(true);
      try {
        // Create material and assign to course
        const materialData = {
          name: materialName,
          price: materialPrice ? parseFloat(materialPrice) : 0,
          speciality_id: selectedSpecialityId || null
        };
        
        await api.approveCourseWithMaterial(pendingCourse.id, materialData);
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
                      <SelectItem key={year.id} value={year.id}>
                        {year.name} {year.speciality_id ? '(With Speciality)' : year.material_id ? '(With Material)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedLevelId && years.length === 0 && (
                  <div className="text-xs text-red-500 mt-1">No years available for the selected level.</div>
                )}
              </div>
              {/* Speciality Select - only show if selected year has speciality_id */}
              {selectedYearId && years.find(y => y.id === selectedYearId)?.speciality_id && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Speciality</label>
                  <Select value={selectedSpecialityId || ''} onValueChange={setSelectedSpecialityId} disabled={!selectedYearId || specialities.length === 0}>
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
              )}
              {/* Material Name Input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Material Name</label>
                <Input
                  placeholder="Enter material name (e.g., Algebra, Web Development)"
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  required
                />
              </div>
              {/* Material Price Input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Material Price (Optional)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={materialPrice}
                  onChange={(e) => setMaterialPrice(e.target.value)}
                />
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
                    {languages.map((language) => (
                      <SelectItem key={language.id} value={language.id}>{language.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Language Level Select */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Language Level</label>
                <Select value={selectedLanguageLevelId || ''} onValueChange={setSelectedLanguageLevelId} disabled={!selectedLanguageId || languageLevels.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedLanguageId ? "Select Level" : "Select Language First"} />
                  </SelectTrigger>
                  <SelectContent>
                    {languageLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

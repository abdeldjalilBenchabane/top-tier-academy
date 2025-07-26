import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { Level, Year, Speciality, Language, LanguageLevel } from '@/types';
import { toast } from '@/lib/toast';

interface LiveSectionPathSelectorProps {
  pendingSection: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const LiveSectionPathSelector = ({ 
  pendingSection, 
  onSuccess, 
  onCancel 
}: LiveSectionPathSelectorProps) => {
  // State for each level of the hierarchy
  const [levels, setLevels] = useState<Level[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  
  // Selected values
  const [selectedLevelId, setSelectedLevelId] = useState<string>('');
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedSpecialityId, setSelectedSpecialityId] = useState<string>('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [materials, setMaterials] = useState<any[]>([]);
  
  const [rootType, setRootType] = useState<string>('');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languageLevels, setLanguageLevels] = useState<LanguageLevel[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');
  const [selectedLanguageLevelId, setSelectedLanguageLevelId] = useState<string>('');
  
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
          setSelectedMaterialId('');
          setSpecialities([]);
          setMaterials([]);
        } catch (error) {
          console.error(error);
          toast.error('Failed to fetch years');
        }
      };

      fetchYears();
    }
  }, [selectedLevelId]);

  // Load specialities and materials when year is selected
  useEffect(() => {
    if (selectedYearId) {
      const fetchSpecialities = async () => {
        try {
          const data = await api.getSpecialities(selectedYearId);
          setSpecialities(data);
          // Reset selections
          setSelectedSpecialityId('');
          setSelectedMaterialId('');
        } catch (error) {
          console.error(error);
          toast.error('Failed to fetch specialities');
        }
      };

      fetchSpecialities();
    } else {
      setSpecialities([]);
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
          setSelectedMaterialId('');
        } catch (error) {
          console.error(error);
          toast.error('Failed to fetch materials');
        }
      };

      fetchMaterials();
    } else {
      setMaterials([]);
    }
  }, [selectedSpecialityId]);

  // Load languages when root type changes
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
    } else {
      setLanguageLevels([]);
    }
  }, [selectedLanguageId]);

  const handleAssignPath = async () => {
    if (!rootType) {
      toast.error('Please select a root type');
      return;
    }

    if (rootType === 'education') {
      if (!selectedLevelId || !selectedYearId || !selectedSpecialityId || !selectedMaterialId) {
        toast.error('Please select all education hierarchy fields');
        return;
      }
    } else if (rootType === 'language') {
      if (!selectedLanguageId || !selectedLanguageLevelId) {
        toast.error('Please select language and language level');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        rootType,
        ...(rootType === 'education' && {
          levelId: selectedLevelId,
          yearId: selectedYearId,
          specialityId: selectedSpecialityId,
          materialId: selectedMaterialId
        }),
        ...(rootType === 'language' && {
          languageId: selectedLanguageId,
          languageLevelId: selectedLanguageLevelId
        })
      };

      const response = await fetch(`/api/live-sections/${pendingSection.id}/assign-path`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to assign path');
      }

      toast.success('Path assigned successfully! Live section is now pending approval.');
      onSuccess();
    } catch (error) {
      console.error('Error assigning path:', error);
      toast.error('Failed to assign path');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rootType) {
      toast.error('Please select a root type');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/live-sections/${pendingSection.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason: 'Rejected by professor' })
      });

      if (!response.ok) {
        throw new Error('Failed to reject live section');
      }

      toast.success('Live section rejected');
      onSuccess();
    } catch (error) {
      console.error('Error rejecting live section:', error);
      toast.error('Failed to reject live section');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  if (!pendingSection) {
    return <div className="flex items-center justify-center p-8">No live section selected</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Assign Live Section Path</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select the educational structure or language path for "{pendingSection.title}". 
          This helps students find your live section in the right place.
        </p>
      </div>

      {/* Root Type Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Root Type *</label>
        <Select value={rootType} onValueChange={setRootType}>
          <SelectTrigger>
            <SelectValue placeholder="Select root type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="education">Education Hierarchy</SelectItem>
            <SelectItem value="language">Language Course</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rootType === 'education' && (
        <div className="space-y-4">
          <h4 className="font-medium">Education Hierarchy</h4>
          
          {/* Level */}
          <div>
            <label className="block text-sm font-medium mb-2">Level *</label>
            <Select value={selectedLevelId} onValueChange={setSelectedLevelId}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level.id} value={level.id.toString()}>
                    {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium mb-2">Year *</label>
            <Select value={selectedYearId} onValueChange={setSelectedYearId} disabled={!selectedLevelId}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year.id} value={year.id.toString()}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Speciality */}
          <div>
            <label className="block text-sm font-medium mb-2">Speciality *</label>
            <Select value={selectedSpecialityId} onValueChange={setSelectedSpecialityId} disabled={!selectedYearId}>
              <SelectTrigger>
                <SelectValue placeholder="Select speciality" />
              </SelectTrigger>
              <SelectContent>
                {specialities.map((speciality) => (
                  <SelectItem key={speciality.id} value={speciality.id.toString()}>
                    {speciality.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Material */}
          <div>
            <label className="block text-sm font-medium mb-2">Material *</label>
            <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId} disabled={!selectedSpecialityId}>
              <SelectTrigger>
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {materials.map((material) => (
                  <SelectItem key={material.id} value={material.id.toString()}>
                    {material.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {rootType === 'language' && (
        <div className="space-y-4">
          <h4 className="font-medium">Language Course</h4>
          
          {/* Language */}
          <div>
            <label className="block text-sm font-medium mb-2">Language *</label>
            <Select value={selectedLanguageId} onValueChange={setSelectedLanguageId}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((language) => (
                  <SelectItem key={language.id} value={language.id.toString()}>
                    {language.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Language Level */}
          <div>
            <label className="block text-sm font-medium mb-2">Language Level *</label>
            <Select value={selectedLanguageLevelId} onValueChange={setSelectedLanguageLevelId} disabled={!selectedLanguageId}>
              <SelectTrigger>
                <SelectValue placeholder="Select language level" />
              </SelectTrigger>
              <SelectContent>
                {languageLevels.map((level) => (
                  <SelectItem key={level.id} value={level.id.toString()}>
                    {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleAssignPath} 
          disabled={isSubmitting || !rootType}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? 'Assigning...' : 'Assign Path'}
        </Button>
      </div>
    </div>
  );
};

export default LiveSectionPathSelector; 

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
import { Level, Year, Speciality, Material, PendingCourse } from '@/types';
import { toast } from '@/lib/toast';

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
  const [selectedLevelId, setSelectedLevelId] = useState<string | undefined>(undefined);
  const [selectedYearId, setSelectedYearId] = useState<string | undefined>(undefined);
  const [selectedSpecialityId, setSelectedSpecialityId] = useState<string | undefined>(undefined);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | undefined>(undefined);
  
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
          setSelectedYearId(undefined);
          setSelectedSpecialityId(undefined);
          setSelectedMaterialId(undefined);
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

  // Load specialities when year is selected
  useEffect(() => {
    if (selectedYearId) {
      const fetchSpecialities = async () => {
        try {
          const data = await api.getSpecialities(selectedYearId);
          setSpecialities(data);
          // Reset downstream selections
          setSelectedSpecialityId(undefined);
          setSelectedMaterialId(undefined);
          setMaterials([]);
        } catch (error) {
          console.error(error);
          toast.error('Failed to fetch specialities');
        }
      };

      fetchSpecialities();
    }
  }, [selectedYearId]);

  // Load materials when speciality is selected
  useEffect(() => {
    if (selectedSpecialityId) {
      const fetchMaterials = async () => {
        try {
          const data = await api.getMaterials(selectedSpecialityId);
          setMaterials(data);
          // Reset material selection
          setSelectedMaterialId(undefined);
        } catch (error) {
          console.error(error);
          toast.error('Failed to fetch materials');
        }
      };

      fetchMaterials();
    }
  }, [selectedSpecialityId]);

  const handleApprove = async () => {
    if (!selectedMaterialId) {
      toast.error('Please select a complete path for the course');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await api.approveCourse(pendingCourse.id, selectedMaterialId);
      toast.success('Course approved and assigned successfully');
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Failed to approve course');
    } finally {
      setIsSubmitting(false);
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
        <h3 className="text-lg font-medium">Select Path for Course</h3>
        <p className="text-sm text-gray-500">
          Choose where to place "{pendingCourse.title}" in the education hierarchy.
        </p>
        
        <div className="space-y-4">
          {/* Level Select */}
          <div>
            <Select
              value={selectedLevelId}
              onValueChange={setSelectedLevelId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Year Select (disabled until level is selected) */}
          <div>
            <Select
              value={selectedYearId}
              onValueChange={setSelectedYearId}
              disabled={!selectedLevelId || years.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedLevelId ? "Select Year" : "Select Level First"} />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Speciality Select (disabled until year is selected) */}
          <div>
            <Select
              value={selectedSpecialityId}
              onValueChange={setSelectedSpecialityId}
              disabled={!selectedYearId || specialities.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedYearId ? "Select Speciality" : "Select Year First"} />
              </SelectTrigger>
              <SelectContent>
                {specialities.map((speciality) => (
                  <SelectItem key={speciality.id} value={speciality.id}>
                    {speciality.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Material Select (disabled until speciality is selected) */}
          <div>
            <Select
              value={selectedMaterialId}
              onValueChange={setSelectedMaterialId}
              disabled={!selectedSpecialityId || materials.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedSpecialityId ? "Select Material" : "Select Speciality First"} />
              </SelectTrigger>
              <SelectContent>
                {materials.map((material) => (
                  <SelectItem key={material.id} value={material.id}>
                    {material.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          disabled={!selectedMaterialId || isSubmitting}
        >
          Approve & Assign
        </Button>
      </div>
    </div>
  );
};

export default PathSelector;

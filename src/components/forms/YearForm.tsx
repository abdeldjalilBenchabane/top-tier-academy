import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { structureAPI } from '@/services/api';
import { Level, Speciality, Material } from '@/types';
import { toast } from '@/lib/toast';

interface YearFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedLevelId?: string;
  year?: { id: string; name: string; levelId: string; specialityId?: string; materialId?: string };
  isEditing?: boolean;
}

const YearForm = ({ 
  onSuccess, 
  onCancel,
  preselectedLevelId,
  year,
  isEditing = false
}: YearFormProps) => {
  const [name, setName] = useState(year?.name || '');
  const [levelId, setLevelId] = useState(year?.levelId || preselectedLevelId || '');
  const [pathType, setPathType] = useState<'speciality' | 'material'>('speciality');
  const [specialityId, setSpecialityId] = useState(year?.specialityId || '');
  const [materialId, setMaterialId] = useState(year?.materialId || '');
  
  const [levels, setLevels] = useState<Level[]>([]);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [levelsData, specialitiesData, materialsData] = await Promise.all([
          structureAPI.getLevels(),
          structureAPI.getSpecialities(),
          structureAPI.getMaterials()
        ]);
        setLevels(levelsData);
        setSpecialities(specialitiesData);
        setMaterials(materialsData);
      } catch (error) {
        console.error(error);
        toast.error('Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Set path type based on existing data
  useEffect(() => {
    if (year) {
      if (year.specialityId) {
        setPathType('speciality');
        setSpecialityId(year.specialityId);
      } else if (year.materialId) {
        setPathType('material');
        setMaterialId(year.materialId);
      }
    }
  }, [year]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a year name');
      return;
    }
    
    if (!levelId) {
      toast.error('Please select a level');
      return;
    }
    
    if (pathType === 'speciality' && !specialityId) {
      toast.error('Please select a speciality');
      return;
    }
    
    if (pathType === 'material' && !materialId) {
      toast.error('Please select a material');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const yearData = {
        name,
        level_id: levelId,
        speciality_id: pathType === 'speciality' ? specialityId : null,
        material_id: pathType === 'material' ? materialId : null
      };
      
      if (isEditing && year) {
        await structureAPI.updateYear(year.id, yearData);
        toast.success('Year updated successfully');
      } else {
        await structureAPI.createYear(yearData);
        toast.success('Year created successfully');
      }
      
      setName('');
      setSpecialityId('');
      setMaterialId('');
      onSuccess?.();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to save year');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-4 text-center">Loading data...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="level-select">Level</Label>
        <Select
          value={levelId || undefined}
          onValueChange={setLevelId}
          disabled={!!preselectedLevelId && !isEditing}
        >
          <SelectTrigger id="level-select">
            <SelectValue placeholder="Select a level" />
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
      
      <div className="space-y-2">
        <Label htmlFor="year-name">Year Name</Label>
        <Input
          id="year-name"
          placeholder="e.g. First Year, Second Year"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label>Education Path Type</Label>
        <RadioGroup
          value={pathType}
          onValueChange={(value) => {
            setPathType(value as 'speciality' | 'material');
            setSpecialityId('');
            setMaterialId('');
          }}
          disabled={isEditing}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="speciality" id="speciality" />
            <Label htmlFor="speciality">With Speciality (Level → Speciality → Year)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="material" id="material" />
            <Label htmlFor="material">Without Speciality (Level → Year → Material)</Label>
          </div>
        </RadioGroup>
      </div>
      
      {pathType === 'speciality' && (
        <div className="space-y-2">
          <Label htmlFor="speciality-select">Speciality</Label>
          <Select
            value={specialityId}
            onValueChange={setSpecialityId}
          >
            <SelectTrigger id="speciality-select">
              <SelectValue placeholder="Select a speciality" />
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
      )}
      
      {pathType === 'material' && (
        <div className="space-y-2">
          <Label htmlFor="material-select">Material</Label>
          <Select
            value={materialId}
            onValueChange={setMaterialId}
          >
            <SelectTrigger id="material-select">
              <SelectValue placeholder="Select a material" />
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
      )}
      
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Year' : 'Create Year')}
        </Button>
      </div>
    </form>
  );
};

export default YearForm;

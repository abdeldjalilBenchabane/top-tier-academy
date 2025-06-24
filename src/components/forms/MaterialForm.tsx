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
import { api } from '@/lib/api';
import { Speciality } from '@/types';
import { toast } from '@/lib/toast';

interface MaterialFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedSpecialityId?: string;
}

const MaterialForm = ({ 
  onSuccess, 
  onCancel,
  preselectedSpecialityId 
}: MaterialFormProps) => {
  const [name, setName] = useState('');
  const [specialityId, setSpecialityId] = useState(preselectedSpecialityId || '');
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSpecialities = async () => {
      try {
        const data = await api.getSpecialities();
        setSpecialities(data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to fetch specialities');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpecialities();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a material name');
      return;
    }
    
    if (!specialityId) {
      toast.error('Please select a speciality');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await api.createMaterial({ name, specialityId });
      toast.success('Material created successfully');
      setName('');
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create material');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-4 text-center">Loading specialities...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="speciality-select">Speciality</Label>
        <Select
          value={specialityId}
          onValueChange={setSpecialityId}
          disabled={!!preselectedSpecialityId}
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
      
      <div className="space-y-2">
        <Label htmlFor="material-name">Material Name</Label>
        <Input
          id="material-name"
          placeholder="e.g. Algebra, Web Development"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      
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
          {isSubmitting ? 'Creating...' : 'Create Material'}
        </Button>
      </div>
    </form>
  );
};

export default MaterialForm;

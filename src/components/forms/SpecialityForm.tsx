
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
import { Year } from '@/types';
import { toast } from '@/lib/toast';

interface SpecialityFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedYearId?: string;
}

const SpecialityForm = ({ 
  onSuccess, 
  onCancel,
  preselectedYearId
}: SpecialityFormProps) => {
  const [name, setName] = useState('');
  const [yearId, setYearId] = useState(preselectedYearId || '');
  const [years, setYears] = useState<Year[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const data = await api.getYears();
        setYears(data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to fetch years');
      } finally {
        setIsLoading(false);
      }
    };

    fetchYears();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a speciality name');
      return;
    }
    
    if (!yearId) {
      toast.error('Please select a year');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await api.createSpeciality({ name, yearId });
      toast.success('Speciality created successfully');
      setName('');
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create speciality');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-4 text-center">Loading years...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="year-select">Year</Label>
        <Select
          value={yearId || undefined}
          onValueChange={setYearId}
          disabled={!!preselectedYearId}
        >
          <SelectTrigger id="year-select">
            <SelectValue placeholder="Select a year" />
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
      
      <div className="space-y-2">
        <Label htmlFor="speciality-name">Speciality Name</Label>
        <Input
          id="speciality-name"
          placeholder="e.g. Mathematics, Computer Science"
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
          {isSubmitting ? 'Creating...' : 'Create Speciality'}
        </Button>
      </div>
    </form>
  );
};

export default SpecialityForm;

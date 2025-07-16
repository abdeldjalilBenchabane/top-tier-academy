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
import { structureAPI } from '@/services/api';
import { Level } from '@/types';
import { toast } from '@/lib/toast';

interface YearFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedLevelId?: string;
  year?: { id: string; name: string; levelId: string };
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
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const data = await structureAPI.getLevels();
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
    
    setIsSubmitting(true);
    
    try {
      if (isEditing && year) {
        await structureAPI.updateYear(year.id, { name, level_id: levelId });
        toast.success('Year updated successfully');
      } else {
        await structureAPI.createYear({ name, level_id: levelId });
      toast.success('Year created successfully');
      }
      
      setName('');
      onSuccess?.();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to save year');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-4 text-center">Loading levels...</div>;
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

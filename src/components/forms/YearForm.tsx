
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
import { Level } from '@/types';
import { toast } from '@/lib/toast';

interface YearFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedLevelId?: string;
}

const YearForm = ({ 
  onSuccess, 
  onCancel,
  preselectedLevelId 
}: YearFormProps) => {
  const [name, setName] = useState('');
  const [levelId, setLevelId] = useState(preselectedLevelId || '');
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await api.createYear({ name, levelId });
      toast.success('Year created successfully');
      setName('');
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create year');
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
          disabled={!!preselectedLevelId}
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
          {isSubmitting ? 'Creating...' : 'Create Year'}
        </Button>
      </div>
    </form>
  );
};

export default YearForm;

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { structureAPI } from '@/services/api';
import { toast } from '@/lib/toast';

interface LevelFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  level?: { id: string; name: string };
  isEditing?: boolean;
}

const LevelForm = ({ onSuccess, onCancel, level, isEditing = false }: LevelFormProps) => {
  const [name, setName] = useState(level?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a level name');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditing && level) {
        await structureAPI.updateLevel(level.id, { name });
        toast.success('Level updated successfully');
      } else {
        await structureAPI.createLevel({ name });
        toast.success('Level created successfully');
      }
      
      setName('');
      onSuccess?.();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to save level');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="level-name">Level Name</Label>
        <Input
          id="level-name"
          placeholder="e.g. High School, Middle School"
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
          {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Level' : 'Create Level')}
        </Button>
      </div>
    </form>
  );
};

export default LevelForm;

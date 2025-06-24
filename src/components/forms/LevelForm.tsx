import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

interface LevelFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const LevelForm = ({ onSuccess, onCancel }: LevelFormProps) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a level name');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await api.createLevel({ name });
      toast.success('Level created successfully');
      setName('');
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create level');
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
          {isSubmitting ? 'Creating...' : 'Create Level'}
        </Button>
      </div>
    </form>
  );
};

export default LevelForm;

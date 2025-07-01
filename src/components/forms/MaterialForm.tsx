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
import { Speciality } from '@/types';
import { toast } from '@/lib/toast';

interface MaterialFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedSpecialityId?: string;
  material?: { id: string; name: string; price?: number; specialityId: string };
  isEditing?: boolean;
}

const MaterialForm = ({ 
  onSuccess, 
  onCancel,
  preselectedSpecialityId,
  material,
  isEditing = false
}: MaterialFormProps) => {
  const [name, setName] = useState(material?.name || '');
  const [price, setPrice] = useState(material?.price?.toString() || '');
  const [specialityId, setSpecialityId] = useState(material?.specialityId || preselectedSpecialityId || '');
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSpecialities = async () => {
      try {
        const data = await structureAPI.getSpecialities();
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
    
    const priceValue = price ? parseFloat(price) : 0;
    if (price && (isNaN(priceValue) || priceValue < 0)) {
      toast.error('Please enter a valid price');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditing && material) {
        await structureAPI.updateMaterial(material.id, { 
          name, 
          price: priceValue, 
          speciality_id: specialityId 
        });
        toast.success('Material updated successfully');
      } else {
        await structureAPI.createMaterial({ 
          name, 
          price: priceValue, 
          speciality_id: specialityId 
        });
        toast.success('Material created successfully');
      }
      
      setName('');
      setPrice('');
      onSuccess?.();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to save material');
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
          disabled={!!preselectedSpecialityId && !isEditing}
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
      
      <div className="space-y-2">
        <Label htmlFor="material-price">Price (Optional)</Label>
        <Input
          id="material-price"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
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
          {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Material' : 'Create Material')}
        </Button>
      </div>
    </form>
  );
};

export default MaterialForm;

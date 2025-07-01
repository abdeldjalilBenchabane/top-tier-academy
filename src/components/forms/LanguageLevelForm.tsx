import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { structureAPI } from '@/services/api';
import { LanguageLevel, Language } from '@/types';
import { toast } from '@/lib/toast';

interface LanguageLevelFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  level?: LanguageLevel;
  isEditing?: boolean;
  preselectedLanguageId?: string;
}

const LanguageLevelForm: React.FC<LanguageLevelFormProps> = ({
  onSuccess,
  onCancel,
  level,
  isEditing = false,
  preselectedLanguageId
}) => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [formData, setFormData] = useState({
    name: level?.name || '',
    description: level?.description || '',
    languageId: level?.languageId || preselectedLanguageId || '',
    order: level?.order || 1,
    isActive: level?.isActive ?? true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const data = await structureAPI.getLanguages();
        setLanguages(data);
      } catch (error) {
        console.error('Failed to fetch languages:', error);
        toast.error('Failed to load languages');
      } finally {
        setIsLoadingLanguages(false);
      }
    };

    fetchLanguages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim() || !formData.languageId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (isEditing && level) {
        await structureAPI.updateLanguageLevel(level.id, {
          name: formData.name,
          description: formData.description,
          language_id: formData.languageId,
          order: formData.order,
          is_active: formData.isActive
        });
        toast.success('Language level updated successfully');
      } else {
        await structureAPI.createLanguageLevel({
          name: formData.name,
          description: formData.description,
          language_id: formData.languageId,
          order: formData.order,
          is_active: formData.isActive
        });
        toast.success('Language level created successfully');
      }
      
      onSuccess();
    } catch (error: any) {
      console.error('Failed to save language level:', error);
      toast.error(error.message || 'Failed to save language level');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="language">Language *</Label>
        <Select
          value={formData.languageId}
          onValueChange={(value) => handleInputChange('languageId', value)}
          disabled={isLoadingLanguages}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((language) => (
              <SelectItem key={language.id} value={language.id}>
                {language.name} ({language.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Level Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="e.g., A1, B2, C1"
          required
          maxLength={5}
        />
        <p className="text-sm text-gray-500">
          Use CEFR level names (A1, A2, B1, B2, C1, C2)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="e.g., Beginner level - Can understand and use familiar everyday expressions"
          required
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="order">Order</Label>
        <Input
          id="order"
          type="number"
          min="1"
          value={formData.order}
          onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 1)}
          placeholder="1"
        />
        <p className="text-sm text-gray-500">
          Order for sorting levels (lower numbers appear first)
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => handleInputChange('isActive', checked)}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isLoadingLanguages}>
          {isSubmitting ? 'Saving...' : (isEditing ? 'Update Level' : 'Create Level')}
        </Button>
      </div>
    </form>
  );
};

export default LanguageLevelForm; 
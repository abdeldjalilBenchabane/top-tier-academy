import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { structureAPI } from '@/services/api';
import { Language } from '@/types';
import { toast } from '@/lib/toast';

interface LanguageFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  language?: Language;
  isEditing?: boolean;
}

const LanguageForm: React.FC<LanguageFormProps> = ({
  onSuccess,
  onCancel,
  language,
  isEditing = false
}) => {
  const [formData, setFormData] = useState({
    name: language?.name || '',
    code: language?.code || '',
    flag: language?.flag || '',
    isActive: language?.isActive ?? true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (isEditing && language) {
        await structureAPI.updateLanguage(language.id, {
          name: formData.name,
          code: formData.code,
          flag: formData.flag,
          is_active: formData.isActive
        });
        toast.success('Language updated successfully');
      } else {
        await structureAPI.createLanguage({
          name: formData.name,
          code: formData.code,
          flag: formData.flag,
          is_active: formData.isActive
        });
        toast.success('Language created successfully');
      }
      
      onSuccess();
    } catch (error: any) {
      console.error('Failed to save language:', error);
      toast.error(error.message || 'Failed to save language');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Language Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="e.g., English, Arabic, French"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Language Code *</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => handleInputChange('code', e.target.value)}
          placeholder="e.g., en, ar, fr"
          required
          maxLength={3}
        />
        <p className="text-sm text-gray-500">
          Use ISO 639-1 language codes (2-3 characters)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="flag">Flag URL (Optional)</Label>
        <Input
          id="flag"
          value={formData.flag}
          onChange={(e) => handleInputChange('flag', e.target.value)}
          placeholder="https://example.com/flag.png"
          type="url"
        />
        <p className="text-sm text-gray-500">
          URL to the flag image for this language
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (isEditing ? 'Update Language' : 'Create Language')}
        </Button>
      </div>
    </form>
  );
};

export default LanguageForm; 
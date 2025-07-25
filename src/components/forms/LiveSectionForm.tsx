import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, FileUp, Video, FileText, Calendar, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';
import { FaGraduationCap, FaBook, FaLayerGroup } from 'react-icons/fa';

interface LiveSessionBlock {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  coverImage?: File;
  imagePreview?: string;
  materialId?: string;
  materialName?: string;
  levelId?: string;
  levelName?: string;
  yearId?: string;
  yearName?: string;
  specialityId?: string;
  specialityName?: string;
}

interface LiveSection {
  id: string;
  title: string;
  blocks: LiveSessionBlock[];
}

interface LiveSectionFormProps {
  onSuccess?: (sectionData?: any) => void;
  onCancel?: () => void;
}

const LiveSectionForm = ({ onSuccess, onCancel }: LiveSectionFormProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(500);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [sections, setSections] = useState<LiveSection[]>([
    {
      id: `section_${Date.now()}`,
      title: '',
      blocks: []
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  




  const addSection = () => {
    setSections([
      ...sections,
      {
        id: `section_${Date.now()}`,
        title: '',
        blocks: []
      }
    ]);
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter(section => section.id !== sectionId));
  };

  const updateSectionTitle = (sectionId: string, title: string) => {
    setSections(
      sections.map(section =>
        section.id === sectionId ? { ...section, title } : section
      )
    );
  };

  const addLiveSessionBlock = (sectionId: string) => {
    const blockId = `block_${Date.now()}${Math.random().toString(36).substring(2, 9)}`;
    setSections(
      sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            blocks: [
              ...section.blocks,
              {
                id: blockId,
                title: '',
                description: '',
                scheduledAt: '',
                duration: 60
              }
            ]
          };
        }
        return section;
      })
    );
  };

  const updateLiveSessionBlock = (
    sectionId: string,
    blockId: string,
    updates: Partial<LiveSessionBlock>
  ) => {
    setSections(
      sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            blocks: section.blocks.map(block =>
              block.id === blockId ? { ...block, ...updates } : block
            )
          };
        }
        return section;
      })
    );
  };

  const removeLiveSessionBlock = (sectionId: string, blockId: string) => {
    setSections(
      sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            blocks: section.blocks.filter(block => block.id !== blockId)
          };
        }
        return section;
      })
    );
  };







  const handleCoverUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Cover image must be less than 10MB');
        return;
      }
      setCoverFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form fields
    if (!title || !description) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // Validate all sections and blocks
    const allBlocks = sections.flatMap(section => section.blocks);
    const invalidBlocks = allBlocks.filter(block => 
      !block.title || !block.description || !block.scheduledAt
    );
    
    if (invalidBlocks.length > 0) {
      toast.error('يرجى ملء جميع الحقول المطلوبة في جميع الجلسات المباشرة');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create the live section first
      const sectionFormData = new FormData();
      sectionFormData.append('title', title);
      sectionFormData.append('description', description);
      sectionFormData.append('price', price.toString());
      sectionFormData.append('status', 'draft');
      
      if (coverFile) {
        sectionFormData.append('cover_image', coverFile);
      }

      // For now, we'll simulate creating a live section
      // In the future, this would be a real API call
      const mockSectionId = `section_${Date.now()}`;
      
      // Create all live sessions from all blocks
      const promises = allBlocks.map(async (block) => {
        const formData = new FormData();
        formData.append('title', block.title);
        formData.append('description', block.description);
        formData.append('start_time', block.scheduledAt);
        formData.append('duration', block.duration.toString());
        formData.append('price', price.toString());
        formData.append('section_id', mockSectionId); // Associate with the mock section
        
        if (coverFile) {
          formData.append('cover_image', coverFile);
        }

        const response = await fetch(`/api/professors/${user?.id}/live-sessions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Failed to create live session: ${block.title}`);
        }

        return response.json();
      });

      await Promise.all(promises);
      
      // Create section data to pass back
      const sectionData = {
        id: mockSectionId,
        title,
        description,
        price,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        live_sessions_count: allBlocks.length,
        cover_url: coverFile ? URL.createObjectURL(coverFile) : undefined
      };
      
      toast.success('تم إنشاء القسم المباشر بنجاح!');
      onSuccess?.(sectionData);
      
    } catch (error) {
      console.error('Error creating live section:', error);
      toast.error('حدث خطأ أثناء إنشاء القسم المباشر');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLiveSessionBlock = (section: LiveSection, block: LiveSessionBlock) => {
    return (
      <div className="space-y-4">
        {/* Title */}
        <div>
          <Label htmlFor={`block-${block.id}-title`}>عنوان الجلسة المباشرة *</Label>
          <Input
            id={`block-${block.id}-title`}
            value={block.title}
            onChange={(e) => updateLiveSessionBlock(section.id, block.id, { title: e.target.value })}
            placeholder="أدخل عنوان الجلسة المباشرة"
            className="mt-1"
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor={`block-${block.id}-description`}>وصف الجلسة المباشرة *</Label>
          <Textarea
            id={`block-${block.id}-description`}
            value={block.description}
            onChange={(e) => updateLiveSessionBlock(section.id, block.id, { description: e.target.value })}
            placeholder="أدخل وصف الجلسة المباشرة"
            className="mt-1"
            rows={3}
          />
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`block-${block.id}-date`}>التاريخ والوقت *</Label>
            <Input
              id={`block-${block.id}-date`}
              type="datetime-local"
              value={block.scheduledAt}
              onChange={(e) => updateLiveSessionBlock(section.id, block.id, { scheduledAt: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor={`block-${block.id}-duration`}>المدة (دقيقة)</Label>
            <Input
              id={`block-${block.id}-duration`}
              type="number"
              value={block.duration}
              onChange={(e) => updateLiveSessionBlock(section.id, block.id, { duration: parseInt(e.target.value) || 60 })}
              className="mt-1"
              min="15"
              max="180"
            />
          </div>
        </div>




      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Live Section Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter live section title"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="description">Live Section Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter live section description"
            className="mt-1"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="price">السعر (دج)</Label>
          <Input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
            className="mt-1"
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="cover">Cover Image (Optional)</Label>
          <div className="mt-2">
            {coverFile ? (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  <img 
                    src={URL.createObjectURL(coverFile)} 
                    alt="Cover preview" 
                    className="w-12 h-12 object-cover rounded"
                  />
                </div>
                
                <div className="flex-1">
                  <p className="text-sm font-medium">{coverFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(coverFile.size / (1024 * 1024)).toFixed(1)} MB
                    {(coverFile.size / (1024 * 1024)) > 10 && (
                      <span className="ml-2 text-orange-600 font-medium">⚠️ Large image</span>
                    )}
                  </p>
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setCoverFile(null);
                    if (coverInputRef.current) {
                      coverInputRef.current.value = '';
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <FileUp className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => coverInputRef.current?.click()}
                >
                  Choose Cover Image
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Live Sessions</h3>
          <Button 
            type="button" 
            onClick={addSection} 
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            Add Live Session
          </Button>
        </div>
        
        {sections.map((section, index) => (
          <Card key={section.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 mb-4">
                {sections.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSection(section.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                {section.blocks.map((block) => (
                  <div key={block.id} className="rounded-md border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">
                        Live Session
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLiveSessionBlock(section.id, block.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {renderLiveSessionBlock(section, block)}
                  </div>
                ))}
                
                <div className="flex flex-wrap gap-2 pt-2">
                  <Label className="w-full text-sm font-medium text-gray-500 mb-1">
                    Add Live Session:
                  </Label>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addLiveSessionBlock(section.id)}
                    className="flex items-center gap-1"
                  >
                    <Video className="h-4 w-4" />
                    Live Session
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
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
          {isSubmitting ? 'Submitting...' : 'Submit Live Sections'}
        </Button>
      </div>
    </form>
  );
};

export default LiveSectionForm; 
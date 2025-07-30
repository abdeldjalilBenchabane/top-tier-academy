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
  editingSection?: {
    id: string;
    title: string;
    description: string;
    price: number;
    cover_image_url?: string;
    telegram_channel?: string;
    live_sessions?: Array<{
      id: string;
      title: string;
      description: string;
      scheduledAt: string;
      duration: number;
    }>;
  };
}

const LiveSectionForm = ({ onSuccess, onCancel, editingSection }: LiveSectionFormProps) => {
  const { user } = useAuth();
  
  console.log('[DEBUG] LiveSectionForm props:', { editingSection, onSuccess, onCancel });
  
  const [title, setTitle] = useState(editingSection?.title || '');
  const [description, setDescription] = useState(editingSection?.description || '');
  const [price, setPrice] = useState(editingSection?.price || 500);
  const [telegramChannel, setTelegramChannel] = useState(editingSection?.telegram_channel || '');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState(editingSection?.cover_image_url || '');
  
  console.log('[DEBUG] Form state initialized:', { title, description, price, telegramChannel, existingCoverUrl });
  
  const [sections, setSections] = useState<LiveSection[]>(() => {
    if (editingSection?.live_sessions && editingSection.live_sessions.length > 0) {
      // Convert existing live sessions to blocks, keeping their real IDs
      const blocks = editingSection.live_sessions.map(session => {
        // Convert scheduledAt to the format expected by datetime-local input
        let formattedScheduledAt = '';
        if (session.scheduledAt) {
          try {
            const date = new Date(session.scheduledAt);
            if (!isNaN(date.getTime())) {
              // Format as YYYY-MM-DDTHH:MM for datetime-local input using local timezone
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              formattedScheduledAt = `${year}-${month}-${day}T${hours}:${minutes}`;
            }
          } catch (error) {
            console.error('[DEBUG] Error formatting date:', session.scheduledAt, error);
          }
        }
        
        return {
          id: session.id, // Keep the real database ID
          title: session.title || '',
          description: session.description || '',
          scheduledAt: formattedScheduledAt,
          duration: session.duration || 60,
          coverImage: undefined,
          imagePreview: undefined
        };
      });
      
      return [{
        id: `section_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        title: '',
        blocks: blocks
      }];
    } else {
      return [{
        id: `section_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        title: '',
        blocks: []
      }];
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // Add useEffect to update form fields when editingSection changes
  React.useEffect(() => {
    console.log('[DEBUG] editingSection changed:', editingSection);
    if (editingSection) {
      setTitle(editingSection.title || '');
      setDescription(editingSection.description || '');
      setPrice(editingSection.price || 500);
      setTelegramChannel(editingSection.telegram_channel || '');
      setExistingCoverUrl(editingSection.cover_image_url || '');
      console.log('[DEBUG] Form fields updated:', {
        title: editingSection.title,
        description: editingSection.description,
        price: editingSection.price,
        telegram_channel: editingSection.telegram_channel,
        cover_image_url: editingSection.cover_image_url
      });
    }
  }, [editingSection]);

  const addSection = () => {
    setSections([
      ...sections,
      {
        id: `section_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
    
    // Set default date/time to tomorrow at 10:00 AM using local timezone
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    // Format as YYYY-MM-DDTHH:MM using local timezone
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    
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
                scheduledAt: defaultDateTime,
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
    console.log('[DEBUG] Updating live session block:', { sectionId, blockId, updates });
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
    
    console.log('[DEBUG] Form submission started');
    console.log('[DEBUG] Form data:', { title, description, price, telegramChannel, editingSection });
    
    if (!user) {
      toast.error('You must be logged in to create a live section');
      return;
    }

    // Validate form fields
    if (!title || !description || !price) {
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
      
      // Create or update the live section first
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price.toString());
      formData.append('telegram_channel', telegramChannel);
      
      if (coverFile) {
        formData.append('cover_image', coverFile);
      }

      const method = editingSection ? 'PUT' : 'POST';
      const url = editingSection 
        ? `/api/live-sections/${editingSection.id}`
        : `/api/professors/${user?.id}/live-sections`;

      console.log('[DEBUG] Making request:', { method, url });
      console.log('[DEBUG] FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      console.log('[DEBUG] Response status:', response.status);
      console.log('[DEBUG] Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DEBUG] Live section error response:', errorText);
        throw new Error(`Failed to ${editingSection ? 'update' : 'create'} live section: ${errorText}`);
      }

      const sectionData = await response.json();
      console.log('[DEBUG] Section data received:', sectionData);
      
      // Handle live sessions - update existing ones and create new ones
      const allBlocks = sections.flatMap(section => section.blocks);
      
      // Separate existing sessions (to update) and new sessions (to create)
      const existingBlocks = allBlocks.filter(block => {
        // If we're in edit mode and the block has a numeric ID, it's an existing session
        return editingSection && !isNaN(Number(block.id));
      });
      
      const newBlocks = allBlocks.filter(block => {
        // If we're in edit mode and the block has a numeric ID, it's an existing session
        if (editingSection && !isNaN(Number(block.id))) {
          return false;
        }
        return true;
      });
      
      console.log('[DEBUG] Existing blocks to update:', existingBlocks);
      console.log('[DEBUG] New blocks to create:', newBlocks);
      
      // Update existing sessions
      const updatePromises = existingBlocks.map(async (block) => {
        console.log('[DEBUG] Updating existing session:', block.id, block.title);
        
        const sessionFormData = new FormData();
        sessionFormData.append('title', block.title);
        sessionFormData.append('description', block.description);
        sessionFormData.append('start_time', block.scheduledAt);
        sessionFormData.append('duration', block.duration.toString());
        sessionFormData.append('price', price.toString());
        sessionFormData.append('professorId', user.id);
        sessionFormData.append('section_id', sectionData.id);
        
        if (coverFile) {
          sessionFormData.append('cover_image', coverFile);
        }

        const sessionResponse = await fetch(`/api/live-sessions/${block.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: sessionFormData
        });

        if (!sessionResponse.ok) {
          let errorMessage = 'Failed to update live session';
          try {
            const errorData = await sessionResponse.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            const errorText = await sessionResponse.text();
            errorMessage = `Server error: ${sessionResponse.status} ${sessionResponse.statusText}`;
          }
          console.error('[DEBUG] Live session update error:', errorMessage);
          throw new Error(errorMessage);
        }

        const sessionResult = await sessionResponse.json();
        console.log('[DEBUG] Session updated successfully:', sessionResult);
        return sessionResult;
      });
      
      // Create new sessions
      const createPromises = newBlocks.map(async (block) => {
        console.log('[DEBUG] Creating new session:', block.title);
        
        const sessionFormData = new FormData();
        sessionFormData.append('title', block.title);
        sessionFormData.append('description', block.description);
        sessionFormData.append('start_time', block.scheduledAt);
        sessionFormData.append('duration', block.duration.toString());
        sessionFormData.append('price', price.toString()); // Use section price
        sessionFormData.append('professorId', user.id);
        
        // Add section_id to associate with the live section
        sessionFormData.append('section_id', sectionData.id);
        
        if (coverFile) {
          sessionFormData.append('cover_image', coverFile);
        }

        const sessionResponse = await fetch(`/api/professors/${user.id}/live-sessions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: sessionFormData
        });

        if (!sessionResponse.ok) {
          let errorMessage = 'Failed to create live session';
          try {
            const errorData = await sessionResponse.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            const errorText = await sessionResponse.text();
            errorMessage = `Server error: ${sessionResponse.status} ${sessionResponse.statusText}`;
          }
          console.error('[DEBUG] Live session error:', errorMessage);
          throw new Error(errorMessage);
        }

        const sessionResult = await sessionResponse.json();
        console.log('[DEBUG] Session created successfully:', sessionResult);
        return sessionResult;
      });

      // Execute all promises
      const allPromises = [...updatePromises, ...createPromises];
      if (allPromises.length > 0) {
        await Promise.all(allPromises);
        console.log('[DEBUG] All sessions processed successfully');
      }
      
      toast.success(editingSection ? 'تم تحديث القسم المباشر بنجاح!' : 'تم إنشاء القسم المباشر بنجاح!');
      onSuccess?.(sectionData);
      
    } catch (error) {
      console.error('[DEBUG] Error creating live section:', error);
      toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء القسم المباشر');
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
            value={block.title || ''}
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
            value={block.description || ''}
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
              value={block.scheduledAt || ''}
              onChange={(e) => {
                updateLiveSessionBlock(section.id, block.id, { scheduledAt: e.target.value });
              }}
              className="mt-1"
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              Current value: {block.scheduledAt || 'Not set'}
            </div>
          </div>
          <div>
            <Label htmlFor={`block-${block.id}-duration`}>المدة (دقيقة)</Label>
            <Input
              id={`block-${block.id}-duration`}
              type="number"
              value={block.duration || 60}
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
            required
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
            required
          />
        </div>

        <div>
          <Label htmlFor="price">السعر (دج)</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="mt-1"
              min="0"
              required
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
            ) : existingCoverUrl ? (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  <img 
                    src={existingCoverUrl} 
                    alt="Existing cover" 
                    className="w-12 h-12 object-cover rounded"
                  />
                </div>
                
                <div className="flex-1">
                  <p className="text-sm font-medium">Current cover image</p>
                  <p className="text-xs text-gray-500">Click to replace</p>
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setExistingCoverUrl('');
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

        <div>
          <Label htmlFor="telegram-channel">Telegram Channel (Optional)</Label>
          <Input
            id="telegram-channel"
            type="url"
            placeholder="https://t.me/yourchannel"
            value={telegramChannel}
            onChange={(e) => setTelegramChannel(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Add your Telegram channel link for students to join
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {editingSection ? 'Add New Live Sessions' : 'Live Sessions'}
          </h3>
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
          {isSubmitting ? 'Submitting...' : (editingSection ? 'Add New Sessions' : 'Submit Live Sections')}
        </Button>
      </div>
    </form>
  );
};

export default LiveSectionForm; 
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
  const [title, setTitle] = useState(editingSection?.title || '');
  const [description, setDescription] = useState(editingSection?.description || '');
  const [price, setPrice] = useState(editingSection?.price || 500);
  const [telegramChannel, setTelegramChannel] = useState(editingSection?.telegram_channel || '');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState(editingSection?.cover_image_url || '');
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
              // Format as YYYY-MM-DDTHH:MM for datetime-local input
              formattedScheduledAt = date.toISOString().slice(0, 16);
            }
          } catch (error) {
            console.error('[DEBUG] Error formatting date:', session.scheduledAt, error);
          }
        }
        
        console.log('[DEBUG] Converting session:', {
          id: session.id,
          title: session.title,
          originalScheduledAt: session.scheduledAt,
          formattedScheduledAt: formattedScheduledAt
        });
        
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
    
    // Set default date/time to tomorrow at 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const defaultDateTime = tomorrow.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    
    console.log('[DEBUG] Adding live session block with default date:', defaultDateTime);
    
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
    
    console.log('[DEBUG] LiveSectionForm handleSubmit started');
    console.log('[DEBUG] User:', user);
    console.log('[DEBUG] Form data:', { title, description, price });
    console.log('[DEBUG] Sections:', sections);
    console.log('[DEBUG] All blocks:', sections.flatMap(section => section.blocks));
    
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
      console.log('[DEBUG] Creating live section...');
      
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

      console.log('[DEBUG] Live section request:', { method, url });

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      console.log('[DEBUG] Live section response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DEBUG] Live section error response:', errorText);
        throw new Error('Failed to create live section');
      }

      const sectionData = await response.json();
      console.log('[DEBUG] Live section created:', sectionData);
      
      // Create individual live sessions using the same logic as LiveSessionForm
      console.log('[DEBUG] Creating live sessions...');
      
      // Filter out existing sessions (they already exist in the database)
      const newBlocks = allBlocks.filter(block => {
        // If we're in edit mode and the block has a numeric ID, it's an existing session
        if (editingSection && !isNaN(Number(block.id))) {
          console.log('[DEBUG] Skipping existing session:', block.id);
          return false;
        }
        return true;
      });
      
      console.log('[DEBUG] New blocks to create:', newBlocks);
      console.log('[DEBUG] Block scheduledAt values:', newBlocks.map(b => ({ id: b.id, scheduledAt: b.scheduledAt, type: typeof b.scheduledAt })));
      
      const promises = newBlocks.map(async (block) => {
        console.log('[DEBUG] Creating live session for block:', block);
        console.log('[DEBUG] Block scheduledAt:', block.scheduledAt, 'Type:', typeof block.scheduledAt);
        
        const sessionFormData = new FormData();
        sessionFormData.append('title', block.title);
        sessionFormData.append('description', block.description);
        sessionFormData.append('start_time', block.scheduledAt);
        sessionFormData.append('duration', block.duration.toString());
        sessionFormData.append('price', price.toString()); // Use section price
        sessionFormData.append('professorId', user.id);
        
        // Add section_id to associate with the live section
        sessionFormData.append('section_id', sectionData.id);
        
        console.log('[DEBUG] Session FormData section_id:', sectionData.id);
        console.log('[DEBUG] Session FormData start_time:', block.scheduledAt);
        
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

        console.log('[DEBUG] Live session response status:', sessionResponse.status);

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
        console.log('[DEBUG] Live session created:', sessionResult);
        return sessionResult;
      });

      if (promises.length > 0) {
        await Promise.all(promises);
        console.log('[DEBUG] All new live sessions created successfully');
      } else {
        console.log('[DEBUG] No new live sessions to create');
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
                console.log('[DEBUG] Date input changed:', e.target.value);
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
            readOnly={!!editingSection}
            disabled={!!editingSection}
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
            required
            readOnly={!!editingSection}
            disabled={!!editingSection}
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
            required
            readOnly={!!editingSection}
            disabled={!!editingSection}
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
                
                {!editingSection && (
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
                )}
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
                
                {!editingSection && (
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
                )}
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
                  disabled={!!editingSection}
                />
                {!editingSection && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    Choose Cover Image
                  </Button>
                )}
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
            disabled={!!editingSection}
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
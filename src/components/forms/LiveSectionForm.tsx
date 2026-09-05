import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, FileUp, Video, FileText, Calendar, Clock, DollarSign, Image as ImageIcon, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// New types for content sections and blocks
interface ContentBlock {
  id: string;
  type: 'text' | 'video' | 'image' | 'pdf';
  title?: string;
  content: string;
  fileUrl?: string; // URL of uploaded file (for existing blocks)
}

interface ContentSection {
  id: string;
  title: string;
  blocks: ContentBlock[];
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
        // Use scheduledAt as-is since backend now stores it without timezone conversion
        let formattedScheduledAt = '';
        if (session.scheduledAt) {
          try {
            // Check if it's already in datetime-local format (YYYY-MM-DDTHH:MM)
            if (typeof session.scheduledAt === 'string' && session.scheduledAt.includes('T')) {
              // Remove seconds and timezone if present
              formattedScheduledAt = session.scheduledAt.substring(0, 16);
            } else {
              // Fallback: try parsing as date
              const date = new Date(session.scheduledAt);
              if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                formattedScheduledAt = `${year}-${month}-${day}T${hours}:${minutes}`;
              }
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
  
  // New states for content sections
  const [contentSections, setContentSections] = useState<ContentSection[]>([
    {
      id: `content_section_${Date.now()}`,
      title: '',
      blocks: []
    }
  ]);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File}>({});
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  
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

  // Fetch content sections when editing
  React.useEffect(() => {
    const loadContentSections = async () => {
      if (editingSection?.id) {
        try {
          console.log('[DEBUG] Fetching content sections for live section:', editingSection.id);
          const response = await fetch(`/api/live-sections/${editingSection.id}/content`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (!response.ok) {
            console.error('[DEBUG] Failed to fetch content sections');
            return;
          }

          const data = await response.json();
          console.log('[DEBUG] Loaded content sections:', data);

          if (data.sections && data.sections.length > 0) {
            // Transform backend data to form state format
            const transformedSections = data.sections.map((section: any) => ({
              id: section.id.toString(),
              title: section.title,
              blocks: section.blocks?.map((block: any) => ({
                id: block.id.toString(),
                type: block.type,
                title: block.title || '',
                content: block.content || '',
                fileUrl: block.fileUrl // Keep the file URL for display
              })) || []
            }));

            setContentSections(transformedSections);
            console.log('[DEBUG] Content sections loaded:', transformedSections);
          } else {
            // No content sections, keep default empty one
            setContentSections([{
              id: `content_section_${Date.now()}`,
              title: '',
              blocks: []
            }]);
          }
        } catch (error) {
          console.error('[DEBUG] Error loading content sections:', error);
        }
      }
    };

    loadContentSections();
  }, [editingSection?.id]);

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

  const handleDeleteCover = async () => {
    if (!editingSection?.id) {
      // Just clear the state if not editing
      setExistingCoverUrl('');
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
      return;
    }

    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete the cover image? This will also delete it from cloud storage.')) {
      return;
    }

    try {
      // Delete from backend (this will also delete from R2)
      const res = await fetch(`/api/live-sections/${editingSection.id}/cover`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to delete cover image');
      }

      toast.success('Cover image deleted successfully');
      // Clear from local state
      setExistingCoverUrl('');
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error deleting cover image:', error);
      toast.error('Failed to delete cover image');
    }
  };

  const handleDeleteLiveSection = async () => {
    if (!editingSection?.id) {
      toast.error('No live section to delete');
      return;
    }

    // Confirm deletion with detailed warning
    const confirmMessage = 'Are you sure you want to delete this entire الدورة?\n\n' +
      'This will permanently delete:\n' +
      '• All content sections\n' +
      '• All blocks and their files from cloud storage\n' +
      '• All live sessions\n' +
      '• The cover image\n' +
      '• All purchase records\n\n' +
      'This action cannot be undone!';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Delete from backend (this will delete everything)
      const res = await fetch(`/api/live-sections/${editingSection.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to delete live section' }));
        throw new Error(errorData.error || 'Failed to delete live section');
      }

      toast.success('Live section deleted successfully');
      
      // Call onSuccess to close form and refresh list
      if (onSuccess) {
        onSuccess();
      }
      
      // Navigate back if possible
      if (window.history.length > 1) {
        window.history.back();
      }
    } catch (error) {
      console.error('Error deleting live section:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete live section');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============ CONTENT SECTIONS MANAGEMENT ============
  
  const addContentSection = () => {
    setContentSections([
      ...contentSections,
      {
        id: `content_section_${Date.now()}`,
        title: '',
        blocks: []
      }
    ]);
  };

  const removeContentSection = async (sectionId: string) => {
    // Check if this is an existing section (has numeric ID)
    const isExistingSection = !isNaN(Number(sectionId));
    
    if (isExistingSection) {
      // Confirm deletion
      if (!window.confirm('Are you sure you want to delete this section? All blocks inside will be deleted, including their files from cloud storage.')) {
        return;
      }
      
      try {
        // Delete from backend (this will also delete all blocks and files)
        const res = await fetch(`/api/live-sections/sections/${sectionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to delete section');
        }
        
        toast.success('Section deleted successfully');
        // Remove from local state
        setContentSections(contentSections.filter(section => section.id !== sectionId));
      } catch (error) {
        console.error('Error deleting section:', error);
        toast.error('Failed to delete section');
      }
    } else {
      // Just remove from local state for new sections
      setContentSections(contentSections.filter(section => section.id !== sectionId));
    }
  };

  const updateContentSectionTitle = (sectionId: string, title: string) => {
    setContentSections(
      contentSections.map(section =>
        section.id === sectionId ? { ...section, title } : section
      )
    );
  };

  const addContentBlock = (sectionId: string, type: ContentBlock['type']) => {
    const blockId = `block_${Date.now()}${Math.random().toString(36).substring(2, 9)}`;
    setContentSections(
      contentSections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            blocks: [
              ...section.blocks,
              {
                id: blockId,
                type,
                content: '',
                title: type === 'text' ? '' : undefined
              }
            ]
          };
        }
        return section;
      })
    );
  };

  const updateContentBlock = (
    sectionId: string,
    blockId: string,
    updates: Partial<ContentBlock>
  ) => {
    setContentSections(
      contentSections.map(section => {
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

  const removeContentBlock = async (sectionId: string, blockId: string) => {
    // Check if this is an existing block (has numeric ID)
    const isExistingBlock = !isNaN(Number(blockId));
    
    if (isExistingBlock) {
      // Confirm deletion
      if (!window.confirm('Are you sure you want to delete this block? This will also delete the associated file from cloud storage.')) {
        return;
      }
      
      try {
        // Delete from backend (this will also delete files from R2)
        const res = await fetch(`/api/live-sections/blocks/${blockId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to delete block');
        }
        
        toast.success('Block deleted successfully');
        // Remove from local state
        setContentSections(
          contentSections.map(section => {
            if (section.id === sectionId) {
              return {
                ...section,
                blocks: section.blocks.filter(block => block.id !== blockId)
              };
            }
            return section;
          })
        );
      } catch (error) {
        console.error('Error deleting block:', error);
        toast.error('Failed to delete block');
      }
    } else {
      // Just remove from local state for new blocks
      setContentSections(
        contentSections.map(section => {
          if (section.id === sectionId) {
            return {
              ...section,
              blocks: section.blocks.filter(block => block.id !== blockId)
            };
          }
          return section;
        })
      );
    }
  };

  const handleFileUpload = (
    sectionId: string,
    blockId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check file size and show warning for large files (over 50MB)
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 50) {
        toast.warning(`Large file detected (${fileSizeMB.toFixed(1)} MB). Upload may take longer than usual.`);
      }
      
      // Store the file in uploadedFiles state
      setUploadedFiles({
        ...uploadedFiles,
        [blockId]: file
      });
      
      // Update the content block with file information
      updateContentBlock(sectionId, blockId, {
        content: `${blockId}_${file.name}`
      });
    }
  };

  const createFileBlob = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const renderContentBlock = (section: ContentSection, block: ContentBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor={`block-${block.id}-title`}>Text Title (Optional)</Label>
            <Input
              id={`block-${block.id}-title`}
              value={block.title || ''}
              onChange={(e) =>
                updateContentBlock(section.id, block.id, { title: e.target.value })
              }
              placeholder="Text title"
            />
            <Textarea
              value={block.content}
              onChange={(e) =>
                updateContentBlock(section.id, block.id, { content: e.target.value })
              }
              placeholder="Enter your content here"
              className="min-h-[100px]"
            />
          </div>
        );
        
      case 'video':
      case 'image':
      case 'pdf':
        return (
          <div className="space-y-2">
            <Label htmlFor={`block-${block.id}-title`}>
              {block.type === 'video' ? 'Video' : block.type === 'image' ? 'Image' : 'PDF'} Title (Optional)
            </Label>
            <Input
              id={`block-${block.id}-title`}
              value={block.title || ''}
              onChange={(e) =>
                updateContentBlock(section.id, block.id, { title: e.target.value })
              }
              placeholder={`${block.type} title`}
            />
            
            {/* Show existing file if it exists */}
            {block.fileUrl && (
              <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {block.type === 'image' && <ImageIcon className="h-5 w-5 text-blue-600" />}
                    {block.type === 'video' && <Video className="h-5 w-5 text-blue-600" />}
                    {block.type === 'pdf' && <BookOpen className="h-5 w-5 text-blue-600" />}
                    <span className="text-sm font-medium text-blue-900">Existing {block.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={block.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeContentBlock(section.id, block.id)}
                      title="Delete this block and file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {block.type === 'image' && (
                  <img src={block.fileUrl} alt={block.title || 'Image'} className="mt-2 max-h-40 rounded" />
                )}
                {block.type === 'video' && (
                  <video src={block.fileUrl} controls className="mt-2 max-h-40 rounded" />
                )}
              </div>
            )}
            
            <div className="flex flex-col space-y-2">
              <Label htmlFor={`block-${block.id}-file`}>
                {block.fileUrl ? 'Replace file (optional)' : 'Upload file'}
              </Label>
              <Input
                ref={el => fileInputRefs.current[block.id] = el}
                type="file"
                id={`block-${block.id}-file`}
                accept={
                  block.type === 'video'
                    ? 'video/*'
                    : block.type === 'image'
                    ? 'image/*'
                    : 'application/pdf'
                }
                className="flex-1"
                onChange={(e) => handleFileUpload(section.id, block.id, e)}
              />
              
              {block.content && uploadedFiles[block.id] && (
                <div className="p-3 bg-gray-50 rounded-md border">
                  <div className="flex items-center gap-2">
                    {block.type === 'image' && (
                      <div className="relative h-16 w-16 border rounded overflow-hidden">
                        <img 
                          src={createFileBlob(uploadedFiles[block.id])} 
                          alt="Preview" 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <p className="text-sm font-medium">{uploadedFiles[block.id].name}</p>
                      <p className="text-xs text-gray-500">
                        {(uploadedFiles[block.id].size / (1024 * 1024)).toFixed(1)} MB
                        {(uploadedFiles[block.id].size / (1024 * 1024)) > 50 && (
                          <span className="ml-2 text-orange-600 font-medium">⚠️ Large file</span>
                        )}
                      </p>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        // Clear the file input
                        if (fileInputRefs.current[block.id]) {
                          fileInputRefs.current[block.id]!.value = '';
                        }
                        
                        // Remove file from state
                        const updatedFiles = { ...uploadedFiles };
                        delete updatedFiles[block.id];
                        setUploadedFiles(updatedFiles);
                        
                        // Clear content
                        updateContentBlock(section.id, block.id, { content: '' });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // ============ END CONTENT SECTIONS MANAGEMENT ============

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
      
      // Save content sections
      console.log('[DEBUG] Saving content sections:', contentSections);
      for (const section of contentSections) {
        // Skip empty sections (no title and no blocks)
        if (!section.title && section.blocks.length === 0) {
          console.log('[DEBUG] Skipping empty section');
          continue;
        }
        
        // If section has a numeric ID, it's existing - update it
        const isExistingSection = !isNaN(Number(section.id));
        
        let sectionId = section.id;
        
        if (isExistingSection) {
          // Update existing section
          console.log('[DEBUG] Updating existing content section:', section.id);
          const sectionResponse = await fetch(`/api/live-sections/sections/${section.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title: section.title,
              liveSectionId: sectionData.id
            })
          });
          
          if (!sectionResponse.ok) {
            console.error('[DEBUG] Failed to update content section');
          }
        } else {
          // Create new section
          console.log('[DEBUG] Creating new content section:', section.title);
          const sectionResponse = await fetch('/api/live-sections/sections', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              live_section_id: sectionData.id,
              title: section.title
            })
          });
          
          if (sectionResponse.ok) {
            const newSection = await sectionResponse.json();
            sectionId = newSection.id;
            console.log('[DEBUG] Content section created:', newSection);
          } else {
            console.error('[DEBUG] Failed to create content section');
            continue;
          }
        }
        
        // Save blocks for this section
        for (const block of section.blocks) {
          const isExistingBlock = !isNaN(Number(block.id));
          
          if (isExistingBlock) {
            // Update existing block
            console.log('[DEBUG] Updating existing block:', block.id);
            const blockFormData = new FormData();
            blockFormData.append('title', block.title || '');
            blockFormData.append('content', block.content || '');
            
            // Only add file if user uploaded a new one
            if (uploadedFiles[block.id]) {
              blockFormData.append('file', uploadedFiles[block.id]);
            }
            
            const blockResponse = await fetch(`/api/live-sections/blocks/${block.id}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: blockFormData
            });
            
            if (!blockResponse.ok) {
              console.error('[DEBUG] Failed to update block');
            }
          } else {
            // Create new block
            console.log('[DEBUG] Creating new block:', block.type, block.title);
            const blockFormData = new FormData();
            blockFormData.append('live_section_id', sectionData.id);
            blockFormData.append('section_id', sectionId);
            blockFormData.append('type', block.type);
            blockFormData.append('title', block.title || '');
            blockFormData.append('content', block.content || '');
            
            // Add file if exists
            if (uploadedFiles[block.id]) {
              blockFormData.append('file', uploadedFiles[block.id]);
            }
            
            const blockResponse = await fetch('/api/live-sections/blocks', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: blockFormData
            });
            
            if (blockResponse.ok) {
              const newBlock = await blockResponse.json();
              console.log('[DEBUG] Block created:', newBlock);
            } else {
              console.error('[DEBUG] Failed to create block');
            }
          }
        }
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
          <Label htmlFor="title">عنوان الدورة</Label>
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
          <Label htmlFor="description">وصف الدورة</Label>
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
                  onClick={handleDeleteCover}
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
      
      <Tabs defaultValue="live-sessions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="live-sessions">Live Sessions</TabsTrigger>
          <TabsTrigger value="content-sections">Content Sections</TabsTrigger>
        </TabsList>

        <TabsContent value="live-sessions" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="content-sections" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Content Sections</h3>
            <Button 
              type="button" 
              onClick={addContentSection} 
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              Add Section
            </Button>
          </div>
          
          {contentSections.map((section, index) => (
            <Card key={section.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <Label htmlFor={`content-section-${index}-title`}>Section Title</Label>
                    <Input
                      id={`content-section-${index}-title`}
                      value={section.title}
                      onChange={(e) => updateContentSectionTitle(section.id, e.target.value)}
                      placeholder="Section title"
                      className="mt-1"
                    />
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeContentSection(section.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    title="Delete section"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {section.blocks.map((block) => (
                    <div key={block.id} className="rounded-md border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium capitalize">
                          {block.type} Content
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeContentBlock(section.id, block.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {renderContentBlock(section, block)}
                    </div>
                  ))}
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Label className="w-full text-sm font-medium text-gray-500 mb-1">
                      Add Content Block:
                    </Label>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addContentBlock(section.id, 'text')}
                      className="flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      Text
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addContentBlock(section.id, 'video')}
                      className="flex items-center gap-1"
                    >
                      <Video className="h-4 w-4" />
                      Video
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addContentBlock(section.id, 'image')}
                      className="flex items-center gap-1"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Image
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addContentBlock(section.id, 'pdf')}
                      className="flex items-center gap-1"
                    >
                      <BookOpen className="h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <div className="flex justify-between items-center pt-4">
        {editingSection && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteLiveSection}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            حذف الدورة
          </Button>
        )}
        <div className="flex justify-end gap-2 ml-auto">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : (editingSection ? 'Add New Sessions' : 'Submit الدورات')}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default LiveSectionForm; 
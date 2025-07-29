
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, FileUp, Image, Video, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ContentBlock, Section } from '@/types';
import { toast } from '@/lib/toast';
import { coursesAPI } from '@/services/api';

interface CourseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CourseForm = ({ onSuccess, onCancel }: CourseFormProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [sections, setSections] = useState<Section[]>([
    {
      id: `section_${Date.now()}`,
      title: '',
      blocks: []
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File}>({});
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const coverInputRef = useRef<HTMLInputElement | null>(null);

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

  const addContentBlock = (sectionId: string, type: ContentBlock['type']) => {
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

  const removeContentBlock = (sectionId: string, blockId: string) => {
    // Remove the file from uploadedFiles if it exists
    if (uploadedFiles[blockId]) {
      const updatedFiles = { ...uploadedFiles };
      delete updatedFiles[blockId];
      setUploadedFiles(updatedFiles);
    }

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

  const handleCoverUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check file size and show warning for large files (over 10MB for covers)
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 10) {
        toast.warning(`Large cover image detected (${fileSizeMB.toFixed(1)} MB). Consider compressing the image for better performance.`);
      }
      
      setCoverFile(file);
    }
  };

  const createFileBlob = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a course title');
      return;
    }
    
    if (!description.trim()) {
      toast.error('Please enter a course description');
      return;
    }
    
    const validSections = sections.filter(section => section.title.trim());
    if (validSections.length === 0) {
      toast.error('Please add at least one section with a title');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add basic course data
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price || ''); // Send empty string instead of '0' to use material price
      formData.append('sections', JSON.stringify(validSections));
      
      // Add cover file if selected
      if (coverFile) {
        formData.append('cover', coverFile);
      }
      
      // Add content files
      Object.entries(uploadedFiles).forEach(([blockId, file]) => {
        formData.append(`content_${blockId}`, file);
      });
      
      // Debug: log FormData keys
      for (let pair of formData.entries()) {
        console.log('[CourseForm] FormData:', pair[0], pair[1]);
      }
      
      // Submit course with files
      await coursesAPI.submitCourseWithFiles(formData);
      toast.success('Course submitted for review');
      
      // Reset form
      setTitle('');
      setDescription('');
      setPrice('');
      setSections([{ id: `section_${Date.now()}`, title: '', blocks: [] }]);
      setUploadedFiles({});
      setCoverFile(null);
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
      
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit course');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContentBlock = (section: Section, block: ContentBlock) => {
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
            <Label>{block.type === 'video' ? 'Video' : block.type === 'image' ? 'Image' : 'PDF'}</Label>
            <div className="flex flex-col space-y-2">
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="course-title">Course Title</Label>
          <Input
            id="course-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter course title"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="course-description">Course Description</Label>
          <Textarea
            id="course-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your course"
            className="min-h-[100px]"
            required
          />
        </div>

        {/* <div className="space-y-2">
          <Label htmlFor="course-price">Course Price (Optional)</Label>
          <Input
            id="course-price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter course price (e.g., 99.99)"
            type="number"
            step="0.01"
            min="0"
          />
        </div> */}

        <div className="space-y-2">
          <Label htmlFor="course-cover">Course Cover Image (Optional)</Label>
          <Input
            ref={coverInputRef}
            id="course-cover"
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="flex-1"
          />
          
          {coverFile && (
            <div className="p-3 bg-gray-50 rounded-md border">
              <div className="flex items-center gap-2">
                <div className="relative h-16 w-16 border rounded overflow-hidden">
                  <img 
                    src={createFileBlob(coverFile)} 
                    alt="Cover Preview" 
                    className="h-full w-full object-cover"
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
            </div>
          )}
        </div>

        {/* Remove the Course Path / Material (Optional) select and related logic */}
        {/* Remove materialId state, setMaterialId, and all references to materialId */}
        {/* Remove the Select component for path/material */}
        {/* Remove logic in handleSubmit that appends material_id to FormData */}
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Course Sections</h3>
          <Button 
            type="button" 
            onClick={addSection} 
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            Add Section
          </Button>
        </div>
        
        {sections.map((section, index) => (
          <Card key={section.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex-1">
                  <Label htmlFor={`section-${index}-title`}>Section Title</Label>
                  <Input
                    id={`section-${index}-title`}
                    value={section.title}
                    onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                    placeholder="Section title"
                    className="mt-1"
                  />
                </div>
                
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
                    <Image className="h-4 w-4" />
                    Image
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addContentBlock(section.id, 'pdf')}
                    className="flex items-center gap-1"
                  >
                    <FileUp className="h-4 w-4" />
                    PDF
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
          {isSubmitting ? 'Submitting...' : 'Submit Course'}
        </Button>
      </div>
    </form>
  );
};

export default CourseForm;

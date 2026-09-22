
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, FileUp, Image, Video, FileText, Clock, Wifi } from 'lucide-react';
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
import UploadProgressBar from '@/components/UploadProgressBar';

import { measureUploadSpeedMbps, estimateSeconds, formatDuration } from '@/lib/uploadEstimate';
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
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: {uploadId: string, filename: string, totalSize: number}}>({});
  const [completedUploads, setCompletedUploads] = useState<{[key: string]: boolean}>({});
  const [internetSpeed, setInternetSpeed] = useState<{upload: number, download: number} | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [isSpeedTesting, setIsSpeedTesting] = useState(false);
  // Removed manual speed input - automatic testing only
  const [uploadTimer, setUploadTimer] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [uploadPercentage, setUploadPercentage] = useState<number>(0);
  const [realTimeSpeed, setRealTimeSpeed] = useState<number>(0);
  const [speedTestProgress, setSpeedTestProgress] = useState<string>('');
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // Simple internet upload speed test using Blob constructor
  // The old test uploaded 1 KB, 5 KB and 10 KB and then divided the result by
  // ten "to fix a decimal point error". Payloads that small measure round-trip
  // latency rather than bandwidth, and the divisor multiplied every estimate by
  // ten on top of that. Both live in src/lib/uploadEstimate.ts now, corrected
  // and shared with the دورة form.
  const testInternetSpeed = async () => {
    setIsSpeedTesting(true);
    setSpeedTestProgress('');
    try {
      const { mbps } = await measureUploadSpeedMbps(setSpeedTestProgress);
      setRealTimeSpeed(mbps);
      setInternetSpeed({ upload: mbps, download: mbps });
      toast.success(`سرعة الرفع: ${mbps.toFixed(1)} ميغابت/ثانية`);
    } catch (error) {
      console.error('Speed test failed:', error);
      toast.error('تعذّر قياس سرعة الرفع. حاول مرة أخرى.');
    } finally {
      setIsSpeedTesting(false);
      setSpeedTestProgress('');
    }
  };

  // Estimated upload time for everything currently picked.
  const calculateEstimatedTime = () => {
    if (!internetSpeed) return;
    const totalSize = Object.values(uploadedFiles).reduce((sum, file) => sum + file.size, 0) +
                     (coverFile ? coverFile.size : 0);
    setEstimatedTime(formatDuration(estimateSeconds(totalSize, internetSpeed.upload)));
  };

  // One source of truth for the estimate: the effect calls the same
  // function the rest of the form does, instead of repeating the maths
  // with a different wording for the same number.
  useEffect(() => {
    calculateEstimatedTime();
  }, [uploadedFiles, coverFile, internetSpeed]);

  // Test speed on component mount
  useEffect(() => {
    testInternetSpeed();
  }, []);

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
      
      // Note: Upload ID will be generated on the backend during actual upload
      // We'll track progress after the upload starts
      
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
      
      // Note: Upload ID will be generated on the backend during actual upload
      // We'll track progress after the upload starts
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
    
    // Start upload timer
    setIsUploading(true);
    const startTime = Date.now();
    
    // Calculate total upload time for timer
    let totalUploadTime = 0;
    if (internetSpeed && (Object.keys(uploadedFiles).length > 0 || coverFile)) {
      const totalSize = Object.values(uploadedFiles).reduce((sum, file) => sum + file.size, 0) + 
                       (coverFile ? coverFile.size : 0);
      
      if (totalSize > 0) {
        const totalSizeMB = totalSize / (1024 * 1024);
        const uploadSpeedMBps = internetSpeed.upload / 8; // Convert Mbps to MB/s
        totalUploadTime = totalSizeMB / uploadSpeedMBps * 1000; // Convert to milliseconds
        
        // Show upload analysis
        const totalSizeFormatted = totalSizeMB > 1024 ? 
          `${(totalSizeMB / 1024).toFixed(1)} GB` : 
          `${totalSizeMB.toFixed(1)} MB`;
        
        toast.info(`📊 Upload Analysis:
📁 Total size: ${totalSizeFormatted}
🚀 Upload speed: ${internetSpeed.upload.toFixed(1)} Mbps
⏱️ Estimated time: ${estimatedTime}`);
      }
    }
    
    // Start dynamic timer with real-time speed calculation
    const timerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, totalUploadTime - elapsed);
      
      // Calculate current upload speed based on elapsed time
      if (elapsed > 0) {
        const totalSizeMB = Object.values(uploadedFiles).reduce((sum, file) => sum + file.size, 0) + 
                           (coverFile ? coverFile.size : 0) / (1024 * 1024);
        const currentSpeedMBps = (totalSizeMB * elapsed / totalUploadTime) / (elapsed / 1000);
        const currentSpeedMbps = currentSpeedMBps * 8;
        setCurrentSpeed(currentSpeedMbps);
      }
      
      let timeString = '';
      if (remaining < 60000) { // Less than 1 minute
        timeString = `${Math.ceil(remaining / 1000)}s`;
      } else if (remaining < 3600000) { // Less than 1 hour
        timeString = `${Math.ceil(remaining / 60000)}m`;
      } else {
        timeString = `${Math.ceil(remaining / 3600000)}h`;
      }
      
      setUploadTimer(timeString);
    }, 1000); // Update every second
    
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
      const response = await coursesAPI.submitCourseWithFiles(formData);
      toast.success('Course submitted for review');
      
      // If the response includes upload IDs, start tracking progress
      if (response && response.uploadIds) {
        console.log('📊 Upload IDs received:', response.uploadIds);
        // Start tracking progress for each upload
        Object.entries(response.uploadIds).forEach(([fieldName, uploadId]) => {
          if (uploadId && typeof uploadId === 'string') {
            setUploadProgress(prev => ({
              ...prev,
              [fieldName]: {
                uploadId: uploadId as string,
                filename: fieldName === 'cover' ? coverFile?.name || '' : uploadedFiles[fieldName]?.name || '',
                totalSize: fieldName === 'cover' ? coverFile?.size || 0 : uploadedFiles[fieldName]?.size || 0
              }
            }));
          }
        });
      }
      
      // Reset form
      setTitle('');
      setDescription('');
      setPrice('');
      setSections([{ id: `section_${Date.now()}`, title: '', blocks: [] }]);
      setUploadedFiles({});
      setCoverFile(null);
      setUploadProgress({});
      setCompletedUploads({});
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
      
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit course');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
      setUploadTimer('');
      setCurrentSpeed(0);
      clearInterval(timerInterval);
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
                        
                        // Clear progress tracking
                        const updatedProgress = { ...uploadProgress };
                        delete updatedProgress[block.id];
                        setUploadProgress(updatedProgress);
                        
                        // Clear content
                        updateContentBlock(section.id, block.id, { content: '' });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Upload Progress Bar */}
                  {uploadProgress[block.id] && uploadProgress[block.id].uploadId && (
                    <div className="mt-3">
                      <UploadProgressBar
                        uploadId={uploadProgress[block.id].uploadId}
                        filename={uploadProgress[block.id].filename}
                        totalSize={uploadProgress[block.id].totalSize}
                        onComplete={(success) => {
                          setCompletedUploads(prev => ({
                            ...prev,
                            [block.id]: success
                          }));
                        }}
                        onCancel={() => {
                          // Clear progress tracking
                          const updatedProgress = { ...uploadProgress };
                          delete updatedProgress[block.id];
                          setUploadProgress(updatedProgress);
                        }}
                      />
                    </div>
                  )}
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
      {/* Internet Speed Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Wifi className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Internet Speed</span>
        </div>
                 {internetSpeed ? (
           <div className="text-sm text-blue-700">
             <p>Upload Speed: <strong>{internetSpeed.upload.toFixed(1)} Mbps</strong></p>
             {realTimeSpeed > 0 && realTimeSpeed !== internetSpeed.upload && (
               <p className="text-xs text-green-600">Real-time: <strong>{realTimeSpeed.toFixed(1)} Mbps</strong></p>
             )}
             {estimatedTime && (
               <div className="flex items-center gap-1 mt-2">
                 <Clock className="h-3 w-3" />
                 <span>Estimated time: <strong>{estimatedTime}</strong></span>
               </div>
             )}
           </div>
        ) : (
          <div className="flex items-center gap-2">
            {isSpeedTesting ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-700">Testing internet speed...</span>
                </div>
                {speedTestProgress && (
                  <span className="text-xs text-blue-600">{speedTestProgress}</span>
                )}
                {realTimeSpeed > 0 && (
                  <span className="text-xs text-green-600">Current: {realTimeSpeed.toFixed(1)} Mbps</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-700">Speed test will run automatically</span>
              </div>
            )}
          </div>
        )}
      </div>

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
                    // Clear progress tracking
                    const updatedProgress = { ...uploadProgress };
                    delete updatedProgress.cover;
                    setUploadProgress(updatedProgress);
                    if (coverInputRef.current) {
                      coverInputRef.current.value = '';
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Upload Progress Bar for Cover */}
              {uploadProgress.cover && uploadProgress.cover.uploadId && (
                <div className="mt-3">
                  <UploadProgressBar
                    uploadId={uploadProgress.cover.uploadId}
                    filename={uploadProgress.cover.filename}
                    totalSize={uploadProgress.cover.totalSize}
                    onComplete={(success) => {
                      setCompletedUploads(prev => ({
                        ...prev,
                        cover: success
                      }));
                    }}
                    onCancel={() => {
                      // Clear progress tracking
                      const updatedProgress = { ...uploadProgress };
                      delete updatedProgress.cover;
                      setUploadProgress(updatedProgress);
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
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
        <div className="flex items-center gap-3">
          {/* Dynamic Timer */}
          {isUploading && uploadTimer && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
              <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
              <span className="text-sm font-medium text-blue-700">
                {uploadTimer} remaining
              </span>
              {currentSpeed > 0 && (
                <span className="text-xs text-blue-600">
                  • {currentSpeed.toFixed(1)} Mbps
                </span>
              )}
            </div>
          )}
          
          {/* Dynamic Speed Display */}
          {internetSpeed && estimatedTime && !isUploading && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
              <Wifi className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                {internetSpeed.upload.toFixed(1)} Mbps • {estimatedTime}
              </span>
            </div>
          )}
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Course'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default CourseForm;


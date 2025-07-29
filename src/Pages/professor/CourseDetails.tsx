 import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit, ArrowLeft } from 'lucide-react';
import PathSelector from '@/components/admin/PathSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Book, Layers, Calendar, FileText, Video, Image as ImageIcon, BookOpen, Download } from 'lucide-react';
import { toast } from '@/lib/toast';
import { api } from '@/lib/api';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const ProfessorCourseDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Add state for path selector dialog
  const [showPathSelector, setShowPathSelector] = useState(false);
  // Add reloadCourse function to refetch course data
  const reloadCourse = () => {
    // Call the same logic as in useEffect to reload course data
    // For now, just call the effect's fetch function
    // (You may want to refactor the effect to expose the fetch function)
    // For now, set a state to trigger useEffect
    setReloadFlag(flag => !flag);
  };
  // Add a reloadFlag state to trigger useEffect
  const [reloadFlag, setReloadFlag] = useState(false);
  // Restore dialog state
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [sectionDialogMode, setSectionDialogMode] = useState<'add' | 'edit'>('add');
  const [sectionDialogTitle, setSectionDialogTitle] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockDialogTitle, setBlockDialogTitle] = useState('');
  const [blockDialogContent, setBlockDialogContent] = useState('');
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [showAddBlockDialog, setShowAddBlockDialog] = useState(false);
  const [addBlockSectionId, setAddBlockSectionId] = useState<string | null>(null);
  const [addBlockType, setAddBlockType] = useState('text');
  const [addBlockTitle, setAddBlockTitle] = useState('');
  const [addBlockContent, setAddBlockContent] = useState('');
  const [addBlockFile, setAddBlockFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  // Remove localSections state and all inline editing handlers

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/courses/${id}`);
        if (!res.ok) throw new Error('Failed to fetch course');
        const data = await res.json();
        setCourse(data);
        setTitle(data.title);
        setDescription(data.description);
      } catch (err) {
        setError('Failed to load course');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id, reloadFlag]);

  useEffect(() => {
    if (course) {
      // setLocalSections(course.sections || []); // This line is removed
    }
  }, [course]);

  const handleDeleteCourse = async () => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to delete course');
      navigate('/professor/courses');
    } catch (err) {
      setError('Failed to delete course');
    }
  };

  const handleEditCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title, description })
      });
      if (!res.ok) throw new Error('Failed to update course');
      setEditMode(false);
      // Update local course state with new title/description
      setCourse((prev: any) => prev ? { ...prev, title, description } : prev);
    } catch (err) {
      setError('Failed to update course');
    }
  };

  // Add block icon helper
  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'pdf':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Section handlers
  const handleAddSection = async (title: string) => {
    if (!title.trim()) return toast.error('Section title required');
    try {
      const res = await fetch('/api/courses/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ course_id: course.id, title, order: course.sections.length + 1 })
      });
      if (!res.ok) throw new Error('Failed to add section');
      const newSection = await res.json();
      setCourse((prev: any) => ({ ...prev, sections: [...prev.sections, { ...newSection, blocks: [] }] }));
      toast.success('Section added');
    } catch (err) {
      toast.error('Failed to add section');
    }
  };

  const handleEditSection = async (sectionId: string, title: string) => {
    if (!title.trim()) return toast.error('Section title required');
    try {
      const res = await fetch(`/api/courses/sections/${sectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title })
      });
      if (!res.ok) throw new Error('Failed to update section');
      const updatedSection = await res.json();
      setCourse((prev: any) => ({
        ...prev,
        sections: prev.sections.map((s: any) => s.id === sectionId ? { ...s, title: updatedSection.title } : s)
      }));
      toast.success('Section updated');
    } catch (err) {
      toast.error('Failed to update section');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!window.confirm('Are you sure you want to delete this section and all its blocks?')) return;
    try {
      const res = await fetch(`/api/courses/sections/${sectionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to delete section');
      setCourse((prev: any) => ({ ...prev, sections: prev.sections.filter((s: any) => s.id !== sectionId) }));
      toast.success('Section deleted');
    } catch (err) {
      toast.error('Failed to delete section');
    }
  };

  // Block handlers
  const handleAddBlock = async (sectionId: string, type: string, title: string, content: string, file: File | null) => {
    if (!title.trim() && type !== 'text') return toast.error('Block title required');
    try {
      const formData = new FormData();
      formData.append('section_id', sectionId);
      formData.append('type', type);
      formData.append('title', title);
      if (type === 'text') {
        formData.append('content', content);
      } else if (file) {
        formData.append('file', file);
      }
      const res = await fetch('/api/courses/blocks', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (!res.ok) throw new Error('Failed to add block');
      const newBlock = await res.json();
      setCourse((prev: any) => ({
        ...prev,
        sections: prev.sections.map((s: any) =>
          s.id === sectionId ? { ...s, blocks: [...s.blocks, newBlock] } : s
        )
      }));
      toast.success('Block added');
    } catch (err) {
      toast.error('Failed to add block');
    }
  };

  const handleEditBlock = async (blockId: string, title: string, content: string) => {
    if (!title.trim()) return toast.error('Block title required');
    try {
      const res = await fetch(`/api/courses/blocks/${blockId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title, content })
      });
      if (!res.ok) throw new Error('Failed to update block');
      const updatedBlock = await res.json();
      setCourse((prev: any) => ({
        ...prev,
        sections: prev.sections.map((section: any) => ({
          ...section,
          blocks: section.blocks.map((block: any) => block.id === blockId ? { ...block, title: updatedBlock.title, content: updatedBlock.content } : block)
        }))
      }));
      toast.success('Block updated');
    } catch (err) {
      toast.error('Failed to update block');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!window.confirm('Are you sure you want to delete this block?')) return;
    try {
      const res = await fetch(`/api/courses/blocks/${blockId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to delete block');
      setCourse((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((section: any) => ({
            ...section,
            blocks: section.blocks.filter((block: any) => block.id !== blockId)
          }))
        };
      });
      toast.success('Block deleted');
    } catch (err) {
      toast.error('Failed to delete block');
    }
  };

  // Handler for cover change
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setCoverFile(file);
    setIsUploadingCover(true);
    // Show local preview
    const previewUrl = URL.createObjectURL(file);
    setCoverPreviewUrl(previewUrl);
    try {
      if (!course) throw new Error('No course loaded');
      const newCoverUrl = await api.uploadCourseCover(course.id, file);
      setCourse((prev: any) => prev ? { ...prev, cover_url: `${newCoverUrl}?t=${Date.now()}` } : prev);
      setCoverPreviewUrl(null); // Switch to server image
      setCoverFile(null);
      toast.success('Course cover updated!');
      // No reloadCourse() here for instant update
    } catch (err) {
      console.error('Failed to upload cover:', err);
      toast.error('Failed to upload course cover');
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Drag and drop handlers for cover upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please drop an image file');
      return;
    }
    
    // Use the same logic as handleCoverChange
    setCoverFile(file);
    setIsUploadingCover(true);
    const previewUrl = URL.createObjectURL(file);
    setCoverPreviewUrl(previewUrl);
    
    try {
      if (!course) throw new Error('No course loaded');
      const newCoverUrl = await api.uploadCourseCover(course.id, file);
      setCourse((prev: any) => prev ? { ...prev, cover_url: `${newCoverUrl}?t=${Date.now()}` } : prev);
      setCoverPreviewUrl(null);
      setCoverFile(null);
      toast.success('Course cover updated!');
    } catch (err) {
      console.error('Failed to upload cover:', err);
      toast.error('Failed to upload course cover');
    } finally {
      setIsUploadingCover(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!course) return <div className="p-8 text-center">Course not found</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back Button */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          onClick={() => navigate('/professor/courses')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Button>
      </div>
      
      {/* Cover Upload UI */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Course Cover</CardTitle>
        </CardHeader>
        <CardContent>
          {coverPreviewUrl || course?.cover_url ? (
            <>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative ${isDragOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
              >
                <img
                  src={coverPreviewUrl || course.cover_url}
                  alt="Course Cover"
                  className="w-full h-auto rounded-md object-cover border mb-2"
                  style={{ maxHeight: 300 }}
                />
                {isDragOver && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-md flex items-center justify-center">
                    <p className="text-white font-medium">Drop to replace cover</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                id="cover-upload-input"
                style={{ display: 'none' }}
                onChange={handleCoverChange}
                disabled={isUploadingCover}
              />
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => document.getElementById('cover-upload-input')?.click()}
                disabled={isUploadingCover}
              >
                {isUploadingCover ? 'Uploading...' : 'Change Cover'}
              </Button>
            </>
          ) : (
            <>
              <div 
                className={`border-2 border-dashed rounded-md p-8 text-center mb-2 transition-colors ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <ImageIcon className={`mx-auto h-12 w-12 mb-4 ${
                  isDragOver ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <p className={`mb-2 ${
                  isDragOver ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {isDragOver ? 'Drop your image here' : 'No cover image uploaded'}
                </p>
                <p className="text-sm text-gray-400">
                  {isDragOver 
                    ? 'Release to upload the image' 
                    : 'Drag and drop an image here or click the button below'
                  }
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                id="cover-upload-input"
                style={{ display: 'none' }}
                onChange={handleCoverChange}
                disabled={isUploadingCover}
              />
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => document.getElementById('cover-upload-input')?.click()}
                disabled={isUploadingCover}
              >
                {isUploadingCover ? 'Uploading...' : 'Add Cover Image'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editMode ? (
            <>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Course Title" />
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Course Description" />
              <Button onClick={handleEditCourse}>Save</Button>
              <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold">{course.title}</h2>
              <p className="text-gray-600">{course.description}</p>
              <Button variant="outline" onClick={() => setEditMode(true)}><Edit className="h-4 w-4 mr-1" /> Edit</Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 shadow-md bg-slate-50 rounded-t">
          <CardTitle className="text-lg flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
            Course Content
          </CardTitle>
          <div className="text-sm text-gray-500">
            {course.sections.length} section{course.sections.length !== 1 ? 's' : ''}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="content">Content Structure</TabsTrigger>
              <TabsTrigger value="preview">Preview Content</TabsTrigger>
            </TabsList>
            <TabsContent value="content" className="mt-4">
              <ScrollArea className="h-[calc(100vh-22rem)] pr-4">
                <div className="space-y-8">
                  {course.sections.map((section, sectionIndex) => (
                    <div key={section.id} className="space-y-3 bg-white rounded-lg shadow p-4 border">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-md font-semibold">
                          {sectionIndex + 1}. {section.title}
                        </h3>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setShowSectionDialog(true); setSectionDialogMode('edit'); setSectionDialogTitle(section.title); setEditingSectionId(section.id); }}><Edit className="h-4 w-4" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteSection(section.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                      </div>
                      <div className="ml-6 space-y-2">
                        {section.blocks.map((block, blockIndex) => (
                          <div key={block.id} className="flex items-start space-x-2 p-2 hover:bg-slate-50 rounded-md border bg-slate-50">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-blue-600">
                              {getBlockIcon(block.type)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {sectionIndex + 1}.{blockIndex + 1} {block.title || `${block.type.charAt(0).toUpperCase() + block.type.slice(1)} Content`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {block.type.charAt(0).toUpperCase() + block.type.slice(1)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => { setShowBlockDialog(true); setEditingBlockId(block.id); setBlockDialogTitle(block.title); setBlockDialogContent(block.content); }}><Edit className="h-4 w-4" /></Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteBlock(block.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button size="sm" className="mt-2" variant="secondary" onClick={() => { setShowAddBlockDialog(true); setAddBlockSectionId(section.id); setAddBlockType('text'); setAddBlockTitle(''); setAddBlockContent(''); setAddBlockFile(null); }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Block
                      </Button>
                    </div>
                  ))}
                </div>
                <Button className="mt-4" variant="secondary" onClick={() => { setShowSectionDialog(true); setSectionDialogMode('add'); setSectionDialogTitle(''); }}>
                  <Plus className="h-4 w-4 mr-1" /> Add Section
                </Button>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="preview" className="mt-4">
              <div className="flex justify-end mb-2">
                <Button size="sm" variant="outline" onClick={reloadCourse}>
                  Refresh
                </Button>
              </div>
              <ScrollArea className="h-[calc(100vh-22rem)] pr-4">
                <div className="space-y-8">
                  {course.sections.map((section) => (
                    <div key={section.id} className="space-y-4">
                      <h2 className="text-xl font-bold border-b pb-2">{section.title}</h2>
                      <div className="space-y-6">
                        {section.blocks.map((block) => (
                          <div key={block.id} className="space-y-2">
                            {block.title && (
                              <h3 className="text-lg font-semibold">{block.title}</h3>
                            )}
                            {block.type === 'text' && (
                              <div className="prose max-w-none">
                                <p>{block.content}</p>
                              </div>
                            )}
                            {block.type === 'image' && (
                              <div className="border rounded-md p-4">
                                {block.fileUrl ? (
                                  <div className="flex flex-col items-center">
                                    <img 
                                      src={block.fileUrl} 
                                      alt={block.title || 'Course image'}
                                      className="max-w-full max-h-[400px] rounded-md object-contain"
                                    />
                                    <p className="text-sm text-gray-500 mt-2">
                                      {block.title || 'Image'}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center space-y-2 p-6">
                                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                                      <ImageIcon className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-500">
                                      Image not available
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                            {block.type === 'video' && (
                              <div className="border rounded-md p-4">
                                {block.fileUrl ? (
                                  <div className="flex flex-col items-center">
                                    <video 
                                      src={block.fileUrl} 
                                      controls
                                      className="max-w-full max-h-[400px] rounded-md"
                                    />
                                    <p className="text-sm text-gray-500 mt-2">
                                      {block.title || 'Video'}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center space-y-2 p-6">
                                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                                      <Video className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-500">
                                      Video not available
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                            {block.type === 'pdf' && (
                              <div className="border rounded-md p-4">
                                {block.fileUrl ? (
                                  <div className="flex flex-col items-center">
                                    <object
                                      data={block.fileUrl}
                                      type="application/pdf"
                                      width="100%"
                                      height="500px"
                                      className="rounded-md border"
                                    >
                                      <p>Your browser does not support PDFs. 
                                        <a href={block.fileUrl} download={block.title || 'PDF'}>Download the PDF</a>
                                      </p>
                                    </object>
                                    <p className="text-sm text-gray-500 mt-2">
                                      {block.title || 'PDF'}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center space-y-2 p-6">
                                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                                      <FileText className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-500">
                                      PDF not available
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardFooter className="flex justify-end">
          <Button variant="destructive" onClick={handleDeleteCourse}><Trash2 className="h-4 w-4 mr-1" /> Delete Course</Button>
        </CardFooter>
      </Card>

      {/* Add PathSelector dialog */}
      <Dialog open={showPathSelector} onOpenChange={setShowPathSelector}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Course Path</DialogTitle>
          </DialogHeader>
          <PathSelector
            pendingCourse={course}
            onSuccess={() => { setShowPathSelector(false); reloadCourse(); }}
            onCancel={() => setShowPathSelector(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add Section Dialog */}
      <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{sectionDialogMode === 'add' ? 'Add New Section' : 'Edit Section'}</DialogTitle>
            <DialogDescription>
              {sectionDialogMode === 'add' ? 'Enter a title for your new section.' : 'Edit the section title.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={sectionDialogTitle}
              onChange={e => setSectionDialogTitle(e.target.value)}
              placeholder="Section Title"
            />
            <Button onClick={async () => {
              if (sectionDialogMode === 'add') {
                await handleAddSection(sectionDialogTitle);
              } else {
                if (editingSectionId) {
                  await handleEditSection(editingSectionId, sectionDialogTitle);
                }
              }
              setShowSectionDialog(false);
            }}>
              {sectionDialogMode === 'add' ? 'Add Section' : 'Save Section'}
            </Button>
            <Button variant="outline" onClick={() => setShowSectionDialog(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Block Dialog */}
      <Dialog open={showAddBlockDialog} onOpenChange={setShowAddBlockDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Block to Section</DialogTitle>
            <DialogDescription>
              Fill in the block details. For non-text blocks, upload a file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={addBlockTitle}
              onChange={e => setAddBlockTitle(e.target.value)}
              placeholder="Block Title"
            />
            <Select value={addBlockType} onValueChange={setAddBlockType}>
              <SelectTrigger>
                <SelectValue placeholder="Select Block Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
            {addBlockType === 'text' && (
              <Textarea
                value={addBlockContent}
                onChange={e => setAddBlockContent(e.target.value)}
                placeholder="Block Content"
              />
            )}
            {addBlockType === 'image' && (
              <Input
                type="file"
                accept="image/*"
                onChange={e => setAddBlockFile(e.target.files?.[0] || null)}
              />
            )}
            {addBlockType === 'video' && (
              <Input
                type="file"
                accept="video/*"
                onChange={e => setAddBlockFile(e.target.files?.[0] || null)}
              />
            )}
            {addBlockType === 'pdf' && (
              <Input
                type="file"
                accept="application/pdf"
                onChange={e => setAddBlockFile(e.target.files?.[0] || null)}
              />
            )}
            <Button onClick={async () => {
              if (addBlockSectionId) {
                await handleAddBlock(addBlockSectionId, addBlockType, addBlockTitle, addBlockContent, addBlockFile);
              }
              setShowAddBlockDialog(false);
            }}>
              Add Block
            </Button>
            
            <Button variant="outline" onClick={() => setShowAddBlockDialog(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Block Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Block</DialogTitle>
            <DialogDescription>
              Edit the block title and content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={blockDialogTitle}
              onChange={e => setBlockDialogTitle(e.target.value)}
              placeholder="Block Title"
            />
            <Textarea
              value={blockDialogContent}
              onChange={e => setBlockDialogContent(e.target.value)}
              placeholder="Block Content"
            />
            
            <Button onClick={async () => {
              if (editingBlockId) {
                await handleEditBlock(editingBlockId, blockDialogTitle, blockDialogContent);
              }
              setShowBlockDialog(false);
            }}>
              Save Block
            </Button>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>Cancel</Button>
          </div>
          
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessorCourseDetails; 
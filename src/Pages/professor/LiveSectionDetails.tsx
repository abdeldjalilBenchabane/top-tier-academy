import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit, ArrowLeft, Loader2, PlusCircle, FileText, Video, Image as ImageIcon, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/lib/toast';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const LiveSectionDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liveSection, setLiveSection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadFlag, setReloadFlag] = useState(false);

  // Section management states
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [sectionDialogMode, setSectionDialogMode] = useState<'add' | 'edit'>('add');
  const [sectionDialogTitle, setSectionDialogTitle] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  // Block management states
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [addBlockSectionId, setAddBlockSectionId] = useState<string | null>(null);
  const [addBlockType, setAddBlockType] = useState('text');
  const [addBlockTitle, setAddBlockTitle] = useState('');
  const [addBlockContent, setAddBlockContent] = useState('');
  const [addBlockFile, setAddBlockFile] = useState<File | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [isUploadingBlock, setIsUploadingBlock] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const reloadLiveSection = () => {
    setReloadFlag(flag => !flag);
  };

  useEffect(() => {
    const fetchLiveSection = async () => {
      setLoading(true);
      try {
        // Fetch live section with content sections
        const res = await fetch(`/api/live-sections/${id}/content`);
        if (!res.ok) throw new Error('Failed to fetch live section');
        const data = await res.json();
        console.log('[LiveSectionDetails] Fetched data:', data);
        setLiveSection(data);
      } catch (err) {
        console.error('[LiveSectionDetails] Error:', err);
        setError('Failed to load live section');
        toast.error('Failed to load live section');
      } finally {
        setLoading(false);
      }
    };
    fetchLiveSection();
  }, [id, reloadFlag]);

  // ========== SECTION HANDLERS ==========
  const handleOpenAddSection = () => {
    setSectionDialogMode('add');
    setSectionDialogTitle('');
    setEditingSectionId(null);
    setShowSectionDialog(true);
  };

  const handleOpenEditSection = (section: any) => {
    setSectionDialogMode('edit');
    setSectionDialogTitle(section.title);
    setEditingSectionId(section.id);
    setShowSectionDialog(true);
  };

  const handleSaveSection = async () => {
    if (!sectionDialogTitle.trim()) {
      toast.error('Section title is required');
      return;
    }

    try {
      if (sectionDialogMode === 'add') {
        // Create new section
        const res = await fetch('/api/live-sections/sections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            live_section_id: id,
            title: sectionDialogTitle,
            order: (liveSection?.sections?.length || 0) + 1
          })
        });

        if (!res.ok) throw new Error('Failed to create section');
        toast.success('Section created successfully');
      } else {
        // Update existing section
        const res = await fetch(`/api/live-sections/sections/${editingSectionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            title: sectionDialogTitle
          })
        });

        if (!res.ok) throw new Error('Failed to update section');
        toast.success('Section updated successfully');
      }

      setShowSectionDialog(false);
      reloadLiveSection();
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error('Failed to save section');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!window.confirm('Are you sure you want to delete this section? All blocks inside will be deleted, including their files from cloud storage.')) return;

    try {
      console.log('[DeleteSection] Deleting section:', sectionId);
      const res = await fetch(`/api/live-sections/sections/${sectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await res.json().catch(() => ({}));
      console.log('[DeleteSection] Response status:', res.status);
      console.log('[DeleteSection] Response data:', data);

      if (!res.ok) {
        const errorMsg = data.error || data.message || 'Failed to delete section';
        console.error('[DeleteSection] Error:', errorMsg);
        throw new Error(errorMsg);
      }
      
      toast.success('Section deleted successfully');
      reloadLiveSection();
    } catch (error: any) {
      console.error('Error deleting section:', error);
      toast.error(error.message || 'Failed to delete section');
    }
  };

  // ========== BLOCK HANDLERS ==========
  const handleOpenAddBlock = (sectionId: string) => {
    setAddBlockSectionId(sectionId);
    setAddBlockType('text');
    setAddBlockTitle('');
    setAddBlockContent('');
    setAddBlockFile(null);
    setEditingBlockId(null);
    setShowBlockDialog(true);
  };

  const handleOpenEditBlock = (block: any) => {
    setAddBlockSectionId(block.section_id);
    setAddBlockType(block.type);
    setAddBlockTitle(block.title || '');
    setAddBlockContent(block.content || '');
    setAddBlockFile(null);
    setEditingBlockId(block.id);
    setShowBlockDialog(true);
  };

  const handleSaveBlock = async () => {
    if (!addBlockSectionId) return;

    setIsUploadingBlock(true);
    try {
      const formData = new FormData();

      if (editingBlockId) {
        // Update existing block
        formData.append('title', addBlockTitle);
        formData.append('content', addBlockContent);
        
        if (addBlockFile) {
          formData.append('file', addBlockFile);
        }

        const res = await fetch(`/api/live-sections/blocks/${editingBlockId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (!res.ok) throw new Error('Failed to update block');
        toast.success('Block updated successfully');
      } else {
        // Create new block
        formData.append('section_id', addBlockSectionId);
        formData.append('live_section_id', id!);
        formData.append('type', addBlockType);
        formData.append('title', addBlockTitle);
        formData.append('content', addBlockContent);

        if (addBlockFile) {
          formData.append('file', addBlockFile);
        }

        const res = await fetch('/api/live-sections/blocks', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (!res.ok) throw new Error('Failed to create block');
        toast.success('Block created successfully');
      }

      setShowBlockDialog(false);
      reloadLiveSection();
    } catch (error) {
      console.error('Error saving block:', error);
      toast.error('Failed to save block');
    } finally {
      setIsUploadingBlock(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!window.confirm('Are you sure you want to delete this block? This will also delete the associated file from cloud storage.')) return;

    try {
      console.log('[DeleteBlock] Deleting block:', blockId);
      const res = await fetch(`/api/live-sections/blocks/${blockId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await res.json().catch(() => ({}));
      console.log('[DeleteBlock] Response status:', res.status);
      console.log('[DeleteBlock] Response data:', data);

      if (!res.ok) {
        const errorMsg = data.error || data.message || 'Failed to delete block';
        console.error('[DeleteBlock] Error:', errorMsg);
        throw new Error(errorMsg);
      }
      
      toast.success('Block deleted successfully');
      reloadLiveSection();
    } catch (error: any) {
      console.error('Error deleting block:', error);
      toast.error(error.message || 'Failed to delete block');
    }
  };

  const handleDeleteCover = async () => {
    if (!window.confirm('Are you sure you want to delete the cover image? This will also delete it from cloud storage.')) return;

    try {
      console.log('[DeleteCover] Deleting cover for live section:', id);
      const res = await fetch(`/api/live-sections/${id}/cover`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await res.json().catch(() => ({}));
      console.log('[DeleteCover] Response status:', res.status);
      console.log('[DeleteCover] Response data:', data);

      if (!res.ok) {
        const errorMsg = data.error || data.message || 'Failed to delete cover image';
        console.error('[DeleteCover] Error:', errorMsg);
        throw new Error(errorMsg);
      }
      
      toast.success('Cover image deleted successfully');
      reloadLiveSection();
    } catch (error: any) {
      console.error('Error deleting cover image:', error);
      toast.error(error.message || 'Failed to delete cover image');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setAddBlockFile(files[0]);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !liveSection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">{error || 'Live section not found'}</p>
            <Button onClick={() => navigate('/professor/live-sections')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to الدورات
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/professor/live-sections')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Badge variant={
          liveSection.status === 'approved' ? 'default' :
          liveSection.status === 'pending' ? 'secondary' :
          liveSection.status === 'rejected' ? 'destructive' : 'outline'
        }>
          {liveSection.status}
        </Badge>
      </div>

      {/* Live Section Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{liveSection.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cover Image */}
          {liveSection.cover_image_url && (
            <div>
              <Label className="text-sm font-medium text-gray-500 mb-2 block">Cover Image</Label>
              <div className="relative inline-block">
                <img 
                  src={liveSection.cover_image_url} 
                  alt="Cover" 
                  className="max-w-md rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteCover}
                  className="absolute top-2 right-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <div>
            <Label className="text-sm font-medium text-gray-500">Description</Label>
            <p className="text-sm mt-1">{liveSection.description}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-500">Price</Label>
            <p className="text-sm mt-1">{liveSection.price} دج</p>
          </div>
          {liveSection.telegram_channel && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Telegram Channel</Label>
              <p className="text-sm mt-1">{liveSection.telegram_channel}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Sections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Content Sections</CardTitle>
            <Button onClick={handleOpenAddSection} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!liveSection.sections || liveSection.sections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No content sections yet. Click "Add Section" to create one.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {liveSection.sections.map((section: any) => (
                <Card key={section.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenEditSection(section)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteSection(section.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Blocks */}
                      {section.blocks && section.blocks.length > 0 ? (
                        section.blocks.map((block: any) => (
                          <div key={block.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getBlockIcon(block.type)}
                                <span className="font-medium capitalize">{block.type}</span>
                                {block.title && <span className="text-sm text-gray-500">- {block.title}</span>}
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleOpenEditBlock(block)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteBlock(block.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Block content preview */}
                            {block.type === 'text' && (
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{block.content}</p>
                            )}
                            {block.type === 'image' && (block.fileUrl || (block.files && block.files[0]?.file_path)) && (
                              <img src={block.fileUrl || block.files[0]?.file_path} alt={block.title} className="max-w-xs rounded" />
                            )}
                            {block.type === 'video' && (block.fileUrl || (block.files && block.files[0]?.file_path)) && (
                              <video src={block.fileUrl || block.files[0]?.file_path} controls className="max-w-md rounded" />
                            )}
                            {block.type === 'pdf' && (block.fileUrl || (block.files && block.files[0]?.file_path)) && (
                              <a href={block.fileUrl || block.files[0]?.file_path} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                View PDF
                              </a>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No blocks in this section</p>
                      )}
                      
                      {/* Add Block Button */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleOpenAddBlock(section.id)}
                        className="w-full"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Block
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Dialog */}
      <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{sectionDialogMode === 'add' ? 'Add Section' : 'Edit Section'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="section-title">Section Title</Label>
              <Input
                id="section-title"
                value={sectionDialogTitle}
                onChange={(e) => setSectionDialogTitle(e.target.value)}
                placeholder="Enter section title"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSectionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSection}>
              {sectionDialogMode === 'add' ? 'Create' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBlockId ? 'Edit Block' : 'Add Block'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingBlockId && (
              <div>
                <Label htmlFor="block-type">Block Type</Label>
                <Select value={addBlockType} onValueChange={setAddBlockType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label htmlFor="block-title">Title (Optional)</Label>
              <Input
                id="block-title"
                value={addBlockTitle}
                onChange={(e) => setAddBlockTitle(e.target.value)}
                placeholder="Enter block title"
              />
            </div>

            {addBlockType === 'text' ? (
              <div>
                <Label htmlFor="block-content">Content</Label>
                <Textarea
                  id="block-content"
                  value={addBlockContent}
                  onChange={(e) => setAddBlockContent(e.target.value)}
                  placeholder="Enter text content"
                  rows={5}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="block-file">File</Label>
                <Input
                  ref={fileInputRef}
                  id="block-file"
                  type="file"
                  onChange={handleFileChange}
                  accept={
                    addBlockType === 'video' ? 'video/*' :
                    addBlockType === 'image' ? 'image/*' :
                    addBlockType === 'pdf' ? 'application/pdf' : '*'
                  }
                />
                {addBlockFile && (
                  <p className="text-sm text-gray-500 mt-2">
                    Selected: {addBlockFile.name} ({(addBlockFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBlockDialog(false)} disabled={isUploadingBlock}>
              Cancel
            </Button>
            <Button onClick={handleSaveBlock} disabled={isUploadingBlock}>
              {isUploadingBlock ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                editingBlockId ? 'Save' : 'Create'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveSectionDetails;


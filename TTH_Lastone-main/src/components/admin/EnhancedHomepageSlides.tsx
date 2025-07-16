import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileUpload } from '@/components/ui/file-upload';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Plus, Edit, Trash2, Eye, EyeOff, Image, Video, Calendar, Users, TrendingUp, Settings, ArrowUp, ArrowDown, Play, Pause } from 'lucide-react';
import { HomeSlide } from '@/types';
import { slidesAPI } from '@/services/api';
import { toast } from '@/lib/toast';

const EnhancedHomepageSlides = () => {
  const [slides, setSlides] = useState<HomeSlide[]>([]);
  const [editingSlide, setEditingSlide] = useState<HomeSlide | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewSlide, setPreviewSlide] = useState<HomeSlide | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [analytics, setAnalytics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Transform snake_case to camelCase
  const transformSlideData = (slide: any): HomeSlide => {
    return {
      id: slide.id,
      title: slide.title,
      description: slide.description,
      imageUrl: slide.image_url,
      videoUrl: slide.video_url,
      mediaType: slide.media_type,
      order: slide.order,
      isActive: slide.is_active,
      duration: slide.duration,
      startDate: slide.start_date,
      endDate: slide.end_date,
      targetAudience: slide.target_audience_roles || ['student'],
      ctaText: slide.cta_text,
      ctaLink: slide.cta_link,
      overlayColor: slide.overlay_color,
      overlayOpacity: slide.overlay_opacity,
      transition: slide.transition,
      altText: slide.alt_text,
      views: slide.views,
      clicks: slide.clicks,
      createdAt: slide.created_at,
      updatedAt: slide.updated_at,
    };
  };

  // Load slides from API
  useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    try {
      setIsLoading(true);
      const response = await slidesAPI.getAll();
      const transformedSlides = (response.slides || []).map(transformSlideData);
      setSlides(transformedSlides);
    } catch (error) {
      console.error('Error loading slides:', error);
      toast.error('Failed to load slides');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSlide = async (slideData: Partial<HomeSlide>) => {
    try {
    if (editingSlide) {
        // Update existing slide
        const response = await slidesAPI.update(editingSlide.id, slideData);
        const transformedSlide = transformSlideData(response.slide);
        
        // If order was changed, reorder all slides
        if (slideData.order !== undefined && slideData.order !== editingSlide.order) {
          console.log('Order changed, reordering all slides');
          await reorderAllSlides(editingSlide.id, slideData.order);
        } else {
          setSlides(slides.map(s => s.id === editingSlide.id ? transformedSlide : s));
        }
        
        toast.success('Slide updated successfully');
    } else {
        // Create new slide
        const response = await slidesAPI.create(slideData);
        const transformedSlide = transformSlideData(response.slide);
        setSlides([...slides, transformedSlide]);
        toast.success('Slide created successfully');
    }

    setEditingSlide(null);
    setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving slide:', error);
      toast.error('Failed to save slide');
    }
  };

  const reorderAllSlides = async (changedSlideId: string, newOrder: number) => {
    try {
      // Create a copy of slides array
      const slidesCopy = [...slides];
      
      // Find the slide being modified
      const slideIndex = slidesCopy.findIndex(s => s.id === changedSlideId);
      if (slideIndex === -1) return;
      
      // Remove the slide from its current position
      const [movedSlide] = slidesCopy.splice(slideIndex, 1);
      
      // Insert the slide at the new position
      const insertIndex = Math.min(newOrder - 1, slidesCopy.length);
      slidesCopy.splice(insertIndex, 0, movedSlide);
      
      // Update order numbers sequentially
      const reorderedSlides = slidesCopy.map((slide, index) => ({
        id: slide.id,
        order: index + 1
      }));
      
      // Use bulk reorder to update all slides
      await slidesAPI.reorder(reorderedSlides);
      
      // Reload slides to get updated data
      await loadSlides();
      
      toast.success('Slide order updated and all slides reordered');
    } catch (error) {
      console.error('Error reordering slides:', error);
      toast.error('Failed to reorder slides');
    }
  };

  const handleDeleteSlide = async (id: string) => {
    try {
      await slidesAPI.delete(id);
    setSlides(slides.filter(s => s.id !== id));
      toast.success('Slide deleted successfully');
    } catch (error) {
      console.error('Error deleting slide:', error);
      toast.error('Failed to delete slide');
    }
  };

  const toggleSlideStatus = async (id: string) => {
    try {
      const slide = slides.find(s => s.id === id);
      if (!slide) return;
      
      const response = await slidesAPI.update(id, { isActive: !slide.isActive });
      const transformedSlide = transformSlideData(response.slide);
      setSlides(slides.map(s => s.id === id ? transformedSlide : s));
      toast.success(`Slide ${transformedSlide.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling slide status:', error);
      toast.error('Failed to update slide status');
    }
  };

  const moveSlide = async (id: string, direction: 'up' | 'down') => {
    try {
      const currentIndex = slides.findIndex(s => s.id === id);
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= slides.length) return;

      // Create new order array with sequential numbers
      const reorderedSlides = [...slides];
      const temp = reorderedSlides[currentIndex];
      reorderedSlides[currentIndex] = reorderedSlides[newIndex];
      reorderedSlides[newIndex] = temp;

      // Update order numbers sequentially
      const updatedSlides = reorderedSlides.map((slide, index) => ({
        id: slide.id,
        order: index + 1
      }));

      // Use bulk reorder to update all slides
      await slidesAPI.reorder(updatedSlides);
      await loadSlides();
      toast.success('Slide order updated successfully');
    } catch (error) {
      console.error('Error moving slide:', error);
      toast.error('Failed to update slide order');
    }
  };

  const bulkReorder = async () => {
    try {
      // Create a new order array with sequential numbers
      const reorderedSlides = slides.map((slide, index) => ({
        id: slide.id,
        order: index + 1
      }));

      await slidesAPI.reorder(reorderedSlides);
      await loadSlides();
      toast.success('Slides reordered successfully');
    } catch (error) {
      console.error('Error reordering slides:', error);
      toast.error('Failed to reorder slides');
    }
  };

  const openPreview = (slide: HomeSlide) => {
    setPreviewSlide(slide);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Homepage Slides</h2>
          <p className="text-gray-600">Manage your homepage slides with advanced features</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={bulkReorder}>
            <Settings className="h-4 w-4 mr-2" />
            Reorder All
          </Button>
        <Button onClick={() => {
          setEditingSlide(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Slide
        </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold">
                  {slides.reduce((sum, slide) => sum + (slide.views || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Clicks</p>
                <p className="text-2xl font-bold">
                  {slides.reduce((sum, slide) => sum + (slide.clicks || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Active Slides</p>
                <p className="text-2xl font-bold">
                  {slides.filter(s => s.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Total Slides</p>
                <p className="text-2xl font-bold">{slides.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Slides Table */}
      <Card>
        <CardHeader>
          <CardTitle>Slides Management</CardTitle>
          <CardDescription>View and manage all your homepage slides</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slides.map((slide, index) => (
                <TableRow key={slide.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">{slide.order || index + 1}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={index === 0}
                          onClick={() => moveSlide(slide.id, 'up')}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={index === slides.length - 1}
                          onClick={() => moveSlide(slide.id, 'down')}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div 
                      className="w-16 h-12 rounded overflow-hidden bg-gray-100 relative cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openPreview(slide)}
                      title="Click to preview"
                    >
                      {slide.mediaType === 'video' ? (
                        slide.videoUrl ? (
                          <div className="relative w-full h-full">
                            <video
                              src={`http://localhost:5001${slide.videoUrl}`}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                              <Play className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Video className="h-6 w-6 text-gray-500" />
                          </div>
                        )
                      ) : slide.imageUrl ? (
                        <img
                          src={`http://localhost:5001${slide.imageUrl}`}
                          alt={slide.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <Image className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{slide.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {slide.mediaType === 'image' ? (
                        <Image className="h-3 w-3 mr-1" />
                      ) : (
                        <Video className="h-3 w-3 mr-1" />
                      )}
                      {slide.mediaType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={slide.isActive ? 'default' : 'secondary'}>
                      {slide.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{slide.views || 0}</TableCell>
                  <TableCell>{slide.clicks || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPreview(slide)}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSlideStatus(slide.id)}
                        title={slide.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {slide.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSlide(slide);
                          setIsDialogOpen(true);
                        }}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSlide(slide.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Slide Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSlide ? 'Edit Slide' : 'Create New Slide'}</DialogTitle>
            <DialogDescription>
              {editingSlide ? 'Update the slide information and media.' : 'Add a new slide to your homepage.'}
            </DialogDescription>
          </DialogHeader>
          <SlideForm slide={editingSlide} onSave={handleSaveSlide} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="slide-form">
              {editingSlide ? 'Update' : 'Create'} Slide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slide Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Slide Preview</DialogTitle>
            <DialogDescription>
              Preview how this slide will appear on the homepage
            </DialogDescription>
          </DialogHeader>
          {previewSlide && (
            <div className="space-y-4">
              <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden">
                {previewSlide.mediaType === 'video' ? (
                  <video
                    src={`http://localhost:5001${previewSlide.videoUrl}`}
                    controls
                    autoPlay
                    muted
                    loop
                    className="w-full object-cover"
                    style={{ maxHeight: '70vh' }}
                  >
                    <source src={`http://localhost:5001${previewSlide.videoUrl}`} type="video/mp4" />
                    <source src={`http://localhost:5001${previewSlide.videoUrl}`} type="video/webm" />
                    <source src={`http://localhost:5001${previewSlide.videoUrl}`} type="video/ogg" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={`http://localhost:5001${previewSlide.imageUrl}`}
                    alt={previewSlide.title}
                    className="w-full object-contain"
                    style={{ maxHeight: '70vh' }}
                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end pointer-events-none">
                  <div className="p-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">{previewSlide.title}</h3>
                    <p className="text-lg mb-4">{previewSlide.description}</p>
                    {previewSlide.ctaText && (
                      <Button variant="secondary" className="pointer-events-auto">
                        {previewSlide.ctaText}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Media Type:</strong> {previewSlide.mediaType}
                </div>
                <div>
                  <strong>Status:</strong> {previewSlide.isActive ? 'Active' : 'Inactive'}
                </div>
                <div>
                  <strong>Order:</strong> {previewSlide.order || 'Not set'}
                </div>
                <div>
                  <strong>Views:</strong> {previewSlide.views || 0}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Slide Form Component
interface SlideFormProps {
  slide: HomeSlide | null;
  onSave: (slide: Partial<HomeSlide>) => void;
}

const SlideForm = ({ slide, onSave }: SlideFormProps) => {
  const [formData, setFormData] = useState<Partial<HomeSlide>>({
    title: slide?.title || '',
    description: slide?.description || '',
    imageUrl: slide?.imageUrl || '',
    videoUrl: slide?.videoUrl || '',
    mediaType: slide?.mediaType || 'image',
    isActive: slide?.isActive !== undefined ? slide.isActive : true,
    order: slide?.order || 0,
    ctaText: slide?.ctaText || '',
    ctaLink: slide?.ctaLink || '',
    transition: slide?.transition || 'fade'
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(
    slide?.imageUrl || slide?.videoUrl || ''
  );

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      // Update the appropriate URL field based on media type
      if (formData.mediaType === 'video') {
        setFormData({...formData, videoUrl: url, imageUrl: ''});
      } else {
        setFormData({...formData, imageUrl: url, videoUrl: ''});
      }
    } else {
      setPreviewUrl('');
      setFormData({...formData, imageUrl: '', videoUrl: ''});
    }
  };

  const handleMediaTypeChange = (newMediaType: 'image' | 'video') => {
    setFormData({...formData, mediaType: newMediaType});
    // Clear file selection when switching media types
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData({...formData, mediaType: newMediaType, imageUrl: '', videoUrl: ''});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert camelCase to snake_case for backend compatibility
    const slideData = {
      title: formData.title,
      description: formData.description,
      mediaType: formData.mediaType,
      isActive: formData.isActive,
      order: formData.order,
      ctaText: formData.ctaText,
      ctaLink: formData.ctaLink,
      transition: formData.transition,
      media: selectedFile, // Include the selected file
    };
    
    onSave(slideData);
  };

  const getAcceptedFileTypes = () => {
    return formData.mediaType === 'video' 
      ? 'video/mp4,video/webm,video/ogg,video/avi' 
      : 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
  };

  return (
    <form id="slide-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="mediaType">Media Type</Label>
          <Select 
            value={formData.mediaType} 
            onValueChange={handleMediaTypeChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="order">Order</Label>
          <Input
            id="order"
            type="number"
            min="0"
            value={formData.order}
            onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={3}
        />
      </div>

      <FileUpload
        accept={getAcceptedFileTypes()}
        onFileSelect={handleFileSelect}
        preview={previewUrl}
        mediaType={formData.mediaType}
        label={`Upload ${formData.mediaType === 'video' ? 'Video' : 'Image'}`}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ctaText">CTA Text</Label>
          <Input
            id="ctaText"
            value={formData.ctaText}
            onChange={(e) => setFormData({...formData, ctaText: e.target.value})}
            placeholder="Learn More"
          />
        </div>
        <div>
          <Label htmlFor="ctaLink">CTA Link</Label>
          <Input
            id="ctaLink"
            value={formData.ctaLink}
            onChange={(e) => setFormData({...formData, ctaLink: e.target.value})}
            placeholder="/courses"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>
    </form>
  );
};

export default EnhancedHomepageSlides;

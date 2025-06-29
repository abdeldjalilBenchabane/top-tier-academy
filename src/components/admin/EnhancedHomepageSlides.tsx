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
import { Plus, Edit, Trash2, Eye, EyeOff, Image, Video, Calendar, Users, TrendingUp, Settings } from 'lucide-react';
import { HomeSlide } from '@/types';
import { slidesAPI } from '@/services/api';
import { toast } from '@/lib/toast';

const EnhancedHomepageSlides = () => {
  const [slides, setSlides] = useState<HomeSlide[]>([]);
  const [editingSlide, setEditingSlide] = useState<HomeSlide | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [analytics, setAnalytics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load slides from API
  useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    try {
      setIsLoading(true);
      const response = await slidesAPI.getAll();
      setSlides(response.slides || []);
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
        setSlides(slides.map(s => s.id === editingSlide.id ? response.slide : s));
        toast.success('Slide updated successfully');
      } else {
        // Create new slide
        const response = await slidesAPI.create(slideData);
        setSlides([...slides, response.slide]);
        toast.success('Slide created successfully');
      }
      
      setEditingSlide(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving slide:', error);
      toast.error('Failed to save slide');
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
      setSlides(slides.map(s => s.id === id ? response.slide : s));
      toast.success(`Slide ${response.slide.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling slide status:', error);
      toast.error('Failed to update slide status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Homepage Slides</h2>
          <p className="text-gray-600">Manage your homepage slides with advanced features</p>
        </div>
        <Button onClick={() => {
          setEditingSlide(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Slide
        </Button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slides.map((slide) => (
                <TableRow key={slide.id}>
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
                        onClick={() => toggleSlideStatus(slide.id)}
                      >
                        {slide.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSlide(slide);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSlide(slide.id)}
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingSlide ? 'Edit Slide' : 'Add New Slide'}
            </DialogTitle>
            <DialogDescription>
              Configure your homepage slide settings
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <SlideForm
              slide={editingSlide}
              onSave={handleSaveSlide}
            />
          </div>
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
    ctaText: slide?.ctaText || '',
    ctaLink: slide?.ctaLink || '',
    targetAudience: slide?.targetAudience || ['student'],
    transition: slide?.transition || 'fade',
    altText: slide?.altText || ''
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
      ctaText: formData.ctaText,
      ctaLink: formData.ctaLink,
      targetAudience: formData.targetAudience,
      transition: formData.transition,
      altText: formData.altText,
      media: selectedFile, // Include the selected file
    };
    
    onSave(slideData);
  };

  const getAcceptedFileTypes = () => {
    return formData.mediaType === 'video' 
      ? 'video/mp4,video/webm,video/ogg' 
      : 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
  };

  return (
    <form id="slide-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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

      <div>
        <Label htmlFor="altText">Alt Text</Label>
        <Input
          id="altText"
          value={formData.altText}
          onChange={(e) => setFormData({...formData, altText: e.target.value})}
          placeholder="Describe the image/video for accessibility"
        />
      </div>

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

      <div>
        <Label htmlFor="targetAudience">Target Audience</Label>
        <Select 
          value={formData.targetAudience?.[0] || 'student'} 
          onValueChange={(value) => setFormData({...formData, targetAudience: [value]})}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </form>
  );
};

export default EnhancedHomepageSlides;

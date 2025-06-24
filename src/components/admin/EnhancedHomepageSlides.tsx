
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

const EnhancedHomepageSlides = () => {
  const [slides, setSlides] = useState<HomeSlide[]>([]);
  const [editingSlide, setEditingSlide] = useState<HomeSlide | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [analytics, setAnalytics] = useState([]);

  // Mock data for initial load
  useEffect(() => {
    const mockSlides: HomeSlide[] = [
      {
        id: '1',
        title: 'Welcome to Our Platform',
        description: 'Discover amazing courses and learning opportunities',
        imageUrl: '/api/placeholder/800/400',
        mediaType: 'image' as const,
        order: 1,
        isActive: true,
        views: 1250,
        clicks: 89,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        targetAudience: ['student'] as ('admin' | 'professor' | 'student')[],
        ctaText: 'Get Started',
        ctaLink: '/courses',
        overlayColor: '#000000',
        overlayOpacity: 0.3,
        transition: 'fade' as const,
        altText: 'Students learning together'
      }
    ];
    setSlides(mockSlides);
  }, []);

  const handleSaveSlide = (slideData: Partial<HomeSlide>) => {
    const newSlide: HomeSlide = {
      id: editingSlide ? editingSlide.id : Date.now().toString(),
      title: slideData.title || '',
      description: slideData.description || '',
      imageUrl: slideData.imageUrl || '',
      videoUrl: slideData.videoUrl,
      mediaType: slideData.mediaType || 'image',
      order: slideData.order || slides.length + 1,
      isActive: slideData.isActive !== undefined ? slideData.isActive : true,
      duration: slideData.duration,
      startDate: slideData.startDate,
      endDate: slideData.endDate,
      targetAudience: (slideData.targetAudience || ['student']) as ('admin' | 'professor' | 'student')[],
      ctaText: slideData.ctaText,
      ctaLink: slideData.ctaLink,
      overlayColor: slideData.overlayColor,
      overlayOpacity: slideData.overlayOpacity,
      transition: slideData.transition || 'fade',
      altText: slideData.altText,
      views: slideData.views || 0,
      clicks: slideData.clicks || 0,
      createdAt: slideData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingSlide) {
      setSlides(slides.map(s => s.id === editingSlide.id ? newSlide : s));
    } else {
      setSlides([...slides, newSlide]);
    }

    setEditingSlide(null);
    setIsDialogOpen(false);
  };

  const handleDeleteSlide = (id: string) => {
    setSlides(slides.filter(s => s.id !== id));
  };

  const toggleSlideStatus = (id: string) => {
    setSlides(slides.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ));
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSlide ? 'Edit Slide' : 'Add New Slide'}
            </DialogTitle>
            <DialogDescription>
              Configure your homepage slide settings
            </DialogDescription>
          </DialogHeader>
          <SlideForm
            slide={editingSlide}
            onSave={handleSaveSlide}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Slide Form Component
interface SlideFormProps {
  slide: HomeSlide | null;
  onSave: (slide: Partial<HomeSlide>) => void;
  onCancel: () => void;
}

const SlideForm = ({ slide, onSave, onCancel }: SlideFormProps) => {
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
    onSave(formData);
  };

  const getAcceptedFileTypes = () => {
    return formData.mediaType === 'video' 
      ? 'video/mp4,video/webm,video/ogg' 
      : 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {slide ? 'Update' : 'Create'} Slide
        </Button>
      </DialogFooter>
    </form>
  );
};

export default EnhancedHomepageSlides;

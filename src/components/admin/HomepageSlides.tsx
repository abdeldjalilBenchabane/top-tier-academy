
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye, EyeOff, Image, Video } from 'lucide-react';
import { HomeSlide } from '@/types';

const HomepageSlides = () => {
  const [slides, setSlides] = useState<HomeSlide[]>([]);
  const [editingSlide, setEditingSlide] = useState<HomeSlide | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mock data for initial load
  useEffect(() => {
    const mockSlides: HomeSlide[] = [
      {
        id: '1',
        title: 'Welcome to Our Platform',
        description: 'Discover amazing courses and learning opportunities',
        imageUrl: '/api/placeholder/800/400',
        mediaType: 'image',
        order: 1,
        isActive: true
      }
    ];
    setSlides(mockSlides);
  }, []);

  const handleSaveSlide = (slideData: Omit<HomeSlide, 'id'>) => {
    const newSlide: HomeSlide = {
      ...slideData,
      id: editingSlide ? editingSlide.id : Date.now().toString(),
      mediaType: slideData.mediaType || 'image'
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
          <h2 className="text-2xl font-bold">Homepage Slides</h2>
          <p className="text-gray-600">Manage the slides displayed on your homepage</p>
        </div>
        <Button onClick={() => {
          setEditingSlide(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Slide
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Slides</CardTitle>
          <CardDescription>View and manage all homepage slides</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell>{slide.order}</TableCell>
                  <TableCell>
                    <Badge variant={slide.isActive ? 'default' : 'secondary'}>
                      {slide.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSlide ? 'Edit Slide' : 'Add New Slide'}
            </DialogTitle>
            <DialogDescription>
              Configure your homepage slide
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
  onSave: (slide: Omit<HomeSlide, 'id'>) => void;
  onCancel: () => void;
}

const SlideForm = ({ slide, onSave, onCancel }: SlideFormProps) => {
  const [formData, setFormData] = useState({
    title: slide?.title || '',
    description: slide?.description || '',
    imageUrl: slide?.imageUrl || '',
    mediaType: slide?.mediaType || 'image' as const,
    order: slide?.order || 1,
    isActive: slide?.isActive !== undefined ? slide.isActive : true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="imageUrl">Media URL</Label>
        <Input
          id="imageUrl"
          value={formData.imageUrl}
          onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
          placeholder="https://example.com/image.jpg"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="mediaType">Media Type</Label>
          <Select value={formData.mediaType} onValueChange={(value: 'image' | 'video') => 
            setFormData({...formData, mediaType: value})
          }>
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
            value={formData.order}
            onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
            min="1"
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

export default HomepageSlides;

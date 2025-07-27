import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Save, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FooterContent {
  id: number;
  section_name: string;
  content_key: string;
  content_value: string;
  content_type: string;
  display_order: number;
  is_active: boolean;
}

const FooterContent = () => {
  const [content, setContent] = useState<FooterContent[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContent, setEditingContent] = useState<Partial<FooterContent>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string>('platform');
  const { toast } = useToast();

  const contentTypes = [
    { value: 'text', label: 'Text' },
    { value: 'url', label: 'URL' },
    { value: 'email', label: 'Email' },
    { value: 'link', label: 'Link' }
  ];

  const sectionLabels: { [key: string]: string } = {
    platform: 'Platform Info',
    social: 'Social Media',
    quick_links: 'Quick Links',
    contact: 'Contact Info',
    newsletter: 'Newsletter',
    copyright: 'Copyright'
  };

  useEffect(() => {
    fetchContent();
    fetchSections();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/footer-content');
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      } else {
        throw new Error('Failed to fetch footer content');
      }
    } catch (error) {
      console.error('Error fetching footer content:', error);
      toast({
        title: "Error",
        description: "Failed to fetch footer content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/footer-content/sections');
      if (response.ok) {
        const data = await response.json();
        setSections(data);
        if (data.length > 0 && !activeSection) {
          setActiveSection(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const handleEdit = (item: FooterContent) => {
    setEditingId(item.id);
    setEditingContent(item);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingContent({});
  };

  const handleSave = async () => {
    try {
      console.log('Updating footer content:', editingContent);
      console.log('Editing ID:', editingId);

      const response = await fetch(`/api/footer-content/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editingContent)
      });

      console.log('Update response status:', response.status);

      if (response.ok) {
        toast({
          title: "Success",
          description: "Footer content updated successfully",
        });
        setEditingId(null);
        setEditingContent({});
        fetchContent();
      } else {
        const errorData = await response.text();
        console.error('Update response error:', errorData);
        throw new Error('Failed to update footer content');
      }
    } catch (error) {
      console.error('Error updating footer content:', error);
      toast({
        title: "Error",
        description: "Failed to update footer content",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const response = await fetch(`/api/footer-content/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Footer content deleted successfully",
        });
        fetchContent();
      } else {
        throw new Error('Failed to delete footer content');
      }
    } catch (error) {
      console.error('Error deleting footer content:', error);
      toast({
        title: "Error",
        description: "Failed to delete footer content",
        variant: "destructive",
      });
    }
  };

  const handleAdd = async () => {
    try {
      // Validate required fields
      if (!editingContent.section_name || !editingContent.content_key || !editingContent.content_value) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      console.log('Adding new footer content:', editingContent);

      const response = await fetch('/api/footer-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editingContent)
      });

      console.log('Add response status:', response.status);

      if (response.ok) {
        toast({
          title: "Success",
          description: "Footer content added successfully",
        });
        setEditingContent({});
        setEditingId(null);
        fetchContent();
      } else {
        const errorData = await response.text();
        console.error('Add response error:', errorData);
        throw new Error('Failed to add footer content');
      }
    } catch (error) {
      console.error('Error adding footer content:', error);
      toast({
        title: "Error",
        description: "Failed to add footer content",
        variant: "destructive",
      });
    }
  };

  const getFilteredContent = () => {
    return content.filter(item => item.section_name === activeSection);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Footer Content Management</h1>
        <Badge variant="outline">
          Total: {content.length} items
        </Badge>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-6 min-w-max">
            {sections.map(section => (
              <TabsTrigger key={section} value={section}>
                {sectionLabels[section] || section}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {sections.map(section => (
          <TabsContent key={section} value={section} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {sectionLabels[section] || section}
                  <Button onClick={() => setEditingContent({ section_name: section })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Content
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editingContent.section_name === section && (
                  <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-semibold mb-4">{editingId ? 'Edit Footer Content' : 'Add New Footer Content'}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="content_key">Content Key *</Label>
                        <Input
                          id="content_key"
                          required
                          value={editingContent.content_key || ''}
                          onChange={(e) => setEditingContent({ ...editingContent, content_key: e.target.value })}
                          placeholder="name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="content_type">Content Type</Label>
                        <Select
                          value={editingContent.content_type || 'text'}
                          onValueChange={(value) => setEditingContent({ ...editingContent, content_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {contentTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="content_value">Content Value *</Label>
                        <Input
                          id="content_value"
                          required
                          value={editingContent.content_value || ''}
                          onChange={(e) => setEditingContent({ ...editingContent, content_value: e.target.value })}
                          placeholder="Enter content value"
                        />
                      </div>
                      <div>
                        <Label htmlFor="display_order">Display Order</Label>
                        <Input
                          id="display_order"
                          type="number"
                          value={editingContent.display_order || 0}
                          onChange={(e) => setEditingContent({ ...editingContent, display_order: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={editingId ? handleSave : handleAdd}>
                        <Save className="h-4 w-4 mr-2" />
                        {editingId ? 'Update' : 'Save'}
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {getFilteredContent().map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.content_key}</div>
                        <div className="text-sm text-gray-500">
                          {item.content_value} | Type: {item.content_type} | Order: {item.display_order}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default FooterContent; 
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HomepageMaterial {
  id: number;
  name: string;
  section_type: 'education' | 'languages';
  level_type: string;
  level_name_ar: string;
  level_name_en?: string;
  display_order: number;
  is_active: boolean;
}

const HomepageMaterials = () => {
  const [materials, setMaterials] = useState<HomepageMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Partial<HomepageMaterial>>({});
  const [activeTab, setActiveTab] = useState('education');
  const { toast } = useToast();

  const educationLevels = [
    { value: 'primary', label: 'الإبتدائي' },
    { value: 'middle', label: 'المتوسط' },
    { value: 'high', label: 'الثانوي' }
  ];

  const languageLevels = [
    { value: 'beginner', label: 'مبتدئ' },
    { value: 'intermediate', label: 'متوسط' },
    { value: 'advanced', label: 'متقدم' }
  ];

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/homepage-materials');
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      } else {
        throw new Error('Failed to fetch materials');
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast({
        title: "Error",
        description: "Failed to fetch materials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (material: HomepageMaterial) => {
    setEditingId(material.id);
    setEditingMaterial(material);
    // Switch to the correct tab if needed
    if (material.section_type !== activeTab) {
      setActiveTab(material.section_type);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingMaterial({});
    setActiveTab(activeTab); // Reset to current tab
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!editingMaterial.name || !editingMaterial.level_type) {
        toast({
          title: "Error",
          description: "Please fill in all required fields (Name and Level)",
          variant: "destructive",
        });
        return;
      }

      console.log('Updating material:', editingMaterial);
      console.log('Editing ID:', editingId);

      // Get the Arabic name for the selected level
      const allLevels = [...educationLevels, ...languageLevels];
      const selectedLevel = allLevels.find(level => level.value === editingMaterial.level_type);
      
      const updatedMaterial = {
        ...editingMaterial,
        level_name_ar: selectedLevel?.label || editingMaterial.level_name_ar
      };

      const response = await fetch(`/api/homepage-materials/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedMaterial)
      });

      console.log('Update response status:', response.status);

      if (response.ok) {
        toast({
          title: "Success",
          description: "Material updated successfully",
        });
        setEditingId(null);
        setEditingMaterial({});
        fetchMaterials();
      } else {
        const errorData = await response.text();
        console.error('Update response error:', errorData);
        throw new Error('Failed to update material');
      }
    } catch (error) {
      console.error('Error updating material:', error);
      toast({
        title: "Error",
        description: "Failed to update material",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      const response = await fetch(`/api/homepage-materials/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Material deleted successfully",
        });
        fetchMaterials();
      } else {
        throw new Error('Failed to delete material');
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: "Error",
        description: "Failed to delete material",
        variant: "destructive",
      });
    }
  };

  const handleAdd = async () => {
    console.log('handleAdd function called');
    console.log('Current editingMaterial:', editingMaterial);
    console.log('Current activeTab:', activeTab);
    
    try {
      // Validate required fields
      if (!editingMaterial.name || !editingMaterial.level_type) {
        toast({
          title: "Error",
          description: "Please fill in all required fields (Name and Level)",
          variant: "destructive",
        });
        return;
      }

      // Get the Arabic name for the selected level
      const allLevels = [...educationLevels, ...languageLevels];
      const selectedLevel = allLevels.find(level => level.value === editingMaterial.level_type);
      
      const newMaterial = {
        name: editingMaterial.name || '',
        section_type: activeTab as 'education' | 'languages',
        level_type: editingMaterial.level_type || '',
        level_name_ar: selectedLevel?.label || '',
        level_name_en: editingMaterial.level_name_en || '',
        display_order: editingMaterial.display_order || 0
      };

      console.log('Adding new material:', newMaterial);

      const response = await fetch('/api/homepage-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newMaterial)
      });

      console.log('Add response status:', response.status);

      if (response.ok) {
        toast({
          title: "Success",
          description: "Material added successfully",
        });
        setEditingMaterial({});
        setEditingId(null);
        fetchMaterials();
      } else {
        const errorData = await response.text();
        console.error('Add response error:', errorData);
        throw new Error('Failed to add material');
      }
    } catch (error) {
      console.error('Error adding material:', error);
      toast({
        title: "Error",
        description: "Failed to add material",
        variant: "destructive",
      });
    }
  };

  const getFilteredMaterials = () => {
    return materials.filter(material => material.section_type === activeTab);
  };

  const getLevelLabel = (levelType: string) => {
    const allLevels = [...educationLevels, ...languageLevels];
    return allLevels.find(level => level.value === levelType)?.label || levelType;
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
        <h1 className="text-3xl font-bold">Homepage Materials Management</h1>
        <Badge variant="outline">
          Total: {materials.length} materials
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="education">Education Materials</TabsTrigger>
          <TabsTrigger value="languages">Language Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="education" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Education Materials
                <Button onClick={() => {
                  console.log('Add Material button clicked for education');
                  setEditingMaterial({ section_type: 'education' });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingMaterial.section_type === 'education' && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-semibold mb-4">{editingId ? 'Edit Education Material' : 'Add New Education Material'}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Material Name (Arabic) *</Label>
                      <Input
                        id="name"
                        required
                        value={editingMaterial.name || ''}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                        placeholder="اللغة العربية"
                      />
                    </div>
                    <div>
                      <Label htmlFor="level_type">Level</Label>
                      <Select
                        value={editingMaterial.level_type || ''}
                        onValueChange={(value) => setEditingMaterial({ ...editingMaterial, level_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {educationLevels.map(level => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="display_order">Display Order</Label>
                      <Input
                        id="display_order"
                        type="number"
                        value={editingMaterial.display_order || 0}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, display_order: parseInt(e.target.value) })}
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
                {getFilteredMaterials().map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{material.name}</div>
                      <div className="text-sm text-gray-500">
                        Level: {getLevelLabel(material.level_type)} | Order: {material.display_order}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(material)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(material.id)}
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

        <TabsContent value="languages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Language Materials
                <Button onClick={() => {
                  console.log('Add Material button clicked for languages');
                  setEditingMaterial({ section_type: 'languages' });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingMaterial.section_type === 'languages' && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-semibold mb-4">{editingId ? 'Edit Language Material' : 'Add New Language Material'}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Material Name (Arabic) *</Label>
                      <Input
                        id="name"
                        required
                        value={editingMaterial.name || ''}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                        placeholder="اللغة الإنجليزية"
                      />
                    </div>
                    <div>
                      <Label htmlFor="level_type">Level</Label>
                      <Select
                        value={editingMaterial.level_type || ''}
                        onValueChange={(value) => setEditingMaterial({ ...editingMaterial, level_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {languageLevels.map(level => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="display_order">Display Order</Label>
                      <Input
                        id="display_order"
                        type="number"
                        value={editingMaterial.display_order || 0}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, display_order: parseInt(e.target.value) })}
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
                {getFilteredMaterials().map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{material.name}</div>
                      <div className="text-sm text-gray-500">
                        Level: {getLevelLabel(material.level_type)} | Order: {material.display_order}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(material)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(material.id)}
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
      </Tabs>
    </div>
  );
};

export default HomepageMaterials; 
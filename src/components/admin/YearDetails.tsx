import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, BookOpen, GraduationCap, Edit, Trash, ArrowLeft, FileText, X } from 'lucide-react';
import { toast } from '@/lib/toast';

interface YearDetailsProps {
  yearId: string;
  onClose: () => void;
}

interface YearData {
  year: {
    id: string;
    name: string;
    level_name: string;
  };
  specialities: Array<{
    id: string;
    name: string;
  }>;
  materials: Array<{
    id: string;
    name: string;
    price: number;
    specialityId?: string | null;
  }>;
}

const YearDetails: React.FC<YearDetailsProps> = ({ yearId, onClose }) => {
  const [yearData, setYearData] = useState<YearData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddSpecialityOpen, setIsAddSpecialityOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isEditSpecialityOpen, setIsEditSpecialityOpen] = useState(false);
  const [isEditMaterialOpen, setIsEditMaterialOpen] = useState(false);
  const [editingSpeciality, setEditingSpeciality] = useState<{id: string, name: string} | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<{id: string, name: string, price: number} | null>(null);
  const [specialityName, setSpecialityName] = useState('');
  const [materialName, setMaterialName] = useState('');
  const [materialPrice, setMaterialPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSpeciality, setCurrentSpeciality] = useState<{id: string, name: string} | null>(null);


  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchYearDetails = async () => {
    try {
      const res = await fetch(`/api/years/${yearId}/details`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch year details');
      const data = await res.json();
      setYearData(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load year details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYearDetails();
  }, [yearId]);

  const handleAddSpeciality = async () => {
    if (!specialityName.trim()) {
      toast.error('Please enter a speciality name');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/years/${yearId}/specialities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name: specialityName }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add speciality');
      }

      toast.success('Speciality added successfully');
      setSpecialityName('');
      setIsAddSpecialityOpen(false);
      fetchYearDetails(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || 'Failed to add speciality');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!materialName.trim()) {
      toast.error('Please enter a material name');
      return;
    }

    const priceValue = materialPrice ? parseFloat(materialPrice) : 0;
    if (materialPrice && (isNaN(priceValue) || priceValue < 0)) {
      toast.error('Please enter a valid price');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/years/${yearId}/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ 
          name: materialName, 
          price: priceValue,
          speciality_id: currentSpeciality?.id || null
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add material');
      }

      toast.success('Material added successfully');
      setMaterialName('');
      setMaterialPrice('');
      setIsAddMaterialOpen(false);
      fetchYearDetails(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || 'Failed to add material');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewSpeciality = (speciality: {id: string, name: string}) => {
    setCurrentSpeciality(speciality);
  };

  const handleViewMaterial = (material: {id: string, name: string, price: number}) => {
    // For now, just show a toast with material details
    // You can expand this to show more details or navigate to a material details page
    const priceText = material.price > 0 ? `${material.price} DZD` : 'Free';
    toast.info(`Viewing material: ${material.name} (${priceText})`);
  };

  const handleEditSpeciality = (speciality: {id: string, name: string}) => {
    setEditingSpeciality(speciality);
    setSpecialityName(speciality.name);
    setIsEditSpecialityOpen(true);
  };

  const handleEditMaterial = (material: {id: string, name: string, price: number}) => {
    setEditingMaterial(material);
    setMaterialName(material.name);
    setMaterialPrice(material.price.toString());
    setIsEditMaterialOpen(true);
  };

  const handleUpdateSpeciality = async () => {
    if (!editingSpeciality || !specialityName.trim()) {
      toast.error('Please enter a speciality name');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/specialities/${editingSpeciality.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name: specialityName }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update speciality');
      }

      toast.success('Speciality updated successfully');
      setSpecialityName('');
      setEditingSpeciality(null);
      setIsEditSpecialityOpen(false);
      fetchYearDetails(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || 'Failed to update speciality');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMaterial = async () => {
    if (!editingMaterial || !materialName.trim()) {
      toast.error('Please enter a material name');
      return;
    }

    const priceValue = materialPrice ? parseFloat(materialPrice) : 0;
    if (materialPrice && (isNaN(priceValue) || priceValue < 0)) {
      toast.error('Please enter a valid price');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/materials/${editingMaterial.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ 
          name: materialName, 
          price: priceValue 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update material');
      }

      toast.success('Material updated successfully');
      setMaterialName('');
      setMaterialPrice('');
      setEditingMaterial(null);
      setIsEditMaterialOpen(false);
      fetchYearDetails(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || 'Failed to update material');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSpeciality = async (speciality: {id: string, name: string}) => {
    if (!confirm(`Are you sure you want to delete "${speciality.name}"? This will also delete all associated materials.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/specialities/${speciality.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete speciality');
      }

      toast.success('Speciality deleted successfully');
      fetchYearDetails(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete speciality');
    }
  };

  const handleDeleteMaterial = async (material: {id: string, name: string}) => {
    if (!confirm(`Are you sure you want to delete "${material.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/materials/${material.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete material');
      }

      toast.success('Material deleted successfully');
      fetchYearDetails(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete material');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading year details...</p>
        </div>
      </div>
    );
  }

  if (!yearData) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load year details</p>
        <Button onClick={onClose} className="mt-4">Close</Button>
      </div>
    );
  }

  const hasSpecialities = yearData.specialities.length > 0;
  const hasMaterials = yearData.materials.length > 0;

  // Get materials for current speciality
  const specialityMaterials = currentSpeciality 
    ? yearData.materials.filter(material => material.specialityId === currentSpeciality.id)
    : [];

  // Debug logging
  if (currentSpeciality) {
    console.log('Current speciality:', currentSpeciality);
    console.log('All materials:', yearData.materials);
    console.log('Filtered materials for speciality:', specialityMaterials);
  }

  // If viewing a speciality, show its materials
  if (currentSpeciality) {
    return (
      <div className="space-y-6">
        {/* Speciality Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {currentSpeciality.name}
            </CardTitle>
            <CardDescription>
              Materials in {currentSpeciality.name}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Back Button */}
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={() => setCurrentSpeciality(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {yearData.year.name}
          </Button>
        </div>

        {/* Materials Section */}
        {specialityMaterials.length > 0 ? (
          <div className="pl-4 border-l border-gray-200">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Materials:</h4>
            <ul className="space-y-1">
              {specialityMaterials.map(material => (
                <li key={material.id}>
                  <div className="flex items-center justify-between py-1 px-2 rounded hover:bg-gray-50">
                    <div className="text-sm text-gray-600">{material.name}</div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditMaterial(material)}
                        className="h-4 w-4 p-0 hover:bg-blue-100 hover:text-blue-600"
                      >
                        <Edit className="h-2 w-2" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteMaterial(material)}
                        className="h-4 w-4 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash className="h-2 w-2" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="pl-4 border-l border-gray-200">
            <p className="text-sm text-gray-500 py-1">
              No materials defined
            </p>
          </div>
        )}

        {/* Add Material Dialog */}
        <Dialog open={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Material to {currentSpeciality.name}</DialogTitle>
              <DialogDescription>
                Create a new material for this speciality.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="material-name">Material Name</Label>
                <Input
                  id="material-name"
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  placeholder="e.g. Algebra, Web Development, Physics"
                />
              </div>
              <div>
                <Label htmlFor="material-price">Material Price (Optional)</Label>
                <Input
                  id="material-price"
                  type="number"
                  value={materialPrice}
                  onChange={(e) => setMaterialPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddMaterialOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMaterial} disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Material'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Year Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {yearData.year.name}
          </CardTitle>
          <CardDescription>
            Level: {yearData.year.level_name}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {!hasMaterials && (
          <Button 
            onClick={() => setIsAddSpecialityOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Speciality
          </Button>
        )}
        
        {!hasSpecialities && (
          <Button 
            onClick={() => setIsAddMaterialOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Material
          </Button>
        )}
      </div>

      {/* Specialities Section */}
      {hasSpecialities && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Specialities in {yearData.year.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {yearData.specialities.map((speciality) => (
                <Card key={speciality.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">{speciality.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-sm text-gray-500 mb-2">
                      Speciality
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSpeciality(speciality)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSpeciality(speciality)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Materials Section */}
      {hasMaterials && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Materials in {yearData.year.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {yearData.materials.map((material) => (
                <Card key={material.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">{material.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-sm text-gray-500 mb-2">
                      {material.price > 0 ? `${material.price} DZD` : 'Free'}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewMaterial(material)}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditMaterial(material)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMaterial(material)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!hasSpecialities && !hasMaterials && (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
            <p className="text-gray-600 mb-4">
              This year doesn't have any specialities or materials yet. Add one to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Speciality Dialog */}
      <Dialog open={isAddSpecialityOpen} onOpenChange={setIsAddSpecialityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Speciality</DialogTitle>
            <DialogDescription>
              Add a new speciality to {yearData.year.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="speciality-name">Speciality Name</Label>
              <Input
                id="speciality-name"
                placeholder="e.g. Computer Science, Mathematics"
                value={specialityName}
                onChange={(e) => setSpecialityName(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSpecialityOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSpeciality} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Speciality'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Material Dialog */}
      <Dialog open={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Material</DialogTitle>
            <DialogDescription>
              Add a new material to {yearData.year.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="material-name">Material Name</Label>
              <Input
                id="material-name"
                placeholder="e.g. Algebra, Web Development"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="material-price">Price (Optional)</Label>
              <Input
                id="material-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={materialPrice}
                onChange={(e) => setMaterialPrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMaterialOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMaterial} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Material'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Speciality Dialog */}
      <Dialog open={isEditSpecialityOpen} onOpenChange={setIsEditSpecialityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Speciality</DialogTitle>
            <DialogDescription>
              Update speciality details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-speciality-name">Speciality Name</Label>
              <Input
                id="edit-speciality-name"
                placeholder="e.g. Computer Science, Mathematics"
                value={specialityName}
                onChange={(e) => setSpecialityName(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditSpecialityOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSpeciality} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Speciality'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Material Dialog */}
      <Dialog open={isEditMaterialOpen} onOpenChange={setIsEditMaterialOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Material</DialogTitle>
            <DialogDescription>
              Update material details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-material-name">Material Name</Label>
              <Input
                id="edit-material-name"
                placeholder="e.g. Algebra, Web Development"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-material-price">Price (Optional)</Label>
              <Input
                id="edit-material-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={materialPrice}
                onChange={(e) => setMaterialPrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditMaterialOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMaterial} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Material'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Button */}
      <div className="flex justify-end">
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      </div>
    </div>
  );
};

export default YearDetails; 
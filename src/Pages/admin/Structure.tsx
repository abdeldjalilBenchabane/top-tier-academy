import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { structureAPI } from '@/services/api';
import { Level, Year, Speciality, Material } from '@/types';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';
import { 
  Folders, 
  FolderPlus, 
  Plus, 
  Edit, 
  Trash,
  BookOpen
} from 'lucide-react';
import LevelForm from '@/components/forms/LevelForm';
import YearForm from '@/components/forms/YearForm';
import SpecialityForm from '@/components/forms/SpecialityForm';
import MaterialForm from '@/components/forms/MaterialForm';
import { toast } from '@/lib/toast';

type FormType = 'level' | 'year' | 'speciality' | 'material';

const Structure = () => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [currentYear, setCurrentYear] = useState<Year | null>(null);
  const [currentSpeciality, setCurrentSpeciality] = useState<Speciality | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState<FormType | null>(null);
  const [selectedAccordion, setSelectedAccordion] = useState<string[]>([]);
  
  // Edit state
  const [editingItem, setEditingItem] = useState<{
    type: FormType;
    data: Level | Year | Speciality | Material;
  } | null>(null);
  
  const navigate = useNavigate();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [levelsData, yearsData, specialitiesData, materialsData] = await Promise.all([
        structureAPI.getLevels(),
        structureAPI.getYears(),
        structureAPI.getSpecialities(),
        structureAPI.getMaterials()
      ]);
      
      console.log('Fetched data:', {
        levels: levelsData,
        years: yearsData,
        specialities: specialitiesData,
        materials: materialsData
      });
      
      setLevels(levelsData);
      setYears(yearsData);
      setSpecialities(specialitiesData);
      setMaterials(materialsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load structure data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFormSuccess = () => {
    setShowForm(null);
    setEditingItem(null);
    fetchData();
  };

  const getYearsForLevel = (levelId: string) => {
    return years.filter(year => year.levelId === levelId);
  };

  const getSpecialitiesForYear = (yearId: string) => {
    return specialities.filter(speciality => speciality.yearId === yearId);
  };

  const getMaterialsForSpeciality = (specialityId: string) => {
    return materials.filter(material => material.specialityId === specialityId);
  };

  const handleLevelClick = (level: Level) => {
    setCurrentLevel(level);
    setCurrentYear(null);
    setCurrentSpeciality(null);
    
    // Ensure the accordion is open
    if (!selectedAccordion.includes(level.id)) {
      setSelectedAccordion([...selectedAccordion, level.id]);
    }
  };

  const handleYearClick = (year: Year) => {
    setCurrentYear(year);
    setCurrentSpeciality(null);
    
    // Ensure the accordion is open
    if (!selectedAccordion.includes(year.id)) {
      setSelectedAccordion([...selectedAccordion, year.id]);
    }
  };

  const handleSpecialityClick = (speciality: Speciality) => {
    setCurrentSpeciality(speciality);
  };

  // Edit handlers
  const handleEditLevel = (level: Level) => {
    setEditingItem({ type: 'level', data: level });
  };

  const handleEditYear = (year: Year) => {
    setEditingItem({ type: 'year', data: year });
  };

  const handleEditSpeciality = (speciality: Speciality) => {
    setEditingItem({ type: 'speciality', data: speciality });
  };

  const handleEditMaterial = (material: Material) => {
    setEditingItem({ type: 'material', data: material });
  };

  // Delete handlers
  const handleDeleteLevel = async (level: Level) => {
    if (!confirm(`Are you sure you want to delete "${level.name}"? This will also delete all associated years, specialities, and materials.`)) {
      return;
    }
    
    try {
      await structureAPI.deleteLevel(level.id);
      toast.success('Level deleted successfully');
      fetchData();
      
      // Clear current selection if deleted
      if (currentLevel?.id === level.id) {
        setCurrentLevel(null);
        setCurrentYear(null);
        setCurrentSpeciality(null);
      }
    } catch (error: any) {
      console.error('Failed to delete level:', error);
      toast.error(error.message || 'Failed to delete level');
    }
  };

  const handleDeleteYear = async (year: Year) => {
    if (!confirm(`Are you sure you want to delete "${year.name}"? This will also delete all associated specialities and materials.`)) {
      return;
    }
    
    try {
      await structureAPI.deleteYear(year.id);
      toast.success('Year deleted successfully');
      fetchData();
      
      // Clear current selection if deleted
      if (currentYear?.id === year.id) {
        setCurrentYear(null);
        setCurrentSpeciality(null);
      }
    } catch (error: any) {
      console.error('Failed to delete year:', error);
      toast.error(error.message || 'Failed to delete year');
    }
  };

  const handleDeleteSpeciality = async (speciality: Speciality) => {
    if (!confirm(`Are you sure you want to delete "${speciality.name}"? This will also delete all associated materials.`)) {
      return;
    }
    
    try {
      await structureAPI.deleteSpeciality(speciality.id);
      toast.success('Speciality deleted successfully');
      fetchData();
      
      // Clear current selection if deleted
      if (currentSpeciality?.id === speciality.id) {
        setCurrentSpeciality(null);
      }
    } catch (error: any) {
      console.error('Failed to delete speciality:', error);
      toast.error(error.message || 'Failed to delete speciality');
    }
  };

  const handleDeleteMaterial = async (material: Material) => {
    if (!confirm(`Are you sure you want to delete "${material.name}"?`)) {
      return;
    }
    
    try {
      await structureAPI.deleteMaterial(material.id);
      toast.success('Material deleted successfully');
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete material:', error);
      toast.error(error.message || 'Failed to delete material');
    }
  };

  const renderForm = () => {
    if (editingItem) {
      // Render edit form
      switch (editingItem.type) {
        case 'level':
          return (
            <LevelForm 
              onSuccess={handleFormSuccess} 
              onCancel={() => setEditingItem(null)} 
              level={editingItem.data as Level}
              isEditing={true}
            />
          );
        case 'year':
          return (
            <YearForm 
              onSuccess={handleFormSuccess} 
              onCancel={() => setEditingItem(null)} 
              year={editingItem.data as Year}
              isEditing={true}
            />
          );
        case 'speciality':
          return (
            <SpecialityForm 
              onSuccess={handleFormSuccess} 
              onCancel={() => setEditingItem(null)} 
              speciality={editingItem.data as Speciality}
              isEditing={true}
            />
          );
        case 'material':
          return (
            <MaterialForm 
              onSuccess={handleFormSuccess} 
              onCancel={() => setEditingItem(null)} 
              material={editingItem.data as Material}
              isEditing={true}
            />
          );
        default:
          return null;
      }
    }
    
    if (!showForm) return null;
    
    // Render create form
    switch (showForm) {
      case 'level':
        return <LevelForm onSuccess={handleFormSuccess} onCancel={() => setShowForm(null)} />;
      case 'year':
        return (
          <YearForm 
            onSuccess={handleFormSuccess} 
            onCancel={() => setShowForm(null)} 
            preselectedLevelId={currentLevel?.id}
          />
        );
      case 'speciality':
        return (
          <SpecialityForm 
            onSuccess={handleFormSuccess} 
            onCancel={() => setShowForm(null)} 
            preselectedYearId={currentYear?.id}
          />
        );
      case 'material':
        return (
          <MaterialForm 
            onSuccess={handleFormSuccess} 
            onCancel={() => setShowForm(null)} 
            preselectedSpecialityId={currentSpeciality?.id}
          />
        );
      default:
        return null;
    }
  };

  // No data state
  if (!isLoading && levels.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Educational Structure" 
          description="Manage your school's hierarchical education system"
        />
        
        <EmptyState
          title="No Educational Structure Defined"
          description="Start by creating your first education level, such as 'High School' or 'Middle School'."
          icon={<Folders className="h-12 w-12 text-gray-400" />}
          action={{
            label: "Create First Level",
            onClick: () => setShowForm('level')
          }}
        />
        
        <Dialog open={!!showForm} onOpenChange={() => setShowForm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Level</DialogTitle>
            </DialogHeader>
            {renderForm()}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Educational Structure" 
        description="Manage your school's hierarchical education system"
        action={
          <Button onClick={() => setShowForm('level')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Level
          </Button>
        }
      />
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left panel - Navigation tree */}
          <div className="md:col-span-4 lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Structure Hierarchy</CardTitle>
                <CardDescription>
                  Navigate through your educational structure
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Accordion 
                  type="multiple" 
                  value={selectedAccordion}
                  onValueChange={setSelectedAccordion}
                  className="w-full"
                >
                  {levels.map(level => (
                    <AccordionItem key={level.id} value={level.id}>
                      <div className="flex items-center justify-between">
                        <AccordionTrigger
                          onClick={() => handleLevelClick(level)}
                          className={`flex-1 ${currentLevel?.id === level.id ? 'font-medium text-blue-600' : ''}`}
                        >
                          {level.name}
                        </AccordionTrigger>
                        <div className="flex items-center gap-1 pr-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditLevel(level)}
                            className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLevel(level)}
                            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <AccordionContent>
                        <div className="pl-4 border-l border-gray-200">
                          {getYearsForLevel(level.id).length > 0 ? (
                            <Accordion 
                              type="multiple" 
                              value={selectedAccordion}
                              onValueChange={setSelectedAccordion}
                              className="w-full"
                            >
                              {getYearsForLevel(level.id).map(year => (
                                <AccordionItem key={year.id} value={year.id}>
                                  <div className="flex items-center justify-between">
                                    <AccordionTrigger
                                      onClick={() => handleYearClick(year)}
                                      className={`flex-1 ${currentYear?.id === year.id ? 'font-medium text-blue-600' : ''}`}
                                    >
                                      {year.name}
                                    </AccordionTrigger>
                                    <div className="flex items-center gap-1 pr-4">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditYear(year)}
                                        className="h-5 w-5 p-0 hover:bg-blue-100 hover:text-blue-600"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteYear(year)}
                                        className="h-5 w-5 p-0 hover:bg-red-100 hover:text-red-600"
                                      >
                                        <Trash className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <AccordionContent>
                                    <div className="pl-4 border-l border-gray-200">
                                      {getSpecialitiesForYear(year.id).length > 0 ? (
                                        <ul className="space-y-1">
                                          {getSpecialitiesForYear(year.id).map(speciality => (
                                            <li key={speciality.id}>
                                              <div className="flex items-center justify-between py-1 px-2 rounded hover:bg-gray-50">
                                                <div
                                                  onClick={() => handleSpecialityClick(speciality)}
                                                  className={`text-left text-sm flex-1 cursor-pointer ${
                                                    currentSpeciality?.id === speciality.id
                                                      ? 'font-medium text-blue-600'
                                                      : ''
                                                  }`}
                                                >
                                                  {speciality.name}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditSpeciality(speciality)}
                                                    className="h-4 w-4 p-0 hover:bg-blue-100 hover:text-blue-600"
                                                  >
                                                    <Edit className="h-2 w-2" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteSpeciality(speciality)}
                                                    className="h-4 w-4 p-0 hover:bg-red-100 hover:text-red-600"
                                                  >
                                                    <Trash className="h-2 w-2" />
                                                  </Button>
                                                </div>
                                              </div>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-sm text-gray-500 py-1">
                                          No specialities defined
                                        </p>
                                      )}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          ) : (
                            <p className="text-sm text-gray-500 py-1">
                              No years defined
                            </p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
          
          {/* Right panel - Details and actions */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">
            {!currentLevel ? (
              <Card>
                <CardContent className="pt-6">
                  <EmptyState
                    title="Select a Level"
                    description="Click on a level from the structure hierarchy to view and manage its details."
                    icon={<Folders className="h-12 w-12 text-gray-400" />}
                  />
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{currentLevel.name}</CardTitle>
                        <CardDescription>
                          Level details and management
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowForm('year')}
                        size="sm"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Year
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Years in {currentLevel.name}</h3>
                      
                      {getYearsForLevel(currentLevel.id).length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {getYearsForLevel(currentLevel.id).map(year => (
                            <Card key={year.id} className="overflow-hidden">
                              <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-base">{year.name}</CardTitle>
                              </CardHeader>
                              <CardContent className="p-4 pt-2">
                                <p className="text-sm text-gray-500 mb-2">
                                  {getSpecialitiesForYear(year.id).length} specialities
                                </p>
                              </CardContent>
                              <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleYearClick(year)}
                                >
                                  View
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditYear(year)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteYear(year)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash className="h-3 w-3" />
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          title="No Years Defined"
                          description={`Add your first year to ${currentLevel.name}`}
                          action={{
                            label: "Add Year",
                            onClick: () => setShowForm('year')
                          }}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {currentYear && (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{currentYear.name}</CardTitle>
                          <CardDescription>
                            Year details and specialities
                          </CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowForm('speciality')}
                          size="sm"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Speciality
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Specialities in {currentYear.name}</h3>
                        
                        {getSpecialitiesForYear(currentYear.id).length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {getSpecialitiesForYear(currentYear.id).map(speciality => (
                              <Card key={speciality.id} className="overflow-hidden">
                                <CardHeader className="p-4 pb-2">
                                  <CardTitle className="text-base">{speciality.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                  <p className="text-sm text-gray-500 mb-2">
                                    {getMaterialsForSpeciality(speciality.id).length} materials
                                  </p>
                                </CardContent>
                                <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSpecialityClick(speciality)}
                                  >
                                    View
                                  </Button>
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
                        ) : (
                          <EmptyState
                            title="No Specialities Defined"
                            description={`Add your first speciality to ${currentYear.name}`}
                            action={{
                              label: "Add Speciality",
                              onClick: () => setShowForm('speciality')
                            }}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {currentSpeciality && (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{currentSpeciality.name}</CardTitle>
                          <CardDescription>
                            Speciality details and materials
                          </CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowForm('material')}
                          size="sm"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Material
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Materials in {currentSpeciality.name}</h3>
                        
                        {getMaterialsForSpeciality(currentSpeciality.id).length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {getMaterialsForSpeciality(currentSpeciality.id).map(material => (
                              <Card key={material.id} className="overflow-hidden">
                                <CardHeader className="p-4 pb-2">
                                  <CardTitle className="text-base">{material.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                  <div className="flex items-center text-sm text-gray-500">
                                    <BookOpen className="h-4 w-4 mr-1" />
                                    <span>0 courses</span>
                                  </div>
                                </CardContent>
                                <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      navigate(`/admin/courses?materialId=${material.id}`);
                                    }}
                                  >
                                    View Courses
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
                        ) : (
                          <EmptyState
                            title="No Materials Defined"
                            description={`Add your first material to ${currentSpeciality.name}`}
                            action={{
                              label: "Add Material",
                              onClick: () => setShowForm('material')
                            }}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      )}
      
      <Dialog open={!!showForm || !!editingItem} onOpenChange={(open) => {
        if (!open) {
          setShowForm(null);
          setEditingItem(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem && `Edit ${editingItem.type.charAt(0).toUpperCase() + editingItem.type.slice(1)}`}
              {showForm === 'level' && 'Create New Level'}
              {showForm === 'year' && 'Create New Year'}
              {showForm === 'speciality' && 'Create New Speciality'}
              {showForm === 'material' && 'Create New Material'}
            </DialogTitle>
            <DialogDescription>
              {editingItem && `Update the details for this ${editingItem.type}`}
              {showForm === 'level' && 'Create a new education level'}
              {showForm === 'year' && 'Create a new year within the selected level'}
              {showForm === 'speciality' && 'Create a new speciality within the selected year'}
              {showForm === 'material' && 'Create a new material within the selected speciality'}
            </DialogDescription>
          </DialogHeader>
          {renderForm()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Structure;

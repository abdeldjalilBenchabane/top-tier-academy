import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/lib/toast';
import { api } from '@/lib/api';
import { 
  DollarSign, 
  BookOpen, 
  Languages, 
  Video, 
  Edit, 
  Save, 
  X, 
  Plus,
  TrendingUp,
  School,
  Globe,
  Clock
} from 'lucide-react';

interface Material {
  id: string;
  name: string;
  price: number;
  specialityId?: string;
  yearId?: string;
  speciality_name?: string;
  year_name?: string;
  level_name?: string;
}

interface LanguageCourse {
  id: string;
  title: string;
  language_name: string;
  language_level_name: string;
  price: number;
}

interface LiveSection {
  id: string;
  title: string;
  price: number;
  root_type: 'education' | 'language';
  material_name?: string;
  language_name?: string;
  language_level_name?: string;
  level_name?: string;
  year_name?: string;
  speciality_name?: string;
  material_name_full?: string;
}

interface LiveSession {
  id: string;
  title: string;
  price: number;
  material_name?: string;
}

const PricingManagement = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [languageCourses, setLanguageCourses] = useState<LanguageCourse[]>([]);
  const [liveSections, setLiveSections] = useState<LiveSection[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingLanguageCourse, setEditingLanguageCourse] = useState<LanguageCourse | null>(null);
  const [editingLiveSection, setEditingLiveSection] = useState<LiveSection | null>(null);
  const [editingLiveSession, setEditingLiveSession] = useState<LiveSession | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchAllPricingData();
  }, []);

  const fetchAllPricingData = async () => {
    try {
      setLoading(true);
      
      // Fetch all pricing data from the comprehensive endpoint
      const pricingData = await api.get('/admin/pricing/overview');
      
      setMaterials(pricingData.materials || []);
      setLanguageCourses(pricingData.languageCourses || []);
      setLiveSections(pricingData.liveSections || []);
      setLiveSessions(pricingData.liveSessions || []);

    } catch (error) {
      console.error('Error fetching pricing data:', error);
      toast.error('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPrice = (item: any, type: string) => {
    setNewPrice(item.price?.toString() || '0');
    switch (type) {
      case 'material':
        setEditingMaterial(item);
        break;
      case 'languageCourse':
        setEditingLanguageCourse(item);
        break;
      case 'liveSection':
        setEditingLiveSection(item);
        break;
      case 'liveSession':
        setEditingLiveSession(item);
        break;
    }
    setIsEditDialogOpen(true);
  };

  const handleSavePrice = async () => {
    try {
      const priceValue = parseFloat(newPrice);
      if (isNaN(priceValue) || priceValue < 0) {
        toast.error('Please enter a valid price');
        return;
      }

      if (editingMaterial) {
        await api.put(`/admin/pricing/materials/${editingMaterial.id}`, { price: priceValue });
        setMaterials(materials.map(m => 
          m.id === editingMaterial.id ? { ...m, price: priceValue } : m
        ));
        toast.success('Material price updated successfully');
      } else if (editingLanguageCourse) {
        // Update language course price
        await api.put(`/admin/pricing/language-courses/${editingLanguageCourse.id}`, {
          price: priceValue,
          language_level_id: editingLanguageCourse.language_level_id
        });
        setLanguageCourses(languageCourses.map(c => 
          c.id === editingLanguageCourse.id ? { ...c, price: priceValue } : c
        ));
        toast.success('Language course price updated successfully');
      } else if (editingLiveSection) {
        await api.put(`/admin/pricing/live-sections/${editingLiveSection.id}`, { price: priceValue });
        setLiveSections(liveSections.map(s => 
          s.id === editingLiveSection.id ? { ...s, price: priceValue } : s
        ));
        toast.success('Live section price updated successfully');
      } else if (editingLiveSession) {
        await api.put(`/admin/pricing/live-sessions/${editingLiveSession.id}`, { price: priceValue });
        setLiveSessions(liveSessions.map(s => 
          s.id === editingLiveSession.id ? { ...s, price: priceValue } : s
        ));
        toast.success('Live session price updated successfully');
      }

      setIsEditDialogOpen(false);
      setEditingMaterial(null);
      setEditingLanguageCourse(null);
      setEditingLiveSection(null);
      setEditingLiveSession(null);
      setNewPrice('');
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Failed to update price');
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} DZD`;
  };

  const getTotalRevenue = () => {
    const materialRevenue = materials.reduce((sum, m) => sum + (parseFloat(m.price) || 0), 0);
    const languageRevenue = languageCourses.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0);
    const liveSectionRevenue = liveSections.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
    const liveSessionRevenue = liveSessions.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
    
    return materialRevenue + languageRevenue + liveSectionRevenue + liveSessionRevenue;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pricing Management</h1>
            <p className="text-muted-foreground">
              Manage prices for all courses and live sessions
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pricing Management</h1>
          <p className="text-muted-foreground">
            Manage prices for all courses and live sessions across education and language paths
          </p>
        </div>
        <Button onClick={fetchAllPricingData} variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Education Materials</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materials.length}</div>
            <p className="text-xs text-muted-foreground">
              Total: {formatPrice(materials.reduce((sum, m) => sum + (parseFloat(m.price) || 0), 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Language Courses</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{languageCourses.length}</div>
            <p className="text-xs text-muted-foreground">
              Total: {formatPrice(languageCourses.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Sections</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveSections.length}</div>
            <p className="text-xs text-muted-foreground">
              Total: {formatPrice(liveSections.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Total: {formatPrice(liveSessions.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Tabs */}
      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            Education Materials
          </TabsTrigger>
          <TabsTrigger value="languages" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Language Courses
          </TabsTrigger>
          <TabsTrigger value="liveSections" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Live Sections
          </TabsTrigger>
          <TabsTrigger value="liveSessions" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Live Sessions
          </TabsTrigger>
        </TabsList>

        {/* Education Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                Education Materials Pricing (3-Path & 4-Path)
              </CardTitle>
              <CardDescription>
                Manage prices for educational materials in both 3-path (direct to year) and 4-path (year → speciality → material) structures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material Name</TableHead>
                    <TableHead>Path Structure</TableHead>
                    <TableHead>Current Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {material.specialityId ? (
                            <>
                              <Badge variant="secondary">4-Path</Badge>
                              <span className="text-sm text-muted-foreground">
                                {material.level_name} → {material.year_name} → {material.speciality_name}
                              </span>
                            </>
                          ) : (
                            <>
                              <Badge variant="outline">3-Path</Badge>
                              <span className="text-sm text-muted-foreground">
                                {material.level_name} → {material.year_name}
                              </span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        {formatPrice(material.price || 0)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPrice(material, 'material')}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language Courses Tab */}
        <TabsContent value="languages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language Courses Pricing
              </CardTitle>
              <CardDescription>
                Manage prices for language courses across different languages and proficiency levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Title</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Current Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {languageCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{course.language_name}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{course.language_level_name}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        {formatPrice(course.price || 0)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPrice(course, 'languageCourse')}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Sections Tab */}
        <TabsContent value="liveSections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Live Sections Pricing (الحصص المباشرة)
              </CardTitle>
              <CardDescription>
                Manage prices for live sections in both education and language paths
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Current Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liveSections.map((section) => (
                    <TableRow key={section.id}>
                      <TableCell className="font-medium">{section.title}</TableCell>
                      <TableCell>
                        <Badge variant={section.root_type === 'education' ? 'default' : 'secondary'}>
                          {section.root_type === 'education' ? 'Education' : 'Language'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {section.root_type === 'education' 
                            ? (section.level_name && section.year_name 
                                ? `${section.level_name} → ${section.year_name}${section.speciality_name ? ` → ${section.speciality_name}` : ''} → ${section.material_name_full || 'No material'}`
                                : section.material_name_full || 'No material assigned')
                            : `${section.language_name} - ${section.language_level_name}`
                          }
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        {formatPrice(section.price || 0)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPrice(section, 'liveSection')}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Sessions Tab */}
        <TabsContent value="liveSessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Live Sessions Pricing
              </CardTitle>
              <CardDescription>
                Manage prices for individual live sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session Title</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Current Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liveSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.title}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {session.material_name || 'No material assigned'}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        {formatPrice(session.price || 0)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPrice(session, 'liveSession')}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Price Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Price</DialogTitle>
            <DialogDescription>
              Update the price for this item. All prices are in DZD.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="price">New Price (DZD)</Label>
              <Input
                id="price"
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSavePrice}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingManagement; 
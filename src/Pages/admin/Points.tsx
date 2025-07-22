import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Save, Coins, DollarSign, TrendingUp, Users, Package, Settings, Loader2, Zap, X, Check } from 'lucide-react';
import { toast } from '@/lib/toast';

interface PointPackage {
  id?: number;
  name: string;
  points: number;
  price: number;
  currency: string;
  is_active: boolean;
}

const defaultCurrency = 'DZD';

const AdminPoints: React.FC = () => {
  const [packages, setPackages] = useState<PointPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PointPackage | null>(null);
  const [newPack, setNewPack] = useState<PointPackage>({
    name: '',
    points: 0,
    price: 0,
    currency: defaultCurrency,
    is_active: true,
  });

  // Analytics data
  const [analytics, setAnalytics] = useState({
    totalPackages: 0,
    activePackages: 0,
    totalPoints: 0,
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    // Calculate analytics
    const totalPackages = packages.length;
    const activePackages = packages.filter(p => p.is_active).length;
    const totalPoints = packages.reduce((sum, p) => sum + p.points, 0);
    setAnalytics({
      totalPackages,
      activePackages,
      totalPoints,
    });
  }, [packages]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/points/packages/all', {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      setPackages(data.packages || []);
    } catch (e) {
      setError('Failed to load packages');
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (idx: number, field: keyof PointPackage, value: any) => {
    setPackages(pkgs => pkgs.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const handleSave = async (idx: number) => {
    setSaving(true);
    setError(null);
    const pack = packages[idx];
    try {
      const res = await fetch(`/api/points/packages/${pack.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(pack),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error saving');
      toast.success('Package saved successfully');
      fetchPackages();
    } catch (e: any) {
      setError(e.message || 'Error saving');
      toast.error(e.message || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/points/packages/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error deleting');
      toast.success('Package deleted successfully');
      fetchPackages();
    } catch (e: any) {
      setError(e.message || 'Error deleting');
      toast.error(e.message || 'Error deleting');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newPack.name || !newPack.points || !newPack.price) {
      toast.error('Please fill all fields');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/points/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(newPack),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error adding');
      toast.success('Package added successfully');
      setNewPack({ name: '', points: 0, price: 0, currency: defaultCurrency, is_active: true });
      setIsDialogOpen(false);
      fetchPackages();
    } catch (e: any) {
      setError(e.message || 'Error adding');
      toast.error(e.message || 'Error adding');
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (pack: PointPackage) => {
    setEditingPackage(pack);
    setIsDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingPackage || !editingPackage.name || !editingPackage.points || !editingPackage.price) {
      toast.error('Please fill all fields');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/points/packages/${editingPackage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(editingPackage),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error saving');
      toast.success('Package saved successfully');
      setEditingPackage(null);
      setIsDialogOpen(false);
      fetchPackages();
    } catch (e: any) {
      setError(e.message || 'Error saving');
      toast.error(e.message || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const togglePackageStatus = async (id?: number) => {
    if (!id) return;
    const pack = packages.find(p => p.id === id);
    if (!pack) return;
    try {
      const res = await fetch(`/api/points/packages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ ...pack, is_active: !pack.is_active }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error updating');
      toast.success(`Package ${pack.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchPackages();
    } catch (e: any) {
      toast.error(e.message || 'Error updating');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Point Packages Management</h2>
          <p className="text-gray-600">Manage available point packages for purchase</p>
        </div>
        <Button onClick={() => {
          setEditingPackage(null);
          setNewPack({ name: '', points: 0, price: 0, currency: defaultCurrency, is_active: true });
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Package
        </Button>
      </div>
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Packages</p>
                <p className="text-2xl font-bold">{analytics.totalPackages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Packages</p>
                <p className="text-2xl font-bold">{analytics.activePackages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-2xl font-bold">{analytics.totalPoints.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Packages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Point Packages</CardTitle>
          <CardDescription>Manage all available point packages</CardDescription>
        </CardHeader>
        <CardContent>
      {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchPackages} variant="outline">
                Retry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package Name</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
            {packages.map((pack, idx) => (
                  <TableRow key={pack.id}>
                    <TableCell>
                      <Input 
                        value={pack.name} 
                        onChange={e => handleChange(idx, 'name', e.target.value)}
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={pack.points} 
                        onChange={e => handleChange(idx, 'points', parseInt(e.target.value))}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={pack.price} 
                        onChange={e => handleChange(idx, 'price', parseFloat(e.target.value))}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        value={pack.currency} 
                        onChange={e => handleChange(idx, 'currency', e.target.value)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={pack.is_active}
                          onCheckedChange={() => togglePackageStatus(pack.id)}
                        />
                        <Badge variant={pack.is_active ? "default" : "secondary"}>
                          {pack.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(pack)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSave(idx)}
                          disabled={saving}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(pack.id)}
                          disabled={saving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Edit Package' : 'Add New Package'}
            </DialogTitle>
            <DialogDescription>
              {editingPackage ? 'Edit package details' : 'Enter new package details'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Package Name</Label>
              <Input
                id="name"
                value={editingPackage ? editingPackage.name : newPack.name}
                onChange={e => editingPackage 
                  ? setEditingPackage({ ...editingPackage, name: e.target.value })
                  : setNewPack({ ...newPack, name: e.target.value })
                }
                placeholder="e.g., Basic Package"
              />
            </div>
            <div>
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                value={editingPackage ? editingPackage.points : newPack.points}
                onChange={e => editingPackage 
                  ? setEditingPackage({ ...editingPackage, points: parseInt(e.target.value) })
                  : setNewPack({ ...newPack, points: parseInt(e.target.value) })
                }
                placeholder="100"
              />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={editingPackage ? editingPackage.price : newPack.price}
                onChange={e => editingPackage 
                  ? setEditingPackage({ ...editingPackage, price: parseFloat(e.target.value) })
                  : setNewPack({ ...newPack, price: parseFloat(e.target.value) })
                }
                placeholder="1000"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={editingPackage ? editingPackage.currency : newPack.currency}
                onChange={e => editingPackage 
                  ? setEditingPackage({ ...editingPackage, currency: e.target.value })
                  : setNewPack({ ...newPack, currency: e.target.value })
                }
                placeholder="DZD"
              />
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <Switch
                id="is_active"
                checked={editingPackage ? editingPackage.is_active : newPack.is_active}
                onCheckedChange={checked => editingPackage 
                  ? setEditingPackage({ ...editingPackage, is_active: checked })
                  : setNewPack({ ...newPack, is_active: checked })
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={editingPackage ? handleEditSave : handleAdd}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (editingPackage ? 'Save Changes' : 'Add Package')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPoints; 
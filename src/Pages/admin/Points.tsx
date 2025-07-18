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
import { Plus, Edit, Trash2, Save, Coins, DollarSign, TrendingUp, Users, Package, Settings } from 'lucide-react';
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
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
      if (!data.success) throw new Error(data.error || 'خطأ في الحفظ');
      toast.success('تم حفظ الباقة بنجاح');
      setEditingId(null);
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
      setShowAddForm(false);
      fetchPackages();
    } catch (e: any) {
      setError(e.message || 'Error adding');
      toast.error(e.message || 'Error adding');
    } finally {
      setSaving(false);
    }
  };

  const getValuePerPoint = (price: number, points: number) => {
    if (points === 0) return 0;
    return (price / points).toFixed(2);
  };

  const getPackageIcon = (points: number) => {
    if (points <= 100) return <Coins className="h-5 w-5" />;
    if (points <= 500) return <Package className="h-5 w-5" />;
    if (points <= 1000) return <Zap className="h-5 w-5" />;
    return <TrendingUp className="h-5 w-5" />;
  };

  const getPackageColor = (points: number) => {
    if (points <= 100) return 'bg-blue-500';
    if (points <= 500) return 'bg-green-500';
    if (points <= 1000) return 'bg-purple-500';
    return 'bg-orange-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">جاري تحميل الباقات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة باقات النقاط</h1>
          <p className="text-gray-600 mt-1">إدارة باقات النقاط المتاحة للشراء</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          إضافة باقة جديدة
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <X className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Add New Package Form */}
      {showAddForm && (
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Plus className="h-5 w-5 mr-2" />
              إضافة باقة جديدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="name">اسم الباقة</Label>
                <Input
                  id="name"
                  value={newPack.name}
                  onChange={e => setNewPack(p => ({ ...p, name: e.target.value }))}
                  placeholder="مثال: الباقة الأساسية"
                />
              </div>
              <div>
                <Label htmlFor="points">عدد النقاط</Label>
                <Input
                  id="points"
                  type="number"
                  value={newPack.points}
                  onChange={e => setNewPack(p => ({ ...p, points: parseInt(e.target.value) || 0 }))}
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="price">السعر</Label>
                <Input
                  id="price"
                  type="number"
                  value={newPack.price}
                  onChange={e => setNewPack(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="1000"
                />
              </div>
              <div>
                <Label htmlFor="currency">العملة</Label>
                <Input
                  id="currency"
                  value={newPack.currency}
                  onChange={e => setNewPack(p => ({ ...p, currency: e.target.value }))}
                  placeholder="DZD"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <Switch
                id="is_active"
                checked={newPack.is_active}
                onCheckedChange={(checked) => setNewPack(p => ({ ...p, is_active: checked }))}
              />
              <Label htmlFor="is_active">مفعلة</Label>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={handleAdd} 
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                إضافة الباقة
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
                disabled={saving}
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pack, idx) => (
          <Card key={pack.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${getPackageColor(pack.points)} text-white`}>
                    {getPackageIcon(pack.points)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{pack.name}</CardTitle>
                    <Badge variant={pack.is_active ? "default" : "secondary"} className="mt-1">
                      {pack.is_active ? 'مفعلة' : 'معطلة'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Package Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{pack.points}</div>
                  <div className="text-sm text-gray-600">نقطة</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{pack.price}</div>
                  <div className="text-sm text-gray-600">{pack.currency}</div>
                </div>
              </div>
              
              {/* Value per point */}
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-700">
                  قيمة النقطة: {getValuePerPoint(pack.price, pack.points)} {pack.currency}
                </div>
              </div>

              {/* Edit Mode */}
              {editingId === pack.id ? (
                <div className="space-y-3">
                  <Input
                    value={pack.name}
                    onChange={e => handleChange(idx, 'name', e.target.value)}
                    placeholder="اسم الباقة"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      value={pack.points}
                      onChange={e => handleChange(idx, 'points', parseInt(e.target.value) || 0)}
                      placeholder="النقاط"
                    />
                    <Input
                      type="number"
                      value={pack.price}
                      onChange={e => handleChange(idx, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="السعر"
                    />
                  </div>
                  <Input
                    value={pack.currency}
                    onChange={e => handleChange(idx, 'currency', e.target.value)}
                    placeholder="العملة"
                  />
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={pack.is_active}
                      onCheckedChange={(checked) => handleChange(idx, 'is_active', checked)}
                    />
                    <Label className="text-sm">مفعلة</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleSave(idx)} 
                      disabled={saving}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                      حفظ
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingId(null)}
                      disabled={saving}
                      size="sm"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setEditingId(pack.id || null)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    تعديل
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDelete(pack.id)}
                    disabled={saving}
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {packages.length === 0 && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <Coins className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد باقات نقاط</h3>
            <p className="text-gray-600 mb-4">ابدأ بإضافة باقة نقاط جديدة للطلاب</p>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              إضافة باقة جديدة
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminPoints; 
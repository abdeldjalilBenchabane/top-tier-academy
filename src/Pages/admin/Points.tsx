import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from '../../lib/toast';

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
  const [newPack, setNewPack] = useState<PointPackage>({
    name: '',
    points: 0,
    price: 0,
    currency: defaultCurrency,
    is_active: true,
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/points/packages', {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      setPackages(data.packages || []);
    } catch (e) {
      setError('فشل تحميل الباقات');
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
      fetchPackages();
    } catch (e: any) {
      setError(e.message || 'خطأ في الحفظ');
      toast.error(e.message || 'خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!window.confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
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
      if (!data.success) throw new Error(data.error || 'خطأ في الحذف');
      toast.success('تم حذف الباقة بنجاح');
      fetchPackages();
    } catch (e: any) {
      setError(e.message || 'خطأ في الحذف');
      toast.error(e.message || 'خطأ في الحذف');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newPack.name || !newPack.points || !newPack.price) {
      toast.error('يرجى ملء جميع الحقول');
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
      if (!data.success) throw new Error(data.error || 'خطأ في الإضافة');
      toast.success('تمت إضافة الباقة بنجاح');
      setNewPack({ name: '', points: 0, price: 0, currency: defaultCurrency, is_active: true });
      fetchPackages();
    } catch (e: any) {
      setError(e.message || 'خطأ في الإضافة');
      toast.error(e.message || 'خطأ في الإضافة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">إدارة باقات النقاط</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {loading ? (
        <div>جاري التحميل...</div>
      ) : (
        <table className="w-full border mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th>الاسم</th>
              <th>عدد النقاط</th>
              <th>السعر</th>
              <th>العملة</th>
              <th>مفعلة؟</th>
              <th>حفظ</th>
              <th>حذف</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pack, idx) => (
              <tr key={pack.id} className="border-b">
                <td><Input value={pack.name} onChange={e => handleChange(idx, 'name', e.target.value)} /></td>
                <td><Input type="number" value={pack.points} onChange={e => handleChange(idx, 'points', parseInt(e.target.value))} /></td>
                <td><Input type="number" value={pack.price} onChange={e => handleChange(idx, 'price', parseFloat(e.target.value))} /></td>
                <td><Input value={pack.currency} onChange={e => handleChange(idx, 'currency', e.target.value)} /></td>
                <td>
                  <input type="checkbox" checked={pack.is_active} onChange={e => handleChange(idx, 'is_active', e.target.checked)} />
                </td>
                <td><Button disabled={saving} onClick={() => handleSave(idx)}>حفظ</Button></td>
                <td><Button variant="destructive" disabled={saving} onClick={() => handleDelete(pack.id)}>حذف</Button></td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td><Input value={newPack.name} onChange={e => setNewPack(p => ({ ...p, name: e.target.value }))} placeholder="اسم الباقة" /></td>
              <td><Input type="number" value={newPack.points} onChange={e => setNewPack(p => ({ ...p, points: parseInt(e.target.value) }))} placeholder="عدد النقاط" /></td>
              <td><Input type="number" value={newPack.price} onChange={e => setNewPack(p => ({ ...p, price: parseFloat(e.target.value) }))} placeholder="السعر" /></td>
              <td><Input value={newPack.currency} onChange={e => setNewPack(p => ({ ...p, currency: e.target.value }))} placeholder="العملة" /></td>
              <td>
                <input type="checkbox" checked={newPack.is_active} onChange={e => setNewPack(p => ({ ...p, is_active: e.target.checked }))} />
              </td>
              <td colSpan={2}><Button disabled={saving} onClick={handleAdd}>إضافة</Button></td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminPoints; 
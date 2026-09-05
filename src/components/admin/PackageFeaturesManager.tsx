import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Save, Layers } from 'lucide-react';
import { toast } from '@/lib/toast';
import { API_BASE_URL } from '@/lib/api';

interface Feature {
  id: number; package_id: number; name: string;
  points: number; price: number; currency: string;
  display_order: number; is_active?: boolean;
}
interface Pack { id: number; name: string; features?: Feature[]; }

const authHeaders = () => {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const api = async (path: string, init?: RequestInit) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init, headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
};

const blank = { name: '', points: '', price: '' };

const PackageFeaturesManager = () => {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(blank);
  const [edits, setEdits] = useState<Record<number, Partial<Feature>>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await api('/points/packages/all');
      setPacks(data.packages || []);
      setSelected(prev => prev ?? (data.packages?.[0]?.id ?? null));
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const current = packs.find(p => p.id === selected) || null;
  const features = current?.features || [];

  const add = async () => {
    if (!current) return;
    if (!draft.name.trim()) { toast.error('اسم الميزة مطلوب'); return; }
    setBusy(true);
    try {
      await api(`/points/packages/${current.id}/features`, {
        method: 'POST',
        body: JSON.stringify({
          name: draft.name.trim(),
          points: parseInt(draft.points, 10) || 0,
          price: parseFloat(draft.price) || 0,
          display_order: features.length,
        }),
      });
      toast.success('تمت إضافة الميزة');
      setDraft(blank); await load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const save = async (f: Feature) => {
    const patch = edits[f.id];
    if (!patch) return;
    setBusy(true);
    try {
      await api(`/points/features/${f.id}`, { method: 'PUT', body: JSON.stringify(patch) });
      toast.success('تم الحفظ');
      setEdits(prev => { const n = { ...prev }; delete n[f.id]; return n; });
      await load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const remove = async (f: Feature) => {
    if (!window.confirm(`حذف الميزة «${f.name}»؟`)) return;
    setBusy(true);
    try {
      await api(`/points/features/${f.id}`, { method: 'DELETE' });
      toast.success('تم الحذف'); await load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const field = (f: Feature, key: keyof Feature) =>
    (edits[f.id]?.[key] as any) ?? (f[key] as any);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> ميزات الباقات</CardTitle>
        <CardDescription>
          الباقة هي العنوان، والميزات هي ما يشتريه الطالب فعليًا. كل ميزة لها اسم ونقاط وسعر.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> جاري التحميل…
          </div>
        ) : packs.length === 0 ? (
          <p className="py-4 text-sm text-gray-500">لا توجد باقات بعد.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {packs.map(p => (
                <Button key={p.id} size="sm" variant={selected === p.id ? 'default' : 'outline'}
                  onClick={() => setSelected(p.id)}>
                  {p.name}
                  <Badge variant="secondary" className="ml-2">{p.features?.length || 0}</Badge>
                </Button>
              ))}
            </div>

            <div className="divide-y rounded-md border">
              {features.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">لا توجد ميزات في هذه الباقة.</p>
              ) : features.map(f => (
                <div key={f.id} className="flex flex-wrap items-center gap-2 p-3">
                  <Input className="min-w-[140px] flex-1" value={field(f, 'name')}
                    onChange={e => setEdits(p => ({ ...p, [f.id]: { ...p[f.id], name: e.target.value } }))} />
                  <Input className="w-28" type="number" value={field(f, 'points')}
                    onChange={e => setEdits(p => ({ ...p, [f.id]: { ...p[f.id], points: parseInt(e.target.value, 10) || 0 } }))} />
                  <span className="text-xs text-gray-500">نقطة</span>
                  <Input className="w-28" type="number" value={field(f, 'price')}
                    onChange={e => setEdits(p => ({ ...p, [f.id]: { ...p[f.id], price: parseFloat(e.target.value) || 0 } }))} />
                  <span className="text-xs text-gray-500">دج</span>
                  <Button size="sm" variant="outline" disabled={busy || !edits[f.id]} onClick={() => save(f)}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" disabled={busy} onClick={() => remove(f)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed p-3">
              <Input className="min-w-[140px] flex-1" placeholder="اسم الميزة" value={draft.name}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
              <Input className="w-28" type="number" placeholder="نقاط" value={draft.points}
                onChange={e => setDraft(d => ({ ...d, points: e.target.value }))} />
              <Input className="w-28" type="number" placeholder="سعر" value={draft.price}
                onChange={e => setDraft(d => ({ ...d, price: e.target.value }))} />
              <Button size="sm" disabled={busy || !current} onClick={add}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-1 h-4 w-4" /> إضافة</>}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PackageFeaturesManager;

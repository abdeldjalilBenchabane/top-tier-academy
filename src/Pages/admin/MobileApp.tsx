import React, { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Smartphone, Search, Gift } from 'lucide-react';
import { toast } from '@/lib/toast';
import { API_BASE_URL } from '@/lib/api';

type Mode = 'all' | 'selected' | 'none';
interface Picker { mode: Mode; ids: number[]; }
interface Config {
  showPoints: boolean;
  sections: Record<string, boolean>;
  courses: Picker; liveSections: Picker; liveSessions: Picker; languages: Picker;
  freeCourseIds: number[]; freeLiveSectionIds: number[];
}
interface Item { id: number; title?: string; name?: string; price?: number; material_name?: string; professor_name?: string; }
interface Catalogue { courses: Item[]; liveSections: Item[]; liveSessions: Item[]; languages: Item[]; }

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

// The five chips the app shows in الرئيسية / استكشاف / دوراتي.
const SECTIONS: Array<[string, string, string]> = [
  ['recorded',  'الحصص المسجلة', 'دروس مسجلة يشاهدها الطالب في أي وقت'],
  ['private',   'الحصص الخاصة',  'طلب أستاذ خاص'],
  ['live',      'الحصص المباشرة', 'بث مباشر'],
  ['programs',  'الدورات',       'برامج متكاملة'],
  ['languages', 'لغات',          'مسارات اللغات'],
];

const label = (i: Item) => i.title || i.name || `#${i.id}`;

const PickerCard = ({ title, description, picker, items, onChange, freeIds, onToggleFree }: {
  title: string; description: string; picker: Picker; items: Item[];
  onChange: (p: Picker) => void;
  freeIds?: number[]; onToggleFree?: (id: number) => void;
}) => {
  const [q, setQ] = useState('');
  const shown = items.filter(i => !q || label(i).toLowerCase().includes(q.toLowerCase()));
  const toggle = (id: number) => {
    const has = picker.ids.includes(id);
    onChange({ ...picker, ids: has ? picker.ids.filter(x => x !== id) : [...picker.ids, id] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(['all', 'selected', 'none'] as Mode[]).map(m => (
            <Button key={m} size="sm" variant={picker.mode === m ? 'default' : 'outline'}
              onClick={() => onChange({ ...picker, mode: m })}>
              {m === 'all' ? 'الكل' : m === 'selected' ? 'محدد' : 'إخفاء'}
            </Button>
          ))}
          <span className="ml-auto self-center text-xs text-gray-500">
            {picker.mode === 'all' ? `${items.length} عنصر`
              : picker.mode === 'none' ? 'لا شيء'
              : `${picker.ids.length} من ${items.length}`}
          </span>
        </div>

        {picker.mode === 'selected' && (
          <>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث"
                className="w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 text-sm" />
            </div>
            <div className="max-h-56 divide-y overflow-y-auto rounded-md border">
              {shown.length === 0 ? (
                <p className="p-3 text-sm text-gray-500">لا توجد عناصر.</p>
              ) : shown.map(i => (
                <label key={i.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50">
                  <input type="checkbox" className="h-4 w-4"
                    checked={picker.ids.includes(i.id)} onChange={() => toggle(i.id)} />
                  <span className="flex-1 truncate">
                    {label(i)}
                    {i.material_name && <span className="ml-2 text-xs text-gray-500">{i.material_name}</span>}
                    {i.professor_name && <span className="ml-2 text-xs text-gray-500">{i.professor_name}</span>}
                  </span>
                  {i.price != null && <Badge variant="outline" className="shrink-0 text-xs">{i.price}</Badge>}
                </label>
              ))}
            </div>
          </>
        )}

        {onToggleFree && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-800">
              <Gift className="h-4 w-4" /> مجاني في التطبيق فقط
            </div>
            <p className="mb-2 text-xs text-green-700">
              الطالب يشاهدها دون شراء داخل التطبيق. لا يتغير أي شيء في الموقع.
            </p>
            <div className="max-h-40 divide-y overflow-y-auto rounded-md border bg-white">
              {items.length === 0 ? (
                <p className="p-3 text-xs text-gray-500">لا توجد عناصر.</p>
              ) : items.map(i => (
                <label key={i.id} className="flex cursor-pointer items-center gap-3 px-3 py-1.5 text-sm hover:bg-gray-50">
                  <input type="checkbox" className="h-4 w-4"
                    checked={(freeIds || []).includes(i.id)} onChange={() => onToggleFree(i.id)} />
                  <span className="flex-1 truncate">{label(i)}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AdminMobileApp = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [cat, setCat] = useState<Catalogue>({ courses: [], liveSections: [], liveSessions: [], languages: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api('/admin/mobile-config');
      setConfig(data.config); setCat(data.catalogue);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const data = await api('/admin/mobile-config', { method: 'PUT', body: JSON.stringify({ config }) });
      setConfig(data.config);
      toast.success('تم حفظ إعدادات التطبيق');
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const toggleFree = (key: 'freeCourseIds' | 'freeLiveSectionIds') => (id: number) =>
    setConfig(c => !c ? c : ({
      ...c, [key]: c[key].includes(id) ? c[key].filter(x => x !== id) : [...c[key], id],
    }));

  if (loading || !config) {
    return <div className="flex items-center gap-2 py-12 text-sm text-gray-500">
      <Loader2 className="h-4 w-4 animate-spin" /> جاري التحميل…
    </div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="تطبيق الجوال" description="التحكم في ما يظهر داخل التطبيق. لا يؤثر على الموقع إطلاقًا." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Smartphone className="h-4 w-4" /> عام</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">إظهار النقاط في حسابي</div>
              <p className="text-sm text-gray-500">إخفاؤها يزيل رصيد النقاط من صفحة الحساب في التطبيق.</p>
            </div>
            <Switch checked={config.showPoints}
              onCheckedChange={v => setConfig({ ...config, showPoints: v })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">الأقسام الظاهرة</CardTitle>
          <CardDescription>
            الفلاتر التي تظهر في الرئيسية و استكشاف و دوراتي. أطفئ ما لا تريد إظهاره.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {SECTIONS.map(([key, name, hint]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{name}</div>
                <p className="text-xs text-gray-500">{hint}</p>
              </div>
              <Switch checked={!!config.sections[key]}
                onCheckedChange={v => setConfig({ ...config, sections: { ...config.sections, [key]: v } })} />
            </div>
          ))}
          {Object.values(config.sections).every(v => !v) && (
            <p className="rounded-md bg-yellow-50 p-2 text-xs text-yellow-800">
              كل الأقسام مطفأة — لن يرى الطالب أي فلتر في التطبيق.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <PickerCard title="الدروس" description="أي الدروس تظهر في التطبيق"
          picker={config.courses} items={cat.courses}
          onChange={p => setConfig({ ...config, courses: p })}
          freeIds={config.freeCourseIds} onToggleFree={toggleFree('freeCourseIds')} />

        <PickerCard title="الدورات" description="أي الدورات تظهر في التطبيق"
          picker={config.liveSections} items={cat.liveSections}
          onChange={p => setConfig({ ...config, liveSections: p })}
          freeIds={config.freeLiveSectionIds} onToggleFree={toggleFree('freeLiveSectionIds')} />

        <PickerCard title="الحصص المباشرة" description="أي الحصص المباشرة تظهر في التطبيق"
          picker={config.liveSessions} items={cat.liveSessions}
          onChange={p => setConfig({ ...config, liveSessions: p })} />

        <PickerCard title="اللغات" description="أي اللغات تظهر في التطبيق"
          picker={config.languages} items={cat.languages}
          onChange={p => setConfig({ ...config, languages: p })} />
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={save} disabled={saving} size="lg" className="shadow-lg">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> جاري الحفظ…</> : <><Save className="mr-2 h-4 w-4" /> حفظ إعدادات التطبيق</>}
        </Button>
      </div>
    </div>
  );
};

export default AdminMobileApp;

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Image as ImageIcon, Route } from 'lucide-react';
import { toast } from '@/lib/toast';
import { API_BASE_URL } from '@/lib/api';

interface Opt { id: number | string; name: string; }

const authHeaders = () => {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const getJSON = async (path: string) => {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  const d = await res.json();
  return Array.isArray(d) ? d : (d.levels || d.years || d.specialities || d.materials || d.languages || d.levels || d.data || []);
};

const Select = ({ label, value, onChange, options, disabled }: {
  label: string; value: string; onChange: (v: string) => void; options: Opt[]; disabled?: boolean;
}) => (
  <div className="space-y-1">
    <label className="text-sm font-medium">{label}</label>
    <select
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100"
    >
      <option value="">— اختر —</option>
      {options.map(o => <option key={o.id} value={String(o.id)}>{o.name}</option>)}
    </select>
  </div>
);

const LiveSectionPathCover = ({ section, onSaved }: { section: any; onSaved: () => void }) => {
  const [rootType, setRootType] = useState<'education' | 'language'>(
    section?.language_level_id ? 'language' : 'education');

  const [levels, setLevels] = useState<Opt[]>([]);
  const [years, setYears] = useState<Opt[]>([]);
  const [specialities, setSpecialities] = useState<Opt[]>([]);
  const [materials, setMaterials] = useState<Opt[]>([]);
  const [languages, setLanguages] = useState<Opt[]>([]);
  const [langLevels, setLangLevels] = useState<Opt[]>([]);

  const [levelId, setLevelId] = useState(section?.level_id ? String(section.level_id) : '');
  const [yearId, setYearId] = useState(section?.year_id ? String(section.year_id) : '');
  const [specialityId, setSpecialityId] = useState(section?.speciality_id ? String(section.speciality_id) : '');
  const [materialId, setMaterialId] = useState(section?.material_id ? String(section.material_id) : '');
  const [languageId, setLanguageId] = useState(section?.language_id ? String(section.language_id) : '');
  const [languageLevelId, setLanguageLevelId] = useState(section?.language_level_id ? String(section.language_level_id) : '');

  const [cover, setCover] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(section?.cover_image_url || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getJSON('/public/levels').then(setLevels).catch(() => {});
    getJSON('/languages').then(setLanguages).catch(() => {});
  }, []);

  useEffect(() => {
    if (!levelId) { setYears([]); return; }
    getJSON(`/public/levels/${levelId}/years`).then(setYears).catch(() => setYears([]));
  }, [levelId]);

  useEffect(() => {
    if (!yearId) { setSpecialities([]); setMaterials([]); return; }
    getJSON(`/public/years/${yearId}/specialities`).then(setSpecialities).catch(() => setSpecialities([]));
    // Some years hold materials directly, with no speciality in between.
    getJSON(`/public/years/${yearId}/materials`).then(setMaterials).catch(() => setMaterials([]));
  }, [yearId]);

  useEffect(() => {
    if (!specialityId) return;
    getJSON(`/public/specialities/${specialityId}/materials`).then(setMaterials).catch(() => {});
  }, [specialityId]);

  useEffect(() => {
    if (!languageId) { setLangLevels([]); return; }
    getJSON(`/languages/${languageId}/levels`).then(setLangLevels).catch(() => setLangLevels([]));
  }, [languageId]);

  const pickCover = (f: File | null) => {
    setCover(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    if (rootType === 'education' && (!levelId || !yearId || !materialId)) {
      toast.error('المستوى والسنة والمادة مطلوبة');
      return;
    }
    if (rootType === 'language' && (!languageId || !languageLevelId)) {
      toast.error('اللغة ومستوى اللغة مطلوبان');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('rootType', rootType);
      if (rootType === 'education') {
        fd.append('levelId', levelId);
        fd.append('yearId', yearId);
        fd.append('specialityId', specialityId || '');
        fd.append('materialId', materialId);
      } else {
        fd.append('languageId', languageId);
        fd.append('languageLevelId', languageLevelId);
      }
      if (cover) fd.append('cover_image', cover);

      // No Content-Type header: the browser sets the multipart boundary.
      const res = await fetch(`${API_BASE_URL}/admin/live-sections/${section.id}/path`, {
        method: 'PUT', headers: authHeaders(), body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);

      toast.success('تم تحديث المسار والغلاف');
      setCover(null);
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Route className="h-4 w-4" /> المسار والغلاف</CardTitle>
        <CardDescription>
          تصحيح مسار الدورة حتى تظهر في التصفية، وتغيير صورة الغلاف. لا يغير حالة القبول.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {(['education', 'language'] as const).map(t => (
            <Button key={t} size="sm" variant={rootType === t ? 'default' : 'outline'} onClick={() => setRootType(t)}>
              {t === 'education' ? 'تعليمي' : 'لغات'}
            </Button>
          ))}
        </div>

        {rootType === 'education' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="المستوى" value={levelId} options={levels}
              onChange={v => { setLevelId(v); setYearId(''); setSpecialityId(''); setMaterialId(''); }} />
            <Select label="السنة" value={yearId} options={years} disabled={!levelId}
              onChange={v => { setYearId(v); setSpecialityId(''); setMaterialId(''); }} />
            <Select label="التخصص (اختياري)" value={specialityId} options={specialities} disabled={!yearId}
              onChange={v => { setSpecialityId(v); setMaterialId(''); }} />
            <Select label="المادة" value={materialId} options={materials} disabled={!yearId}
              onChange={setMaterialId} />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="اللغة" value={languageId} options={languages}
              onChange={v => { setLanguageId(v); setLanguageLevelId(''); }} />
            <Select label="المستوى" value={languageLevelId} options={langLevels} disabled={!languageId}
              onChange={setLanguageLevelId} />
          </div>
        )}

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <ImageIcon className="h-4 w-4" /> صورة الغلاف
          </label>
          {preview && <img src={preview} alt="" className="max-h-40 w-full rounded-md object-cover" />}
          <input type="file" accept="image/*" onChange={e => pickCover(e.target.files?.[0] || null)}
            className="w-full text-sm" />
        </div>

        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> جاري الحفظ…</> : <><Save className="mr-2 h-4 w-4" /> حفظ</>}
        </Button>
      </CardContent>
    </Card>
  );
};

export default LiveSectionPathCover;

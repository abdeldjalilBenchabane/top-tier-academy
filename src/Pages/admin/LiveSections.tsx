import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Eye, Check, X, FileText, Video, Image as ImageIcon, Search, User, Layers, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';
import { API_BASE_URL } from '@/lib/api';

// The UI says الدورات; the API, URLs and database still say live sections.
const LABEL = 'الدورات';

type Status = 'all' | 'pending' | 'approved' | 'rejected';

interface Section {
  id: number; title: string; description?: string; status: string;
  year_name?: string; speciality_name?: string; language_level_name?: string;
  professor_name?: string; professor_email?: string; price?: number;
  level_name?: string; material_name?: string; language_name?: string;
  cover_image_url?: string; rejected_reason?: string; created_at?: string;
  live_sessions_count?: number;
}
interface Block { id: number; type: string; title?: string; content?: string; fileUrl?: string; files?: any[]; }
interface ContentSection { id: number; title: string; blocks?: Block[]; }

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

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    approved: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
    draft: 'bg-gray-100 text-gray-600',
  };
  const label: Record<string, string> = {
    approved: 'مقبولة', pending: 'قيد المراجعة', rejected: 'مرفوضة', draft: 'مسودة',
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] || map.draft}`}>
    {label[status] || status}
  </span>;
};

const AdminLiveSections = () => {
  const [tab, setTab] = useState<Status>('all');
  const [rows, setRows] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  // Filters are derived from the rows themselves, so no extra endpoints and
  // the options always match what actually exists.
  const [fLevel, setFLevel] = useState('');
  const [fYear, setFYear] = useState('');
  const [fSpeciality, setFSpeciality] = useState('');
  const [fMaterial, setFMaterial] = useState('');
  const [fLanguage, setFLanguage] = useState('');
  const [fProfessor, setFProfessor] = useState('');

  const [viewing, setViewing] = useState<Section | null>(null);
  const [content, setContent] = useState<ContentSection[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);

  const [rejecting, setRejecting] = useState<Section | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async (status: Status) => {
    setLoading(true);
    try { setRows(await api(`/admin/live-sections/all?status=${status}`)); }
    catch (e: any) { toast.error(e.message); setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(tab); }, [tab]);

  const openContent = async (s: Section) => {
    setViewing(s); setContent([]); setLoadingContent(true);
    try {
      const data = await api(`/live-sections/${s.id}/content`);
      setContent(data.sections || data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoadingContent(false); }
  };

  const approve = async (s: Section) => {
    setBusy(true);
    try {
      await api(`/admin/live-sections/${s.id}/approve`, { method: 'POST' });
      toast.success(`تم قبول «${s.title}» وإشعار الأستاذ.`);
      setViewing(null); load(tab);
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const reject = async () => {
    if (!rejecting) return;
    setBusy(true);
    try {
      await api(`/admin/live-sections/${rejecting.id}/reject`, {
        method: 'POST', body: JSON.stringify({ reason: reason || 'لم يتم تحديد سبب' }),
      });
      toast.success(`تم رفض «${rejecting.title}» وإشعار الأستاذ.`);
      setRejecting(null); setReason(''); setViewing(null); load(tab);
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const uniq = (key: keyof Section) =>
    [...new Set(rows.map(r => (r[key] as string) || '').filter(Boolean))].sort();

  const shown = rows.filter(r =>
    (!q || r.title?.toLowerCase().includes(q.toLowerCase())
        || r.professor_name?.toLowerCase().includes(q.toLowerCase())) &&
    (!fLevel || r.level_name === fLevel) &&
    (!fYear || r.year_name === fYear) &&
    (!fSpeciality || r.speciality_name === fSpeciality) &&
    (!fMaterial || r.material_name === fMaterial) &&
    (!fLanguage || r.language_name === fLanguage) &&
    (!fProfessor || r.professor_name === fProfessor));

  const resetFilters = () => {
    setQ(''); setFLevel(''); setFYear(''); setFSpeciality('');
    setFMaterial(''); setFLanguage(''); setFProfessor('');
  };
  const activeFilters = [fLevel, fYear, fSpeciality, fMaterial, fLanguage, fProfessor, q].filter(Boolean).length;

  const TABS: Array<[Status, string]> = [
    ['all', 'الكل'], ['pending', 'قيد المراجعة'], ['approved', 'مقبولة'], ['rejected', 'مرفوضة'],
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={LABEL} description={`إدارة ${LABEL} — معاينة المحتوى وتغيير الحالة في أي وقت`} />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {TABS.map(([k, label]) => (
              <Button key={k} size="sm" variant={tab === k ? 'default' : 'outline'} onClick={() => setTab(k)}>
                {label}
              </Button>
            ))}
            <div className="relative ml-auto min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث بالعنوان أو الأستاذ"
                className="w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 text-sm" />
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {([
              ['المستوى', fLevel, setFLevel, uniq('level_name')],
              ['السنة', fYear, setFYear, uniq('year_name')],
              ['التخصص', fSpeciality, setFSpeciality, uniq('speciality_name')],
              ['المادة', fMaterial, setFMaterial, uniq('material_name')],
              ['اللغة', fLanguage, setFLanguage, uniq('language_name')],
              ['الأستاذ', fProfessor, setFProfessor, uniq('professor_name')],
            ] as Array<[string, string, (v: string) => void, string[]]>)
              .filter(([, , , opts]) => opts.length > 0)
              .map(([label, value, setter, opts]) => (
                <select key={label} value={value} onChange={e => setter(e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                  <option value="">{label}: الكل</option>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ))}
            {activeFilters > 0 && (
              <Button size="sm" variant="ghost" onClick={resetFilters}>
                مسح الفلاتر ({activeFilters})
              </Button>
            )}
            <span className="ml-auto text-sm text-gray-500">{shown.length} من {rows.length}</span>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> جاري التحميل…
            </div>
          ) : shown.length === 0 ? (
            <p className="py-8 text-sm text-gray-500">لا توجد نتائج.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shown.map(s => (
                <Card key={s.id} className="overflow-hidden flex flex-col">
                  {s.cover_image_url && (
                    <img src={s.cover_image_url} alt="" className="h-32 w-full object-cover" />
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-1">{s.title}</CardTitle>
                      <StatusBadge status={s.status} />
                    </div>
                    <CardDescription className="flex items-center text-xs">
                      <User className="h-3.5 w-3.5 mr-1" />
                      <span>{s.professor_name || '—'}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pb-2 flex-1">
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{s.description}</p>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {s.material_name && (
                        <Badge variant="outline" className="text-xs flex items-center">
                          <Layers className="h-3 w-3 mr-1" />{s.material_name}
                        </Badge>
                      )}
                      {s.price != null && (
                        <Badge variant="outline" className="text-xs">{s.price} نقطة</Badge>
                      )}
                    </div>

                    {s.status === 'rejected' && s.rejected_reason && (
                      <div className="text-xs text-red-600 line-clamp-2">سبب الرفض: {s.rejected_reason}</div>
                    )}

                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      <span>{s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}</span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 flex flex-col gap-2">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to={`/admin/live-sections/${s.id}`}>
                        <Eye className="mr-1 h-4 w-4" /> عرض التفاصيل
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => openContent(s)}>
                      معاينة سريعة
                    </Button>
                    <div className="flex w-full gap-2">
                      {s.status !== 'approved' && (
                        <Button size="sm" className="flex-1" disabled={busy} onClick={() => approve(s)}>
                          <Check className="mr-1 h-4 w-4" /> قبول
                        </Button>
                      )}
                      {s.status !== 'rejected' && (
                        <Button size="sm" variant="destructive" className="flex-1" disabled={busy}
                          onClick={() => { setRejecting(s); setReason(''); }}>
                          <X className="mr-1 h-4 w-4" /> رفض
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content preview — decide with the material in front of you */}
      <Dialog open={!!viewing} onOpenChange={(v) => { if (!busy && !v) setViewing(null); }}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewing?.title} {viewing && <StatusBadge status={viewing.status} />}
            </DialogTitle>
            <DialogDescription>
              {viewing?.professor_name ? `الأستاذ: ${viewing.professor_name}` : ''}
            </DialogDescription>
          </DialogHeader>

          {viewing?.cover_image_url && (
            <img src={viewing.cover_image_url} alt="" className="max-h-48 w-full rounded-md object-cover" />
          )}
          {viewing?.description && <p className="text-sm text-gray-600">{viewing.description}</p>}

          {loadingContent ? (
            <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> تحميل المحتوى…
            </div>
          ) : content.length === 0 ? (
            <p className="py-4 text-sm text-gray-500">لا يوجد محتوى بعد.</p>
          ) : (
            <div className="space-y-4">
              {content.map(sec => (
                <div key={sec.id} className="rounded-md border p-3">
                  <div className="mb-2 font-medium">{sec.title}</div>
                  <div className="space-y-2">
                    {(sec.blocks || []).map(b => (
                      <div key={b.id} className="rounded border bg-gray-50 p-2 text-sm">
                        <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
                          {b.type === 'video' ? <Video className="h-3.5 w-3.5" />
                            : b.type === 'image' ? <ImageIcon className="h-3.5 w-3.5" />
                            : <FileText className="h-3.5 w-3.5" />}
                          {b.type}{b.title ? ` · ${b.title}` : ''}
                        </div>
                        {b.type === 'video' && b.fileUrl ? (
                          <video src={b.fileUrl} controls className="max-h-64 w-full rounded" />
                        ) : b.type === 'image' && b.fileUrl ? (
                          <img src={b.fileUrl} alt="" className="max-h-64 rounded" />
                        ) : b.type === 'text' ? (
                          <div className="whitespace-pre-wrap text-gray-700">{b.content}</div>
                        ) : b.fileUrl ? (
                          <a href={b.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                            فتح الملف
                          </a>
                        ) : <span className="text-gray-400">—</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="gap-2">
            {viewing && viewing.status !== 'approved' && (
              <Button disabled={busy} onClick={() => approve(viewing)}>
                <Check className="mr-1 h-4 w-4" /> قبول
              </Button>
            )}
            {viewing && viewing.status !== 'rejected' && (
              <Button variant="destructive" disabled={busy}
                onClick={() => { setRejecting(viewing); setReason(''); }}>
                <X className="mr-1 h-4 w-4" /> رفض
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject reason */}
      <Dialog open={!!rejecting} onOpenChange={(v) => { if (!busy && !v) setRejecting(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض «{rejecting?.title}»</DialogTitle>
            <DialogDescription>
              سيتم إرسال السبب إلى الأستاذ بالبريد الإلكتروني.
              {rejecting?.status === 'approved' && ' هذه الدورة مقبولة حاليًا وسيتم تغيير حالتها إلى مرفوضة.'}
            </DialogDescription>
          </DialogHeader>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4}
            placeholder="سبب الرفض" className="w-full rounded-md border border-gray-300 p-2 text-sm" />
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setRejecting(null)}>إلغاء</Button>
            <Button variant="destructive" disabled={busy} onClick={reject}>
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> جاري…</> : 'تأكيد الرفض'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLiveSections;

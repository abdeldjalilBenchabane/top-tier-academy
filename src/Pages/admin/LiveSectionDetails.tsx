import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Loader2, ChevronRight, Check, X, User, Layers, Calendar, Users,
  FileText, Video, Image as ImageIcon,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { API_BASE_URL } from '@/lib/api';
import LiveSectionPathCover from '@/components/admin/LiveSectionPathCover';
import { serverDate } from '@/lib/utils';

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

const STATUS: Record<string, { cls: string; label: string }> = {
  approved: { cls: 'bg-green-100 text-green-700', label: 'مقبولة' },
  pending:  { cls: 'bg-yellow-100 text-yellow-700', label: 'قيد المراجعة' },
  rejected: { cls: 'bg-red-100 text-red-700', label: 'مرفوضة' },
  draft:    { cls: 'bg-gray-100 text-gray-600', label: 'مسودة' },
};

const AdminLiveSectionDetails = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const all = await api('/admin/live-sections/all?status=all');
      const found = (all || []).find((x: any) => String(x.id) === String(sectionId));
      setSection(found || null);

      const content = await api(`/live-sections/${sectionId}/content`);
      setSections(content.sections || []);

      try {
        const st = await api(`/admin/year-reset/items/${sectionId}/students?type=live`);
        setStudents(st.students || []);
      } catch { setStudents([]); }
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [sectionId]);

  const decide = async (action: 'approve' | 'reject') => {
    setBusy(true);
    try {
      await api(`/admin/live-sections/${sectionId}/${action}`, {
        method: 'POST',
        body: action === 'reject' ? JSON.stringify({ reason: reason || 'لم يتم تحديد سبب' }) : undefined,
      });
      toast.success(action === 'approve' ? 'تم القبول وإشعار الأستاذ' : 'تم الرفض وإشعار الأستاذ');
      setRejectOpen(false); setReason(''); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  if (loading) {
    return <div className="flex items-center gap-2 py-12 text-sm text-gray-500">
      <Loader2 className="h-4 w-4 animate-spin" /> جاري التحميل…
    </div>;
  }
  if (!section) {
    return <div className="space-y-4">
      <p className="text-sm text-gray-500">لم يتم العثور على الدورة.</p>
      <Button variant="outline" asChild><Link to="/admin/live-sections">العودة</Link></Button>
    </div>;
  }

  const st = STATUS[section.status] || STATUS.draft;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/admin/live-sections" className="hover:underline">الدورات</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate">{section.title}</span>
      </div>

      <PageHeader title={section.title} description={section.description || ''} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>المحتوى</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {section.cover_image_url && (
              <img src={section.cover_image_url} alt="" className="max-h-56 w-full rounded-md object-cover" />
            )}
            {sections.length === 0 ? (
              <p className="text-sm text-gray-500">لا يوجد محتوى بعد.</p>
            ) : sections.map((sec: any) => (
              <div key={sec.id} className="rounded-md border p-3">
                <div className="mb-2 font-medium">{sec.title}</div>
                <div className="space-y-2">
                  {(sec.blocks || []).map((b: any) => (
                    <div key={b.id} className="rounded border bg-gray-50 p-2 text-sm">
                      <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
                        {b.type === 'video' ? <Video className="h-3.5 w-3.5" />
                          : b.type === 'image' ? <ImageIcon className="h-3.5 w-3.5" />
                          : <FileText className="h-3.5 w-3.5" />}
                        {b.type}{b.title ? ` · ${b.title}` : ''}
                      </div>
                      {b.type === 'video' && b.fileUrl ? (
                        <video src={b.fileUrl} controls preload="metadata" className="max-h-72 w-full rounded" />
                      ) : b.type === 'image' && b.fileUrl ? (
                        <img src={b.fileUrl} alt="" className="max-h-72 rounded" />
                      ) : b.type === 'text' ? (
                        <div className="whitespace-pre-wrap text-gray-700">{b.content}</div>
                      ) : b.fileUrl ? (
                        <a href={b.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">فتح الملف</a>
                      ) : <span className="text-gray-400">—</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">الحالة</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${st.cls}`}>{st.label}</span>
              {section.status === 'rejected' && section.rejected_reason && (
                <p className="text-sm text-red-600">سبب الرفض: {section.rejected_reason}</p>
              )}
              <div className="flex gap-2 pt-1">
                {section.status !== 'approved' && (
                  <Button size="sm" className="flex-1" disabled={busy} onClick={() => decide('approve')}>
                    <Check className="mr-1 h-4 w-4" /> قبول
                  </Button>
                )}
                {section.status !== 'rejected' && (
                  <Button size="sm" variant="destructive" className="flex-1" disabled={busy}
                    onClick={() => { setReason(''); setRejectOpen(true); }}>
                    <X className="mr-1 h-4 w-4" /> رفض
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <LiveSectionPathCover section={section} onSaved={load} />

          <Card>
            <CardHeader><CardTitle className="text-base">معلومات</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" />{section.professor_name || '—'}</div>
              {section.material_name && <div className="flex items-center gap-2"><Layers className="h-4 w-4 text-gray-400" />{section.material_name}</div>}
              <div className="flex flex-wrap gap-1 pt-1">
                {section.level_name && <Badge variant="outline">{section.level_name}</Badge>}
                {section.year_name && <Badge variant="outline">{section.year_name}</Badge>}
                {section.speciality_name && <Badge variant="outline">{section.speciality_name}</Badge>}
                {section.language_name && <Badge variant="outline">{section.language_name}</Badge>}
              </div>
              {section.price != null && <div className="pt-1 font-semibold">{section.price} نقطة</div>}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="h-3.5 w-3.5" />
                {section.created_at ? serverDate(section.created_at).toLocaleDateString() : '—'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" /> الطلاب ({students.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <p className="text-sm text-gray-500">لا يوجد طلاب.</p>
              ) : (
                <div className="max-h-56 divide-y overflow-y-auto text-sm">
                  {students.map((s: any) => (
                    <div key={s.id} className="py-1.5">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.email}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={(v) => { if (!busy) setRejectOpen(v); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>رفض «{section.title}»</DialogTitle></DialogHeader>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4}
            placeholder="سبب الرفض" className="w-full rounded-md border border-gray-300 p-2 text-sm" />
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setRejectOpen(false)}>إلغاء</Button>
            <Button variant="destructive" disabled={busy} onClick={() => decide('reject')}>
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> جاري…</> : 'تأكيد الرفض'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLiveSectionDetails;

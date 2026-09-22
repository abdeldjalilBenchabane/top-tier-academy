import React, { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Search, RotateCcw, AlertTriangle, BookOpen, Video, Languages, Radio, UserRound } from 'lucide-react';
import { toast } from '@/lib/toast';
import { API_BASE_URL } from '@/lib/api';
import { serverDate } from '@/lib/utils';

type Kind = 'course' | 'language_course' | 'live' | 'live_session' | 'private_class';

interface Purchase {
  kind: Kind; row_id: number;
  student_id: number; student_name: string; student_email: string;
  item_id: number; item_title: string;
  purchased_at: string | null; points: number;
}

const KINDS: Record<Kind, { label: string; icon: React.ReactNode }> = {
  course:          { label: 'درس',        icon: <BookOpen className="h-3 w-3" /> },
  language_course: { label: 'دورة لغة',   icon: <Languages className="h-3 w-3" /> },
  live:            { label: 'دورة',       icon: <Video className="h-3 w-3" /> },
  live_session:    { label: 'حصة مباشرة', icon: <Radio className="h-3 w-3" /> },
  private_class:   { label: 'حصة خاصة',   icon: <UserRound className="h-3 w-3" /> },
};

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

const AdminPurchases = () => {
  const [rows, setRows] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<'all' | Kind>('all');
  const [target, setTarget] = useState<Purchase | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setRows((await api('/admin/purchases')).purchases || []); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const cancel = async () => {
    if (!target) return;
    setBusy(true);
    try {
      const r = await api('/admin/purchases/cancel', {
        method: 'POST',
        body: JSON.stringify({ kind: target.kind, rowId: target.row_id }),
      });
      toast.success(`تم الإلغاء وإرجاع ${r.refunded} نقطة. الرصيد الجديد: ${r.newBalance}`);
      setRows(prev => prev.filter(p => !(p.kind === target.kind && p.row_id === target.row_id)));
      setTarget(null);
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const shown = rows.filter(r =>
    (kind === 'all' || r.kind === kind) &&
    (!q || r.student_name?.toLowerCase().includes(q.toLowerCase())
        || r.student_email?.toLowerCase().includes(q.toLowerCase())
        || r.item_title?.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="space-y-6">
      <PageHeader title="المشتريات" description="إلغاء عملية شراء خاطئة وإرجاع النقاط للطالب تلقائيًا" />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {([
              ['all', 'الكل'], ['course', 'الدروس'], ['language_course', 'دورات اللغات'],
              ['live', 'الدورات'], ['live_session', 'الحصص المباشرة'], ['private_class', 'الحصص الخاصة'],
            ] as const).map(([k, label]) => (
              <Button key={k} size="sm" variant={kind === k ? 'default' : 'outline'} onClick={() => setKind(k)}>
                {label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={load} disabled={loading}>تحديث</Button>
            <div className="relative ml-auto min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث بالطالب أو العنوان"
                className="w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 text-sm" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> جاري التحميل…
            </div>
          ) : shown.length === 0 ? (
            <p className="py-8 text-sm text-gray-500">لا توجد مشتريات.</p>
          ) : (
            <div className="divide-y rounded-md border">
              {shown.map(p => (
                <div key={`${p.kind}-${p.row_id}`} className="flex flex-wrap items-center gap-3 px-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                        {KINDS[p.kind]?.icon}
                        {KINDS[p.kind]?.label || p.kind}
                      </Badge>
                      <span className="truncate font-medium">{p.item_title}</span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-gray-500">
                      {p.student_name} · {p.student_email}
                      {p.purchased_at ? ` · ${serverDate(p.purchased_at).toLocaleDateString()}` : ''}
                    </div>
                  </div>
                  <Badge className="shrink-0">{p.points} نقطة</Badge>
                  <Button size="sm" variant="destructive" className="shrink-0" onClick={() => setTarget(p)}>
                    <RotateCcw className="mr-1 h-4 w-4" /> إلغاء وإرجاع النقاط
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!target} onOpenChange={(v) => { if (!busy && !v) setTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> تأكيد الإلغاء
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>سيتم تنفيذ ما يلي دفعة واحدة:</p>
                <div className="rounded-md border bg-gray-50 p-3 text-sm">
                  <div className="flex justify-between py-0.5">
                    <span>الطالب</span><span className="font-semibold">{target?.student_name}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>{target ? KINDS[target.kind]?.label : ''}</span>
                    <span className="max-w-[55%] truncate font-semibold">{target?.item_title}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t pt-2">
                    <span>سحب الوصول</span><span className="font-semibold text-red-600">نعم</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>إرجاع النقاط</span>
                    <span className="font-semibold text-green-700">+{target?.points}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  لن يتم حذف حساب الطالب ولا محتوى الدورة. يمكنه الشراء مرة أخرى في أي وقت.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); cancel(); }} disabled={busy}
              className="bg-red-600 hover:bg-red-700">
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> جاري…</> : 'تأكيد الإلغاء'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPurchases;

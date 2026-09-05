import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2, Users, ChevronLeft, Search } from 'lucide-react';
import { toast } from '@/lib/toast';
import { API_BASE_URL } from '@/lib/api';

type Kind = 'course' | 'live';
interface Item { id: number; title: string; students: number; }
interface Student { id: number; name: string; email: string; acquired_at: string | null; }
interface Preview {
  removes: { courseAccess: number; liveAccess: number; studentsAffected: number };
  keeps: { courses: number; liveSections: number; courseFiles: number; liveSectionFiles: number; purchaseRecords: number };
  empty: boolean; confirmPhrase: string;
}

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const api = async (path: string, init?: RequestInit) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
};

const StudentAccessCard = () => {
  const [kind, setKind] = useState<Kind>('course');
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [open, setOpen] = useState<Item | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState('');
  const [working, setWorking] = useState(false);

  const loadItems = async (k: Kind) => {
    setLoadingItems(true);
    try { setItems((await api(`/admin/year-reset/items?type=${k}`)).items || []); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoadingItems(false); }
  };

  useEffect(() => { loadItems(kind); }, [kind]);

  const openItem = async (it: Item) => {
    setOpen(it); setPicked(new Set()); setFilter(''); setLoadingStudents(true);
    try { setStudents((await api(`/admin/year-reset/items/${it.id}/students?type=${kind}`)).students || []); }
    catch (e: any) { toast.error(e.message); setStudents([]); }
    finally { setLoadingStudents(false); }
  };

  const shown = students.filter(s =>
    !filter || s.name?.toLowerCase().includes(filter.toLowerCase()) || s.email?.toLowerCase().includes(filter.toLowerCase()));

  const toggle = (id: number) => setPicked(p => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const allShownPicked = shown.length > 0 && shown.every(s => picked.has(s.id));
  const toggleAll = () => setPicked(p => {
    const n = new Set(p);
    if (allShownPicked) shown.forEach(s => n.delete(s.id)); else shown.forEach(s => n.add(s.id));
    return n;
  });

  const revoke = async () => {
    if (!open || picked.size === 0) return;
    setWorking(true);
    try {
      const r = await api('/admin/year-reset/revoke', {
        method: 'POST',
        body: JSON.stringify({ type: kind, id: open.id, studentIds: [...picked] }),
      });
      toast.success(`Removed ${r.revoked} student(s) from "${open.title}".`);
      setStudents(prev => prev.filter(s => !picked.has(s.id)));
      setItems(prev => prev.map(i => i.id === open.id ? { ...i, students: Math.max(0, i.students - r.revoked) } : i));
      setPicked(new Set());
    } catch (e: any) { toast.error(e.message); }
    finally { setWorking(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Student Access</CardTitle>
        <CardDescription>
          See who owns each course or live section, and remove access for the students you pick.
          Nothing about the course itself is changed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!open ? (
          <>
            <div className="mb-4 flex gap-2">
              {(['course', 'live'] as Kind[]).map(k => (
                <Button key={k} size="sm" variant={kind === k ? 'default' : 'outline'} onClick={() => setKind(k)}>
                  {k === 'course' ? 'Courses' : 'الدورات'}
                </Button>
              ))}
            </div>
            {loadingItems ? (
              <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : items.length === 0 ? (
              <p className="py-6 text-sm text-gray-500">Nothing here yet.</p>
            ) : (
              <div className="divide-y rounded-md border">
                {items.map(it => (
                  <button key={it.id} onClick={() => openItem(it)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50">
                    <span className="truncate pr-3">{it.title}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${it.students ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      {it.students} student{it.students === 1 ? '' : 's'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setOpen(null)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <span className="truncate text-sm font-medium">{open.title}</span>
            </div>

            {loadingStudents ? (
              <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading students…
              </div>
            ) : students.length === 0 ? (
              <p className="py-6 text-sm text-gray-500">No student owns this yet.</p>
            ) : (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search name or email"
                      className="w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 text-sm" />
                  </div>
                  <Button size="sm" variant="outline" onClick={toggleAll}>
                    {allShownPicked ? 'Clear' : 'Select all'}
                  </Button>
                </div>

                <div className="max-h-72 divide-y overflow-y-auto rounded-md border">
                  {shown.map(s => (
                    <label key={s.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50">
                      <input type="checkbox" checked={picked.has(s.id)} onChange={() => toggle(s.id)} className="h-4 w-4" />
                      <span className="flex-1 truncate">
                        <span className="font-medium">{s.name}</span>
                        <span className="ml-2 text-xs text-gray-500">{s.email}</span>
                      </span>
                      {s.acquired_at && (
                        <span className="shrink-0 text-xs text-gray-400">
                          {new Date(s.acquired_at).toLocaleDateString()}
                        </span>
                      )}
                    </label>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">{picked.size} selected</span>
                  <Button variant="destructive" size="sm" disabled={picked.size === 0 || working} onClick={revoke}>
                    {working ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removing…</> : 'Remove access'}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

const ClearAllAccessCard = () => {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(false);

  const start = async () => {
    setLoading(true);
    try {
      const data: Preview = await api('/admin/year-reset/preview');
      if (data.empty) { toast.error('No student currently owns anything.'); return; }
      setPreview(data); setOpen(true);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const run = async () => {
    if (!preview) return;
    setRunning(true);
    try {
      const r = await api('/admin/year-reset', {
        method: 'POST', body: JSON.stringify({ confirm: preview.confirmPhrase }),
      });
      toast.success(`Cleared access: ${r.deleted.courseAccess} course + ${r.deleted.liveAccess} live section enrollments removed.`);
      setOpen(false); setPreview(null);
    } catch (e: any) { toast.error(e.message); }
    finally { setRunning(false); }
  };

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" /> New Year Reset
        </CardTitle>
        <CardDescription>
          Removes every student's access to every course and live section, so the new year
          starts with nobody enrolled. Courses, live sections, content and files are kept.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={start} disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking…</> : 'Clear all student access'}
        </Button>
      </CardContent>

      <AlertDialog open={open} onOpenChange={(v) => { if (!running) setOpen(v); }}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm">
                  <div className="mb-1 font-semibold text-red-700">This will remove</div>
                  <div className="flex justify-between"><span>Course enrollments</span><span className="font-semibold">{preview?.removes.courseAccess}</span></div>
                  <div className="flex justify-between"><span>Live section purchases</span><span className="font-semibold">{preview?.removes.liveAccess}</span></div>
                  <div className="flex justify-between"><span>Students affected</span><span className="font-semibold">{preview?.removes.studentsAffected}</span></div>
                </div>

                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm">
                  <div className="mb-1 font-semibold text-green-700">This keeps (nothing is deleted)</div>
                  <div className="flex justify-between"><span>Courses</span><span className="font-semibold">{preview?.keeps.courses}</span></div>
                  <div className="flex justify-between"><span>Live sections</span><span className="font-semibold">{preview?.keeps.liveSections}</span></div>
                  <div className="flex justify-between"><span>Course files</span><span className="font-semibold">{preview?.keeps.courseFiles}</span></div>
                  <div className="flex justify-between"><span>Live section files</span><span className="font-semibold">{preview?.keeps.liveSectionFiles}</span></div>
                  <div className="flex justify-between"><span>Purchase records</span><span className="font-semibold">{preview?.keeps.purchaseRecords}</span></div>
                </div>

                <p className="text-xs text-gray-500">
                  No video or file is removed from storage. Students simply stop owning
                  the courses and must buy them again.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={running}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); run(); }} disabled={running}
              className="bg-red-600 hover:bg-red-700">
              {running ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Clearing…</> : 'Confirm, clear access'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

const YearResetCard = () => (
  <div className="space-y-4">
    <StudentAccessCard />
    <ClearAllAccessCard />
  </div>
);

export default YearResetCard;

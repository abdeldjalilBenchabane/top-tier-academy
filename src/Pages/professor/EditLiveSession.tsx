import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronRight } from 'lucide-react';
import LiveSessionForm from '@/components/forms/LiveSessionForm';

const authHeaders = () => {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const getJSON = async (url: string) => {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const d = await res.json();
  return Array.isArray(d) ? d : d;
};

const asList = (d: any, ...keys: string[]) =>
  Array.isArray(d) ? d : (keys.map(k => d?.[k]).find(Array.isArray) || []);

/**
 * Editing on its own page rather than in a dialog. Everything the form needs —
 * the session, its resolved path, and every dropdown list — is fetched here
 * first, so the form renders once with its options already in place. That is
 * what makes the saved values actually appear in the selects.
 */
const EditLiveSessionPage = ({ asAdmin = false }: { asAdmin?: boolean }) => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [path, setPath] = useState<any>(null);
  const [options, setOptions] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const sessionData = await getJSON(`/api/live-sessions/${sessionId}`);
        const resolved = await getJSON(`/api/live-sessions/${sessionId}/path`);

        const opts: any = {};
        if (resolved?.root_type !== 'language') {
          if (resolved?.level_id) {
            opts.years = asList(await getJSON(`/api/public/levels/${resolved.level_id}/years`), 'years');
          }
          if (resolved?.year_id) {
            opts.specialities = asList(await getJSON(`/api/public/years/${resolved.year_id}/specialities`), 'specialities');
          }
          if (resolved?.speciality_id) {
            opts.materials = asList(await getJSON(`/api/public/specialities/${resolved.speciality_id}/materials`), 'materials');
          } else if (resolved?.year_id) {
            opts.materials = asList(await getJSON(`/api/public/years/${resolved.year_id}/materials`), 'materials');
          }
        }

        if (cancelled) return;
        setSession(sessionData?.session || sessionData);
        setPath(resolved?.material_id || resolved?.language_level_id ? resolved : null);
        setOptions(opts);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'تعذر تحميل البث');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  const backTo = asAdmin ? '/admin/live-sessions' : '/professor/live-sessions';

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> جاري تحميل البث…
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-4 py-8">
        <p className="text-sm text-red-600">{error || 'لم يتم العثور على البث.'}</p>
        <Button variant="outline" asChild><Link to={backTo}>العودة</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to={backTo} className="hover:underline">البث المباشر</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate">{session.title}</span>
      </div>

      <PageHeader
        title="تعديل البث المباشر"
        description="عدّل معلومات البث ومساره التعليمي. تغيير الموعد يرسل إشعارًا لكل طالب اشتراه."
      />

      <Card>
        <CardContent className="pt-6">
          <LiveSessionForm
            asAdmin={asAdmin}
            editingSession={session}
            initialPath={path}
            initialOptions={options}
            onSuccess={() => navigate(backTo)}
            onCancel={() => navigate(backTo)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EditLiveSessionPage;

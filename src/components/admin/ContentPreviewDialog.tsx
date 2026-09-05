import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, FileText, Video, Image as ImageIcon } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

// Shows what a professor actually submitted, so an admin can approve or reject
// with the material in front of them. Works for both courses and live sections:
// the two endpoints return the same sections -> blocks -> files shape.
export interface PreviewTarget {
  kind: 'course' | 'live';
  id: number | string;
  title?: string;
  subtitle?: string;
}

interface Block { id: number; type: string; title?: string; content?: string; fileUrl?: string; files?: any[]; }
interface Section { id: number; title: string; blocks?: Block[]; }

const authHeaders = () => {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const ContentPreviewDialog = ({
  target, onClose, footer,
}: { target: PreviewTarget | null; onClose: () => void; footer?: React.ReactNode }) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [cover, setCover] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null); setSections([]); setCover(null); setDescription('');
      try {
        const path = target.kind === 'live'
          ? `/live-sections/${target.id}/content`
          : `/courses/${target.id}`;
        const res = await fetch(`${API_BASE_URL}${path}`, { headers: authHeaders() });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Failed to load content (${res.status})`);
        if (cancelled) return;
        setSections(data.sections || []);
        setCover(data.cover_image_url || data.cover || null);
        setDescription(data.description || '');
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [target?.kind, target?.id]);

  return (
    <Dialog open={!!target} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="line-clamp-1">{target?.title || 'معاينة المحتوى'}</DialogTitle>
          {target?.subtitle && <DialogDescription>{target.subtitle}</DialogDescription>}
        </DialogHeader>

        {cover && <img src={cover} alt="" className="max-h-48 w-full rounded-md object-cover" />}
        {description && <p className="text-sm text-gray-600">{description}</p>}

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> تحميل المحتوى…
          </div>
        ) : error ? (
          <p className="py-4 text-sm text-red-600">{error}</p>
        ) : sections.length === 0 ? (
          <p className="py-4 text-sm text-gray-500">لا يوجد محتوى بعد.</p>
        ) : (
          <div className="space-y-4">
            {sections.map(sec => (
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
                        <video src={b.fileUrl} controls preload="metadata" className="max-h-64 w-full rounded" />
                      ) : b.type === 'image' && b.fileUrl ? (
                        <img src={b.fileUrl} alt="" className="max-h-64 rounded" />
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
          </div>
        )}

        {footer}
      </DialogContent>
    </Dialog>
  );
};

export default ContentPreviewDialog;

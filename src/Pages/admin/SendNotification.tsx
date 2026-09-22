import React, { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Send, Users, BellRing, AlertTriangle } from 'lucide-react';
import { toast } from '@/lib/toast';
import { API_BASE_URL } from '@/lib/api';

const authHeaders = () => {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
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

// Who can be written to. Each one maps to an audience the send endpoint knows.
const AUDIENCES = [
  { value: 'all_students',   label: 'كل الطلاب' },
  { value: 'all_professors', label: 'كل الأساتذة' },
  { value: 'all_users',      label: 'كل المستخدمين' },
] as const;

type Audience = typeof AUDIENCES[number]['value'];

interface PushStatus {
  push_configured: boolean;
  active_devices: number;
  users_reachable: number;
}

const SendNotification = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [route, setRoute] = useState('');
  const [audience, setAudience] = useState<Audience>('all_students');

  const [status, setStatus] = useState<PushStatus | null>(null);
  const [preview, setPreview] = useState<{ recipients: number; reachable_by_push: number } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api('/admin/push/status').then(setStatus).catch(() => {});
  }, []);

  // The count comes from the server, not a guess: the admin sees the real
  // number of people before committing to a message they cannot recall.
  useEffect(() => {
    setPreview(null);
    api(`/admin/notifications/audience-preview?audience=${audience}`)
      .then(setPreview)
      .catch(() => {});
  }, [audience]);

  const ready = title.trim().length > 0 && message.trim().length > 0;

  const send = async () => {
    setSending(true);
    try {
      const res = await api('/admin/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          audience,
          image_url: imageUrl.trim() || undefined,
          route: route.trim() || undefined,
        }),
      });
      toast.success(res.message);
      if (res.failed > 0) {
        toast.error(`${res.failed} إشعاراً لم يُرسل — راجع سجل الخادم`);
      }
      setConfirming(false);
      setTitle(''); setMessage(''); setImageUrl(''); setRoute('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const audienceLabel = AUDIENCES.find(a => a.value === audience)?.label ?? audience;

  return (
    <div className="space-y-6">
      <PageHeader
        title="إرسال إشعار"
        description="اكتب إشعاراً وأرسله إلى الطلاب أو الأساتذة"
      />

      {/* Push is a separate question from the notification itself: without a
          Firebase key the message still reaches everyone inside the app, and
          the admin should know that rather than assume phones buzzed. */}
      {status && !status.push_configured && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">إشعارات الهاتف غير مفعّلة بعد</p>
            <p className="mt-1">
              الإشعار سيصل إلى مركز الإشعارات داخل التطبيق والموقع، لكنه لن يظهر على
              شاشة الهاتف. يحتاج الخادم مفتاح حساب الخدمة من Firebase.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">محتوى الإشعار</CardTitle>
            <CardDescription>هذا ما سيراه المستخدم</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">العنوان</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: دورة جديدة متاحة الآن"
                maxLength={120}
              />
              <p className="text-xs text-gray-500">{title.length}/120</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">النص</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="اكتب نص الإشعار هنا…"
                maxLength={500}
              />
              <p className="text-xs text-gray-500">{message.length}/500</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="route">الوجهة عند الضغط (اختياري)</Label>
                <Input
                  id="route"
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                  placeholder="/TTHCourses"
                  dir="ltr"
                />
                <p className="text-xs text-gray-500">اتركه فارغاً ليفتح مركز الإشعارات</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="image">رابط صورة (اختياري)</Label>
                <Input
                  id="image"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://…"
                  dir="ltr"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">من يستقبله</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {AUDIENCES.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setAudience(a.value)}
                  className={`w-full rounded-lg border-2 p-3 text-right transition ${
                    audience === a.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                  }`}
                >
                  <span className="font-medium">{a.label}</span>
                </button>
              ))}

              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
                {preview ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span><strong>{preview.recipients}</strong> مستخدماً سيستقبله</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-gray-600">
                      <BellRing className="h-4 w-4 text-gray-500" />
                      <span>
                        <strong>{preview.reachable_by_push}</strong> منهم لديه جهاز مسجّل
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-gray-500">جاري الحساب…</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* The preview is the last thing before a message that cannot be
              unsent, so it shows the notification the way the phone will. */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معاينة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border bg-white p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#194cbf] text-white">
                    <BellRing className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-sm">
                      {title.trim() || 'عنوان الإشعار'}
                    </p>
                    <p className="line-clamp-3 text-sm text-gray-600">
                      {message.trim() || 'نص الإشعار سيظهر هنا'}
                    </p>
                  </div>
                </div>
                {imageUrl.trim() && (
                  <img
                    src={imageUrl.trim()}
                    alt=""
                    className="mt-3 max-h-32 w-full rounded-lg object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            disabled={!ready || sending}
            onClick={() => setConfirming(true)}
          >
            <Send className="ml-2 h-4 w-4" />
            إرسال
          </Button>
        </div>
      </div>

      {/* A notification cannot be recalled once sent, so the number of people
          it reaches is shown one more time, in words, before it goes. */}
      <Dialog open={confirming} onOpenChange={(v) => { if (!sending && !v) setConfirming(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الإرسال</DialogTitle>
            <DialogDescription className="text-right">
              سيصل هذا الإشعار إلى <strong>{preview?.recipients ?? '…'}</strong> مستخدماً
              ({audienceLabel}). لا يمكن التراجع بعد الإرسال.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-gray-50 p-3">
            <p className="font-semibold text-sm">{title.trim()}</p>
            <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{message.trim()}</p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={sending} onClick={() => setConfirming(false)}>
              إلغاء
            </Button>
            <Button disabled={sending} onClick={send}>
              {sending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {sending ? 'جاري الإرسال…' : 'تأكيد الإرسال'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SendNotification;

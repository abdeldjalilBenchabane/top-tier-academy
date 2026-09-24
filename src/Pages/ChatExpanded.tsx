// A full-screen reading view for the live chat.
//
// The sidebar is 320px wide and sits beside the video, which is fine for
// glancing at but poor for actually reading a busy room — and the teacher, who
// has to follow what students are asking while also teaching, had the worst of
// it. This is the same conversation and the same input, given the whole
// window.
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, Users, Pin, PinOff } from 'lucide-react';
import ChatAvatar, { senderColors } from '@/components/ChatAvatar';

interface Message {
    sender: string;
    text: string;
    color: string;
    // Set when the page knows who wrote it: your own messages sit on one
    // side, everyone else's on the other.
    mine?: boolean;
    socketId?: string;
    userId?: number | string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    messages: Message[];
    input: string;
    setInput: (val: string) => void;
    handleSend: () => void;
    chatEnabled: boolean;
    isProfessor: boolean;
    // The same three the side panel gets, so the big view is not a poorer
    // copy of it: what is pinned, where the unread ones start, and — for a
    // teacher — the ability to pin and unpin from here too.
    pinnedMessage?: { sender: string; text: string } | null;
    unreadDividerIndex?: number | null;
    onPin?: (message: Message) => void;
    onUnpin?: () => void;
    // Used only to find someone's picture; a name with no match falls back to
    // its initial.
    participants?: any[];
}

const ChatExpanded: React.FC<Props> = ({
    open, onClose, messages, input, setInput, handleSend, chatEnabled, isProfessor,
    pinnedMessage = null, unreadDividerIndex = null, onPin, onUnpin, participants = [],
}) => {
    // A message carries the sender's socket (live) or user id (history); the
    // participants list carries their picture. Match on either.
    const avatarFor = (msg: Message): string | null => {
        const found = participants.find((p: any) =>
            (msg.socketId && p.id === msg.socketId) ||
            (msg.userId !== undefined && String(p.userId) === String(msg.userId)) ||
            (p.name && p.name === msg.sender));
        return found?.avatar_url || null;
    };
    const endRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Escape closes it, the way every other overlay on the site behaves.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    // Opening on an old message would hide the newest ones, which are the
    // point, so land at the bottom and stay there.
    useEffect(() => {
        if (open) endRef.current?.scrollIntoView({ block: 'end' });
    }, [open, messages.length]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height =
                Math.min(textareaRef.current.scrollHeight, 160) + 'px';
        }
    }, [input]);

    if (!open) return null;

    return (
        <div
            dir="rtl"
            className="fixed inset-0 z-[10050] flex flex-col bg-[#0b1020]/95 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label="الدردشة المباشرة"
        >
            <header className="flex items-center gap-3 border-b border-white/15 px-4 py-3 sm:px-6">
                <MessageSquare className="h-5 w-5 text-purple-300" />
                <h2 className="text-lg font-semibold text-white">الدردشة المباشرة</h2>
                <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-gray-300">
                    <Users className="h-3.5 w-3.5" />
                    {messages.length} رسالة
                </span>
                {!chatEnabled && (
                    <span className="text-xs text-red-400">الدردشة مغلقة من قبل الأستاذ</span>
                )}
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="إغلاق"
                    className="mr-auto rounded-lg p-2 text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                    <X className="h-5 w-5" />
                </button>
            </header>

            {pinnedMessage && (
                <div className="border-b border-white/10 px-4 py-3 sm:px-6">
                    <div className="mx-auto flex max-w-3xl items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
                        <Pin className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold tracking-wide text-amber-300">مثبّتة</p>
                            <p className="text-xs font-semibold text-amber-100">{pinnedMessage.sender}</p>
                            <p className="whitespace-pre-line break-words text-sm text-amber-50/90">{pinnedMessage.text}</p>
                        </div>
                        {isProfessor && onUnpin && (
                            <button
                                type="button"
                                onClick={onUnpin}
                                title="إلغاء التثبيت"
                                aria-label="إلغاء التثبيت"
                                className="rounded-full p-1 text-amber-200 transition hover:bg-amber-400/20"
                            >
                                <PinOff className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                <div className="mx-auto max-w-3xl space-y-3">
                    {messages.length === 0 ? (
                        <div className="py-20 text-center text-gray-400">
                            <MessageSquare className="mx-auto mb-3 h-10 w-10 opacity-40" />
                            <p className="text-base">لا توجد رسائل بعد</p>
                            <p className="mt-1 text-sm opacity-70">
                                {isProfessor ? 'ستظهر أسئلة الطلاب هنا' : 'ابدأ المحادثة!'}
                            </p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const mine = msg.mine === true;
                            const colors = senderColors(msg.sender, mine);
                            return (
                                <React.Fragment key={idx}>
                                    {unreadDividerIndex !== null && idx === unreadDividerIndex && (
                                        <div className="flex items-center gap-2 py-1" aria-label="رسائل جديدة">
                                            <span className="h-px flex-1 bg-red-500/60" />
                                            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-300">
                                                رسائل جديدة
                                            </span>
                                            <span className="h-px flex-1 bg-red-500/60" />
                                        </div>
                                    )}
                                    {/* Yours on one side, everyone else's on the other, so a
                                        back-and-forth reads as a conversation. */}
                                    <div className={`group flex items-end gap-2 ${mine ? 'flex-row' : 'flex-row-reverse'}`}>
                                        <ChatAvatar name={msg.sender} avatarUrl={avatarFor(msg)} mine={mine} size={30} />
                                        <div className={`min-w-0 max-w-[78%] rounded-2xl px-4 py-2.5 ${
                                            mine ? 'bg-[#194cbf]/30 rounded-bl-sm' : 'bg-white/[0.07] rounded-br-sm'
                                        }`}>
                                            <div className={`text-xs font-bold ${colors.text}`}>
                                                {mine ? 'أنت' : msg.sender}
                                            </div>
                                            <div className="mt-0.5 whitespace-pre-line break-words text-[15px] leading-relaxed text-gray-100">
                                                {msg.text}
                                            </div>
                                        </div>
                                        {isProfessor && onPin && (
                                            <button
                                                type="button"
                                                onClick={() => onPin(msg)}
                                                title="تثبيت الرسالة"
                                                aria-label="تثبيت الرسالة"
                                                className="mb-1 rounded-full p-1.5 text-gray-500 opacity-0 transition hover:bg-white/10 hover:text-amber-300 focus:opacity-100 group-hover:opacity-100"
                                            >
                                                <Pin className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </React.Fragment>
                            );
                        })
                    )}
                    <div ref={endRef} />
                </div>
            </div>

            <div className="border-t border-white/15 px-4 py-3 sm:px-6">
                <div className="mx-auto flex max-w-3xl items-end gap-2">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        disabled={!chatEnabled}
                        placeholder={chatEnabled ? 'اكتب رسالتك…' : 'الدردشة مغلقة'}
                        className="min-h-[44px] flex-1 resize-none break-words rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <Button
                        className="h-[44px] bg-purple-600 px-5 hover:bg-purple-700"
                        onClick={handleSend}
                        disabled={!chatEnabled || !input.trim()}
                    >
                        إرسال
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChatExpanded;

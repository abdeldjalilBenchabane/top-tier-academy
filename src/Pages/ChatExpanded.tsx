// A full-screen reading view for the live chat.
//
// The sidebar is 320px wide and sits beside the video, which is fine for
// glancing at but poor for actually reading a busy room — and the teacher, who
// has to follow what students are asking while also teaching, had the worst of
// it. This is the same conversation and the same input, given the whole
// window.
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, Users } from 'lucide-react';

interface Message {
    sender: string;
    text: string;
    color: string;
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
}

const ChatExpanded: React.FC<Props> = ({
    open, onClose, messages, input, setInput, handleSend, chatEnabled, isProfessor,
}) => {
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
                        messages.map((msg, idx) => (
                            <div key={idx} className="rounded-xl bg-white/5 px-4 py-3">
                                <div className={`text-sm font-semibold ${msg.color}`}>{msg.sender}</div>
                                <div className="mt-1 whitespace-pre-line break-words text-base leading-relaxed text-gray-100">
                                    {msg.text}
                                </div>
                            </div>
                        ))
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

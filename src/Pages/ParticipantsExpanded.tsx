// The whole room, in one window.
//
// The panel beside the video shows two people per row and scrolls, which is
// fine for a handful and useless for forty: a teacher wanting to know who is
// actually watching had to scroll a narrow column. This gives the same list
// the full width, with a search box, the teacher first, and the microphone
// switch on each row.
import React, { useEffect, useMemo, useState } from 'react';
import { Users, X, Mic, MicOff, Search } from 'lucide-react';
import ChatAvatar from '@/components/ChatAvatar';

interface Props {
    open: boolean;
    onClose: () => void;
    participants: any[];
    currentUserId?: number | string;
    isProfessor: boolean;
    studentsMuted: boolean;
    studentMuteStates: Record<string, boolean>;
    isLocalMicMuted: boolean;
    onToggleStudentMic?: (participant: any, muted: boolean) => void;
}

const ParticipantsExpanded: React.FC<Props> = ({
    open, onClose, participants, currentUserId, isProfessor,
    studentsMuted, studentMuteStates, isLocalMicMuted, onToggleStudentMic,
}) => {
    const [query, setQuery] = useState('');

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    // Teachers first, then everyone by name, so the list does not reshuffle
    // as people come and go.
    const shown = useMemo(() => {
        const text = query.trim().toLowerCase();
        return [...participants]
            .filter((p) => !text || String(p.name || '').toLowerCase().includes(text))
            .sort((a, b) => {
                const teacher = (p: any) => (p.role === 'professor' ? 0 : 1);
                if (teacher(a) !== teacher(b)) return teacher(a) - teacher(b);
                return String(a.name || '').localeCompare(String(b.name || ''), 'ar');
            });
    }, [participants, query]);

    if (!open) return null;

    const students = participants.filter((p) => p.role !== 'professor').length;

    return (
        <div
            dir="rtl"
            className="fixed inset-0 z-[10050] flex flex-col bg-[#0b1020]/95 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label="المشاركون"
        >
            <header className="flex flex-wrap items-center gap-3 border-b border-white/15 px-4 py-3 sm:px-6">
                <Users className="h-5 w-5 text-[#9ec1ff]" />
                <h2 className="text-lg font-semibold text-white">المشاركون</h2>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-gray-300">
                    {students} طالب
                </span>
                {isProfessor && (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        studentsMuted ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                    }`}>
                        {studentsMuted ? 'جميع الطلاب مكتومون' : 'الطلاب يمكنهم التحكم في الميكروفون'}
                    </span>
                )}
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="إغلاق"
                    title="إغلاق"
                    className="mr-auto rounded-lg p-2 text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                    <X className="h-5 w-5" />
                </button>
            </header>

            {/* A search box earns its place once the room is big enough that
                scanning the list stops working. */}
            {participants.length > 8 && (
                <div className="border-b border-white/10 px-4 py-3 sm:px-6">
                    <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2">
                        <Search className="h-4 w-4 shrink-0 text-gray-400" />
                        <input
                            id="participants-search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="ابحث عن طالب…"
                            className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                        />
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                <div className="mx-auto grid max-w-5xl gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {shown.length === 0 ? (
                        <p className="col-span-full py-16 text-center text-gray-400">
                            {query ? 'لا أحد بهذا الاسم' : 'لا يوجد مشاركون بعد'}
                        </p>
                    ) : shown.map((p) => {
                        const isTeacher = p.role === 'professor';
                        const isMe = String(p.userId) === String(currentUserId);
                        const muted = isTeacher
                            ? (isMe ? isLocalMicMuted : false)
                            : (studentMuteStates[p.userId] !== undefined ? studentMuteStates[p.userId] : true);
                        return (
                            <div
                                key={p.userId ?? p.id}
                                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5"
                            >
                                <span className="relative shrink-0">
                                    <span className={`block rounded-full border-2 ${muted ? 'border-red-500' : 'border-green-500'}`}>
                                        <ChatAvatar name={p.name || 'مستخدم'} avatarUrl={p.avatar_url} mine={isMe} size={34} />
                                    </span>
                                    <span
                                        title={muted ? 'مكتوم' : 'ميكروفون نشط'}
                                        className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0b1020] ${muted ? 'bg-red-500' : 'bg-green-500'}`}
                                    />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-white">
                                        {p.name || 'مستخدم'}{isMe && ' (أنت)'}
                                    </p>
                                    <p className="text-[11px] text-gray-400">{isTeacher ? 'أستاذ' : 'طالب'}</p>
                                </div>

                                

                                {isProfessor && !isTeacher && onToggleStudentMic && (
                                    <button
                                        type="button"
                                        title={muted ? 'إعطاء الميكروفون' : 'كتم الطالب'}
                                        aria-label={muted ? 'إعطاء الميكروفون' : 'كتم الطالب'}
                                        onClick={() => onToggleStudentMic(p, !muted)}
                                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition ${
                                            muted
                                                ? 'bg-green-600/90 text-white hover:bg-green-600'
                                                : 'bg-red-600/90 text-white hover:bg-red-600'
                                        }`}
                                    >
                                        {muted ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ParticipantsExpanded;

// src/components/ChatSidebar.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface Message {
    sender: string;
    text: string;
    color: string;
}

interface Props {
    messages: Message[];
    input: string;
    setInput: (val: string) => void;
    handleSend: () => void;
    chatEnabled: boolean;
    studentsMuted: boolean;
    isProfessor: boolean;
}


const ChatSidebar: React.FC<Props> = ({
    messages,
    input,
    setInput,
    handleSend,
    chatEnabled,
    studentsMuted,
    isProfessor
}) => {
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 h-[600px] flex flex-col">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/20">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-semibold">الدردشة المباشرة</h3>
                {!chatEnabled && <span className="ml-2 text-xs text-red-400">الدردشة مغلقة من قبل الأستاذ</span>}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>لا توجد رسائل بعد</p>
                        <p className="text-xs">ابدأ المحادثة!</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-3">
                            <div className={`font-medium text-sm ${msg.color}`}>{msg.sender}</div>
                            <div className="text-sm text-gray-300">{msg.text}</div>
                        </div>
                    ))
                )}
                <div ref={chatEndRef}></div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="text"
                    placeholder={chatEnabled ? "اكتب رسالتك..." : "الدردشة مغلقة"}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    disabled={!chatEnabled}
                />
                <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={handleSend}
                    disabled={!chatEnabled || !input.trim()}
                >
                    إرسال
                </Button>
            </div>

            {!chatEnabled && (
                <div className="text-xs text-red-400 mt-2 text-center">تم إيقاف الدردشة من قبل الأستاذ</div>
            )}
            {studentsMuted && !isProfessor && (
                <div className="text-xs text-yellow-400 mt-2 text-center">تم كتم الميكروفون من قبل الأستاذ</div>
            )}
            {/* Participants list for professor */}
            {isProfessor && (
                <div className="bg-white/10 rounded-xl p-4 mt-6">
                    <h3 className="font-bold mb-2 text-white">المشاركون</h3>
                    <ul>
                        {participants.map((p) => (
                            <li key={p.id} className="flex items-center justify-between mb-2">
                                <span className="text-white">{p.name || p.id}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>

    );
};

export default ChatSidebar;

// src/components/ChatSidebar.tsx
import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Maximize2 } from 'lucide-react';

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
    // Opens the same conversation in a full-window view. Optional so the
    // component still works anywhere that has no room to expand into.
    onExpand?: () => void;
    // Fill the height of whatever holds it, instead of a fixed 400/600px.
    // The live page stacks this beside the participants list and wants the
    // two to come out the same size.
    fill?: boolean;
}

const ChatSidebar: React.FC<Props> = ({
    messages,
    input,
    setInput,
    handleSend,
    chatEnabled,
    studentsMuted,
    isProfessor,
    onExpand,
    fill = false
}) => {
    const chatEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-expand textarea as user types
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatEndRef.current) {
            // Scroll only within the chat container, not the whole page
            const chatContainer = chatEndRef.current.closest('.overflow-y-auto');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }
    }, [messages]);

    return (
        <>
            <style>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;  /* Internet Explorer 10+ */
                    scrollbar-width: none;  /* Firefox */
                }
                .scrollbar-hide::-webkit-scrollbar { 
                    display: none;  /* Safari and Chrome */
                }
            `}</style>
            <div className={`rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur-sm p-4 flex flex-col ${fill ? 'h-full' : 'h-[400px] lg:h-[600px]'}`}>
                <div
                    className={`flex items-center gap-2 mb-4 pb-4 border-b border-white/20 ${onExpand ? 'cursor-pointer' : ''}`}
                    onClick={onExpand}
                >
                    <MessageSquare className="w-5 h-5" />
                    <h3 className="font-semibold">الدردشة المباشرة</h3>
                    {!chatEnabled && <span className="ml-2 text-xs text-red-400">الدردشة مغلقة من قبل الأستاذ</span>}
                    {onExpand && (
                        <button
                            type="button"
                            onClick={onExpand}
                            title="توسيع الدردشة"
                            aria-label="توسيع الدردشة"
                            className="ml-auto rounded-lg p-1.5 text-gray-300 transition hover:bg-white/10 hover:text-white"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 mb-4 scrollbar-hide">
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
                                <div className="text-sm text-gray-300 break-words whitespace-pre-line">{msg.text}</div>
                            </div>
                        ))
                    )}
                    <div ref={chatEndRef}></div>
                </div>

                <div className="flex items-center gap-2">
                    <textarea
                        ref={textareaRef}
                        placeholder={chatEnabled ? "اكتب رسالتك..." : "الدردشة مغلقة"}
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none break-words whitespace-pre-line min-h-[40px] text-base sm:text-lg scrollbar-hide"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        disabled={!chatEnabled}
                        rows={1}
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
                </div>
        </>
    );
};

export default ChatSidebar;

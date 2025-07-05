import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Heart, MessageSquare, Share2, Settings, MicOff, Mic, MessageCircle, Fullscreen, Pause, Play as PlayIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AgoraVideoPlayer from '@/components/AgoraVideoPlayer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import ChatSidebar from './ChatSidebar';

// Placeholder for future Agora integration
// import AgoraRTC from 'agora-rtc-sdk-ng';

// Environment variables for Agora
const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || 'e8a09e60ab1548d4b0f18a0cd440f8b7';
const AGORA_APP_CERTIFICATE = import.meta.env.VITE_AGORA_APP_CERTIFICATE;

const StreamingInternal = ({ id, user, navigate }: { id: string; user: any; navigate: any }) => {

    const [session, setSession] = useState<any>(null);
    const [loadingSession, setLoadingSession] = useState(true);
    const [chatEnabled, setChatEnabled] = useState(true);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const chatEndRef = useRef(null);
    const [studentsMuted, setStudentsMuted] = useState(true);
    const [agoraToken, setAgoraToken] = useState<string | null>(null);
    const [agoraError, setAgoraError] = useState<string | null>(null);
    const [agoraUid, setAgoraUid] = useState<number | null>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [isUnmuted, setIsUnmuted] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [accessChecked, setAccessChecked] = useState(false);
    const [canAccess, setCanAccess] = useState(true);
    
    // Socket.IO for chat
    const [socket, setSocket] = useState<Socket | null>(null);

    // Generate a stable UID that doesn't change on re-renders
    const stableUid = useMemo(() => {
        const userBase = parseInt(String(user.id).replace(/\D/g, '')) % 1000;
        const sessionBase = parseInt(String(id).replace(/\D/g, '')) % 1000;
        const randomPart = Math.floor(Math.random() * 9000) + 1000;
        const numericUid = (userBase + sessionBase + randomPart) % 10000;
        return numericUid;
    }, [user.id, id]);

    useEffect(() => {
        const fetchSession = async () => {
            if (!id) return;
            try {
                const data = await api.getLiveSession(id);
                setSession(data);
            } catch (error) {
                setSession(null);
            } finally {
                setLoadingSession(false);
            }
        };
        fetchSession();
    }, [id]);

    // Role detection (professor or student)
    const role = user?.role === 'professor' ? 'host' : 'audience';
    const isProfessor = role === 'host';

    // Scroll chat to bottom on new message
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // TODO: Integrate Agora SDK here
    // useEffect(() => { ... }, [role, id]);

    useEffect(() => {
        const fetchToken = async () => {
            if (!user?.id || !stableUid || agoraToken !== null) return;

            // Avoid multiple token requests

            console.log('[DEBUG] Frontend requesting token with null UID (Agora will assign)');
            console.log('[DEBUG] Request URL:', `/api/rtcToken?channel=${id}&uid=${stableUid}`);

            try {
                const res = await fetch(`/api/rtcToken?channel=${id}&uid=${stableUid}`,
                    {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });

                console.log('[DEBUG] Token response status:', res.status);

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    console.error('[DEBUG] Token request failed:', errorData);
                    setAgoraError('Failed to get video token: ' + (errorData.error || 'Unknown error'));
                    return;
                }

                const data = await res.json();
                console.log('[DEBUG] Token received successfully for UID:', data.uid);
                console.log('[DEBUG] Token length:', data.token ? data.token.length : 0);
                setAgoraToken(data.token);
                setAgoraUid(data.uid);
            } catch (error) {
                console.error('[DEBUG] Token fetch error:', error);
                setAgoraError('Network error while fetching token: ' + error.message);
            }
        };
        fetchToken();
    }, [id, user?.id, stableUid, agoraToken]); // Removed agoraToken from dependencies

    useEffect(() => {
        console.log('[DEBUG] user at mount:', user);
        if (user) {
            console.log('[DEBUG] user.id:', user.id, 'typeof:', typeof user.id);
        }
    }, [user]);

    // Initialize Socket.IO for chat
    useEffect(() => {
        if (!user?.id || !id) return;

        console.log('[DEBUG] Initializing Socket.IO for chat');
        
        const newSocket = io('http://localhost:5001');
        setSocket(newSocket);

        // Connection event handlers
        newSocket.on('connect', () => {
            console.log('[DEBUG] Socket.IO connected successfully');
            
            // Add current user to participants list
            setParticipants(prev => {
                const currentUser = {
                    id: newSocket.id,
                    name: user.name || 'مستخدم',
                    role: user.role,
                    avatar_url: user.avatar_url
                };
                
                // Check if user already exists
                if (prev.find(p => p.id === currentUser.id)) return prev;
                return [...prev, currentUser];
            });
        });

        newSocket.on('connect_error', (error) => {
            console.error('[DEBUG] Socket.IO connection error:', error);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('[DEBUG] Socket.IO disconnected:', reason);
        });

        // Join the chat room
        newSocket.emit('join-room', id, {
            name: user.name || 'مستخدم',
            role: user.role,
            id: user.id,
            avatar_url: user.avatar_url
        });

        // Listen for new messages
        newSocket.on('new-message', (messageData) => {
            console.log('[DEBUG] Socket.IO message received:', messageData);
            setMessages(prev => [...prev, {
                sender: messageData.sender,
                color: messageData.id === newSocket.id ? 'text-green-300' : 'text-blue-300',
                text: messageData.text
            }]);
        });

        // Listen for user joined
        newSocket.on('user-joined', (userData) => {
            console.log('[DEBUG] User joined via Socket.IO:', userData);
            setParticipants(prev => {
                if (prev.find(p => p.id === userData.id)) return prev;
                return [...prev, { id: userData.id, name: userData.name, role: userData.role, avatar_url: userData.avatar_url }];
            });
            setViewerCount(prev => prev + 1);
        });

        // Listen for user left
        newSocket.on('user-left', (userData) => {
            console.log('[DEBUG] User left via Socket.IO:', userData);
            setParticipants(prev => prev.filter(p => p.id !== userData.id));
            setViewerCount(prev => Math.max(0, prev - 1));
        });

        // Listen for professor controls
        newSocket.on('students-muted', () => {
            console.log('[DEBUG] Students muted by professor');
            setStudentsMuted(true);
        });

        newSocket.on('students-unmuted', () => {
            console.log('[DEBUG] Students unmuted by professor');
            setStudentsMuted(false);
        });

        newSocket.on('chat-toggled', (enabled) => {
            console.log('[DEBUG] Chat toggled by professor:', enabled);
            setChatEnabled(enabled);
        });

        return () => {
            console.log('[DEBUG] Cleaning up Socket.IO connection');
            newSocket.disconnect();
        };
    }, [user?.id, id]);

    useEffect(() => {
        console.log('[DEBUG] Re-render, messages.length:', messages.length);
        console.log('[DEBUG] Messages:', messages);
    }, [messages]);

    // Send message function (Socket.IO only)
    const handleSend = () => {
        if (!input.trim() || !socket) {
            console.log('[DEBUG] Cannot send message:', { 
                hasInput: !!input.trim(), 
                hasSocket: !!socket,
                input: input 
            });
            return;
        }

        const message = {
            type: 'CHAT',
            text: input,
            sender: user?.name || 'مستخدم'
        };

        console.log('[DEBUG] Sending message via Socket.IO:', {
            sender: message.sender,
            text: message.text,
            roomId: id,
            socketId: socket.id
        });

        // Send via Socket.IO
        socket.emit('send-message', id, {
            sender: message.sender,
            text: message.text
        });

        setInput('');
    };

    // Professor controls (Socket.IO only)
    const handleMuteAll = () => {
        setStudentsMuted(true);
        if (socket) {
            socket.emit('mute-all', id);
        }
    };
    
    const handleUnmuteAll = () => {
        setStudentsMuted(false);
        if (socket) {
            socket.emit('unmute-all', id);
        }
    };
    
    const handleToggleChat = () => {
        setChatEnabled((v) => {
            const newValue = !v;
            if (socket) {
                socket.emit('toggle-chat', id, newValue);
            }
            return newValue;
        });
    };

    useEffect(() => {
        const checkAccess = async () => {
            if (user?.role === 'student' && id) {
                try {
                    console.log('[DEBUG] Checking access for user.id:', user.id, 'session id:', id);
                    const res = await fetch(`/api/live-sessions/${id}/access?student_id=${user.id}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    const data = await res.json();
                    console.log('[DEBUG] Access API response:', data);
                    setCanAccess(data.can_access);
                } catch (err) {
                    console.error('[DEBUG] Error checking access:', err);
                    setCanAccess(false);
                } finally {
                    setAccessChecked(true);
                }
            } else {
                setAccessChecked(true);
            }
        };
        checkAccess();
    }, [id, user]);

    useEffect(() => {
        console.log('[DEBUG] user:', user);
        console.log('[DEBUG] canAccess:', canAccess, 'accessChecked:', accessChecked);
    }, [user, canAccess, accessChecked]);

    // Plein écran
    const handleFullScreen = () => {
        const elem = document.getElementById('agora-video-container');
        if (elem) {
            if (!document.fullscreenElement) {
                elem.requestFullscreen();
                setIsFullScreen(true);
            } else {
                document.exitFullscreen();
                setIsFullScreen(false);
            }
        }
    };

    // Pause/reprise (mock)
    const handlePause = () => setIsPaused((v) => !v);

    // Debug panel for development
    const debugPanel = null; // Removed debug panel to hide sensitive information

    if (loadingSession) {
        return <div className="py-8 text-center text-white">Chargement de la session...</div>;
    }
    if (!session) {
        return <div className="py-8 text-center text-red-400">Session introuvable</div>;
    }

    if (!accessChecked) {
        return <div className="py-8 text-center text-white">Vérification de l'accès...</div>;
    }
    if (!canAccess) {
        return <div className="py-8 text-center text-red-400">لا يمكنك الوصول إلى هذه الجلسة. يرجى شراء الجلسة أولاً.</div>;
    }
    console.log('[DEBUG] Re-render, messages.length:', messages.length);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
            {debugPanel}
            
            {/* Header */}
            <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(-1)}
                            className="text-white hover:bg-white/10"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            العودة
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold">{session.title}</h1>
                            <p className="text-sm text-gray-300">مشاهدون: {viewerCount}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                            <Users className="w-4 h-4 mr-2" />
                            المشاركون
                        </Button>
                        <Button size="sm" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                            <Share2 className="w-4 h-4 mr-2" />
                            مشاركة
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Video Player (Agora placeholder) */}
                <div className="lg:col-span-3">
                    <div className="bg-black rounded-xl overflow-hidden shadow-2xl relative">
                        <div id="agora-video-container" className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative flex items-center justify-center">
                            {/* Zone vidéo Agora */}
                            {agoraToken ? (
                                <>
                                    <ErrorBoundary>
                                        <AgoraVideoPlayer
                                            appId={AGORA_APP_ID}
                                            channel={id as string}
                                            token={agoraToken}
                                            uid={agoraUid || 0}
                                            role={isProfessor ? 'host' : 'audience'}
                                            studentsMuted={studentsMuted}
                                            onError={(err) => {
                                                console.error('[DEBUG] AgoraVideoPlayer error:', err);
                                                setAgoraError('فشل الاتصال بالبث المباشر. يرجى المحاولة لاحقاً.');
                                            }}
                                        />
                                    </ErrorBoundary>

                                    {agoraError && (
                                        <div className="text-red-400 text-center py-4">{agoraError}</div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                    <p>جاري الاتصال بالبث المباشر...</p>
                                </div>
                            )}

                            {/* Video Controls */}
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                                <Button size="sm" variant="secondary" className="bg-black/50 hover:bg-black/70 text-white border-0" onClick={handlePause}>
                                    {isPaused ? <PlayIcon className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                </Button>
                                <Button size="sm" variant="secondary" className="bg-black/50 hover:bg-black/70 text-white border-0" onClick={handleFullScreen}>
                                    <Fullscreen className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Professor Controls */}
                            {isProfessor && (
                                <div className="absolute top-4 left-4 flex gap-2 z-10">
                                    <Button size="sm" variant="secondary" className="bg-black/50 hover:bg-black/70 text-white border-0" onClick={handleMuteAll}>
                                        <MicOff className="w-4 h-4" /> كتم الجميع
                                    </Button>
                                    <Button size="sm" variant="secondary" className="bg-black/50 hover:bg-black/70 text-white border-0" onClick={handleUnmuteAll}>
                                        <Mic className="w-4 h-4" /> إلغاء كتم الجميع
                                    </Button>
                                    <Button size="sm" variant={chatEnabled ? 'secondary' : 'destructive'} className="bg-black/50 hover:bg-black/70 text-white border-0" onClick={handleToggleChat}>
                                        <MessageCircle className="w-4 h-4" /> {chatEnabled ? 'إيقاف الدردشة' : 'تفعيل الدردشة'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Video Info */}
                    <div className="mt-6">
                        <h1 className="text-2xl font-bold mb-2">{session.title}</h1>
                        <p className="text-gray-300 mb-4">مقدم من: {session.presenter}</p>
                        <p className="text-gray-400 leading-relaxed">{session.description}</p>
                        <div className="flex items-center gap-4 mt-6">
                            <Button className="bg-red-500 hover:bg-red-600 flex items-center gap-2">
                                <Heart className="w-4 h-4" />
                                إعجاب ({session.likes})
                            </Button>
                            <Button variant="outline" className="border-white/20 bg-white/15 text-white hover:bg-white/10 flex  items-center gap-2">
                                <Share2 className="w-4 h-4" />
                                مشاركة
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Chat Sidebar */}
                <ChatSidebar
                    key={`chat-${messages.length}`} // 🔥 clé dynamique
                    messages={messages}
                    input={input}
                    setInput={setInput}
                    handleSend={handleSend}
                    chatEnabled={chatEnabled}
                    studentsMuted={studentsMuted}
                    isProfessor={isProfessor}
                />

            </div>

            {/* Interactive Participants List */}
            <div className="bg-white/10 rounded-xl p-4 mt-6">
                <h3 className="font-bold mb-4 text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    المشاركون ({participants.length})
                </h3>
                
                {participants.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-3 flex items-center justify-center">
                            <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-400 text-sm">لا يوجد مشاركون بعد</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {participants.map((participant) => (
                            <div 
                                key={participant.id} 
                                className="relative group cursor-pointer"
                                title={participant.name}
                            >
                                {/* Avatar Circle */}
                                <div className="relative w-16 h-16 mx-auto">
                                    {/* Profile Picture or Initial */}
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white/20 group-hover:border-green-400 transition-all duration-200">
                                        {participant.avatar_url ? (
                                            <img 
                                                src={participant.avatar_url} 
                                                alt={participant.name}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <span>{participant.name ? participant.name.charAt(0).toUpperCase() : 'م'}</span>
                                        )}
                                    </div>
                                    
                                    {/* Online Status Indicator */}
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                    
                                    {/* Hover Effect */}
                                    <div className="absolute inset-0 rounded-full bg-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                                </div>
                                
                                {/* Name */}
                                <div className="text-center mt-2">
                                    <p className="text-white text-sm font-medium truncate">
                                        {participant.name || 'مستخدم'}
                                    </p>
                                    {participant.role && (
                                        <p className="text-gray-400 text-xs">
                                            {participant.role === 'professor' ? 'أستاذ' : 'طالب'}
                                        </p>
                                    )}
                                </div>
                                
                                {/* Hover Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                    {participant.name || 'مستخدم'}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Participants Summary */}
                <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between text-sm text-gray-300">
                        <span>إجمالي المشاركين: {participants.length}</span>
                        <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            متصلون الآن
                        </span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default StreamingInternal;

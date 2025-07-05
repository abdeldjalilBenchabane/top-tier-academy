import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Heart, MessageSquare, Share2, Settings, MicOff, Mic, MessageCircle, Fullscreen, Pause, Play as PlayIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AgoraVideoPlayer from '@/components/AgoraVideoPlayer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { RTMClient } from 'agora-rtm-sdk';
import { api } from '@/lib/api';
import ChatSidebar from './ChatSidebar';

// Placeholder for future Agora integration
// import AgoraRTC from 'agora-rtc-sdk-ng';

// TODO: Remplace par import { AGORA_APP_ID } from '@/config';

const AGORA_APP_ID = 'e8a09e60ab1548d4b0f18a0cd440f8b7';

const StreamingInternal = ({ id, user, navigate }: { id: string; user: any; navigate: any }) => {


    const [session, setSession] = useState<any>(null);
    const [loadingSession, setLoadingSession] = useState(true);
    const [chatEnabled, setChatEnabled] = useState(true);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const chatEndRef = useRef(null);
    const [studentsMuted, setStudentsMuted] = useState(true);
    const [rtmClient, setRtmClient] = useState<any>(null);
    const [rtmChannel, setRtmChannel] = useState<any>(null);
    const [rtmError, setRtmError] = useState<string | null>(null);
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

    useEffect(() => {
        // Defensive check for user.id
        if (!user?.id || typeof user.id !== 'string' || user.id.trim() === '' || user.id === 'undefined') {
            console.error('[DEBUG] RTM: user.id is missing or invalid:', user?.id, typeof user?.id);
            setRtmError('Cannot join live: Invalid user ID. Please log out and log in again.');
            return;
        }
        if (!id || !agoraToken) return;
        if (!user.agoraRtmToken) {
            setRtmError('Cannot join live: Missing Agora RTM token. Please refresh or re-login.');
            console.error('RTM: Missing user.agoraRtmToken:', user.agoraRtmToken);
            return;
        }
        let client: any = null;
        let mounted = true;

        const initRTM = async () => {
            let safeUid = user.agoraUid || (user.id ? String(user.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) : undefined);
            if (!safeUid) {
                safeUid = Math.random().toString(36).substring(2, 10);
                console.warn('Invalid user.id for Agora RTM, using fallback UID:', safeUid);
            }
            console.log('[DEBUG] Agora RTM safeUid:', safeUid, 'user.id:', user.id, typeof user.id);
            if (!safeUid) {
                setRtmError('Cannot join live: Invalid user ID after sanitization.');
                console.error('UID Agora RTM vide ou invalide, RTM non initialisé');
                return;
            }
            try {
                // Création du client RTM v2
                client = new RTMClient(AGORA_APP_ID, safeUid);
                await client.login({ token: user.agoraRtmToken });
                await client.join({ channelId: id });
                if (mounted) {
                    setRtmClient(client);
                    setRtmChannel(id); // On stocke juste l'id du channel
                }
                // Récupérer les membres du channel
                const members = await client.getChannelMembers({ channelId: id });
                setViewerCount(members.length);
                setParticipants(members.map((m: any) => ({ id: m })));
                // Ecoute des messages
                client.on('channelMessage', (evt: any) => {
                    // evt.channelId, evt.message, evt.senderId
                    let parsed = null;
                    try {
                        parsed = JSON.parse(evt.message.text);
                    } catch (e) {
                        setMessages((prev) => [
                            ...prev,
                            {
                                sender: evt.senderId === safeUid ? (user.name || 'Vous') : evt.senderId,
                                color: evt.senderId === safeUid ? 'text-green-300' : 'text-blue-300',
                                text: evt.message.text || ''
                            }
                        ]);
                        return;
                    }
                    if (!parsed || typeof parsed !== 'object') return;
                    if (parsed.type === 'MUTE_ALL') setStudentsMuted(true);
                    else if (parsed.type === 'UNMUTE_ALL') setStudentsMuted(false);
                    else if (parsed.type === 'CHAT_ENABLED') setChatEnabled(!!parsed.value);
                    else if (parsed.type === 'CHAT' && typeof parsed.text === 'string') {
                        setMessages((prev) => [
                            ...prev,
                            {
                                sender: typeof parsed.sender === 'string' ? parsed.sender : (evt.senderId === safeUid ? (user.name || 'Vous') : evt.senderId),
                                color: evt.senderId === safeUid ? 'text-green-300' : 'text-blue-300',
                                text: parsed.text
                            }
                        ]);
                    } else if (parsed.type === 'JOIN' && parsed.id && parsed.name) {
                        setParticipants((prev) => {
                            const exists = prev.find((p) => p.id === parsed.id);
                            if (exists && exists.name === parsed.name) return prev;
                            if (exists) {
                                return prev.map((p) => p.id === parsed.id ? { ...p, name: parsed.name } : p);
                            }
                            return [...prev, { id: parsed.id, name: parsed.name }];
                        });
                    }
                });

                // Ecoute des membres
                client.on('memberJoined', async (evt: any) => {
                    const members = await client.getChannelMembers({ channelId: id });
                    setViewerCount(members.length);
                    setParticipants((prev) => {
                        if (prev.find((p) => p.id === evt.userId)) return prev;
                        return [...prev, { id: evt.userId }];
                    });
                });
                client.on('memberLeft', async (evt: any) => {
                    const members = await client.getChannelMembers({ channelId: id });
                    setViewerCount(members.length);
                    setParticipants((prev) => prev.filter((p) => p.id !== evt.userId));
                });
            } catch (err) {
                setRtmError('RTM: Agora RTM login/join error: ' + (err && err.message ? err.message : err));
                console.error('RTM: Agora RTM login/join error:', err);
            }
        };
        initRTM();

        return () => {
            mounted = false;
            if (client) client.logout();
        };
    }, [user?.id, id, user.agoraRtmToken]);
    useEffect(() => {
        console.log('[DEBUG] Re-render, messages.length:', messages.length);
        console.log('[DEBUG] Messages:', messages);
    }, [messages]);


    // Envoi message RTM
    const handleSend = () => {
        if (!input.trim() || !rtmClient || !rtmChannel) return;

        const message = {
            type: 'CHAT',
            text: input,
            sender: user?.name || 'مستخدم'
        };

        console.log('[DEBUG] Adding message to state:', {
            sender: message.sender,
            text: message.text
        });

        setMessages(prev => {
            const updated = [...prev, {
                sender: message.sender,
                color: 'text-green-300',
                text: message.text
            }];
            console.log('[DEBUG] Messages after local update:', updated);
            return updated;
        });

        // 👇 Force React à se réveiller (déclenche un render léger)
        setInput(prev => prev + ' ');



        rtmClient.sendMessageToChannel({
            channelId: rtmChannel,
            message: { text: JSON.stringify(message) }
        });


        if (user?.name) {
            rtmClient.sendMessageToChannel({
                channelId: rtmChannel,
                message: {
                    text: JSON.stringify({ type: 'JOIN', id: user.id, name: user.name })
                }
            });
        }


        setInput('');
    };

    // Professor controls
    const handleMuteAll = () => {
        setStudentsMuted(true);
        if (rtmClient && rtmChannel) {
            rtmClient.sendMessageToChannel({ channelId: rtmChannel, message: { text: JSON.stringify({ type: 'MUTE_ALL' }) } });
        }
    };
    const handleUnmuteAll = () => {
        setStudentsMuted(false);
        if (rtmClient && rtmChannel) {
            rtmClient.sendMessageToChannel({ channelId: rtmChannel, message: { text: JSON.stringify({ type: 'UNMUTE_ALL' }) } });
        }
    };
    const handleToggleChat = () => {
        setChatEnabled((v) => {
            const newValue = !v;
            if (rtmClient && rtmChannel) {
                rtmClient.sendMessageToChannel({ channelId: rtmChannel, message: { text: JSON.stringify({ type: 'CHAT_ENABLED', value: newValue }) } });
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
    const debugPanel = process.env.NODE_ENV === 'development' ? (
        <div style={{ background: '#222', color: '#fff', padding: 10, margin: 10 }}>
            <div>Logged in user: {JSON.stringify(user)}</div>
            <div>Token: {localStorage.getItem('token')}</div>
        </div>
    ) : null;

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
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-blue-800 text-white" dir="rtl">

            
            {/* Header */}
            <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="text-white hover:bg-white/10 flex items-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        العودة إلى الرئيسية
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-red-500 px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            مباشر
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                            <Users className="w-4 h-4" />
                            <span>{viewerCount.toLocaleString()} مشاهد</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Video Player (Agora placeholder) */}
                <div className="lg:col-span-3">
                    <div className="bg-black rounded-xl overflow-hidden shadow-2xl relative">
                        <div id="agora-video-container" className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative flex items-center justify-center">
                            {/* Zone vidéo Agora */}
                            {rtmError && (
                                <div className="text-red-400 text-center py-8">{rtmError}</div>
                            )}
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

                                    {/* Contrôles vidéo */}
                                    <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                                        <Button size="icon" variant="secondary" onClick={handleFullScreen} title="Plein écran">
                                            <Fullscreen className="w-5 h-5" />
                                        </Button>
                                        <Button size="icon" variant="secondary" onClick={handlePause} title={isPaused ? 'Reprendre' : 'Pause'}>
                                            {isPaused ? <PlayIcon className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-white/80">Chargement de la vidéo...</div>
                            )}

                            {/* Prof controls overlay */}
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
                    <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-6">
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

export default StreamingInternal;

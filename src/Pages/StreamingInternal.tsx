import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Heart, MessageSquare, Share2, Settings, MicOff, Mic, MessageCircle, Fullscreen, Pause, Play as PlayIcon, Video, VideoOff, Monitor, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AgoraVideoPlayer, { AgoraVideoPlayerRef } from '@/components/AgoraVideoPlayer';
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
    const [controlsLoading, setControlsLoading] = useState(false);
    const [isLocalMicMuted, setIsLocalMicMuted] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [cameraDevices, setCameraDevices] = useState<{ deviceId: string, label: string }[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string>('');
    const [isLocalCameraEnabled, setIsLocalCameraEnabled] = useState(true);

    // Socket.IO for chat
    const [socket, setSocket] = useState<Socket | null>(null);

    const [studentMuteStates, setStudentMuteStates] = useState<{ [key: string]: boolean }>({});

    // Ref for AgoraVideoPlayer to access its methods
    const agoraVideoRef = useRef<AgoraVideoPlayerRef>(null);

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

        // Set userData on the client socket for AgoraVideoPlayer to use
        (newSocket as any).userData = { ...user };

        // Listener pour l'état courant du mute dès la connexion
        newSocket.on('connect', () => {
            console.log('[DEBUG] Student socket connected:', newSocket.id, 'room:', id);
        });
        newSocket.on('students-muted-state', (isMuted) => {
            console.log('[SOCKET] Received students-muted-state:', isMuted);
            setStudentsMuted(isMuted);
        });

        // Connection event handlers
        newSocket.on('connect', () => {
            console.log('[DEBUG] Socket.IO connected successfully');

            // Add current user to participants list
            setParticipants(prev => {
                const currentUser = {
                    id: newSocket.id,
                    userId: user.id,
                    name: user.name || 'مستخدم',
                    role: user.role,
                    avatar_url: user.avatar_url
                };

                // Check if user already exists using userId as unique identifier
                if (prev.find(p => p.userId === currentUser.userId)) return prev;
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
            avatar_url: user.avatar_url,
            socketId: newSocket.id
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
                // Use userId as unique identifier to prevent duplicates
                if (prev.find(p => p.userId === userData.userId)) return prev;
                return [...prev, {
                    id: userData.id,
                    userId: userData.userId,
                    name: userData.name,
                    role: userData.role,
                    avatar_url: userData.avatar_url
                }];
            });
            setViewerCount(prev => prev + 1);
        });

        // Listen for participants list (sent when joining)
        newSocket.on('participants-list', (participantsList) => {
            console.log('[DEBUG] Received participants list:', participantsList);
            setParticipants(participantsList);
            setViewerCount(participantsList.length);
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

            // Update all student mute states to true
            setStudentMuteStates(prev => {
                const newState = { ...prev };
                participants.forEach(participant => {
                    if (participant.role === 'student') {
                        newState[participant.userId] = true;
                    }
                });
                console.log('[DEBUG] Updated all student mute states to true via socket event:', newState);
                return newState;
            });
        });

        newSocket.on('students-unmuted', () => {
            console.log('[DEBUG] Students unmuted by professor');
            setStudentsMuted(false);

            // Update all student mute states to muted by default (students can control their own)
            setStudentMuteStates(prev => {
                const newState = { ...prev };
                participants.forEach(participant => {
                    if (participant.role === 'student') {
                        // Keep students muted by default when teacher unmutes all
                        // They can then control their own mic
                        newState[participant.userId] = true; // Still muted by default
                    }
                });
                console.log('[DEBUG] Updated all student mute states to muted by default via socket event:', newState);
                return newState;
            });
        });

        newSocket.on('chat-toggled', (enabled) => {
            console.log('[DEBUG] Chat toggled by professor:', enabled);
            setChatEnabled(enabled);
        });

        // Listen for individual student mic control
        newSocket.on('student-mic-toggled', (data) => {
            console.log('[DEBUG] Student mic toggle signal received:', data, 'current socket.id:', newSocket.id);

            // Update local state for visual feedback
            setStudentMuteStates(prev => {
                const newState = {
                    ...prev,
                    [data.studentId]: data.muted
                };
                console.log('[DEBUG] Updated studentMuteStates:', {
                    oldState: prev,
                    newState: newState,
                    studentId: data.studentId,
                    newMutedState: data.muted
                });
                return newState;
            });

            // If this is for the current user, log the action
            if (data.studentId === newSocket.id) {
                console.log(`[DEBUG] My mic was ${data.muted ? 'muted' : 'unmuted'} by professor`);
            }
        });

        return () => {
            console.log('[DEBUG] Cleaning up Socket.IO connection');
            newSocket.disconnect();
        };
    }, [user?.id, id]);

    // [LIVE STREAM MODIF] --- Gestion de la fin de stream côté professeur et élève ---
    useEffect(() => {
        if (!socket) return;
        const handleRemoved = ({ roomId }) => {
            alert('Vous avez été retiré de la session par le professeur.');
            window.location.href = '/'; // Redirige hors du live
        };
        socket.on('removed-from-room', handleRemoved);
        return () => {
            socket.off('removed-from-room', handleRemoved);
        };
    }, [socket]);

    // [LIVE STREAM MODIF] --- Réception de l'événement 'stream-ended' côté élève ---
    useEffect(() => {
        if (!socket) return;
        const handleStreamEnded = ({ roomId }) => {
            console.log('[DEBUG] stream-ended event received', roomId); // [LIVE STREAM MODIF]
            // Désactive micro et caméra avant de rediriger [LIVE STREAM MODIF]
            if (agoraVideoRef.current) {
                if (!agoraVideoRef.current.isLocalMicMuted) {
                    agoraVideoRef.current.toggleLocalMic();
                }
                if (agoraVideoRef.current.isLocalCameraEnabled) {
                    agoraVideoRef.current.toggleLocalCamera();
                }
            }
            window.location.href = '/TTHLiveClasses'; // [LIVE STREAM MODIF]
        };
        socket.on('stream-ended', handleStreamEnded);
        return () => {
            socket.off('stream-ended', handleStreamEnded);
        };
    }, [socket]);

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
    const handleMuteAll = async () => {
        if (controlsLoading) return;

        console.log('[DEBUG] Professor clicking mute all, current studentsMuted:', studentsMuted);
        setControlsLoading(true);

        try {
            setStudentsMuted(true);

            // Update all student mute states to true
            setStudentMuteStates(prev => {
                const newState = { ...prev };
                participants.forEach(participant => {
                    if (participant.role === 'student') {
                        newState[participant.userId] = true;
                    }
                });
                console.log('[DEBUG] Updated all student mute states to true:', newState);
                return newState;
            });

            if (socket) {
                console.log('[DEBUG] Emitting mute-all event to room:', id);
                socket.emit('mute-all', id);
            } else {
                console.error('[DEBUG] No socket available for mute-all');
            }
        } catch (error) {
            console.error('[DEBUG] Error in handleMuteAll:', error);
        } finally {
            setControlsLoading(false);
        }
    };

    const handleUnmuteAll = async () => {
        if (controlsLoading) return;

        console.log('[DEBUG] Professor clicking unmute all, current studentsMuted:', studentsMuted);
        setControlsLoading(true);

        try {
            setStudentsMuted(false);

            // Update all student mute states to false (unmuted) but students can control their own
            // Note: When teacher unmutes all, students are still muted by default but can unmute themselves
            setStudentMuteStates(prev => {
                const newState = { ...prev };
                participants.forEach(participant => {
                    if (participant.role === 'student') {
                        // Keep students muted by default when teacher unmutes all
                        // They can then control their own mic
                        newState[participant.userId] = true; // Still muted by default
                    }
                });
                console.log('[DEBUG] Updated all student mute states to muted by default:', newState);
                return newState;
            });

            if (socket) {
                console.log('[DEBUG] Emitting unmute-all event to room:', id);
                socket.emit('unmute-all', id);
            } else {
                console.error('[DEBUG] No socket available for unmute-all');
            }
        } catch (error) {
            console.error('[DEBUG] Error in handleUnmuteAll:', error);
        } finally {
            setControlsLoading(false);
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

    // Remove access check for students
    useEffect(() => {
        if (String(id).startsWith('private_class_')) {
            setCanAccess(true);
            setAccessChecked(true);
        } else {
            // Original access check for normal live sessions
            const checkAccess = async () => {
                if (user?.role === 'student' && id) {
                    try {
                        const res = await fetch(`/api/live-sessions/${id}/access?student_id=${user.id}`, {
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                        });
                        const data = await res.json();
                        setCanAccess(data.can_access);
                    } catch (err) {
                        setCanAccess(false);
                    } finally {
                        setAccessChecked(true);
                    }
                } else {
                    setAccessChecked(true);
                }
            };
            checkAccess();
        }
    }, [id, user]);

    useEffect(() => {
        console.log('[DEBUG] user:', user);
        console.log('[DEBUG] canAccess:', canAccess, 'accessChecked:', accessChecked);
    }, [user, canAccess, accessChecked]);

    // Sync state with AgoraVideoPlayer ref
    useEffect(() => {
        if (agoraVideoRef.current && isProfessor) {
            // Update local state with ref values
            setIsLocalMicMuted(agoraVideoRef.current.isLocalMicMuted);
            setIsLocalCameraEnabled(agoraVideoRef.current.isLocalCameraEnabled);
            setIsScreenSharing(agoraVideoRef.current.isScreenSharing);
            setCameraDevices(agoraVideoRef.current.cameraDevices);
            setSelectedCameraId(agoraVideoRef.current.selectedDeviceId);
        }
    }, [agoraVideoRef.current, isProfessor]);

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

    // Video controls for professor
    const handleToggleMic = () => {
        if (agoraVideoRef.current) {
            agoraVideoRef.current.toggleLocalMic();
            // Update local state for immediate UI feedback
            setIsLocalMicMuted(!isLocalMicMuted);
        }
    };

    const handleToggleCamera = () => {
        if (agoraVideoRef.current) {
            agoraVideoRef.current.toggleLocalCamera();
            // Update local state for immediate UI feedback
            setIsLocalCameraEnabled(!isLocalCameraEnabled);
        }
    };

    const handleScreenShare = async () => {
        if (agoraVideoRef.current) {
            try {
                if (isScreenSharing) {
                    await agoraVideoRef.current.stopScreenShare();
                    setIsScreenSharing(false);
                } else {
                    await agoraVideoRef.current.startScreenShare();
                    setIsScreenSharing(true);
                }
            } catch (error) {
                console.error('[DEBUG] Screen share error:', error);
            }
        }
    };

    const handleCameraChange = async (deviceId: string) => {
        if (agoraVideoRef.current) {
            try {
                await agoraVideoRef.current.setSelectedDeviceId(deviceId);
                setSelectedCameraId(deviceId);
            } catch (error) {
                console.error('[DEBUG] Camera change error:', error);
            }
        }
    };

    // Debug panel for development
    const debugPanel = null; // Removed debug panel to hide sensitive information

    useEffect(() => {
        // Keep isFullScreen in sync with actual fullscreen state
        const handleFullscreenChange = () => {
            const elem = document.getElementById('agora-video-container');
            if (document.fullscreenElement === elem) {
                setIsFullScreen(true);
            } else {
                setIsFullScreen(false);
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const [showChatOverlay, setShowChatOverlay] = useState(true);
    const [lastMessageCount, setLastMessageCount] = useState(0);
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const [unseenCount, setUnseenCount] = useState(0);

    // Track new messages for notification badge (with count)
    useEffect(() => {
        if (!isFullScreen) {
            setHasNewMessages(false);
            setLastMessageCount(messages.length);
            setUnseenCount(0);
        } else if (showChatOverlay) {
            setHasNewMessages(false);
            setLastMessageCount(messages.length);
            setUnseenCount(0);
        } else if (messages.length > lastMessageCount) {
            setHasNewMessages(true);
            setUnseenCount(unseenCount + (messages.length - lastMessageCount));
            setLastMessageCount(messages.length);
        }
    }, [messages, isFullScreen, showChatOverlay]);

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
        <div dir='rtl' className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-purple-700 text-white">
            {debugPanel}

            {/* Header - Responsive */}
            <div className="bg-white/10 backdrop-blur-sm border-b border-white/10 rounded-b-xl">
                <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(-1)}
                            className="text-white hover:bg-white/10 text-xs sm:text-sm"
                        >
                            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            العودة
                        </Button>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-sm sm:text-lg font-semibold truncate">{session.title}</h1>
                            <p className="text-xs sm:text-sm text-gray-300">مشاهدون: {viewerCount}</p>
                            {!isProfessor && (
                                <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                                    <span className={`inline-flex items-center gap-1 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${studentMuteStates[user?.id] ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                                        {studentMuteStates[user?.id] ? <MicOff className="w-2 h-2 sm:w-3 sm:h-3" /> : <Mic className="w-2 h-2 sm:w-3 sm:h-3" />}
                                        <span className="hidden sm:inline">{studentMuteStates[user?.id] ? 'مكتوم' : 'ميكروفون نشط'}</span>
                                    </span>
                                    {studentsMuted && (
                                        <span className="inline-flex items-center gap-1 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300">
                                            <MicOff className="w-2 h-2 sm:w-3 sm:h-3" />
                                            <span className="hidden sm:inline">مكتوم من قبل الأستاذ</span>
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - Responsive */}
            <div className="max-w-7xl mx-auto p-2 sm:p-4 grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-6">
                {/* Video Player (Agora placeholder) - Responsive */}
                <div className="lg:col-span-3">
                    <div className="bg-black rounded-xl overflow-hidden shadow-2xl relative">
                        <div id="agora-video-container" className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative flex items-center justify-center" style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
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
                                            socket={socket}
                                            onError={(err) => {
                                                console.error('[DEBUG] AgoraVideoPlayer error:', err);
                                                setAgoraError('فشل الاتصال بالبث المباشر. يرجى المحاولة لاحقاً.');
                                            }}
                                            ref={agoraVideoRef}
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

                            {/* Video Controls - Responsive for Mobile/Tablet */}
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex flex-row flex-nowrap gap-1 sm:gap-2 max-w-full px-2 items-center justify-center w-auto">
                                {/* Fullscreen button (all users) */}
                                <Button size="sm" variant="secondary" className="bg-black/50 hover:bg-black/70 text-white border-0 text-xs sm:text-sm" onClick={handleFullScreen}>
                                    <Fullscreen className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>

                                {/* Student Mic Control */}
                                {!isProfessor && (
                                        <Button
                                            size="sm"
                                            variant={studentMuteStates[user?.id] ? 'destructive' : 'default'}
                                            className={`${studentMuteStates[user?.id] ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white border-0 ${studentsMuted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} text-xs sm:text-sm`}
                                            onClick={() => {
                                                if (!studentsMuted) {
                                                    const isMuted = studentMuteStates[user?.id] !== undefined ? studentMuteStates[user?.id] : true;
                                                    if (socket) {
                                                        const signalData = {
                                                            studentId: user?.id,
                                                            studentName: user?.name,
                                                            muted: !isMuted
                                                        };
                                                        socket.emit('toggle-student-mic', id, signalData);
                                                    }
                                                }
                                            }}
                                            disabled={studentsMuted}
                                            title={studentsMuted ? 'مكتوم من قبل الأستاذ' : (studentMuteStates[user?.id] ? 'إلغاء كتم الميكروفون' : 'كتم الميكروفون')}
                                        >
                                            {studentMuteStates[user?.id] ? <MicOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Mic className="w-3 h-3 sm:w-4 sm:h-4" />}
                                        </Button>
                                )}

                                {/* Teacher Controls: all in one row */}
                                {isProfessor && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="bg-black/50 hover:bg-black/70 text-white border-0 text-xs sm:text-sm"
                                            onClick={handleToggleMic}
                                            title="كتم/إلغاء كتم الميكروفون"
                                        >
                                            {isLocalMicMuted ? <MicOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Mic className="w-3 h-3 sm:w-4 sm:h-4" />}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={isLocalCameraEnabled ? 'secondary' : 'destructive'}
                                            className={`${isLocalCameraEnabled ? 'bg-black/50 hover:bg-black/70' : 'bg-red-600 hover:bg-red-700'} text-white border-0 text-xs sm:text-sm`}
                                            onClick={handleToggleCamera}
                                            title={isLocalCameraEnabled ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
                                        >
                                            {isLocalCameraEnabled ? <Video className="w-3 h-3 sm:w-4 sm:h-4" /> : <VideoOff className="w-3 h-3 sm:w-4 sm:h-4" />}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={isScreenSharing ? 'destructive' : 'secondary'}
                                            className={`${isScreenSharing ? 'bg-red-600 hover:bg-red-700' : 'bg-black/50 hover:bg-black/70'} text-white border-0 text-xs sm:text-sm`}
                                            onClick={handleScreenShare}
                                            title={isScreenSharing ? 'إيقاف مشاركة الشاشة' : 'مشاركة الشاشة'}
                                        >
                                            <Monitor className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </Button>
                                        {isLocalCameraEnabled && cameraDevices.length > 1 && (
                                            <select
                                                value={selectedCameraId}
                                                onChange={(e) => handleCameraChange(e.target.value)}
                                                className="bg-black/70 text-white rounded px-1 py-1 border border-white/20 text-xs max-w-20 sm:max-w-none"
                                                title="اختيار الكاميرا"
                                            >
                                                {cameraDevices.map(device => (
                                                    <option key={device.deviceId} value={device.deviceId}>
                                                        {device.label || `Camera ${device.deviceId}`}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        <Button
                                            size="sm"
                                            variant={studentsMuted ? 'destructive' : 'secondary'}
                                            className={`${studentsMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-black/50 hover:bg-black/70'} text-white border-0 text-xs sm:text-sm`}
                                            onClick={handleMuteAll}
                                            title="كتم جميع الطلاب"
                                            disabled={controlsLoading}
                                        >
                                            {controlsLoading ? (
                                                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <MicOff className="w-3 h-3 sm:w-4 sm:h-4" />
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={!studentsMuted ? 'default' : 'secondary'}
                                            className={`${!studentsMuted ? 'bg-green-600 hover:bg-green-700' : 'bg-black/50 hover:bg-black/70'} text-white border-0 text-xs sm:text-sm`}
                                            onClick={handleUnmuteAll}
                                            title="إلغاء كتم جميع الطلاب"
                                            disabled={controlsLoading}
                                        >
                                            {controlsLoading ? (
                                                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <Mic className="w-3 h-3 sm:w-4 sm:h-4" />
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={chatEnabled ? 'secondary' : 'destructive'}
                                            className={`${chatEnabled ? 'bg-black/50 hover:bg-black/70' : 'bg-red-600 hover:bg-red-700'} text-white border-0 text-xs sm:text-sm`}
                                            onClick={handleToggleChat}
                                            title={chatEnabled ? 'إيقاف الدردشة' : 'تفعيل الدردشة'}
                                        >
                                            <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </Button>
                                            <Button
                                                variant="destructive"
                                                className="ml-2"
                                                onClick={async () => {
                                                    console.log('[DEBUG] Prof click Terminer le stream', { id, socket, socketId: socket?.id }); // [LIVE STREAM MODIF]
                                                    // Désactive micro et caméra avant de terminer le stream [LIVE STREAM MODIF]
                                                    if (agoraVideoRef.current) {
                                                        if (!agoraVideoRef.current.isLocalMicMuted) {
                                                            agoraVideoRef.current.toggleLocalMic();
                                                        }
                                                        if (agoraVideoRef.current.isLocalCameraEnabled) {
                                                            agoraVideoRef.current.toggleLocalCamera();
                                                        }
                                                    }
                                                    if (socket && id) {
                                                        console.log('[DEBUG] Emitting end-stream', { id }); // [LIVE STREAM MODIF]
                                                        socket.emit('end-stream', id); // [LIVE STREAM MODIF]
                                                    } else {
                                                        console.error('[DEBUG] end-stream NOT emitted', { socket, id }); // [LIVE STREAM MODIF]
                                                    }
                                            }}
                                        >
                                            إنهاء البث
                                            </Button>
                                    </>
                                )}
                            </div>

                            {/* Overlay ChatSidebar in fullscreen mode */}
                            {isFullScreen && (
                                <>
                                    {/* Floating toggle icon for chat overlay */}
                                    <button
                                        onClick={() => setShowChatOverlay((v) => !v)}
                                        style={{
                                            position: 'absolute',
                                            left: 10,
                                            top: 10,
                                            zIndex: 100,
                                            background: 'rgba(30,30,60,0.7)',
                                            borderRadius: '50%',
                                            width: 44,
                                            height: 44,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: 'none',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.18)',
                                        }}
                                        title={showChatOverlay ? 'إخفاء الدردشة' : 'إظهار الدردشة'}
                                    >
                                        {showChatOverlay ? <XCircle size={28} color="#fff" /> : <MessageSquare size={28} color="#fff" />}
                                        {hasNewMessages && !showChatOverlay && (
                                            <span style={{
                                                position: 'absolute',
                                                top: 6,
                                                right: 6,
                                                background: '#f43f5e',
                                                color: '#fff',
                                                borderRadius: '50%',
                                                minWidth: 16,
                                                height: 16,
                                                fontSize: 12,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 700,
                                                padding: '0 4px',
                                            }}>{unseenCount}</span>
                                        )}
                                    </button>
                                    {showChatOverlay && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: '5%',
                                                width: 350,
                                                height: '90%',
                                                zIndex: 50,
                                                pointerEvents: 'auto',
                                                display: 'flex',
                                                flexDirection: 'column',
                                            }}
                                            className="chat-overlay-fullscreen"
                                        >
                                            <ChatSidebar
                                                key={`chat-fullscreen-${messages.length}`}
                                                messages={messages}
                                                input={input}
                                                setInput={setInput}
                                                handleSend={handleSend}
                                                chatEnabled={chatEnabled}
                                                studentsMuted={studentsMuted}
                                                isProfessor={isProfessor}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Video Info */}
                    <div className="mt-6">
                        <h1 className="text-2xl font-bold mb-2">{session.title}</h1>
                        <p className="text-gray-300 mb-4">مقدم من: {session.presenter}</p>
                        <p className="text-gray-400 leading-relaxed">{session.description}</p>
                    </div>
                </div>

                {/* Chat Sidebar (hide in fullscreen) */}
                {!isFullScreen && (
                    <ChatSidebar
                        key={`chat-${messages.length}`}
                        messages={messages}
                        input={input}
                        setInput={setInput}
                        handleSend={handleSend}
                        chatEnabled={chatEnabled}
                        studentsMuted={studentsMuted}
                        isProfessor={isProfessor}
                    />
                )}
            </div>

            {/* Interactive Participants List - Responsive */}
            <div className="bg-white/10 rounded-xl p-2 sm:p-4 mt-3 sm:mt-6">
                <h3 className="font-bold mb-2 sm:mb-4 text-white flex items-center gap-2 text-sm sm:text-base">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                    المشاركون ({participants.length})
                    {isProfessor && (
                        <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4 text-xs sm:text-sm">
                            <span className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${studentsMuted ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                                <span className="hidden sm:inline">{studentsMuted ? 'جميع الطلاب مكتومون' : 'الطلاب يمكنهم التحكم في الميكروفون'}</span>
                                <span className="sm:hidden">{studentsMuted ? 'مكتومون' : 'يمكن التحكم'}</span>
                            </span>
                        </div>
                    )}
                </h3>

                {participants.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-full mx-auto mb-2 sm:mb-3 flex items-center justify-center">
                            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-400 text-xs sm:text-sm">لا يوجد مشاركون بعد</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4">
                        {participants.map((participant) => {
                            const isCurrentUser = participant.userId === user?.id;
                            const isStudent = participant.role === 'student';
                            const isMuted = studentMuteStates[participant.userId] !== undefined ? studentMuteStates[participant.userId] : true;
                            const canProfToggle = isProfessor && isStudent;
                            const canStudentToggleOwn = isStudent && isCurrentUser && !studentsMuted;
                            const canToggle = canProfToggle || canStudentToggleOwn;
                            return (
                                <div
                                    key={participant.userId}
                                    className="relative group cursor-pointer"
                                    title={participant.name}
                                >
                                    {/* Avatar Circle */}
                                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto">
                                        {/* Profile Picture or Initial */}
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm sm:text-lg border-2 border-white/20 group-hover:border-green-400 transition-all duration-200">
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
                                        <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                            <div className="w-1 h-1 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                                        </div>
                                        {/* Hover Effect */}
                                        <div className="absolute inset-0 rounded-full bg-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                                    </div>
                                    {/* Name + Mic Icon + Professor Controls */}
                                    <div className="text-center mt-1 sm:mt-2 flex items-center justify-center gap-1 flex-col">
                                        <p className="text-white text-xs sm:text-sm font-medium truncate mb-0">
                                            {participant.name || 'مستخدم'}
                                        </p>
                                        {/* Mic status icon for all */}
                                            <span
                                            className={`inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full ${isMuted ? 'bg-red-500' : 'bg-green-500'}`}
                                            title={isMuted ? 'مكتوم' : 'ميكروفون نشط'}
                                        >
                                            {isMuted ? <MicOff className="w-2 h-2 sm:w-3 sm:h-3 text-white" /> : <Mic className="w-2 h-2 sm:w-3 sm:h-3 text-white" />}
                                        </span>
                                        {/* Professor controls: Let student speak / Mute student */}
                                        {canProfToggle && (
                                            <div className="flex flex-col gap-1 mt-1">
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className={`flex items-center gap-1 px-2 py-1 text-xs ${isMuted ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                                                    disabled={!isMuted} // Only enable if student is muted
                                                    title="إعطاء الطالب الميكروفون (Let student speak)"
                                                    onClick={() => {
                                                        if (socket && isMuted) {
                                                            const signalData = {
                                                                studentId: participant.userId,
                                                                studentName: participant.name,
                                                                muted: false
                                                            };
                                                            console.log('[PROF] Let student speak:', signalData);
                                                            socket.emit('toggle-student-mic', id, signalData);
                                                        }
                                                    }}
                                                >
                                                    <Mic className="w-3 h-3 text-white" />
                                                    <span>إعطاء الميكروفون</span>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className={`flex items-center gap-1 px-2 py-1 text-xs ${!isMuted ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                                                    disabled={isMuted} // Only enable if student is unmuted
                                                    title="كتم الطالب (Mute student)"
                                                onClick={() => {
                                                        if (socket && !isMuted) {
                                                            const signalData = {
                                                                studentId: participant.userId,
                                                                studentName: participant.name,
                                                                muted: true
                                                            };
                                                            console.log('[PROF] Mute student:', signalData);
                                                            socket.emit('toggle-student-mic', id, signalData);
                                                        }
                                                    }}
                                                >
                                                    <MicOff className="w-3 h-3 text-white" />
                                                    <span>كتم الطالب</span>
                                                </Button>
                                            </div>
                                        )}
                                        {/* Student can toggle own mic if allowed */}
                                        {canStudentToggleOwn && (
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className={`flex items-center gap-1 px-2 py-1 text-xs ${isMuted ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                                                title={isMuted ? 'إلغاء كتم الميكروفون' : 'كتم الميكروفون'}
                                                onClick={() => {
                                                        if (socket) {
                                                            const signalData = {
                                                                studentId: participant.userId,
                                                                studentName: participant.name,
                                                                muted: !isMuted
                                                            };
                                                        console.log('[STUDENT] Toggle own mic:', signalData);
                                                            socket.emit('toggle-student-mic', id, signalData);
                                                    }
                                                }}
                                            >
                                                {isMuted ? <Mic className="w-3 h-3 text-white" /> : <MicOff className="w-3 h-3 text-white" />}
                                                <span>{isMuted ? 'تشغيل الميكروفون' : 'كتم الميكروفون'}</span>
                                            </Button>
                                        )}
                                    </div>
                                    {participant.role && (
                                        <p className="text-gray-400 text-xs">
                                            {participant.role === 'professor' ? 'أستاذ' : 'طالب'}
                                        </p>
                                    )}
                                    {/* Hover Tooltip */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 sm:px-3 py-1 bg-black/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                        {participant.name || 'مستخدم'}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Participants Summary - Responsive */}
                <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-white/10">
                    <div className="flex justify-between text-xs sm:text-sm text-gray-300">
                        <span>إجمالي المشاركين: {participants.length}</span>
                        <span className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                            <span className="hidden sm:inline">متصلون الآن</span>
                            <span className="sm:hidden">متصلون</span>
                        </span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default StreamingInternal;

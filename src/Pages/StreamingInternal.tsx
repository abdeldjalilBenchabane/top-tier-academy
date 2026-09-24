import React, { useState, useEffect, useRef, useMemo } from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import { ArrowLeft, Users, Heart, MessageSquare, Share2, Settings, MicOff, Mic, MessageCircle, Fullscreen, Pause, Play as PlayIcon, Video, VideoOff, Monitor, Eye, EyeOff, X, Maximize2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useAuth } from '@/contexts/AuthContext';

import { toast } from '@/hooks/use-toast';

import AgoraVideoPlayer, { AgoraVideoPlayerRef } from '@/components/AgoraVideoPlayer';

import ErrorBoundary from '@/components/ErrorBoundary';

import { io, Socket } from 'socket.io-client';

import { api } from '@/lib/api';

import { authAPI } from '@/services/api';

import ChatSidebar from './ChatSidebar';
import ChatExpanded from './ChatExpanded';
import ParticipantsExpanded from './ParticipantsExpanded';



// Import chat notification APIs

import { getChatNotifications, markChatAsSeen, incrementUnseenCount, getChatMessages } from '@/services/api';



// Telegram icon component

const TelegramIcon = ({ className }: { className?: string }) => (

  <svg 

    className={className} 

    viewBox="0 0 24 24" 

    fill="currentColor"

  >

    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.05-.2-.06-.06-.14-.04-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06-.01.13-.02.2z"/>

  </svg>

);



// Placeholder for future Agora integration

// import AgoraRTC from 'agora-rtc-sdk-ng';



// Environment variables for Agora

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || 'e8a09e60ab1548d4b0f18a0cd440f8b7';

const AGORA_APP_CERTIFICATE = import.meta.env.VITE_AGORA_APP_CERTIFICATE;



const StreamingInternal = ({ id, user, navigate }: { id: string; user: any; navigate: any }) => {



    const [session, setSession] = useState<any>(null);

    // The states a professor can set by hand. Same wording as TTHLiveCard and
    // the student dashboard, so the room agrees with the page that led here.
    const STREAM_STATE: Record<string, { label: string; cls: string }> = {
        live:             { label: 'مباشر الآن',    cls: 'bg-green-500/20 text-green-300' },
        starting:         { label: 'على وشك البدء', cls: 'bg-emerald-500/20 text-emerald-300' },
        paused:           { label: 'متوقفة مؤقتاً', cls: 'bg-amber-500/20 text-amber-300' },
        technical_issues: { label: 'مشكلة تقنية',   cls: 'bg-orange-500/20 text-orange-300' },
        cancelled:        { label: 'ملغاة',         cls: 'bg-red-500/20 text-red-300' },
        ended:            { label: 'انتهى البث',    cls: 'bg-gray-500/20 text-gray-300' },
    };

    const [loadingSession, setLoadingSession] = useState(true);

    const [chatEnabled, setChatEnabled] = useState(true);

    const [messages, setMessages] = useState([]);

    const [input, setInput] = useState('');

    const [studentsMuted, setStudentsMuted] = useState(true);

    const [agoraToken, setAgoraToken] = useState<string | null>(null);

    const [agoraError, setAgoraError] = useState<string | null>(null);

    const [agoraUid, setAgoraUid] = useState<number | null>(null);

    const [participants, setParticipants] = useState<any[]>([]);

    const [isUnmuted, setIsUnmuted] = useState(false);

    const [viewerCount, setViewerCount] = useState(0);

    const [isFullScreen, setIsFullScreen] = useState(false);

    const [isPaused, setIsPaused] = useState(false);

    const [showFullscreenChat, setShowFullscreenChat] = useState(false);
    // The full-window chat. Unlike showFullscreenChat this does not
    // require the video to be in fullscreen, so it works for the student
    // watching in a normal window and for the teacher while presenting.
    const [chatExpanded, setChatExpanded] = useState(false);
    // The room list given the whole window, for when the side panel's two
    // narrow columns stop being enough to see who is watching.
    const [peopleExpanded, setPeopleExpanded] = useState(false);
    // null until the teacher has answered. Some teachers present without
    // appearing on camera, and that has to be a choice made before the
    // stream goes out, not something to undo afterwards.
    const [startWithCamera, setStartWithCamera] = useState<boolean | null>(null);
    // The two side panels, each on its own switch: open the room list, the
    // chat, or both. They share the column and come out the same height, so
    // neither looks like the important one.
    const [showPeople, setShowPeople] = useState(false);
    // A student arrives with the chat already open: following along and asking
    // is most of what they do in a lesson, and a closed panel reads as "there
    // is no chat". A teacher starts with it closed — they are presenting, and
    // the chip in the corner brings it back with its unread count.
    const [showChat, setShowChat] = useState(user?.role !== 'professor');
    const anyPanel = showPeople || showChat;

    const [unseenMessages, setUnseenMessages] = useState(0);
    // Where the conversation was when the panel was last opened, so the unread
    // ones can be marked off from the rest. Null means everything is read.
    const [unreadDividerIndex, setUnreadDividerIndex] = useState<number | null>(null);
    // The message the teacher wants kept in view for everyone.
    const [pinnedMessage, setPinnedMessage] = useState<{ sender: string; text: string } | null>(null);

    const [lastSeenMessageId, setLastSeenMessageId] = useState(0);
    // The message handler is registered once, so reading showChat directly
    // there would keep whatever it was at the time — always false. A ref is
    // read fresh on every message.
    const showChatRef = useRef(false);

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

    

    // Ref for fullscreen chat auto-scroll

    const fullscreenChatEndRef = useRef<HTMLDivElement>(null);



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



    // Token refresh mechanism for streaming sessions

    useEffect(() => {

        if (!user?.id) return;



        // Refresh token every 6 hours (before 7-day expiration)

        const tokenRefreshInterval = setInterval(async () => {

            try {

                console.log('[DEBUG] Refreshing token for streaming session...');

                const response = await authAPI.refreshToken();

                

                if (response.token) {

                    // Update localStorage with new token

                    localStorage.setItem('token', response.token);

                    console.log('[DEBUG] Token refreshed successfully');

                    

                    // Show success notification for professor

                    if (isProfessor) {

                        toast({

                            title: "Session Extended",

                            description: "Your streaming session has been extended to prevent disconnection.",

                            duration: 3000,

                        });

                    }

                }

            } catch (error) {

                console.error('[DEBUG] Token refresh failed:', error);

                

                // If token refresh fails, show warning to professor

                if (isProfessor) {

                    toast({

                        title: "Session Warning",

                        description: "Your session may expire soon. Please save your work.",

                        duration: 5000,

                    });

                }

            }

        }, 6 * 60 * 60 * 1000); // 6 hours



        // Session keep-alive ping every 5 minutes

        const keepAliveInterval = setInterval(async () => {

            try {

                await authAPI.verifyToken();

                console.log('[DEBUG] Session keep-alive ping successful');

            } catch (error) {

                console.error('[DEBUG] Session keep-alive ping failed:', error);

                

                // If keep-alive fails, try to refresh token

                try {

                    const response = await authAPI.refreshToken();

                    if (response.token) {

                        localStorage.setItem('token', response.token);

                        console.log('[DEBUG] Token refreshed after keep-alive failure');

                    }

                } catch (refreshError) {

                    console.error('[DEBUG] Token refresh after keep-alive failure failed:', refreshError);

                    

                    // If both fail, show critical warning to professor

                    if (isProfessor) {

                        toast({

                            title: "Session Critical",

                            description: "Your session is at risk. Please refresh the page.",

                            duration: 10000,

                        });

                    }

                }

            }

        }, 5 * 60 * 1000); // 5 minutes



        // Cleanup intervals on unmount

        return () => {

            clearInterval(tokenRefreshInterval);

            clearInterval(keepAliveInterval);

        };

    }, [user?.id, isProfessor]);



    // Handle page visibility changes (when teacher switches tabs or minimizes)

    useEffect(() => {

        if (!isProfessor) return;



        const handleVisibilityChange = async () => {

            if (document.visibilityState === 'visible') {

                console.log('[DEBUG] Page became visible, verifying session...');

                try {

                    await authAPI.verifyToken();

                    console.log('[DEBUG] Session verified after page visibility change');

                } catch (error) {

                    console.error('[DEBUG] Session verification failed after visibility change:', error);

                    try {

                        const response = await authAPI.refreshToken();

                        if (response.token) {

                            localStorage.setItem('token', response.token);

                            console.log('[DEBUG] Session refreshed after visibility change');

                            toast({

                                title: "Session Restored",

                                description: "Your teacher session has been restored.",

                                duration: 3000,

                            });

                        }

                    } catch (refreshError) {

                        console.error('[DEBUG] Session refresh failed after visibility change:', refreshError);

                        toast({

                            title: "Session Warning",

                            description: "Please refresh the page to restore teacher privileges.",

                            duration: 5000,

                        });

                    }

                }

            }

        };



        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {

            document.removeEventListener('visibilitychange', handleVisibilityChange);

        };

    }, [isProfessor]);



    // Auto-scroll fullscreen chat to bottom when new messages arrive

    useEffect(() => {

        if (fullscreenChatEndRef.current && showFullscreenChat && isFullScreen) {

            const chatContainer = fullscreenChatEndRef.current.closest('.overflow-y-auto');

            if (chatContainer) {

                chatContainer.scrollTop = chatContainer.scrollHeight;

            }

        }

    }, [messages, showFullscreenChat, isFullScreen]);







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



        const newSocket = io('https://top-tier.academy');

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

        // Initialize student microphone state when joining
        if (user && !isProfessor) {
            setStudentMuteStates(prev => ({
                ...prev,
                [user.id]: true // Students start muted by default
            }));
        }



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



            // For professors: Verify session is still valid and refresh if needed

            if (isProfessor) {

                const verifySession = async () => {

                    try {

                        await authAPI.verifyToken();

                        console.log('[DEBUG] Professor session verified successfully');

                    } catch (error) {

                        console.error('[DEBUG] Professor session verification failed, attempting refresh:', error);

                        try {

                            const response = await authAPI.refreshToken();

                            if (response.token) {

                                localStorage.setItem('token', response.token);

                                console.log('[DEBUG] Professor session refreshed successfully');

                                toast({

                                    title: "Session Recovered",

                                    description: "Your session has been refreshed to maintain teacher privileges.",

                                    duration: 3000,

                                });

                            }

                        } catch (refreshError) {

                            console.error('[DEBUG] Professor session refresh failed:', refreshError);

                            toast({

                                title: "Session Error",

                                description: "Failed to maintain teacher session. Please refresh the page.",

                                duration: 5000,

                            });

                        }

                    }

                };

                verifySession();

            }

        });



        newSocket.on('connect_error', (error) => {

            console.error('[DEBUG] Socket.IO connection error:', error);

        });



        newSocket.on('disconnect', (reason) => {

            console.log('[DEBUG] Socket.IO disconnected:', reason);

        });



        // Join the room on every connection, not once at startup.
        // Socket.IO reconnects by itself after any drop — a restart of the
        // server, a phone waking up, a lost second of network — but the room
        // membership lives on the old socket and does not come back with it.
        // Emitting this once meant that after any reconnection the client sat
        // in the room's silence: no participants, no chat, nothing arriving,
        // until the person reloaded the page.
        const joinRoom = () => {
            console.log('[DEBUG] joining room', id, 'as', newSocket.id);
            newSocket.emit('join-room', id, {
                name: user.name || 'مستخدم',
                role: user.role,
                id: user.id,
                avatar_url: user.avatar_url,
                socketId: newSocket.id,
                agoraUid: stableUid
            });
        };
        newSocket.on('connect', joinRoom);
        if (newSocket.connected) joinRoom();



        // Load old messages from database

        const loadOldMessages = async () => {

            try {

                const data = await getChatMessages(id);

                if (data.success && data.messages) {

                    const formattedMessages = data.messages.map(msg => ({

                        sender: msg.user_name,

                        color: msg.user_id === user.id ? 'text-green-300' : 'text-[#61a1ff]',

                        text: msg.message_text,

                        id: msg.id,

                        // Who wrote it, said plainly rather than inferred from
                        // the colour: the expanded chat puts your own messages
                        // on one side and everyone else's on the other, and
                        // finds their picture by this id.
                        mine: msg.user_id === user.id,

                        userId: msg.user_id,

                        timestamp: msg.timestamp

                    }));

                    setMessages(formattedMessages);

                    console.log('[DEBUG] Loaded', formattedMessages.length, 'old messages');

                }

            } catch (error) {

                console.error('[DEBUG] Error loading old messages:', error);

            }

        };



        // Load old messages after joining the room

        loadOldMessages();



        // Listen for new messages

        newSocket.on('new-message', async (messageData) => {

            console.log('[DEBUG] Socket.IO message received:', messageData);

            setMessages(prev => [...prev, {

                sender: messageData.sender,

                color: messageData.id === newSocket.id ? 'text-green-300' : 'text-[#61a1ff]',

                text: messageData.text,

                mine: messageData.id === newSocket.id,

                // The sender's socket, which is also how the participants list
                // identifies them — that is where their picture comes from.
                socketId: messageData.id,

                id: messageData.id || Date.now() // Add unique ID for tracking

            }]);

            

            // Increment unseen messages if chat is not visible or user is not in fullscreen

            const chatOnScreen = showChatRef.current || (showFullscreenChat && isFullScreen);
            if (!chatOnScreen) {
                setUnseenMessages(prev => prev + 1);

                // Save to database

                try {

                    await incrementUnseenCount(id);

                } catch (error) {

                    console.error('Error incrementing unseen count:', error);

                }

            }

        });



        // Listen for user joined

        newSocket.on('user-joined', (userData) => {

            console.log('[DEBUG] User joined via Socket.IO:', userData);

            setParticipants(prev => {

                // Same person, new connection: replace the old entry instead of
                // keeping it. Keeping it left the previous socket id in the
                // list, and the 'user-left' for that old socket then removed
                // the student even though they had just rejoined.

                return [...prev.filter(p => p.userId !== userData.userId), {

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

        // The teacher paused, hit a technical problem, or came back. Sent on
        // every change and once on arrival, so the badge and the banner never
        // show a status the room has already left.
        newSocket.on('message-pinned', (data: { sender: string; text: string } | null) => {

            setPinnedMessage(data && data.text ? data : null);

        });

        newSocket.on('session-updated', (data: any) => {

            if (!data) return;

            setSession((prev: any) => (prev ? { ...prev, ...data } : prev));

        });

        newSocket.on('session-status', (data: { status?: string }) => {

            if (!data?.status) return;

            setSession((prev: any) => (prev ? { ...prev, status: data.status } : prev));

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

            if (data.studentId === user?.id) {

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



    // [LIVE STREAM MODIF] --- Réception de l'événement 'stream-ended-professor' côté professeur ---

    useEffect(() => {

        if (!socket || !isProfessor) return;

        const handleStreamEndedProfessor = ({ roomId }) => {

            console.log('[DEBUG] stream-ended-professor event received', roomId); // [LIVE STREAM MODIF]

            // Désactive micro et caméra avant de rediriger [LIVE STREAM MODIF]

            if (agoraVideoRef.current) {

                if (!agoraVideoRef.current.isLocalMicMuted) {

                    agoraVideoRef.current.toggleLocalMic();

                }

                if (agoraVideoRef.current.isLocalCameraEnabled) {

                    agoraVideoRef.current.toggleLocalCamera();

                }

            }

            // Redirect professor to their live sessions page instead of home

            window.location.href = '/professor/live-sessions'; // [LIVE STREAM MODIF]

        };

        socket.on('stream-ended-professor', handleStreamEndedProfessor);

        return () => {

            socket.off('stream-ended-professor', handleStreamEndedProfessor);

        };

    }, [socket, isProfessor]);



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

        

        // Immediately scroll fullscreen chat to bottom for better UX

        if (showFullscreenChat && isFullScreen && fullscreenChatEndRef.current) {

            setTimeout(() => {

                const chatContainer = fullscreenChatEndRef.current?.closest('.overflow-y-auto');

                if (chatContainer) {

                    chatContainer.scrollTop = chatContainer.scrollHeight;

                }

            }, 100);

        }

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



    // Pinning is the teacher's: the server checks the role again, so this is
    // the convenience, not the rule.
    const handlePinMessage = (message: { sender: string; text: string }) => {
        if (!socket || !isProfessor) return;
        socket.emit('pin-message', id, { sender: message.sender, text: message.text });
    };

    const handleUnpinMessage = () => {
        if (!socket || !isProfessor) return;
        socket.emit('unpin-message', id);
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



    // Mark messages as seen when chat is opened

    const markMessagesAsSeen = async () => {

        setUnseenMessages(0);

        if (messages.length > 0) {

            const newLastSeenId = messages[messages.length - 1].id;

            setLastSeenMessageId(newLastSeenId);

            await saveChatNotifications();

        }

    };



    // Opening the panel marks the conversation read and remembers where the
    // new messages began, so a line can be drawn between old and new. Closing
    // it clears the line, so the next visit marks its own.
    useEffect(() => {
        showChatRef.current = showChat;
        if (!showChat) {
            setUnreadDividerIndex(null);
            return;
        }
        if (unseenMessages > 0) {
            setUnreadDividerIndex(Math.max(0, messages.length - unseenMessages));
        }
        markMessagesAsSeen();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showChat]);

    // Mark messages as seen when chat becomes visible
    useEffect(() => {
        if (showFullscreenChat && isFullScreen) {
            markMessagesAsSeen();

        }

    }, [showFullscreenChat, isFullScreen, messages.length]);



    // Access check for students

    useEffect(() => {

        if (String(id).startsWith('private_class_')) {

            setCanAccess(true);

            setAccessChecked(true);

        } else {

            // Access check for normal live sessions

            const checkAccess = async () => {

                if (user?.role === 'student' && id) {

                    // Check if student has purchased/enrolled in this live session

                    try {

                        const res = await fetch(`/api/live-sessions/${id}/access`, {

                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }

                        });

                        if (!res.ok) {

                            console.error('[DEBUG] Access check failed:', res.status);

                            setCanAccess(false);

                            setAccessChecked(true);

                            return;

                        }

                        const data = await res.json();

                        console.log('[DEBUG] Access check result:', data);

                        setCanAccess(data.canAccess || data.can_access || false);

                    } catch (err) {

                        console.error('[DEBUG] Access check error:', err);

                        setCanAccess(false);

                    } finally {

                        setAccessChecked(true);

                    }

                } else {

                    setCanAccess(true); // Professors and admins can always access

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

            setIsScreenSharing(agoraVideoRef.current.isScreenSharing);

            setCameraDevices(agoraVideoRef.current.cameraDevices);

            setSelectedCameraId(agoraVideoRef.current.selectedDeviceId);

        }

    }, [agoraVideoRef.current, isProfessor]);



    // Listen for fullscreen changes (excluding iOS Safari which uses fake fullscreen)

    useEffect(() => {

        // Detect iOS Safari - don't listen to native fullscreen events on iOS
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent);
        
        if (isIOS) {
            // On iOS, we use fake fullscreen, so no need to listen to native events
            return;
        }

        const handleFullscreenChange = () => {

            const isFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement
            );

            console.log('[DEBUG] Fullscreen state changed:', isFullscreen);

            setIsFullScreen(isFullscreen);

        };



        // Standard fullscreen events
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        // Webkit (Chrome, etc.)
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        // Mozilla
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        // MS
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {

            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);

        };

    }, []);

    // Ensure video elements have iOS-compatible attributes
    useEffect(() => {
        const container = document.getElementById('agora-video-container');
        if (!container) return;

        const observer = new MutationObserver(() => {
            const videoElements = container.querySelectorAll('video');
            videoElements.forEach((video) => {
                // Add iOS-specific attributes for better fullscreen support
                video.setAttribute('playsinline', 'true');
                video.setAttribute('webkit-playsinline', 'true');
                video.setAttribute('x5-playsinline', 'true'); // For some Android browsers
                // Ensure video is not muted by default (unless needed)
                // video.muted = false; // Commented out - keep existing mute state
            });
        });

        observer.observe(container, {
            childList: true,
            subtree: true
        });

        // Also check immediately
        const videoElements = container.querySelectorAll('video');
        videoElements.forEach((video) => {
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            video.setAttribute('x5-playsinline', 'true');
        });

        return () => {
            observer.disconnect();
        };
    }, [agoraToken, agoraUid]); // Re-run when video connection changes



    // Handle screen orientation changes for iOS fullscreen
    useEffect(() => {
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent);
        
        if (!isIOS || !isFullScreen) return;

        const handleOrientationChange = () => {
            // Wait for orientation change to complete
            setTimeout(() => {
                // Reset scroll position
                window.scrollTo(0, 0);
                document.body.scrollTop = 0;
                document.documentElement.scrollTop = 0;
                
                // Ensure body stays fixed
                document.body.style.position = 'fixed';
                document.body.style.width = '100%';
                document.body.style.height = '100%';
                document.body.style.top = '0';
                document.body.style.left = '0';
                
                // Force reflow to fix layout
                const container = document.getElementById('agora-video-container');
                if (container) {
                    const parent = container.closest('.bg-black.rounded-xl') as HTMLElement;
                    if (parent && !parent.classList.contains('ios-fullscreen')) {
                        parent.classList.add('ios-fullscreen');
                    }
                    if (!container.classList.contains('ios-fullscreen')) {
                        container.classList.add('ios-fullscreen');
                    }
                }
            }, 100);
        };

        // Listen for orientation changes
        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);

        return () => {
            window.removeEventListener('orientationchange', handleOrientationChange);
            window.removeEventListener('resize', handleOrientationChange);
        };
    }, [isFullScreen]);



    // Plein écran - Fake fullscreen for iOS Safari, normal fullscreen for others

    const handleFullScreen = () => {

        const container = document.getElementById('agora-video-container');
        const parentContainer = container?.closest('.bg-black.rounded-xl') as HTMLElement;

        if (!container) return;

        // Detect iOS Safari specifically
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent);

        if (isIOS) {
            // iOS Safari: Use fake fullscreen with CSS class
            const isCurrentlyFullscreen = container.classList.contains('ios-fullscreen');
            
            if (isCurrentlyFullscreen) {
                // Exit fake fullscreen
                container.classList.remove('ios-fullscreen');
                if (parentContainer) {
                    parentContainer.classList.remove('ios-fullscreen');
                }
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
                document.body.style.height = '';
                document.body.style.top = '';
                document.body.style.left = '';
                // Reset scroll position
                window.scrollTo(0, 0);
                
                // Re-enable zoom when exiting fullscreen
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
                }
                
                setIsFullScreen(false);
            } else {
                // Enter fake fullscreen
                // Apply to both container and parent for proper styling
                if (parentContainer) {
                    parentContainer.classList.add('ios-fullscreen');
                }
                container.classList.add('ios-fullscreen');
                document.body.style.overflow = 'hidden';
                // Prevent scroll on body
                document.body.style.position = 'fixed';
                document.body.style.width = '100%';
                document.body.style.height = '100%';
                document.body.style.top = '0';
                document.body.style.left = '0';
                // Reset scroll position
                window.scrollTo(0, 0);
                document.body.scrollTop = 0;
                document.documentElement.scrollTop = 0;
                
                // Temporarily disable zoom in viewport to prevent auto-zoom on input focus
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                }
                
                setIsFullScreen(true);
            }
        } else {
            // All other devices: Use standard fullscreen API
            const isCurrentlyFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement
            );

            if (isCurrentlyFullscreen) {
                // Exit fullscreen (try all methods)
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    (document as any).webkitExitFullscreen();
                } else if ((document as any).mozCancelFullScreen) {
                    (document as any).mozCancelFullScreen();
                } else if ((document as any).msExitFullscreen) {
                    (document as any).msExitFullscreen();
                }
                setIsFullScreen(false);
            } else {
                // Enter fullscreen
                const requestFullscreen = container.requestFullscreen ||
                    (container as any).webkitRequestFullscreen ||
                    (container as any).mozRequestFullScreen ||
                    (container as any).msRequestFullscreen;

                if (requestFullscreen) {
                    requestFullscreen.call(container).then(() => {
                        setIsFullScreen(true);
                        console.log('[Fullscreen] Container fullscreen activated');
                    }).catch((err: any) => {
                        console.error('[Fullscreen] Failed to enter fullscreen:', err);
                    });
                } else {
                    console.warn('[Fullscreen] Fullscreen API not supported');
                }
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

        // No local flip here. This used to invert its own copy of the state,
        // which started at "on" whatever the camera was doing — so for a
        // teacher who began without one, every press made the icon more
        // wrong. The player reports the real state through
        // onCameraStateChange and the icon follows that.
        agoraVideoRef.current?.toggleLocalCamera();

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



    // Load chat notifications from database

    const loadChatNotifications = async () => {

        try {

            const data = await getChatNotifications(id);

            setUnseenMessages(data.unseenCount || 0);

            setLastSeenMessageId(data.lastSeenMessageId || 0);

        } catch (error) {

            console.error('Error loading chat notifications:', error);

        }

    };



    // Save chat notifications to database

    const saveChatNotifications = async () => {

        try {

            await markChatAsSeen(id, lastSeenMessageId);

        } catch (error) {

            console.error('Error saving chat notifications:', error);

        }

    };



    // Load notifications on component mount

    useEffect(() => {

        loadChatNotifications();

    }, [id]);



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

        return (

            <div className="min-h-screen bg-gradient-to-br from-[#194cbf] to-[#61a1ff] text-white flex items-center justify-center p-4">

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md w-full text-center">

                    <div className="mb-4">

                        <Video className="h-16 w-16 mx-auto text-white/80" />

                    </div>

                    <h2 className="text-2xl font-bold mb-4">لا يمكنك الوصول إلى هذه الجلسة</h2>

                    <p className="text-white/90 mb-6">يجب عليك التسجيل في هذه الجلسة المباشرة أولاً قبل الانضمام إليها.</p>

                    <Button

                        onClick={() => navigate('/')}

                        className="bg-white text-[#194cbf] hover:bg-white/90"

                    >

                        العودة إلى الصفحة الرئيسية

                    </Button>

                </div>

            </div>

        );

    }

    console.log('[DEBUG] Re-render, messages.length:', messages.length);



    return (

        <div dir='rtl' className="min-h-screen bg-[#202124] text-white">

            {debugPanel}



            {/* Header - Responsive */}

            <nav dir="rtl" className="bg-[#202124] border-b border-white/10 text-white sticky top-0 z-50">

                <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5 flex items-center justify-between gap-2">

                    <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3">

                        <Button

                            variant="ghost"

                            size="sm"

                            onClick={() => navigate(-1)}

                            className="shrink-0 h-8 px-2 text-white hover:bg-white/10 text-xs"

                        >

                            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />

                            العودة

                        </Button>

                        {/* One line: the title, then the small facts beside it. They used to
                            stack four deep, which made the bar taller than the
                            controls it sits above. */}
                        <div className="flex min-w-0 flex-1 items-center gap-2">

                            <h1 className="min-w-0 truncate text-sm font-semibold sm:text-base">{session.title}</h1>

                            {STREAM_STATE[session.status] && (
                                <span className={`hidden shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline-flex ${STREAM_STATE[session.status].cls}`}>
                                    {session.status === 'paused' || session.status === 'technical_issues' ? (
                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                    ) : session.status === 'live' ? (
                                        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                                    ) : null}
                                    {STREAM_STATE[session.status].label}
                                </span>
                            )}

                            <span className="hidden shrink-0 items-center gap-1 text-[11px] text-gray-400 sm:inline-flex">
                                <Eye className="h-3 w-3" />
                                {viewerCount}
                            </span>

                            {!isProfessor && (
                                <span
                                    title={studentsMuted ? 'مكتوم من قبل الأستاذ' : (studentMuteStates[user?.id] ? 'مكتوم' : 'ميكروفون نشط')}
                                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                                        studentsMuted
                                            ? 'bg-orange-500/20 text-orange-300'
                                            : studentMuteStates[user?.id]
                                            ? 'bg-red-500/20 text-red-300'
                                            : 'bg-green-500/20 text-green-300'
                                    }`}
                                >
                                    {studentsMuted || studentMuteStates[user?.id]
                                        ? <MicOff className="h-3 w-3" />
                                        : <Mic className="h-3 w-3" />}
                                </span>
                            )}

                        </div>

                    </div>

                    {/* The room and the chat, each on its own switch. Open one, the
                        other, or both — they share the column beside the video
                        and come out the same size. */}
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowPeople(!showPeople)}
                            title={showPeople ? 'إخفاء المشاركين' : 'عرض المشاركين'}
                            aria-pressed={showPeople}
                            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2 transition ${
                                showPeople
                                    ? 'border-[#194cbf] bg-[#194cbf] text-white'
                                    : 'border-white/15 bg-white/5 text-gray-200 hover:bg-white/10'
                            }`}
                        >
                            <Users className="h-4 w-4" />
                            <span className="text-xs font-semibold">{participants.length}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowChat(!showChat)}
                            title={showChat ? 'إخفاء الدردشة' : 'عرض الدردشة'}
                            aria-pressed={showChat}
                            className={`relative flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2 transition ${
                                showChat
                                    ? 'border-[#194cbf] bg-[#194cbf] text-white'
                                    : 'border-white/15 bg-white/5 text-gray-200 hover:bg-white/10'
                            }`}
                        >
                            <MessageSquare className="h-4 w-4" />
                            <span className="hidden text-xs font-semibold sm:inline">الدردشة</span>
                            {!showChat && unseenMessages > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                    {unseenMessages}
                                </span>
                            )}
                        </button>
                    </div>

                </div>

            </nav>



            {/* Main Content - Responsive */}

            <div className={`max-w-7xl mx-auto p-2 sm:p-4 flex flex-col gap-3 sm:gap-6 ${anyPanel ? 'lg:grid lg:grid-cols-4' : 'lg:block'}`}>

                {/* Video Player (Agora placeholder) - Responsive */}

                <div className={`order-1 ${anyPanel ? 'lg:col-span-3' : ''}`}>

                    <div className="bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-white/10">

                        <div id="agora-video-container" className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative flex items-center justify-center" style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
                            <style>{`
                                /* The control bar: one floating pill of round
                                   buttons over the video, instead of a row of
                                   small rectangles sitting on the picture. */
                                .tth-bar {
                                    background: rgba(32, 33, 36, 0.95);
                                    backdrop-filter: blur(12px);
                                    -webkit-backdrop-filter: blur(12px);
                                    border: 1px solid rgba(255,255,255,0.10);
                                    border-radius: 18px;
                                    padding: 8px 10px;
                                    box-shadow: 0 12px 32px rgba(0,0,0,0.5);
                                    scrollbar-width: none;
                                }
                                /* Every control is a round grey key, except the
                                   ones that already say danger or "on" in
                                   colour — those keep their own background. */
                                .tth-bar button:not([class*="bg-red"]):not([class*="bg-[#194cbf]"]) {
                                    background: #3c4043 !important;
                                    color: #fff !important;
                                }
                                .tth-bar button:not([class*="bg-red"]):not([class*="bg-[#194cbf]"]):hover {
                                    background: #474b4f !important;
                                }
                                .tth-bar::-webkit-scrollbar { display: none; }
                                .tth-bar button {
                                    border-radius: 9999px !important;
                                    min-width: 42px;
                                    height: 42px;
                                    padding-inline: 12px !important;
                                    flex: 0 0 auto;
                                }
                                .tth-bar select {
                                    border-radius: 9999px !important;
                                    height: 38px;
                                }
                                @media (max-width: 640px) {
                                    .tth-bar button { min-width: 38px; height: 38px; padding-inline: 9px !important; }
                                }

                                /* The teacher's name sits on the picture, the
                                   way it does in a call, not in a card below. */
                                .tth-nameplate {
                                    position: absolute;
                                    bottom: 12px;
                                    inset-inline-start: 14px;
                                    z-index: 10001;
                                    display: flex;
                                    align-items: center;
                                    gap: 8px;
                                    max-width: min(60%, 320px);
                                    padding: 6px 12px 6px 8px;
                                    border-radius: 9999px;
                                    background: rgba(0,0,0,0.55);
                                    backdrop-filter: blur(8px);
                                    -webkit-backdrop-filter: blur(8px);
                                    color: #fff;
                                    font-size: 13px;
                                    font-weight: 600;
                                    pointer-events: none;
                                }
                                @media (max-width: 640px) { .tth-nameplate { display: none; } }

                                .ios-fullscreen {
                                    position: fixed !important;
                                    top: 0 !important;
                                    left: 0 !important;
                                    width: 100vw !important;
                                    height: 100vh !important;
                                    background: #000000 !important;
                                    z-index: 9999 !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                    border-radius: 0 !important;
                                    box-shadow: none !important;
                                    overflow: hidden !important;
                                }
                                .ios-fullscreen#agora-video-container {
                                    aspect-ratio: unset !important;
                                    display: flex !important;
                                    align-items: center !important;
                                    justify-content: center !important;
                                    background: #000000 !important;
                                    min-height: 100vh !important;
                                }
                                .ios-fullscreen .bg-gradient-to-br,
                                .ios-fullscreen.bg-gradient-to-br {
                                    background: #000000 !important;
                                }
                                .ios-fullscreen button,
                                .ios-fullscreen .absolute {
                                    z-index: 10000 !important;
                                }
                                .ios-fullscreen .absolute {
                                    position: absolute !important;
                                }
                                /* Ensure chat input and send button are accessible */
                                .ios-fullscreen .flex.items-center.gap-2 {
                                    position: relative !important;
                                    z-index: 10001 !important;
                                    padding-bottom: env(safe-area-inset-bottom, 8px) !important;
                                    margin-bottom: 0 !important;
                                }
                                /* Ensure bottom control buttons are always visible */
                                .ios-fullscreen .absolute.bottom-2 {
                                    bottom: 16px !important;
                                    z-index: 10002 !important;
                                    position: fixed !important;
                                    left: 50% !important;
                                    transform: translateX(-50%) !important;
                                }
                                /* Ensure top buttons are visible */
                                .ios-fullscreen .absolute.top-4,
                                .ios-fullscreen .absolute.top-2 {
                                    z-index: 10003 !important;
                                    position: fixed !important;
                                }
                                /* Ensure chat toggle button is always above chat panel */
                                .ios-fullscreen .absolute.left-4.top-4 {
                                    z-index: 10005 !important;
                                    position: fixed !important;
                                }
                                /* Ensure chat panel doesn't overlap buttons */
                                .ios-fullscreen .absolute.left-0.top-0.w-80 {
                                    z-index: 10004 !important;
                                    padding-bottom: 80px !important;
                                }
                                /* Ensure chat input area is always accessible */
                                .ios-fullscreen .absolute.left-0.top-0.w-80 .flex-1.overflow-y-auto {
                                    max-height: calc(100vh - 120px) !important;
                                }
                                /* Prevent iOS zoom on input focus - MUST be 16px or larger */
                                .ios-fullscreen textarea,
                                .ios-fullscreen input,
                                .ios-fullscreen textarea:focus,
                                .ios-fullscreen input:focus {
                                    font-size: 16px !important;
                                    -webkit-text-size-adjust: 100% !important;
                                    transform: scale(1) !important;
                                }
                                /* Prevent zoom on focus for iOS */
                                @supports (-webkit-touch-callout: none) {
                                    .ios-fullscreen textarea,
                                    .ios-fullscreen input {
                                        font-size: 16px !important;
                                        -webkit-text-size-adjust: 100% !important;
                                    }
                                    .ios-fullscreen textarea:focus,
                                    .ios-fullscreen input:focus {
                                        font-size: 16px !important;
                                        transform: scale(1) !important;
                                        -webkit-text-size-adjust: 100% !important;
                                    }
                                }
                                /* Prevent body scroll when in iOS fullscreen */
                                body.ios-fullscreen-active {
                                    position: fixed !important;
                                    width: 100% !important;
                                    height: 100% !important;
                                    overflow: hidden !important;
                                }
                            `}</style>

                            {/* The lesson is interrupted. A small badge in the header
                                is easy to miss while watching, so a student sees it
                                over the video itself — and knows the frozen picture
                                is expected, not their connection. The teacher gets the
                                same reminder that the students are waiting. */}
                            {session && (session.status === 'paused' || session.status === 'technical_issues' || session.status === 'starting') && (
                                <div
                                    dir="rtl"
                                    className="pointer-events-none absolute inset-x-0 top-0 z-[10010] flex justify-center p-3"
                                >
                                    <div className={`flex max-w-xl items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md ${
                                        session.status === 'technical_issues'
                                            ? 'bg-orange-600/90'
                                            : session.status === 'paused'
                                            ? 'bg-amber-500/90'
                                            : 'bg-emerald-600/90'
                                    }`}>
                                        {session.status === 'technical_issues' ? (
                                            <Settings className="h-5 w-5 shrink-0 animate-spin text-white" style={{ animationDuration: '3s' }} />
                                        ) : session.status === 'paused' ? (
                                            <Pause className="h-5 w-5 shrink-0 text-white" />
                                        ) : (
                                            <PlayIcon className="h-5 w-5 shrink-0 text-white" />
                                        )}
                                        <div className="text-white">
                                            <p className="text-sm font-bold">
                                                {session.status === 'technical_issues'
                                                    ? 'مشكلة تقنية'
                                                    : session.status === 'paused'
                                                    ? 'الحصة متوقفة مؤقتاً'
                                                    : 'الحصة على وشك البدء'}
                                            </p>
                                            <p className="text-xs text-white/85">
                                                {session.status === 'technical_issues'
                                                    ? (isProfessor ? 'الطلاب يرون أنك تعالج مشكلة تقنية.' : 'الأستاذ يعالج مشكلة تقنية — ابقَ في الحصة، ستُستأنف قريباً.')
                                                    : session.status === 'paused'
                                                    ? (isProfessor ? 'الطلاب يرون أن الحصة متوقفة.' : 'ابقَ في الحصة، ستُستأنف بعد قليل.')
                                                    : (isProfessor ? 'الطلاب ينتظرون بدءك.' : 'سيبدأ الأستاذ بعد لحظات.')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Whose picture this is, written on the picture. */}
                            {(() => {
                                const teacher = session?.presenter || session?.professor_name || '';
                                return teacher ? (
                                    <div className="tth-nameplate">
                                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#194cbf] to-[#61a1ff] text-[11px] font-bold">
                                            {teacher.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="truncate">{teacher}</span>
                                    </div>
                                ) : null;
                            })()}

                            {/* Zone vidéo Agora */}

                            {/* The teacher answers before anything is published, so a
                                camera-shy teacher never appears on screen even for a
                                moment. Students skip this entirely. */}
                            {isProfessor && startWithCamera === null && (
                                <div className="absolute inset-0 z-[10020] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
                                    <div dir="rtl" className="w-full max-w-md rounded-2xl border border-white/15 bg-[#121a33] p-6 text-center shadow-2xl">
                                        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-purple-600/20">
                                            <Video className="h-7 w-7 text-purple-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white">كيف تريد أن تبدأ البث؟</h3>
                                        <p className="mt-2 text-sm text-gray-400">
                                            يمكنك تشغيل الكاميرا لاحقاً في أي وقت من زر الكاميرا.
                                        </p>
                                        <div className="mt-6 space-y-2">
                                            <button
                                                type="button"
                                                onClick={() => setStartWithCamera(true)}
                                                className="w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white transition hover:bg-purple-700"
                                            >
                                                البدء بالكاميرا والصوت
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStartWithCamera(false)}
                                                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
                                            >
                                                البدء بالصوت فقط
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {agoraToken && (!isProfessor || startWithCamera !== null) ? (

                                <>

                                    <ErrorBoundary>

                                        <AgoraVideoPlayer

                                            appId={AGORA_APP_ID}

                                            channel={id as string}

                                            token={agoraToken}

                                            uid={agoraUid || 0}

                                            role={isProfessor ? 'host' : 'audience'}

                                            startWithCamera={isProfessor ? startWithCamera !== false : true}

                                            onCameraStateChange={setIsLocalCameraEnabled}

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

                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#61a1ff] mx-auto mb-2"></div>

                                    <p>جاري الاتصال بالبث المباشر...</p>

                                </div>

                            )}



                            {/* Fullscreen Chat - Inside video container */}

                            {isFullScreen && showFullscreenChat && (

                                <div className="absolute left-0 top-0 w-80 h-full bg-black/80 backdrop-blur-sm border-r border-white/20 z-50" style={{ zIndex: 10004 }}>

                                    <div className="h-full flex flex-col p-4">

                                        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/20">

                                            <MessageSquare className="w-5 h-5" />

                                            <h3 className="font-semibold text-white">الدردشة المباشرة</h3>

                                            {!chatEnabled && <span className="ml-2 text-xs text-red-400">الدردشة مغلقة من قبل الأستاذ</span>}

                                        </div>



                                        <div className="flex-1 overflow-y-auto space-y-3 mb-4 scrollbar-hide">

                                            {messages.length === 0 ? (

                                                <div className="text-center text-gray-400 py-8">

                                                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />

                                                    <p>لا توجد رسائل بعد</p>

                                                    <p className="text-xs">ابدأ المحادثة!</p>

                                                </div>

                                            ) : (

                                                messages.map((msg, idx) => (

                                                    <div key={msg.id} className="bg-white/10 rounded-lg p-3">

                                                        <div className={`font-medium text-sm ${msg.color}`}>{msg.sender}</div>

                                                        <div className="text-sm text-gray-300 break-words whitespace-pre-line">{msg.text}</div>

                                                    </div>

                                                ))

                                            )}

                                            <div ref={fullscreenChatEndRef}></div>

                                        </div>



                                        <div className="flex items-center gap-2" style={{ position: 'relative', zIndex: 10001, paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>

                                            <textarea

                                                placeholder={chatEnabled ? "اكتب رسالتك..." : "الدردشة مغلقة"}

                                                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#61a1ff] resize-none break-words whitespace-pre-line min-h-[40px]"

                                                value={input}

                                                onChange={e => setInput(e.target.value)}

                                                onKeyDown={e => {

                                                    if (e.key === 'Enter' && !e.shiftKey) {

                                                        e.preventDefault();

                                                        handleSend();

                                                    }

                                                }}

                                                onFocus={(e) => {
                                                    // Prevent iOS from scrolling the page when focusing textarea
                                                    setTimeout(() => {
                                                        window.scrollTo(0, 0);
                                                        document.body.scrollTop = 0;
                                                        document.documentElement.scrollTop = 0;
                                                    }, 100);
                                                }}

                                                disabled={!chatEnabled}

                                                rows={1}

                                                style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '16px', WebkitTextSizeAdjust: '100%' }}

                                            />

                                            <Button

                                                size="sm"

                                                className="bg-[#194cbf] hover:bg-[#61a1ff]"

                                                onClick={handleSend}

                                                disabled={!chatEnabled || !input.trim()}

                                                style={{ flexShrink: 0, zIndex: 10001 }}

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

                                </div>

                            )}



                            {/* Chat Toggle Button - Only show in fullscreen */}

                            {isFullScreen && (

                                <div className="absolute left-4 top-4 z-20" style={{ zIndex: 10005, position: 'fixed' }}>

                                    <Button

                                        size="sm"

                                        variant="secondary"

                                        className={`border-0 rounded-full w-10 h-10 p-0 relative ${

                                            showFullscreenChat 

                                                ? 'bg-black/70 hover:bg-black/90 text-white' 

                                                : 'bg-[#194cbf] hover:bg-[#61a1ff] text-white'

                                        }`}

                                        onClick={() => {

                                            setShowFullscreenChat(!showFullscreenChat);

                                            if (!showFullscreenChat) {

                                                markMessagesAsSeen();

                                            }

                                        }}

                                        title={showFullscreenChat ? 'إخفاء الدردشة' : 'إظهار الدردشة'}

                                    >

                                        <MessageSquare className="w-4 h-4" />

                                        {unseenMessages > 0 && (

                                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">

                                                {unseenMessages > 99 ? '99+' : unseenMessages}

                                            </div>

                                        )}

                                    </Button>

                                </div>

                            )}



                            {/* Video Controls - Responsive for Mobile/Tablet */}

                            <div className="tth-bar absolute bottom-3 sm:bottom-5 left-1/2 transform -translate-x-1/2 flex flex-row flex-nowrap gap-1.5 sm:gap-2 max-w-[calc(100%-1rem)] items-center justify-center w-auto overflow-x-auto" style={{ zIndex: 10002 }}>

                                {/* Fullscreen button (all users) */}

                                <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    className="bg-black/50 hover:bg-black/70 text-white border-0 text-xs sm:text-sm" 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleFullScreen();
                                    }}
                                    style={{ 
                                        touchAction: 'manipulation',
                                        WebkitTapHighlightColor: 'transparent',
                                        cursor: 'pointer',
                                        zIndex: 10
                                    }}
                                >

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

                                            variant="secondary"

                                            className="bg-black/50 hover:bg-black/70 text-white border-0 text-xs sm:text-sm"

                                            onClick={handleToggleCamera}

                                            title="تشغيل/إيقاف الكاميرا"

                                        >

                                            {isLocalCameraEnabled ? <Video className="w-3 h-3 sm:w-4 sm:h-4" /> : <VideoOff className="w-3 h-3 sm:w-4 sm:h-4" />}

                                        </Button>

                                        <Button

                                            size="sm"

                                            variant="secondary"

                                            className={`bg-black/50 hover:bg-black/70 text-white border-0 text-xs sm:text-sm ${isScreenSharing ? 'bg-orange-600 hover:bg-orange-700' : ''}`}

                                            onClick={handleScreenShare}

                                            title="مشاركة الشاشة"

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

                                            size="sm"

                                            className="bg-red-600 hover:bg-red-700 text-white border-0 text-xs sm:text-sm"

                                            onClick={async () => {

                                                console.log('[DEBUG] Prof click Terminer le stream', { id, socket, socketId: socket?.id });

                                                // Désactive micro et caméra avant de terminer le stream

                                                if (agoraVideoRef.current) {

                                                    if (!agoraVideoRef.current.isLocalMicMuted) {

                                                        agoraVideoRef.current.toggleLocalMic();

                                                    }

                                                    if (agoraVideoRef.current.isLocalCameraEnabled) {

                                                        agoraVideoRef.current.toggleLocalCamera();

                                                    }

                                                }

                                                if (socket && id) {

                                                    console.log('[DEBUG] Emitting end-stream', { id });

                                                    socket.emit('end-stream', id);

                                                } else {

                                                    console.error('[DEBUG] end-stream NOT emitted', { socket, id });

                                                    // Fallback: redirect immediately if no socket

                                                    navigate('/professor/live-sessions');

                                                }

                                            }}

                                        >

                                            إنهاء البث

                                        </Button>

                                    </>

                                )}


                                {/* Open the room list or the chat over the video, the way a call does
                                    it, rather than stacking them down the page. */}
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className={`border-0 text-xs sm:text-sm ${showPeople ? 'bg-[#194cbf] hover:bg-[#61a1ff] text-white' : 'bg-black/50 hover:bg-black/70 text-white'}`}
                                    onClick={() => setShowPeople(!showPeople)}
                                    title="المشاركون"
                                >
                                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="ml-1 text-[11px] font-semibold">{participants.length}</span>
                                </Button>

                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className={`relative border-0 text-xs sm:text-sm ${showChat ? 'bg-[#194cbf] hover:bg-[#61a1ff] text-white' : 'bg-black/50 hover:bg-black/70 text-white'}`}
                                    onClick={() => setShowChat(!showChat)}
                                    title="الدردشة"
                                >
                                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                                    {!showChat && unseenMessages > 0 && (
                                        <span className="absolute -top-1 -right-1 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                            {unseenMessages}
                                        </span>
                                    )}
                                </Button>

                            </div>



                            {/* Telegram Channel Button - Sidebar */}

                            {session?.telegram_channel && (

                                <div className="absolute top-4 right-4 z-10">

                                    <Button

                                        size="sm"

                                        variant="secondary"

                                        className="bg-[#194cbf] hover:bg-[#61a1ff] text-white border-0 text-xs sm:text-sm"

                                        onClick={() => window.open(session.telegram_channel, '_blank')}

                                        title="قناتنا على التلغرام"

                                    >

                                        <TelegramIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />

                                        <span className="hidden sm:inline">قناتنا على التلغرام</span>

                                    </Button>

                                </div>

                            )}

                        </div>

                    </div>

                </div>



                {/* Chat Sidebar - Responsive: bottom on mobile/tablet, right on desktop */}

                <div className={`order-2 lg:order-2 lg:col-span-1 flex-col gap-3 lg:h-[600px] ${anyPanel ? 'flex' : 'hidden'}`}>

                    {showPeople && (
                    <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur-sm p-3 sm:p-4 shadow-lg shadow-black/20">
                <h3 className="font-bold mb-3 text-white flex flex-wrap items-center gap-2 text-sm sm:text-base">
                    <span className="grid place-items-center h-8 w-8 rounded-xl bg-[#194cbf]/25 text-[#9ec1ff]">
                        <Users className="w-4 h-4" />
                    </span>
                    المشاركون
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-gray-200">
                        {participants.length}
                    </span>
                    <button
                        type="button"
                        onClick={() => setPeopleExpanded(true)}
                        aria-label="توسيع المشاركين"
                        title="توسيع"
                        className="ml-auto rounded-full p-1.5 text-gray-300 transition hover:bg-white/10 hover:text-white"
                    >
                        <Maximize2 className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowPeople(false)}
                        aria-label="إغلاق المشاركين"
                        title="إغلاق"
                        className="rounded-full p-1.5 text-gray-300 transition hover:bg-white/10 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>

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

                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-3 flex-1 min-h-0 overflow-y-auto pr-1 content-start">

                        {participants.map((participant) => {

                            const isCurrentUser = participant.userId === user?.id;

                            const isStudent = participant.role === 'student';

                            // A teacher is not one of the muted students: their badge follows
                            // their own microphone. Reading the student map for them
                            // found nothing and fell back to "muted", so a teacher who
                            // was speaking was shown with a red muted icon.
                            const isTeacherRow = participant.role === 'professor';
                            const isMuted = isTeacherRow
                                ? (isCurrentUser ? isLocalMicMuted : false)
                                : (studentMuteStates[participant.userId] !== undefined ? studentMuteStates[participant.userId] : true);

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

                                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#194cbf] to-[#61a1ff] flex items-center justify-center text-white font-bold text-sm sm:text-lg border-2 border-white/20 group-hover:border-green-400 transition-all duration-200">

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

                                        {/* One switch, not two. It used to be a pair of wide buttons, each
                                            disabled half the time, which took more room in the tile
                                            than the student's own name. */}
                                        {canProfToggle && (
                                            <button
                                                type="button"
                                                title={isMuted ? 'إعطاء الميكروفون' : 'كتم الطالب'}
                                                aria-label={isMuted ? 'إعطاء الميكروفون' : 'كتم الطالب'}
                                                onClick={() => {
                                                    if (!socket) return;
                                                    socket.emit('toggle-student-mic', id, {
                                                        studentId: participant.userId,
                                                        studentName: participant.name,
                                                        muted: !isMuted,
                                                    });
                                                }}
                                                className={`mt-1 grid h-7 w-7 place-items-center rounded-full transition ${
                                                    isMuted
                                                        ? 'bg-green-600/90 text-white hover:bg-green-600'
                                                        : 'bg-red-600/90 text-white hover:bg-red-600'
                                                }`}
                                            >
                                                {isMuted ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                                            </button>
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
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10">
                    <div className="flex justify-between text-xs sm:text-sm text-gray-300">
                        <span>إجمالي المشاركين: {participants.length}</span>
                        <span className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                            </span>
                            <span className="hidden sm:inline">متصلون الآن</span>
                            <span className="sm:hidden">متصلون</span>
                        </span>
                    </div>
                </div>
            </div>


                    )}

                    {showChat && (
                    <div className="flex-1 min-h-0">
                    <ChatSidebar
                        fill

                        messages={messages}

                        input={input}

                        setInput={setInput}

                        handleSend={handleSend}

                        chatEnabled={chatEnabled}

                        studentsMuted={studentsMuted}

                        isProfessor={isProfessor}

                        onExpand={() => setChatExpanded(true)}

                        unreadDividerIndex={unreadDividerIndex}

                        pinnedMessage={pinnedMessage}

                        onPin={handlePinMessage}

                        onUnpin={handleUnpinMessage}

                        participants={participants}

                    />
                    </div>
                    )}

                </div>

            </div>



            {/* The same conversation, given the whole window — for the student
                reading along and for the teacher following students' questions. */}
            <ParticipantsExpanded
                open={peopleExpanded}
                onClose={() => setPeopleExpanded(false)}
                participants={participants}
                currentUserId={user?.id}
                isProfessor={isProfessor}
                studentsMuted={studentsMuted}
                studentMuteStates={studentMuteStates}
                isLocalMicMuted={isLocalMicMuted}
                onToggleStudentMic={(participant, muted) => {
                    if (!socket) return;
                    socket.emit('toggle-student-mic', id, {
                        studentId: participant.userId,
                        studentName: participant.name,
                        muted,
                    });
                }}
            />

            <ChatExpanded
                open={chatExpanded}
                onClose={() => setChatExpanded(false)}
                messages={messages}
                input={input}
                setInput={setInput}
                handleSend={handleSend}
                chatEnabled={chatEnabled}
                isProfessor={isProfessor}
                pinnedMessage={pinnedMessage}
                unreadDividerIndex={unreadDividerIndex}
                onPin={handlePinMessage}
                onUnpin={handleUnpinMessage}
                participants={participants}
            />



            {/* The session details, under the video. Who is in the room is not here:
                it sits beside the video in the side column, where it can be seen
                without scrolling. */}
            <div className="max-w-7xl mx-auto px-2 sm:px-4 mt-3 sm:mt-6 space-y-3 sm:space-y-4">
            {/* The session details. The teacher's name was read from a field the
                API does not send for an ordinary session, so "مقدم من:" was
                always blank; professor_name is the one that is actually there. */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur-sm p-4 sm:p-6 shadow-lg shadow-black/20">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                        {session.title}
                    </h1>
                    {STREAM_STATE[session.status] && (
                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STREAM_STATE[session.status].cls}`}>
                            {STREAM_STATE[session.status].label}
                        </span>
                    )}
                </div>

                {(() => {
                    const teacher = session.presenter || session.professor_name || '';
                    return teacher ? (
                        <div className="mt-4 flex items-center gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#194cbf] to-[#61a1ff] text-base font-bold text-white">
                                {teacher.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-gray-400">الأستاذ</p>
                                <p className="truncate font-semibold text-white">{teacher}</p>
                            </div>
                        </div>
                    ) : null;
                })()}

                {session.description && (
                    <p className="mt-4 rounded-xl bg-black/20 p-3 sm:p-4 leading-relaxed text-gray-300">
                        {session.description}
                    </p>
                )}
            </div>
            </div>



        </div>

    );

};



export default StreamingInternal;
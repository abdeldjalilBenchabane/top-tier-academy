import React, { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';

interface AgoraVideoPlayerProps {
    appId: string;
    channel: string;
    token: string;
    uid: string | number;
    role: 'host' | 'audience';
    studentsMuted: boolean;
}

const AgoraVideoPlayer: React.FC<AgoraVideoPlayerProps & { onError?: (err: any) => void }> = ({
    appId,
    channel,
    token,
    uid,
    role,
    studentsMuted,
    onError
}) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const clientRef = useRef<IAgoraRTCClient | null>(null);
    const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
    const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
    const isInitializedRef = useRef(false);
    const cleanupInProgressRef = useRef(false);
    const mountedRef = useRef(true);
    const videoContainerRef = useRef<HTMLDivElement>(null);

    const cleanup = useCallback(async () => {
        if (cleanupInProgressRef.current) {
            return;
        }
        cleanupInProgressRef.current = true;
        try {
            if (localAudioTrackRef.current) {
                try {
                    localAudioTrackRef.current.close();
                } catch {}
                localAudioTrackRef.current = null;
            }
            if (localVideoTrackRef.current) {
                try {
                    localVideoTrackRef.current.close();
                } catch {}
                localVideoTrackRef.current = null;
            }
            if (clientRef.current) {
                try {
                    if (clientRef.current.connectionState === 'CONNECTED') {
                        await clientRef.current.leave();
                    }
                } catch {}
                clientRef.current = null;
            }
            isInitializedRef.current = false;
            if (mountedRef.current) {
                setIsConnected(false);
                setIsConnecting(false);
                setRemoteUsers([]);
            }
        } finally {
            cleanupInProgressRef.current = false;
        }
    }, []);

    const init = useCallback(async () => {
        if (!mountedRef.current) return;

        if (!appId || !channel || !token) {
            setError('Missing required connection parameters');
            return;
        }

        await cleanup();
        isInitializedRef.current = false;
        if (!mountedRef.current) return;

        try {
            setIsConnecting(true);
            setError(null);
            isInitializedRef.current = true;

            const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
            clientRef.current = client;
            await client.setClientRole(role);

            client.on('user-published', async (user, mediaType) => {
                if (role === 'host' || !mountedRef.current) return;
                try {
                    await client.subscribe(user, mediaType);
                    if (mediaType === 'video' && mountedRef.current) {
                        setRemoteUsers([user]);
                        if (videoContainerRef.current && user.videoTrack) {
                            user.videoTrack.play(videoContainerRef.current);
                        }
                    }
                    if (mediaType === 'audio' && user.audioTrack) {
                        user.audioTrack.play();
                    }
                } catch {}
            });

            client.on('user-unpublished', (user) => {
                if (mountedRef.current) {
                    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
                }
                if (user.videoTrack) {
                    try { user.videoTrack.stop(); } catch {}
                }
                if (user.audioTrack) {
                    try { user.audioTrack.stop(); } catch {}
                }
            });

            client.on('connection-state-change', (curState) => {
                if (mountedRef.current) {
                    if (curState === 'CONNECTED') {
                        setIsConnecting(false);
                        setIsConnected(true);
                    } else if (curState === 'DISCONNECTED') {
                        setIsConnected(false);
                    }
                }
            });

            try {
                await client.join(appId, channel, token ?? null, uid ?? null);
            } catch (joinErr: any) {
                setError('Échec de la connexion à la classe en direct. Veuillez réessayer.');
                return;
            }

            if (role === 'host') {
                try {
                    localAudioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
                    localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack();
                    await client.publish([localAudioTrackRef.current, localVideoTrackRef.current]);
                    if (videoContainerRef.current && localVideoTrackRef.current && mountedRef.current) {
                        localVideoTrackRef.current.play(videoContainerRef.current);
                    }
                } catch (err: any) {
                    if (err.name === 'NotAllowedError') {
                        setError('Camera or microphone access denied. Please allow permissions and refresh.');
                    } else if (err.name === 'NotFoundError') {
                        setError('No camera or microphone found. Please connect a device and try again.');
                    } else {
                        setError('Failed to access camera/microphone: ' + err.message);
                    }
                }
            }
        } catch (err: any) {
            isInitializedRef.current = false;
            if (mountedRef.current) {
                setError('Failed to connect to live stream: ' + (err.message || 'Unknown error'));
                setIsConnecting(false);
                if (onError && err.code !== 'OPERATION_ABORTED') onError(err);
            }
        }
    }, [appId, channel, token, uid, role, onError, cleanup]);

    useEffect(() => {
        mountedRef.current = true;
        const initializeConnection = async () => {
            await cleanup();
            isInitializedRef.current = false;
            if (!mountedRef.current) return;
            await init();
        };
        const timeoutId = setTimeout(initializeConnection, 100);
        return () => {
            mountedRef.current = false;
            clearTimeout(timeoutId);
            cleanup();
        };
    }, [appId, channel, token, uid, role]);

    useEffect(() => {
        if (role === 'audience' && localAudioTrackRef.current) {
            localAudioTrackRef.current.setEnabled(!studentsMuted);
        }
    }, [studentsMuted, role]);

    if (isConnecting) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px] bg-black rounded-lg">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-white">{role === 'host' ? 'جاري الاتصال...' : 'في انتظار البث المباشر...'}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px] bg-black rounded-lg">
                <div className="text-center">
                    <div className="text-red-400 mb-4">{error}</div>
                    {role === 'host' && (
                        <button
                            onClick={() => {
                                setError(null);
                                isInitializedRef.current = false;
                                init();
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
                        >
                            إعادة المحاولة
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px] bg-black rounded-lg">
                <div className="text-center">
                    <p className="text-white">{role === 'host' ? 'في انتظار الاتصال...' : 'في انتظار البث المباشر...'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full min-h-[400px] bg-black rounded-lg overflow-hidden">
            <div ref={videoRef} className="w-full h-full" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <div ref={videoContainerRef} className="w-full h-full" style={{ position: 'relative', width: '100%', height: '100%' }} />
                {role === 'audience' && remoteUsers.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white text-center">
                            <p>في انتظار أن يبدأ الأستاذ البث...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgoraVideoPlayer;

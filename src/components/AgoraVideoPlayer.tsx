import React, { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, ILocalVideoTrack, CameraVideoTrackInitConfig } from 'agora-rtc-sdk-ng';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';

interface AgoraVideoPlayerProps {
    appId: string;
    channel: string;
    token: string;
    uid: string | number;
    role: 'host' | 'audience';
    studentsMuted: boolean;
    socket?: any;
}

const AgoraVideoPlayer: React.FC<AgoraVideoPlayerProps & { onError?: (err: any) => void }> = ({
    appId,
    channel,
    token,
    uid,
    role,
    studentsMuted,
    socket,
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
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const screenTrackRef = useRef<ILocalVideoTrack | null>(null);
    const [cameraDevices, setCameraDevices] = useState<{ deviceId: string, label: string }[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [isLocalMicMuted, setIsLocalMicMuted] = useState(false);

    const cleanup = useCallback(async () => {
        if (cleanupInProgressRef.current) {
            return;
        }
        cleanupInProgressRef.current = true;
        try {
            if (localAudioTrackRef.current) {
                try {
                    localAudioTrackRef.current.close();
                } catch { }
                localAudioTrackRef.current = null;
            }
            if (localVideoTrackRef.current) {
                try {
                    localVideoTrackRef.current.close();
                } catch { }
                localVideoTrackRef.current = null;
            }
            if (clientRef.current) {
                try {
                    if (clientRef.current.connectionState === 'CONNECTED') {
                        await clientRef.current.leave();
                    }
                } catch { }
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
                } catch { }
            });

            client.on('user-unpublished', (user) => {
                if (mountedRef.current) {
                    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
                }
                if (user.videoTrack) {
                    try { user.videoTrack.stop(); } catch { }
                }
                if (user.audioTrack) {
                    try { user.audioTrack.stop(); } catch { }
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
                    let cameraIdToUse = selectedDeviceId;
                    if (!cameraIdToUse && cameraDevices.length > 0) cameraIdToUse = cameraDevices[0].deviceId;
                    localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack({ cameraId: cameraIdToUse } as CameraVideoTrackInitConfig);
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
            } else if (role === 'audience') {
                // Pour les étudiants, créer une piste audio locale (non publiée) pour le contrôle du micro
                try {
                    localAudioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
                    // Ne pas publier la piste audio pour les étudiants
                    console.log('[DEBUG] Created local audio track for student (not published)');
                } catch (err: any) {
                    console.warn('[DEBUG] Could not create audio track for student:', err);
                    // Ne pas afficher d'erreur pour les étudiants si le micro n'est pas disponible
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
    }, [appId, channel, token, uid, role, onError, cleanup, selectedDeviceId, cameraDevices]);

    async function stopScreenShare(_evt?: any) {
        if (!clientRef.current) return;
        if (screenTrackRef.current) {
            await clientRef.current.unpublish([screenTrackRef.current]);
            screenTrackRef.current.stop();
            screenTrackRef.current = null;
        }
        // Re-publish camera
        if (localVideoTrackRef.current) {
            await clientRef.current.publish([localVideoTrackRef.current]);
            if (videoContainerRef.current) {
                localVideoTrackRef.current.play(videoContainerRef.current);
            }
        }
        setIsScreenSharing(false);
    }

    const startScreenShare = useCallback(async () => {
        if (!clientRef.current) return;
        try {
            const screenTrack = await AgoraRTC.createScreenVideoTrack();
            // Unpublish camera video
            if (localVideoTrackRef.current) {
                await clientRef.current.unpublish([localVideoTrackRef.current]);
                localVideoTrackRef.current.stop();
            }
            // Publish screen
            await clientRef.current.publish([screenTrack]);
            screenTrackRef.current = screenTrack;
            setIsScreenSharing(true);
            // Play in local container
            if (videoContainerRef.current) {
                screenTrack.play(videoContainerRef.current);
            }
            // Listen for end
            (screenTrack as any).on('track-ended', async (_evt: any) => { await stopScreenShare(undefined); });
        } catch (err) {
            setError('Erreur lors du partage d\'écran: ' + (err.message || 'inconnue'));
        }
    }, [clientRef, videoContainerRef, setIsScreenSharing, stopScreenShare]);

    const createAndPublishVideoTrack = useCallback(async (cameraId: string) => {
        if (!clientRef.current) return;
        // Fermer l'ancienne piste si elle existe
        if (localVideoTrackRef.current) {
            await clientRef.current.unpublish([localVideoTrackRef.current]);
            localVideoTrackRef.current.stop();
            localVideoTrackRef.current.close();
            localVideoTrackRef.current = null;
        }
        // Créer la nouvelle piste
        const videoTrack = await AgoraRTC.createCameraVideoTrack({ cameraId } as CameraVideoTrackInitConfig);
        await clientRef.current.publish([videoTrack]);
        localVideoTrackRef.current = videoTrack;
        // Afficher dans le container
        if (videoContainerRef.current && videoTrack) {
            videoTrack.play(videoContainerRef.current);
        }
    }, [clientRef, videoContainerRef]);

    // Fonction pour contrôler le micro local du professeur
    const toggleLocalMic = useCallback(() => {
        if (localAudioTrackRef.current) {
            const newMuteState = !isLocalMicMuted;
            localAudioTrackRef.current.setEnabled(!newMuteState);
            setIsLocalMicMuted(newMuteState);
            console.log(`[DEBUG] Professor mic ${newMuteState ? 'muted' : 'unmuted'}`);
        }
    }, [isLocalMicMuted, localAudioTrackRef]);

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

    useEffect(() => {
        let mounted = true;
        AgoraRTC.getCameras().then(devices => {
            if (mounted) {
                setCameraDevices(devices);
                if (devices.length > 0 && !selectedDeviceId) {
                    setSelectedDeviceId(devices[0].deviceId);
                }
            }
        });
        return () => { mounted = false; };
    }, []);

    // Écouter les signaux de contrôle du micro individuel
    useEffect(() => {
        if (!socket || role !== 'audience') return;

        const handleStudentMicToggle = async (data: any) => {
            console.log('[DEBUG] Received student mic toggle signal:', data, 'socket.id:', socket.id, 'user.id:', socket.userData?.id);
            // Vérifier si ce signal est pour cet étudiant (userId)
            if (data.studentId === socket.userData?.id) {
                console.log('[DEBUG] This mic toggle is for me, setting mic to:', !data.muted);
                try {
                    if (!data.muted) {
                        // Unmute: passer en host et publier la piste audio
                        if (clientRef.current && localAudioTrackRef.current) {
                            await clientRef.current.setClientRole('host');
                            await clientRef.current.publish([localAudioTrackRef.current]);
                            localAudioTrackRef.current.setEnabled(true);
                            console.log('[DEBUG] Student set to host and audio published');
                        }
                    } else {
                        // Mute: unpublish et repasser en audience
                        if (clientRef.current && localAudioTrackRef.current) {
                            await clientRef.current.unpublish([localAudioTrackRef.current]);
                            localAudioTrackRef.current.setEnabled(false);
                            await clientRef.current.setClientRole('audience');
                            console.log('[DEBUG] Student set to audience and audio unpublished');
                        }
                    }
                } catch (err) {
                    console.error('[DEBUG] Error in student mic toggle:', err);
                }
                // Feedback visuel immédiat
                setIsLocalMicMuted(!!data.muted);
            }
        };

        socket.on('student-mic-toggled', handleStudentMicToggle);
        return () => {
            socket.off('student-mic-toggled', handleStudentMicToggle);
        };
    }, [socket, role]);

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
                {role === 'host' && isConnected && (
                    <div className="absolute top-4 right-4 z-20 flex gap-2">
                        {/* Bouton Mute/Unmute du professeur */}
                        <Button
                            size="sm"
                            variant="secondary"
                            className={`${isLocalMicMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white border-0 shadow-lg`}
                            onClick={toggleLocalMic}
                            title={isLocalMicMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                        >
                            {isLocalMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </Button>

                        {/* Bouton Partage d'écran */}
                        {isScreenSharing ? (
                            <Button
                                onClick={stopScreenShare}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 shadow"
                            >
                                Arrêter le partage d'écran
                            </Button>
                        ) : (
                            <Button
                                onClick={startScreenShare}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 shadow"
                            >
                                Partager l'écran
                            </Button>
                        )}
                    </div>
                )}
                {role === 'host' && isConnected && cameraDevices.length > 1 && (
                    <div className="absolute top-4 left-4 z-20">
                        <label htmlFor="camera-select" className="text-white mr-2">Caméra :</label>
                        <select
                            id="camera-select"
                            value={selectedDeviceId}
                            onChange={async (e) => {
                                setSelectedDeviceId(e.target.value);
                                await createAndPublishVideoTrack(e.target.value);
                            }}
                            className="bg-black/70 text-white rounded px-2 py-1 border border-white/20"
                        >
                            {cameraDevices.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${device.deviceId}`}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgoraVideoPlayer;

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

    console.log('[DEBUG] AgoraVideoPlayer props:', { appId, channel, token: token ? 'present' : 'missing', uid, role });

    // Cleanup function
    const cleanup = useCallback(async () => {
        console.log('[DEBUG] Cleaning up Agora connection...');
        
        // Close local tracks
        if (localAudioTrackRef.current) {
            try {
            localAudioTrackRef.current.close();
            } catch (err) {
                console.warn('[DEBUG] Error closing audio track:', err);
            }
            localAudioTrackRef.current = null;
        }
        if (localVideoTrackRef.current) {
            try {
            localVideoTrackRef.current.close();
            } catch (err) {
                console.warn('[DEBUG] Error closing video track:', err);
            }
            localVideoTrackRef.current = null;
        }
        
        // Leave channel and destroy client
        if (clientRef.current) {
            try {
                await clientRef.current.leave();
            } catch (err) {
                console.warn('[DEBUG] Error leaving channel:', err);
            }
            clientRef.current = null;
        }
        
        // Clear video container
        if (videoRef.current) {
            videoRef.current.innerHTML = '';
        }
        
        isInitializedRef.current = false;
        setIsConnected(false);
        setIsConnecting(false);
        setRemoteUsers([]);
    }, []);

    const init = useCallback(async () => {
        if (isInitializedRef.current) {
            console.log('[DEBUG] Already initialized, skipping...');
            return;
        }

        if (!appId || !channel || !token) {
            console.error('[DEBUG] Missing required props:', { appId: !!appId, channel: !!channel, token: !!token });
            setError('Missing required connection parameters');
            return;
        }

        // Ensure cleanup is awaited before joining
        await cleanup();

        try {
            setIsConnecting(true);
            setError(null);
            isInitializedRef.current = true;

            console.log('[DEBUG] Creating Agora client...');
                const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
                clientRef.current = client;

            // Set client role
                await client.setClientRole(role);
            console.log('[DEBUG] Client role set to:', role);

            // Set up event handlers
                client.on('user-published', async (user, mediaType) => {
                if (role === 'host') {
                    // Teacher should never subscribe to or display remote users
                    return;
                }
                console.log('[DEBUG] User published:', user.uid, mediaType);
                try {
                    await client.subscribe(user, mediaType);
                    
                    if (mediaType === 'video') {
                        setRemoteUsers([user]); // Only show the teacher's video for students
                        if (videoRef.current && user.videoTrack) {
                            const existingVideos = videoRef.current.querySelectorAll('video');
                            existingVideos.forEach(video => video.remove());
                            user.videoTrack.play(videoRef.current);
                            const videoElement = videoRef.current.querySelector('video');
                            if (videoElement) {
                                videoElement.setAttribute('data-uid', user.uid.toString());
                                videoElement.style.width = '100%';
                                videoElement.style.height = '100%';
                                videoElement.style.objectFit = 'cover';
                            }
                        }
                    }
                    if (mediaType === 'audio' && user.audioTrack) {
                        console.log('[DEBUG] Playing remote audio for user:', user.uid);
                        user.audioTrack.play();
                    }
                } catch (err) {
                    console.error('[DEBUG] Error subscribing to user:', err);
                }
            });

            client.on('user-unpublished', (user) => {
                console.log('[DEBUG] User unpublished:', user.uid);
                setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
                
                // Stop and remove video track
                if (user.videoTrack) {
                    try {
                        user.videoTrack.stop();
                    } catch (err) {
                        console.warn('[DEBUG] Error stopping video track:', err);
                    }
                }
                
                // Stop audio track
                if (user.audioTrack) {
                    try {
                        user.audioTrack.stop();
                    } catch (err) {
                        console.warn('[DEBUG] Error stopping audio track:', err);
                    }
                }
                
                // Remove video element from DOM
                if (videoRef.current) {
                    const videoElements = videoRef.current.querySelectorAll('video');
                    videoElements.forEach(video => {
                        if (video.getAttribute('data-uid') === user.uid.toString()) {
                            video.remove();
                        }
                    });
                }
            });

            client.on('connection-state-change', (curState, prevState) => {
                console.log('[DEBUG] Connection state:', prevState, '->', curState);
                if (curState === 'CONNECTED') {
                    setIsConnecting(false);
                    setIsConnected(true);
                } else if (curState === 'DISCONNECTED') {
                    setIsConnected(false);
                    }
                });

            // Join channel with null UID to let Agora assign automatically
            console.log('[DEBUG] Joining channel:', channel);
            await client.join(appId, channel, token, null);
            console.log('[DEBUG] Successfully joined channel');
            
            // Only create and publish local tracks for host (teacher)
                if (role === 'host') {
                try {
                    console.log('[DEBUG] Creating local tracks for host...');
                    // Create Agora tracks directly (no need for getUserMedia first)
                    console.log('[DEBUG] Creating Agora tracks...');
                    localAudioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
                    localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack();
                    console.log('[DEBUG] Publishing local tracks...');
                    await client.publish([localAudioTrackRef.current, localVideoTrackRef.current]);
                    if (videoRef.current && localVideoTrackRef.current) {
                        console.log('[DEBUG] Playing local video track...');
                        localVideoTrackRef.current.play(videoRef.current);
                        console.log('[DEBUG] Video track should now be visible');
                }
            } catch (err) {
                    console.error('[DEBUG] Error creating local tracks:', err);
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
            console.error('[DEBUG] Agora join error:', err);
            isInitializedRef.current = false;
            
            if (err.code === 'UID_CONFLICT') {
                setError('Connection error: UID conflict. Please refresh the page.');
            } else if (err.code === 'OPERATION_ABORTED') {
                setError('Connection was aborted. Please try again.');
            } else if (err.message?.includes('WebSocket')) {
                setError('Network connection issue. Please check your internet connection.');
            } else {
                setError('Failed to connect to live stream: ' + (err.message || 'Unknown error'));
            }
            
            setIsConnecting(false);
            if (onError) onError(err);
        }
    }, [appId, channel, token, role, onError]);

    useEffect(() => {
        console.log('[DEBUG] AgoraVideoPlayer useEffect triggered');
        
        // Cleanup previous connection
        cleanup();
        
        // Initialize new connection
        if (appId && channel && token) {
            console.log('[DEBUG] Initializing Agora connection...');
        init();
        }

        // Cleanup on unmount
        return () => {
            cleanup();
        };
    }, [appId, channel, token, role, init, cleanup]);

    // Mute/unmute students (audience)
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
                    {role === 'host' && (
                        <button 
                            onClick={async () => {
                                try {
                                    console.log('[DEBUG] Testing camera access...');
                                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                                    console.log('[DEBUG] Camera test successful:', stream);
                                    alert('Camera access successful! Stream tracks: ' + stream.getTracks().length);
                                } catch (err) {
                                    console.error('[DEBUG] Camera test failed:', err);
                                    alert('Camera test failed: ' + err.message);
                                }
                            }}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                            اختبار الكاميرا
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
            <div 
                ref={videoRef} 
                className="w-full h-full"
                style={{ 
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%'
                }}
            >
                {role === 'audience' && remoteUsers.length === 0 && (
                    <div className="text-white text-center">
                        <p>في انتظار أن يبدأ الأستاذ البث...</p>
                    </div>
                )}
                {role === 'host' && localVideoTrackRef.current && (
                    <div className="text-white text-center">
                        <p>أنت الآن البث المباشر</p>
                    </div>
                )}
            </div>
            
            {/* Debug panel for development */}
            {process.env.NODE_ENV === 'development' && (
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded">
                    <div>Role: {role}</div>
                    <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
                    {role === 'audience' && <div>Remote Users: {remoteUsers.length}</div>}
                    <div>Local Audio: {localAudioTrackRef.current ? 'Yes' : 'No'}</div>
                    <div>Local Video: {localVideoTrackRef.current ? 'Yes' : 'No'}</div>
                </div>
            )}
        </div>
    );
};

export default AgoraVideoPlayer; 
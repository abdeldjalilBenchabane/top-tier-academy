import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';

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



export interface AgoraVideoPlayerRef {

    toggleLocalMic: () => void;

    toggleLocalCamera: () => void;

    startScreenShare: () => Promise<void>;

    stopScreenShare: (_evt?: any) => Promise<void>;

    isLocalMicMuted: boolean;

    isLocalCameraEnabled: boolean;

    isScreenSharing: boolean;

    cameraDevices: { deviceId: string, label: string }[];

    selectedDeviceId: string;

    setSelectedDeviceId: (deviceId: string) => Promise<void>;

}



const AgoraVideoPlayer = forwardRef<AgoraVideoPlayerRef, AgoraVideoPlayerProps & { onError?: (err: any) => void }>(({

    appId,

    channel,

    token,

    uid,

    role,

    studentsMuted,

    socket,

    onError

}, ref) => {

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

    const [isLocalCameraEnabled, setIsLocalCameraEnabled] = useState(true);

    // Local state for effective role (for dynamic promotion/demotion)

    const [effectiveRole, setEffectiveRole] = useState(role);



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

                if (!mountedRef.current) return;

                try {

                    await client.subscribe(user, mediaType);

                    console.log(`[DEBUG] ${role} subscribed to ${mediaType} from user ${user.uid}`);

                    

                    if (mediaType === 'video' && mountedRef.current) {

                        setRemoteUsers(prev => {

                            const existing = prev.find(u => u.uid === user.uid);

                            if (existing) {

                                return prev.map(u => u.uid === user.uid ? { ...u, videoTrack: user.videoTrack } : u);

                            } else {

                                return [...prev, user];

                            }

                        });

                        if (videoContainerRef.current && user.videoTrack) {

                            user.videoTrack.play(videoContainerRef.current);
                            
                            // For students: Always apply screen sharing styling for better display
                            if (role === 'audience') {
                                // Apply screen sharing styling for students to ensure proper display
                                const applyScreenSharingStyle = () => {
                                    const video = videoContainerRef.current?.querySelector('video');
                                    if (video) {
                                        // Apply screen sharing styling for students
                                        video.style.objectFit = 'contain';
                                        video.style.objectPosition = 'center';
                                        video.style.width = '100%';
                                        video.style.height = '100%';
                                        video.style.maxWidth = '100%';
                                        video.style.maxHeight = '100%';
                                        video.style.padding = '10px';
                                        video.style.boxSizing = 'border-box';
                                        
                                        // Center the screen content properly
                                        if (videoContainerRef.current) {
                                            videoContainerRef.current.style.display = 'flex';
                                            videoContainerRef.current.style.alignItems = 'center';
                                            videoContainerRef.current.style.justifyContent = 'center';
                                            videoContainerRef.current.style.overflow = 'hidden';
                                            videoContainerRef.current.style.backgroundColor = 'black';
                                        }
                                    }
                                };
                                
                                // Apply styling immediately and after a delay to ensure it's applied
                                applyScreenSharingStyle();
                                setTimeout(() => applyScreenSharingStyle(), 100);
                                setTimeout(() => applyScreenSharingStyle(), 500);
                            }

                        }

                    }

                    if (mediaType === 'audio' && user.audioTrack) {

                        // Update the user's audio track in the list

                        setRemoteUsers(prev => {

                            const existing = prev.find(u => u.uid === user.uid);

                            if (existing) {

                                return prev.map(u => u.uid === user.uid ? { ...u, audioTrack: user.audioTrack } : u);

                            } else {

                                return [...prev, user];

                            }

                        });

                        user.audioTrack.play();

                        console.log(`[DEBUG] ${role} playing audio from user ${user.uid}`);

                    }

                } catch (error) {

                    console.error(`[DEBUG] Error subscribing to ${mediaType} from user ${user.uid}:`, error);

                }

            });



            client.on('user-unpublished', (user) => {

                if (mountedRef.current) {

                    // Only remove the user if they have no video track (meaning they're completely gone)

                    // If they still have video track but audio is muted, keep them in the list

                    setRemoteUsers(prev => {

                        const existingUser = prev.find(u => u.uid === user.uid);

                        if (existingUser && existingUser.videoTrack) {

                            // User still has video, just update their audio track status

                            return prev.map(u => u.uid === user.uid ? { ...u, audioTrack: null } : u);

                        } else {

                            // User has no video track, remove them completely

                            return prev.filter(u => u.uid !== user.uid);

                        }

                    });

                }

                if (user.videoTrack) {

                    try { user.videoTrack.stop(); } catch { }

                }

                if (user.audioTrack) {

                    try { user.audioTrack.stop(); } catch { }

                }
                
                // For students: When video is unpublished, reset styling to camera mode
                if (role === 'audience' && videoContainerRef.current) {
                    setTimeout(() => {
                        const video = videoContainerRef.current?.querySelector('video');
                        if (video) {
                            // Reset to camera styling
                            video.style.objectFit = 'cover';
                            video.style.objectPosition = 'center';
                            video.style.padding = '0';
                            video.style.boxSizing = 'border-box';
                            
                            // Reset container styling
                            if (videoContainerRef.current) {
                                videoContainerRef.current.style.display = 'block';
                                videoContainerRef.current.style.alignItems = 'stretch';
                                videoContainerRef.current.style.justifyContent = 'flex-start';
                                videoContainerRef.current.style.overflow = 'visible';
                            }
                        }
                    }, 100);
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

                // Pour les étudiants, créer une piste audio locale pour le contrôle du micro

                try {

                    localAudioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();

                    // Initialize audio track but don't publish yet

                    console.log('[DEBUG] Created local audio track for student (ready to publish when unmuted)');

                } catch (err: any) {

                    console.warn('[DEBUG] Could not create audio track for student:', err);

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

    // Helper to ensure video fills container correctly
    const ensureVideoFullSize = useCallback((type = 'camera') => {
        if (videoContainerRef.current) {
            const video = videoContainerRef.current.querySelector('video');
            if (video) {
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.background = 'black';
                video.style.userSelect = 'none';
                (video.style as any).webkitUserSelect = 'none';
                (video.style as any).webkitTouchCallout = 'none';
                video.style.transform = 'none';
                video.style.transition = 'none';

                if (type === 'screen') {
                    // For screen sharing, use 'contain' to show the FULL screen content
                    // This ensures students see everything without cuts
                    video.style.objectFit = 'contain';
                    video.style.objectPosition = 'center';
                    
                    // Center the screen content properly
                    if (videoContainerRef.current) {
                        videoContainerRef.current.style.display = 'flex';
                        videoContainerRef.current.style.alignItems = 'center';
                        videoContainerRef.current.style.justifyContent = 'center';
                        videoContainerRef.current.style.overflow = 'hidden';
                        videoContainerRef.current.style.backgroundColor = 'black';
                    }
                    
                    // Ensure video maintains aspect ratio and shows full content
                    video.style.width = '100%';
                    video.style.height = '100%';
                    video.style.maxWidth = '100%';
                    video.style.maxHeight = '100%';
                    
                    // Add padding to ensure no content is cut off
                    video.style.padding = '10px';
                    video.style.boxSizing = 'border-box';
                    
                } else {
                    // For camera video, use 'cover' to fill the container
                    video.style.objectFit = 'cover';
                    video.style.objectPosition = 'center';
                }
            }
        }
    }, []);

    async function stopScreenShare(_evt?: any): Promise<void> {
        if (!clientRef.current) return;
        
        console.log('[DEBUG] Stopping screen share, audio track state:', {
            exists: !!localAudioTrackRef.current,
            enabled: localAudioTrackRef.current?.enabled,
            muted: isLocalMicMuted
        });
        
        // Check if audio track is currently published before stopping screen share
        const localTracksBefore = clientRef.current.localTracks;
        const isAudioPublishedBefore = localTracksBefore.some(track => track === localAudioTrackRef.current);
        console.log('[DEBUG] Before stopping screen share - Audio track published?', isAudioPublishedBefore);
        
        if (screenTrackRef.current) {
            await clientRef.current.unpublish([screenTrackRef.current]);
            screenTrackRef.current.stop();
            screenTrackRef.current = null;
        }
        
        // Check again after unpublishing screen track
        const localTracksAfter = clientRef.current.localTracks;
        const isAudioStillPublished = localTracksAfter.some(track => track === localAudioTrackRef.current);
        console.log('[DEBUG] After unpublishing screen - Audio track still published?', isAudioStillPublished);
        
        // CRITICAL: Always republish audio track together with camera video
        // This ensures remote users get notified and can subscribe to the audio track
        const tracksToPublish = [];
        if (localVideoTrackRef.current) {
            tracksToPublish.push(localVideoTrackRef.current);
        }
        if (localAudioTrackRef.current) {
            // Unpublish audio first if it's already published, then republish to trigger user-published event
            if (isAudioStillPublished) {
                console.log('[DEBUG] Unpublishing audio track to trigger republish event for remote users...');
                await clientRef.current.unpublish([localAudioTrackRef.current]);
                // Small delay to ensure unpublish completes
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            tracksToPublish.push(localAudioTrackRef.current);
            console.log('[DEBUG] Publishing camera video and audio track together');
        }
        
        if (tracksToPublish.length > 0) {
            await clientRef.current.publish(tracksToPublish);
            if (videoContainerRef.current) {
                localVideoTrackRef.current.play(videoContainerRef.current);
                // Apply camera-specific styling
                ensureVideoFullSize('camera');
            }
        }
        
        // CRITICAL: Ensure audio track is still enabled and working after screen share stops
        if (localAudioTrackRef.current) {
            console.log('[DEBUG] Ensuring audio track is enabled after screen share stop');
            // Make sure audio track is enabled and volume is set correctly
            if (isLocalMicMuted) {
                localAudioTrackRef.current.setVolume(0);
                localAudioTrackRef.current.setEnabled(false);
                console.log('[DEBUG] Audio track muted (user preference)');
            } else {
                localAudioTrackRef.current.setVolume(100);
                localAudioTrackRef.current.setEnabled(true);
                console.log('[DEBUG] Audio track enabled with volume 100');
            }
            // Force a small delay to ensure the state is applied
            setTimeout(() => {
                if (localAudioTrackRef.current && !isLocalMicMuted) {
                    localAudioTrackRef.current.setEnabled(true);
                    localAudioTrackRef.current.setVolume(100);
                    console.log('[DEBUG] Audio track state verified after delay');
                }
            }, 200);
        } else {
            console.warn('[DEBUG] WARNING: localAudioTrackRef is null during screen share stop!');
        }
        
        setIsScreenSharing(false);
    }



    const startScreenShare = useCallback(async () => {
        if (!clientRef.current) return;
        try {
            const screenTrack = await AgoraRTC.createScreenVideoTrack();
            
            // IMPORTANT: Check if audio track is currently published
            const localTracks = clientRef.current.localTracks;
            const isAudioPublished = localTracks.some(track => track === localAudioTrackRef.current);
            
            console.log('[DEBUG] Before screen share - Audio track published?', isAudioPublished);
            
            // Unpublish camera video only (audio track should remain published)
            if (localVideoTrackRef.current) {
                await clientRef.current.unpublish([localVideoTrackRef.current]);
                localVideoTrackRef.current.stop();
            }
            
            // Check again after unpublishing video
            const localTracksAfter = clientRef.current.localTracks;
            const isAudioStillPublished = localTracksAfter.some(track => track === localAudioTrackRef.current);
            console.log('[DEBUG] After unpublishing video - Audio track still published?', isAudioStillPublished);
            
            // CRITICAL: Always republish audio track together with screen track
            // This ensures remote users get notified and can subscribe to the audio track
            const tracksToPublish = [screenTrack];
            if (localAudioTrackRef.current) {
                // Unpublish audio first if it's already published, then republish to trigger user-published event
                if (isAudioStillPublished) {
                    console.log('[DEBUG] Unpublishing audio track to trigger republish event for remote users...');
                    await clientRef.current.unpublish([localAudioTrackRef.current]);
                    // Small delay to ensure unpublish completes
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                tracksToPublish.push(localAudioTrackRef.current);
                console.log('[DEBUG] Publishing screen track and audio track together');
            }
            
            // Publish both tracks together
            await clientRef.current.publish(tracksToPublish);
            screenTrackRef.current = screenTrack;
            setIsScreenSharing(true);
            
            // CRITICAL: Ensure audio track is still enabled and working after screen share starts
            if (localAudioTrackRef.current) {
                console.log('[DEBUG] Ensuring audio track is enabled after screen share start');
                // Make sure audio track is enabled and volume is set correctly
                if (isLocalMicMuted) {
                    localAudioTrackRef.current.setVolume(0);
                    localAudioTrackRef.current.setEnabled(false);
                    console.log('[DEBUG] Audio track muted (user preference)');
                } else {
                    localAudioTrackRef.current.setVolume(100);
                    localAudioTrackRef.current.setEnabled(true);
                    console.log('[DEBUG] Audio track enabled with volume 100');
                }
                // Force a small delay to ensure the state is applied
                setTimeout(() => {
                    if (localAudioTrackRef.current && !isLocalMicMuted) {
                        localAudioTrackRef.current.setEnabled(true);
                        localAudioTrackRef.current.setVolume(100);
                        console.log('[DEBUG] Audio track state verified after delay');
                    }
                }, 200);
            } else {
                console.warn('[DEBUG] WARNING: localAudioTrackRef is null during screen share start!');
            }
            
            // Play in local container
            if (videoContainerRef.current) {
                screenTrack.play(videoContainerRef.current);
                // Apply screen-specific styling with a small delay to ensure video is loaded
                setTimeout(() => {
                    if (ensureVideoFullSize) {
                        ensureVideoFullSize('screen');
                    }
                }, 100);
            }
            
            // Listen for end
            (screenTrack as any).on('track-ended', async (_evt: any) => { 
                await stopScreenShare(_evt); 
            });
        } catch (err) {
            console.error('[DEBUG] Screen share error:', err);
            setError('Erreur lors du partage d\'écran: ' + (err.message || 'inconnue'));
        }
    }, [clientRef, videoContainerRef, setIsScreenSharing, stopScreenShare, ensureVideoFullSize, isLocalMicMuted]);



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



    const changeCameraDevice = useCallback(async (deviceId: string) => {

        setSelectedDeviceId(deviceId);

        await createAndPublishVideoTrack(deviceId);

    }, [createAndPublishVideoTrack]);



    // Fonction pour contrôler le micro local du professeur

    const toggleLocalMic = useCallback(() => {

        if (localAudioTrackRef.current) {

            const newMuteState = !isLocalMicMuted;

            // Try using setVolume instead of setEnabled to prevent video stream interruption
            if (newMuteState) {
                // Muting: set volume to 0 instead of disabling the track
                try {
                    localAudioTrackRef.current.setVolume(0);
                    console.log(`[DEBUG] Professor mic muted (volume set to 0)`);
                } catch (error) {
                    // Fallback to setEnabled if setVolume fails
                    localAudioTrackRef.current.setEnabled(false);
                    console.log(`[DEBUG] Professor mic muted (fallback to setEnabled false)`);
                }
            } else {
                // Unmuting: restore volume and ensure track is enabled
                try {
                    localAudioTrackRef.current.setVolume(100);
                    localAudioTrackRef.current.setEnabled(true);
                    console.log(`[DEBUG] Professor mic unmuted (volume restored to 100)`);
                } catch (error) {
                    // Fallback to setEnabled if setVolume fails
                    localAudioTrackRef.current.setEnabled(true);
                    console.log(`[DEBUG] Professor mic unmuted (fallback to setEnabled true)`);
                }
            }

            setIsLocalMicMuted(newMuteState);

            // Debug: Check if video is still visible

            if (videoContainerRef.current) {

                const video = videoContainerRef.current.querySelector('video');

                if (video) {

                    console.log(`[DEBUG] Video element after mic toggle:`, {

                        visible: video.style.display !== 'none',

                        width: video.style.width,

                        height: video.style.height,

                        background: video.style.background

                    });

                }

            }

        }

    }, [isLocalMicMuted, localAudioTrackRef]);



    // Fonction pour contrôler la caméra locale du professeur

    const toggleLocalCamera = useCallback(() => {

        if (localVideoTrackRef.current) {

            const newCameraState = !isLocalCameraEnabled;

            localVideoTrackRef.current.setEnabled(newCameraState);

            setIsLocalCameraEnabled(newCameraState);

            console.log(`[DEBUG] Professor camera ${newCameraState ? 'enabled' : 'disabled'}`);

        }

    }, [isLocalCameraEnabled, localVideoTrackRef]);

    // Patch play() calls to ensure video is always full size
    useEffect(() => {
        // Apply appropriate styling based on current state
        if (isScreenSharing) {
            ensureVideoFullSize('screen');
        } else {
            ensureVideoFullSize('camera');
        }
    }, [ensureVideoFullSize, isScreenSharing]);

    // Handle fullscreen changes for better screen sharing display
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (document.fullscreenElement) {
                // When entering fullscreen, ensure proper screen sharing display
                if (isScreenSharing) {
                    const video = videoContainerRef.current?.querySelector('video');
                    if (video) {
                        // In fullscreen, use 'contain' to show the complete screen content
                        video.style.objectFit = 'contain';
                        video.style.objectPosition = 'center';
                        video.style.width = '100%';
                        video.style.height = '100%';
                        video.style.maxWidth = '100%';
                        video.style.maxHeight = '100%';
                        
                        // Add padding to ensure no content is cut off in fullscreen
                        video.style.padding = '20px';
                        video.style.boxSizing = 'border-box';
                        
                        // Ensure the container is properly centered
                        if (videoContainerRef.current) {
                            videoContainerRef.current.style.display = 'flex';
                            videoContainerRef.current.style.alignItems = 'center';
                            videoContainerRef.current.style.justifyContent = 'center';
                            videoContainerRef.current.style.backgroundColor = 'black';
                            videoContainerRef.current.style.overflow = 'hidden';
                        }
                    }
                }
            } else {
                // When exiting fullscreen, restore normal styling
                if (isScreenSharing) {
                    ensureVideoFullSize('screen');
                } else if (role === 'audience') {
                    // For students: When exiting fullscreen, reapply screen sharing styling
                    const applyNormalScreenSharingStyle = () => {
                        const video = videoContainerRef.current?.querySelector('video');
                        if (video) {
                            // Apply screen sharing styling for students in normal mode
                            video.style.objectFit = 'contain';
                            video.style.objectPosition = 'center';
                            video.style.width = '100%';
                            video.style.height = '100%';
                            video.style.maxWidth = '100%';
                            video.style.maxHeight = '100%';
                            video.style.padding = '10px';
                            video.style.boxSizing = 'border-box';
                            
                            // Center the screen content properly
                            if (videoContainerRef.current) {
                                videoContainerRef.current.style.display = 'flex';
                                videoContainerRef.current.style.alignItems = 'center';
                                videoContainerRef.current.style.justifyContent = 'center';
                                videoContainerRef.current.style.overflow = 'hidden';
                                videoContainerRef.current.style.backgroundColor = 'black';
                            }
                        }
                    };
                    
                    // Apply styling immediately and after a delay to ensure it's applied
                    applyNormalScreenSharingStyle();
                    setTimeout(() => applyNormalScreenSharingStyle(), 100);
                    setTimeout(() => applyNormalScreenSharingStyle(), 300);
                } else {
                    ensureVideoFullSize('camera');
                }
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, [isScreenSharing, ensureVideoFullSize]);



    useEffect(() => {

        mountedRef.current = true;

        const initializeConnection = async () => {

            await cleanup();

            isInitializedRef.current = false;

            if (!mountedRef.current) return;

            await init();

            setEffectiveRole(role); // Reset effective role on re-init

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

                            console.log('[DEBUG] Student: setting role to host and publishing audio');

                            // Switch to host role first

                            await clientRef.current.setClientRole('host');

                            setEffectiveRole('host');

                            // Small delay to ensure role change is processed

                            await new Promise(resolve => setTimeout(resolve, 100));

                            // Enable mic and publish

                            localAudioTrackRef.current.setEnabled(true);

                            await clientRef.current.publish([localAudioTrackRef.current]);

                            console.log('[DEBUG] Student: audio published, mic enabled');

                        } else {

                            console.warn('[DEBUG] Student: clientRef or localAudioTrackRef missing');

                        }

                    } else {

                        // Mute: unpublish et repasser en audience

                        if (clientRef.current && localAudioTrackRef.current) {

                            console.log('[DEBUG] Student: unpublishing audio and setting role to audience');

                            // Unpublish first

                            await clientRef.current.unpublish([localAudioTrackRef.current]);

                            localAudioTrackRef.current.setEnabled(false);

                            // Switch back to audience role

                            await clientRef.current.setClientRole('audience');

                            setEffectiveRole('audience');

                            console.log('[DEBUG] Student: audio unpublished, mic disabled');

                        } else {

                            console.warn('[DEBUG] Student: clientRef or localAudioTrackRef missing');

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



    useImperativeHandle(ref, () => ({

        toggleLocalMic,

        toggleLocalCamera,

        startScreenShare,

        stopScreenShare,

        isLocalMicMuted,

        isLocalCameraEnabled,

        isScreenSharing,

        cameraDevices,

        selectedDeviceId,

        setSelectedDeviceId: changeCameraDevice

    }));



    if (isConnecting) {

        return (

            <div className="flex items-center justify-center h-full min-h-[400px] bg-black rounded-lg">

                <div className="text-center">

                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>

                    <p className="text-white">{effectiveRole === 'host' ? 'جاري الاتصال...' : 'في انتظار البث المباشر...'}</p>

                </div>

            </div>

        );

    }



    if (error) {

        return (

            <div className="flex items-center justify-center h-full min-h-[400px] bg-black rounded-lg">

                <div className="text-center">

                    <div className="text-red-400 mb-4">{error}</div>

                    {effectiveRole === 'host' && (

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

                    <p className="text-white">{effectiveRole === 'host' ? 'في انتظار الاتصال...' : 'في انتظار البث المباشر...'}</p>

                </div>

            </div>

        );

    }



    return (

        <div className="relative w-full h-full min-h-[400px] bg-black rounded-lg overflow-hidden">

            <div ref={videoRef} className="w-full h-full" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>

                <div

                  ref={videoContainerRef}

                  className="w-full h-full"

                  style={{

                    position: 'relative',

                    width: '100%',

                    height: '100%',

                    userSelect: 'none',

                    WebkitUserSelect: 'none',

                    WebkitTouchCallout: 'none',

                    // Mirror the host's own video (like Zoom/Google Meet) but not screen sharing

                    ...(role === 'host' && !isScreenSharing ? { transform: 'scaleX(-1)' } : {})

                  }}

                />

                {role === 'audience' && remoteUsers.length === 0 && (

                    <div className="absolute inset-0 flex items-center justify-center">

                        <div className="text-white text-center">

                            <p>في انتظار أن يبدأ الأستاذ البث...</p>

                        </div>

                    </div>

                )}

                {role === 'audience' && !isLocalMicMuted && (

                    <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs z-50" style={{ zIndex: 10003, position: 'fixed' }}>الميكروفون نشط</div>

                )}

            </div>

        </div>

    );

});



export default AgoraVideoPlayer;
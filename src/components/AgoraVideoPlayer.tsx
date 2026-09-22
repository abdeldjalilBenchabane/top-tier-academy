import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';

import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, ILocalVideoTrack, ILocalAudioTrack, CameraVideoTrackInitConfig } from 'agora-rtc-sdk-ng';

import { Button } from '@/components/ui/button';

import { Mic, MicOff, Maximize2, VideoOff } from 'lucide-react';



// A teacher's screen share goes out on a second Agora connection whose uid is
// this base + the teacher's own uid. That keeps the camera published at the
// same time, and lets every viewer (web and mobile) tell the two apart from
// the uid alone, including students who join late.
const SCREEN_UID_BASE = 900000000;
const isScreenUid = (u: any) => Number(u) >= SCREEN_UID_BASE;

interface AgoraVideoPlayerProps {

    // Some teachers present without showing themselves. Starting the stream
    // does not have to mean starting the camera; they can still turn it on
    // later from the camera button.
    startWithCamera?: boolean;

    // The page draws the camera button, but only the player knows whether a
    // camera is actually running. It used to keep its own guess, starting at
    // "on" and flipping on every press, so a teacher who began without a
    // camera saw the button lit and each press made it more wrong.
    onCameraStateChange?: (enabled: boolean) => void;

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

    // Default true so every existing caller behaves exactly as before.
    startWithCamera = true,

    onCameraStateChange,

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
    const screenClientRef = useRef<IAgoraRTCClient | null>(null);
    // Sound of the shared tab/screen (a video playing in it, etc.), when the
    // teacher ticks "share audio" in the browser's picker.
    const screenAudioRef = useRef<ILocalAudioTrack | null>(null);
    // Small corner box for the teacher's camera while a screen is shared.
    const pipContainerRef = useRef<HTMLDivElement>(null);
    const remoteCameraRef = useRef<any>(null);
    const remoteScreenRef = useRef<any>(null);
    const [showPip, setShowPip] = useState(false);
    // The camera box can be dragged; on release it snaps to the nearest corner.
    // Which of the two videos fills the main area during a screen share.
    const [screenBig, setScreenBig] = useState(true);
    const [pipCorner, setPipCorner] = useState<'tl' | 'tr' | 'bl' | 'br'>('br');
    const [pipDrag, setPipDrag] = useState<{ x: number; y: number } | null>(null);
    const pipGrabRef = useRef<{ dx: number; dy: number } | null>(null);
    const pipPosRef = useRef<{ x: number; y: number } | null>(null);

    const onPipPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const wrap = videoRef.current;
        const el = pipContainerRef.current;
        if (!wrap || !el) return;
        const w = wrap.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        pipGrabRef.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
        pipPosRef.current = { x: r.left - w.left, y: r.top - w.top };
        setPipDrag(pipPosRef.current);
        try { el.setPointerCapture(e.pointerId); } catch { }
        e.preventDefault();
    };

    const onPipPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const grab = pipGrabRef.current;
        const wrap = videoRef.current;
        const el = pipContainerRef.current;
        if (!grab || !wrap || !el) return;
        const w = wrap.getBoundingClientRect();
        const x = Math.min(Math.max(e.clientX - w.left - grab.dx, 0), w.width - el.offsetWidth);
        const y = Math.min(Math.max(e.clientY - w.top - grab.dy, 0), w.height - el.offsetHeight);
        pipPosRef.current = { x, y };
        setPipDrag({ x, y });
    };

    const onPipPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        const wrap = videoRef.current;
        const el = pipContainerRef.current;
        const pos = pipPosRef.current;
        pipGrabRef.current = null;
        pipPosRef.current = null;
        if (wrap && el && pos) {
            const w = wrap.getBoundingClientRect();
            const vertical = pos.y + el.offsetHeight / 2 < w.height / 2 ? 't' : 'b';
            const horizontal = pos.x + el.offsetWidth / 2 < w.width / 2 ? 'l' : 'r';
            setPipCorner(`${vertical}${horizontal}` as 'tl' | 'tr' | 'bl' | 'br');
            try { el.releasePointerCapture(e.pointerId); } catch { }
        }
        setPipDrag(null);
    };

    const [cameraDevices, setCameraDevices] = useState<{ deviceId: string, label: string }[]>([]);

    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

    const [isLocalMicMuted, setIsLocalMicMuted] = useState(false);

    // Starts from the teacher's answer, so the very first frame is right.
    const [isLocalCameraEnabled, setIsLocalCameraEnabled] = useState(startWithCamera);

    useEffect(() => {
        onCameraStateChange?.(isLocalCameraEnabled);
    }, [isLocalCameraEnabled, onCameraStateChange]);

    // What a student can see of the teacher. Kept as state, not read off the
    // refs, because the placeholder has to re-render when these change.
    //
    // remoteAudioSeen stands in for "the teacher is here": the Agora uid is a
    // per-join random number, so the teacher cannot be picked out by id, but
    // students join muted and only speak once the teacher lets them — so the
    // first audio in the room is the teacher's. Without it a student who
    // arrives early would be told "voice only" before anyone had spoken.
    const [remoteCameraOn, setRemoteCameraOn] = useState(false);
    const [remoteScreenOn, setRemoteScreenOn] = useState(false);
    const [remoteAudioSeen, setRemoteAudioSeen] = useState(false);

    // Local state for effective role (for dynamic promotion/demotion)

    const [effectiveRole, setEffectiveRole] = useState(role);



    const cleanup = useCallback(async () => {

        if (cleanupInProgressRef.current) {

            return;

        }

        cleanupInProgressRef.current = true;

        try {
            if (screenTrackRef.current) {
                try { screenTrackRef.current.close(); } catch { }
                screenTrackRef.current = null;
            }
            if (screenAudioRef.current) {
                try { screenAudioRef.current.close(); } catch { }
                screenAudioRef.current = null;
            }
            if (screenClientRef.current) {
                try { await screenClientRef.current.leave(); } catch { }
                screenClientRef.current = null;
            }
            remoteCameraRef.current = null;
            remoteScreenRef.current = null;


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
                // Our own screen-share connection: already shown locally.
                if (Number(user.uid) === SCREEN_UID_BASE + (Number(uid) || 0)) return;

                try {

                    await client.subscribe(user, mediaType);
                    console.log(`[DEBUG] ${role} subscribed to ${mediaType} from user ${user.uid}`);
                    if (mountedRef.current) {
                        if (mediaType === 'audio') setRemoteAudioSeen(true);
                        if (mediaType === 'video') {
                            if (isScreenUid(user.uid)) setRemoteScreenOn(true);
                            else { setRemoteCameraOn(true); setRemoteAudioSeen(true); }
                        }
                    }

                    

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

                            if (isScreenUid(user.uid)) {
                                // Screen share takes the main area; the camera
                                // moves to the corner box.
                                remoteScreenRef.current = user;
                                const cam = remoteCameraRef.current;
                                if (cam?.videoTrack && pipContainerRef.current) {
                                    cam.videoTrack.stop();
                                    cam.videoTrack.play(pipContainerRef.current);
                                    setShowPip(true);
                                }
                            } else {
                                remoteCameraRef.current = user;
                                if (remoteScreenRef.current && pipContainerRef.current) {
                                    user.videoTrack.play(pipContainerRef.current);
                                    setShowPip(true);
                                    return;
                                }
                            }
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



            client.on('user-unpublished', (user, mediaType) => {

                if (Number(user.uid) === SCREEN_UID_BASE + (Number(uid) || 0)) return;
                if (mediaType === 'video') {
                    if (isScreenUid(user.uid)) setRemoteScreenOn(false);
                    else if (remoteCameraRef.current?.uid === user.uid) setRemoteCameraOn(false);
                    if (isScreenUid(user.uid)) {
                        remoteScreenRef.current = null;
                        setShowPip(false);
                        setScreenBig(true);
                        const cam = remoteCameraRef.current;
                        if (cam?.videoTrack && videoContainerRef.current) {
                            cam.videoTrack.stop();
                            cam.videoTrack.play(videoContainerRef.current);
                        }
                        if (user.videoTrack) {
                            try { user.videoTrack.stop(); } catch { }
                        }
                        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
                        return;
                    }
                    if (remoteCameraRef.current?.uid === user.uid) {
                        remoteCameraRef.current = null;
                        setShowPip(false);
                    }
                }

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



            // If the teacher's browser drops mid-share, the screen connection
            // just leaves without unpublishing; put the camera back full size.
            client.on('user-left', (user) => {
                if (!mountedRef.current) return;
                if (!isScreenUid(user.uid)) {
                    // The teacher's main connection went away: their camera
                    // went with it.
                    if (remoteCameraRef.current?.uid === user.uid) {
                        remoteCameraRef.current = null;
                        setRemoteCameraOn(false);
                    }
                    return;
                }
                setRemoteScreenOn(false);
                if (remoteScreenRef.current?.uid !== user.uid) return;
                remoteScreenRef.current = null;
                setShowPip(false);
                setScreenBig(true);
                const cam = remoteCameraRef.current;
                if (cam?.videoTrack && videoContainerRef.current) {
                    cam.videoTrack.stop();
                    cam.videoTrack.play(videoContainerRef.current);
                }
                setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
            });

            // A camera can be muted instead of unpublished (the mobile SDKs do
            // this); either way the student is no longer seeing a face.
            client.on('user-info-updated', (infoUid, msg) => {
                if (!mountedRef.current || isScreenUid(infoUid)) return;
                if (msg === 'mute-video') setRemoteCameraOn(false);
                if (msg === 'unmute-video') setRemoteCameraOn(true);
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

                    if (startWithCamera) {

                        let cameraIdToUse = selectedDeviceId;

                        if (!cameraIdToUse && cameraDevices.length > 0) cameraIdToUse = cameraDevices[0].deviceId;

                        localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack({ cameraId: cameraIdToUse, encoderConfig: '720p_1' } as CameraVideoTrackInitConfig);

                        await client.publish([localAudioTrackRef.current, localVideoTrackRef.current]);

                        if (videoContainerRef.current && localVideoTrackRef.current && mountedRef.current) {

                            localVideoTrackRef.current.play(videoContainerRef.current);

                        }

                    } else {

                        // Voice only. The camera button creates the track on
                        // demand, so this is a starting choice, not a cage.
                        await client.publish([localAudioTrackRef.current]);

                        setIsLocalCameraEnabled(false);

                    }

                } catch (err: any) {

                    // Whatever failed, no camera is running: say so, rather than leaving
                    // the button lit over a black screen.
                    setIsLocalCameraEnabled(false);

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

    // Moves the two tracks between the main area and the corner box.
    const applyLayout = useCallback((screenInMain: boolean) => {
        const main = videoContainerRef.current;
        const pip = pipContainerRef.current;
        if (!main || !pip) return;
        const isHost = role === 'host';
        const screenTrack: any = isHost ? screenTrackRef.current : remoteScreenRef.current?.videoTrack;
        const cameraTrack: any = isHost ? localVideoTrackRef.current : remoteCameraRef.current?.videoTrack;
        if (!screenTrack || !cameraTrack) return;
        try { screenTrack.stop(); } catch { }
        try { cameraTrack.stop(); } catch { }
        if (screenInMain) {
            screenTrack.play(main);
            cameraTrack.play(pip);
        } else {
            cameraTrack.play(main);
            screenTrack.play(pip);
        }
        setTimeout(() => ensureVideoFullSize(screenInMain ? 'screen' : 'camera'), 100);
    }, [role, ensureVideoFullSize]);

    const swapViews = useCallback(() => {
        setScreenBig((current) => {
            const next = !current;
            applyLayout(next);
            return next;
        });
    }, [applyLayout]);

    async function stopScreenShare(_evt?: any): Promise<void> {
        const screenClient = screenClientRef.current;
        const screenTrack = screenTrackRef.current;
        const screenAudio = screenAudioRef.current;
        screenClientRef.current = null;
        screenTrackRef.current = null;
        screenAudioRef.current = null;
        if (screenClient) {
            try { await screenClient.unpublish(); } catch { }
        }
        if (screenTrack) {
            try { screenTrack.stop(); screenTrack.close(); } catch { }
        }
        if (screenAudio) {
            try { screenAudio.close(); } catch { }
        }
        if (screenClient) {
            try { await screenClient.leave(); } catch { }
        }
        // The camera never stopped publishing; just move it back to full size.
        setShowPip(false);
        setScreenBig(true);
        if (localVideoTrackRef.current && videoContainerRef.current) {
            localVideoTrackRef.current.stop();
            localVideoTrackRef.current.play(videoContainerRef.current);
            ensureVideoFullSize('camera');
        }
        setIsScreenSharing(false);
    }



    const startScreenShare = useCallback(async () => {
        if (!clientRef.current || screenClientRef.current) return;
        let screenTrack: ILocalVideoTrack | null = null;
        let screenAudio: ILocalAudioTrack | null = null;
        let screenClient: IAgoraRTCClient | null = null;
        try {
            // 'auto': also capture the tab/system sound if the browser offers
            // it and the teacher ticks "share audio"; otherwise video only.
            const created = await AgoraRTC.createScreenVideoTrack({}, 'auto');
            if (Array.isArray(created)) {
                [screenTrack, screenAudio] = created;
            } else {
                screenTrack = created;
            }

            // Separate connection for the screen, so the camera (and mic) on
            // the main connection keep publishing untouched.
            const screenUid = SCREEN_UID_BASE + (Number(uid) || 0);
            const res = await fetch(`/api/rtcToken?channel=${encodeURIComponent(channel)}&uid=${screenUid}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('screen token request failed: ' + res.status);
            const { token: screenToken } = await res.json();

            screenClient = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
            await screenClient.setClientRole('host');
            await screenClient.join(appId, channel, screenToken, screenUid);
            await screenClient.publish(screenAudio ? [screenTrack, screenAudio] : [screenTrack]);

            screenClientRef.current = screenClient;
            screenTrackRef.current = screenTrack;
            screenAudioRef.current = screenAudio;
            setIsScreenSharing(true);

            // Local view matches what students see: screen big, camera small.
            if (localVideoTrackRef.current && pipContainerRef.current) {
                localVideoTrackRef.current.stop();
                localVideoTrackRef.current.play(pipContainerRef.current);
                setShowPip(true);
            }
            if (videoContainerRef.current) {
                screenTrack.play(videoContainerRef.current);
                setTimeout(() => ensureVideoFullSize('screen'), 100);
            }

            (screenTrack as any).on('track-ended', async (_evt: any) => {
                await stopScreenShare(_evt);
            });
        } catch (err: any) {
            console.error('[DEBUG] Screen share error:', err);
            try { screenTrack?.close(); } catch { }
            try { screenAudio?.close(); } catch { }
            try { await screenClient?.leave(); } catch { }
            screenClientRef.current = null;
            screenTrackRef.current = null;
            // Closing the browser's share picker is not an error.
            const cancelled = err?.name === 'NotAllowedError' || err?.code === 'PERMISSION_DENIED';
            if (!cancelled) {
                setError('Erreur lors du partage d\'écran: ' + (err?.message || 'inconnue'));
            }
        }
    }, [clientRef, videoContainerRef, setIsScreenSharing, stopScreenShare, ensureVideoFullSize, appId, channel, uid]);



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

        const videoTrack = await AgoraRTC.createCameraVideoTrack({ cameraId, encoderConfig: '720p_1' } as CameraVideoTrackInitConfig);

        await clientRef.current.publish([videoTrack]);

        localVideoTrackRef.current = videoTrack;

        // Afficher dans le container

        const target = screenTrackRef.current ? pipContainerRef.current : videoContainerRef.current;

        if (target && videoTrack) {

            videoTrack.play(target);

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

    const toggleLocalCamera = useCallback(async () => {

        // A teacher who started without a camera has no track to enable, so
        // the first press has to make one and publish it. Without this the
        // camera button would be dead for the rest of the lesson.
        if (!localVideoTrackRef.current) {
            try {
                let cameraIdToUse = selectedDeviceId;
                if (!cameraIdToUse && cameraDevices.length > 0) cameraIdToUse = cameraDevices[0].deviceId;
                const track = await AgoraRTC.createCameraVideoTrack(
                    { cameraId: cameraIdToUse, encoderConfig: '720p_1' } as CameraVideoTrackInitConfig);
                localVideoTrackRef.current = track;
                if (clientRef.current) await clientRef.current.publish([track]);
                if (mountedRef.current) {
                    // While a screen is being shared it owns the big view,
                    // so a camera turned on now belongs in the small one.
                    if (screenTrackRef.current && screenBig && pipContainerRef.current) {
                        track.play(pipContainerRef.current);
                        setShowPip(true);
                    } else if (videoContainerRef.current) {
                        track.play(videoContainerRef.current);
                    }
                }
                setIsLocalCameraEnabled(true);
                console.log('[DEBUG] Professor camera started mid-stream');
            } catch (err: any) {
                console.error('[DEBUG] Could not start the camera:', err);
                setError(
                    err?.name === 'NotAllowedError'
                        ? 'تم رفض الإذن بالكاميرا. اسمح بالوصول ثم حاول مرة أخرى.'
                        : 'تعذر تشغيل الكاميرا.');
            }
            return;
        }

        const newCameraState = !isLocalCameraEnabled;

        localVideoTrackRef.current.setEnabled(newCameraState);

        setIsLocalCameraEnabled(newCameraState);

        console.log(`[DEBUG] Professor camera ${newCameraState ? 'enabled' : 'disabled'}`);

    }, [isLocalCameraEnabled, localVideoTrackRef, selectedDeviceId, cameraDevices, screenBig]);

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

                    // Mirror the host's own camera (like Zoom/Google Meet), wherever it is shown

                    ...(role === 'host' && (!isScreenSharing || !screenBig) ? { transform: 'scaleX(-1)' } : {})

                  }}

                />

                {/* Where the teacher's camera would be, but isn't. A black
                    rectangle reads as "broken"; this reads as "off". Shown
                    only when the big view is meant to hold the camera — while a
                    screen is shared big, the screen is there instead. */}
                {/* The student's side of the same thing: the teacher is here
                    and speaking, but has neither a camera nor a shared screen.
                    Once a screen is shared it fills this area instead. */}
                {role === 'audience' && remoteAudioSeen && !remoteCameraOn && !remoteScreenOn && (
                    <div
                        style={{ position: 'absolute', inset: 0, zIndex: 5 }}
                        className="flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#141b33] to-[#0b1020] text-center"
                    >
                        <div className="relative grid h-20 w-20 place-items-center rounded-full bg-purple-600/20">
                            <span className="absolute inset-0 animate-ping rounded-full bg-purple-500/20" />
                            <Mic className="relative h-9 w-9 text-purple-200" />
                        </div>
                        <div dir="rtl">
                            <p className="text-lg font-semibold text-white">الأستاذ يشرح بالصوت فقط</p>
                            <p className="mt-1 text-sm text-white/60">الكاميرا مغلقة — ستظهر الشاشة هنا إن شاركها الأستاذ.</p>
                        </div>
                    </div>
                )}

                {role === 'host' && !isLocalCameraEnabled && (!isScreenSharing || !screenBig) && (
                    <div
                        style={{ position: 'absolute', inset: 0, zIndex: 5 }}
                        className="flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#141b33] to-[#0b1020] text-center"
                    >
                        <div className="grid h-20 w-20 place-items-center rounded-full bg-white/10">
                            <VideoOff className="h-9 w-9 text-white/70" />
                        </div>
                        <div dir="rtl">
                            <p className="text-lg font-semibold text-white">الكاميرا مغلقة</p>
                            <p className="mt-1 text-sm text-white/60">الطلاب يسمعون صوتك. شغّل الكاميرا متى شئت.</p>
                        </div>
                    </div>
                )}

                <div
                  ref={pipContainerRef}
                  onPointerDown={onPipPointerDown}
                  onPointerMove={onPipPointerMove}
                  onPointerUp={onPipPointerUp}
                  onPointerCancel={onPipPointerUp}
                  style={{
                    position: 'absolute',
                    ...(pipDrag
                      ? { left: pipDrag.x, top: pipDrag.y }
                      : {
                          [pipCorner[0] === 't' ? 'top' : 'bottom']: 16,
                          [pipCorner[1] === 'l' ? 'left' : 'right']: 16,
                        }),
                    cursor: pipDrag ? 'grabbing' : 'grab',
                    touchAction: 'none',
                    width: '22%',
                    minWidth: 150,
                    maxWidth: 300,
                    aspectRatio: '16 / 9',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#111',
                    border: '2px solid rgba(255,255,255,0.25)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
                    zIndex: 20,
                    // For the teacher, while the screen is big this tile holds
                    // the camera — and a camera that is off is just a black
                    // box. When the views are swapped it holds the screen, and
                    // that is always worth showing.
                    display: showPip && (role !== 'host' || !(isScreenSharing && screenBig) || isLocalCameraEnabled) ? 'block' : 'none',
                    // Mirror the teacher's own camera, like the main view does.
                    ...(role === 'host' && screenBig ? { transform: 'scaleX(-1)' } : {}),
                  }}
                >
                  <button
                    type="button"
                    title="تكبير هذا العرض"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); swapViews(); }}
                    style={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                      zIndex: 5,
                      width: 30,
                      height: 30,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      color: '#fff',
                      background: 'rgba(0,0,0,0.55)',
                      // Undo the mirror so the icon isn't reversed.
                      transform: role === 'host' && screenBig ? 'scaleX(-1)' : 'none',
                    }}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>

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
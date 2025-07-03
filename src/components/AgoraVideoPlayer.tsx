import React, { useEffect, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';

interface AgoraVideoPlayerProps {
    appId: string;
    channel: string;
    token: string;
    uid: string | number;
    role: 'host' | 'audience';
    studentsMuted: boolean;
}

const AgoraVideoPlayer: React.FC<AgoraVideoPlayerProps> = ({ appId, channel, token, uid, role, studentsMuted }) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const clientRef = useRef<IAgoraRTCClient | null>(null);

    useEffect(() => {
        let localAudioTrack: IMicrophoneAudioTrack | null = null;
        let localVideoTrack: ICameraVideoTrack | null = null;
        let canceled = false;

        const init = async () => {
            try {
                const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
                clientRef.current = client;

                await client.setClientRole(role);

                client.on('user-published', async (user, mediaType) => {
                    if (canceled) return;
                    await client.subscribe(user, mediaType);
                    if (mediaType === 'video') {
                        const remoteVideoTrack = user.videoTrack;
                        if (videoRef.current && remoteVideoTrack) {
                            remoteVideoTrack.play(videoRef.current);
                        }
                    }
                    if (mediaType === 'audio') {
                        user.audioTrack && user.audioTrack.play();
                    }
                });

                await client.join(appId, channel, token, uid);
                if (canceled) return;

                if (role === 'host') {
                    localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                    localVideoTrack = await AgoraRTC.createCameraVideoTrack();
                    if (canceled) return;
                    await client.publish([localAudioTrack, localVideoTrack]);
                    if (videoRef.current && localVideoTrack) {
                        localVideoTrack.play(videoRef.current);
                    }
                }
            } catch (err) {
                if (!canceled) {
                    console.error(err);
                }
            }
        };

        init();

        return () => {
            canceled = true;
            if (localAudioTrack) localAudioTrack.close();
            if (localVideoTrack) localVideoTrack.close();
            clientRef.current?.leave().catch(() => { });
        };
    }, [appId, channel, token, uid, role]);

    // Mute/unmute students (audience)
    useEffect(() => {
        if (role === 'audience' && clientRef.current) {
            clientRef.current.localTracks?.forEach(track => {
                if (track.trackMediaType === 'audio') {
                    studentsMuted ? track.setEnabled(false) : track.setEnabled(true);
                }
            });
        }
    }, [studentsMuted, role]);

    return (
        <div ref={videoRef} style={{ width: '100%', height: '100%' }} />
    );
};

export default AgoraVideoPlayer; 
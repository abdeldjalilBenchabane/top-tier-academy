import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Heart, MessageSquare, Share2, Settings, MicOff, Mic, MessageCircle, Fullscreen, Pause, Play as PlayIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AgoraVideoPlayer from '@/components/AgoraVideoPlayer';
import AgoraRTM from 'agora-rtm-sdk';
import { api } from '@/lib/api';

// Placeholder for future Agora integration
// import AgoraRTC from 'agora-rtc-sdk-ng';

// TODO: Remplace par import { AGORA_APP_ID } from '@/config';
const AGORA_APP_ID = 'f2971224e3704d5cb79d248db1ec1778'; // App ID Agora réel

const Streaming = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

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

  // Chat state
  const [chatEnabled, setChatEnabled] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  // Mute state (all students muted by default)
  const [studentsMuted, setStudentsMuted] = useState(true);

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // TODO: Integrate Agora SDK here
  // useEffect(() => { ... }, [role, id]);

  // RTM (chat) state
  const [rtmClient, setRtmClient] = useState<any>(null);
  const [rtmChannel, setRtmChannel] = useState<any>(null);

  const [agoraToken, setAgoraToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      if (!user?.id) return;
      const res = await fetch(`/api/rtcToken?channel=${id}&uid=${user.id}`);
      const data = await res.json();
      setAgoraToken(data.token);
    };
    fetchToken();
  }, [id, user]);

  // Nouvelle logique RTM
  useEffect(() => {
    if (!user?.id || !id || !agoraToken) return;
    let client: any = null;
    let channel: any = null;
    let mounted = true;

    const initRTM = async () => {
      let safeUid = user && user.id
        ? String(user.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
        : '';
      console.log('Agora RTM safeUid:', safeUid, 'user.id:', user && user.id);
      if (!safeUid) {
        console.error('UID Agora RTM vide ou invalide, RTM non initialisé');
        return;
      }
      if (AgoraRTM.RTM && typeof AgoraRTM.RTM === 'function') {
        client = new AgoraRTM.RTM(AGORA_APP_ID);
      } else if (AgoraRTM.RTM && typeof AgoraRTM.RTM.createInstance === 'function') {
        client = AgoraRTM.RTM.createInstance(AGORA_APP_ID);
      } else if (typeof AgoraRTM.createInstance === 'function') {
        client = AgoraRTM.createInstance(AGORA_APP_ID);
      } else if (typeof AgoraRTM.Client === 'function') {
        client = new AgoraRTM.Client({ appID: AGORA_APP_ID });
      } else {
        console.error('Impossible de créer le client AgoraRTM : méthode inconnue', AgoraRTM);
        return;
      }
      await client.login({ uid: safeUid, token: agoraToken });
      channel = client.createChannel(id);
      await channel.join();
      if (mounted) {
        setRtmClient(client);
        setRtmChannel(channel);
      }
      // Compteur initial de spectateurs
      const members = await channel.getMembers();
      setViewerCount(members.length);
      // Quand quelqu'un rejoint
      channel.on('MemberJoined', async () => {
        const members = await channel.getMembers();
        setViewerCount(members.length);
      });
      // Quand quelqu'un quitte
      channel.on('MemberLeft', async () => {
        const members = await channel.getMembers();
        setViewerCount(members.length);
      });
      // Ecoute des messages
      channel.on('ChannelMessage', (message: any, memberId: string) => {
        setMessages((prev) => [
          ...prev,
          { sender: memberId === safeUid ? (user.name || 'Vous') : memberId, color: memberId === safeUid ? 'text-green-300' : 'text-blue-300', text: message.text }
        ]);
      });
    };
    initRTM();
    return () => {
      mounted = false;
      if (channel) channel.leave();
      if (client) client.logout();
    };
  }, [user?.id, id, agoraToken]);

  // Envoi message RTM
  const handleSend = () => {
    if (!input.trim() || !chatEnabled) return;
    if (rtmChannel) {
      rtmChannel.sendMessage({ text: input });
    }
    setMessages([...messages, { sender: user?.name || 'مستخدم', color: 'text-green-300', text: input }]);
    setInput('');
  };

  // Professor controls
  const handleMuteAll = () => setStudentsMuted(true);
  const handleUnmuteAll = () => setStudentsMuted(false);
  const handleToggleChat = () => setChatEnabled((v) => !v);

  // Participants (pour mute/unmute individuel)
  const [participants, setParticipants] = useState<any[]>([]); // à remplir avec la vraie liste RTM plus tard
  // Pour l'élève : est-ce qu'il est autorisé à parler ?
  const [isUnmuted, setIsUnmuted] = useState(false); // à synchroniser avec l'autorisation du prof

  const [viewerCount, setViewerCount] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [canAccess, setCanAccess] = useState(true); // true pour le prof, à vérifier pour l'étudiant

  // Vérification d'accès pour l'étudiant
  useEffect(() => {
    const checkAccess = async () => {
      if (user?.role === 'student' && id) {
        try {
          const res = await fetch(`/api/live-sessions/${id}/access?student_id=${user.id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          const data = await res.json();
          setCanAccess(data.can_access);
        } catch {
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

  if (isLoading) {
    return <div className="py-8 text-center text-white">Chargement de l'utilisateur...</div>;
  }
  if (!user || !user.id) {
    return <div className="py-8 text-center text-red-400">Utilisateur non authentifié ou ID manquant.</div>;
  }

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
    return <div className="py-8 text-center text-red-400">Le live n'a pas encore commencé ou vous n'avez pas accès.</div>;
  }

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
              {agoraToken ? (
                <>
                  <AgoraVideoPlayer
                    appId={AGORA_APP_ID}
                    channel={id as string}
                    token={agoraToken}
                    uid={user.id}
                    role={isProfessor ? 'host' : 'audience'}
                    studentsMuted={studentsMuted}
                    isPaused={isPaused}
                  />
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
        <div className="lg:col-span-1">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 h-[600px] flex flex-col">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/20">
              <MessageSquare className="w-5 h-5" />
              <h3 className="font-semibold">الدردشة المباشرة</h3>
              {!chatEnabled && <span className="ml-2 text-xs text-red-400">الدردشة مغلقة من قبل الأستاذ</span>}
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {messages.map((msg, idx) => (
                <div key={idx} className="bg-white/5 rounded-lg p-3">
                  <div className={`font-medium text-sm ${msg.color}`}>{msg.sender}</div>
                  <div className="text-sm text-gray-300">{msg.text}</div>
                </div>
              ))}
              <div ref={chatEndRef}></div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={chatEnabled ? "اكتب رسالتك..." : "الدردشة مغلقة"}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                disabled={!chatEnabled || (studentsMuted && !isProfessor)}
              />
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={handleSend} disabled={!chatEnabled || (studentsMuted && !isProfessor)}>
                إرسال
              </Button>
            </div>
            {studentsMuted && !isProfessor && (
              <div className="text-xs text-red-400 mt-2 text-center">تم كتم الميكروفون من قبل الأستاذ</div>
            )}
          </div>
        </div>
      </div>

      {/* Participants list for professor */}
      {isProfessor && (
        <div className="bg-white/10 rounded-xl p-4 mt-6">
          <h3 className="font-bold mb-2 text-white">المشاركون</h3>
          <ul>
            {participants.map((p) => (
              <li key={p.id} className="flex items-center justify-between mb-2">
                <span className="text-white">{p.name || p.id}</span>
                <Button size="sm" variant={p.isUnmuted ? 'destructive' : 'secondary'}
                  onClick={() => {/* logique mute/unmute à implémenter */ }}>
                  {p.isUnmuted ? 'كتم' : 'سماح'}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Streaming;

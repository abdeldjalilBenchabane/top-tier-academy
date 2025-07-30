import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Plus, Calendar, Clock, Zap, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusControl from '../live-sessions/StatusControl';
import { LiveSession } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface LiveSessionsProps {
  professorId: string;
}

const LiveSessions = ({ professorId }: LiveSessionsProps) => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
    fetchNotifications();
  }, [professorId]);

  // Sort sessions so 'live' are at the top
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (a.status !== 'live' && b.status === 'live') return 1;
    return 0;
  });

  // Broadcast 'hasLiveNow' to sidebar
  useEffect(() => {
    const hasLiveNow = sessions.some(s => s.status === 'live');
    localStorage.setItem('professorHasLiveNow', hasLiveNow ? '1' : '0');
    window.dispatchEvent(new CustomEvent('professorLiveNowChanged', { detail: { hasLiveNow } }));
  }, [sessions]);

  // Automatic status management
  const checkAndUpdateSessionStatus = async (session: LiveSession) => {
    const now = new Date();
    const sessionStartTime = new Date(session.start_time || session.scheduledAt);
    const sessionEndTime = new Date(sessionStartTime.getTime() + (session.duration || 60) * 60 * 1000);
    
    let newStatus = session.status;
    
    // Check if session should be live
    if (session.status === 'scheduled' && now >= sessionStartTime && now <= sessionEndTime) {
      newStatus = 'live';
    }
    // Check if session should be ended
    else if (session.status === 'live' && now > sessionEndTime) {
      newStatus = 'ended';
    }
    
    // Update status if it changed
    if (newStatus !== session.status) {
      try {
        await api.updateLiveSessionStatus(session.id, newStatus);
        console.log(`Session ${session.id} status automatically updated to: ${newStatus}`);
        // Refresh sessions to get updated status
        fetchSessions();
      } catch (error) {
        console.error(`Failed to update session ${session.id} status:`, error);
      }
    }
  };

  // Check all sessions for status updates
  useEffect(() => {
    if (sessions.length === 0) return;
    
    const checkAllSessions = () => {
      sessions.forEach(session => {
        checkAndUpdateSessionStatus(session);
      });
    };
    
    // Check immediately
    checkAllSessions();
    
    // Check every 30 seconds
    const interval = setInterval(checkAllSessions, 30000);
    
    return () => clearInterval(interval);
  }, [sessions]);

  // Refresh sessions every 30 seconds to get updated status
  useEffect(() => {
    if (!professorId) return;
    
    const refreshInterval = setInterval(() => {
      fetchSessions();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [professorId]);

  const fetchSessions = async () => {
    if (!professorId) return;
    try {
      const data = await api.getLiveSessions(professorId);
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch live sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load live sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      // Only show notifications related to this professor and live sessions
      setNotifications(data.filter((n: any) => n.sessionId && n.message && n.message.toLowerCase().includes('live session')));
    } catch (error) {
      setNotifications([]);
    }
  };


  const handleStartSession = async (sessionId: string) => {
    try {
      await api.updateLiveSessionStatus(sessionId, 'live');
      toast({
        title: "Success",
        description: "Live session started successfully",
      });
      navigate(`/streaming/${sessionId}`);
    } catch (error) {
      console.error('Failed to start live session:', error);
      toast({
        title: "Error",
        description: "Failed to start live session",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: LiveSession['status']) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'live': return 'default';
      case 'upcoming': return 'default';
      case 'ended': return 'secondary';
      case 'cancelled': return 'outline';
      default: return 'default';
    }
  };

  const getSessionStatus = (session: LiveSession) => {
    // Check if session is manually ended
    if (session.status === 'ended' || session.status === 'cancelled') {
      return 'ended';
    }

    // For now, return the session status as is
    return session.status || 'scheduled';
  };

  const canStartSession = (session: LiveSession) => {
    // Add logic to determine if session can be started
    // For now, allow starting if status is 'scheduled'
    return session.status === 'scheduled';
  };

  // Helper to get status badge
  const getApprovalStatusBadge = (session: any) => {
    if (session.is_rejected) {
      return <Badge className="bg-red-500 text-white">Rejected</Badge>;
    }
    if (session.is_approved) {
      return <Badge className="bg-green-500 text-white">Approved</Badge>;
    }
    return <Badge className="bg-yellow-500 text-black">Pending Approval</Badge>;
  };

  if (loading) {
    return <div className="py-8 text-center">Loading live sessions...</div>;
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Live Sessions</h2>
          <p className="text-gray-600">Schedule and manage your live teaching sessions</p>
        </div>

        <Button onClick={() => navigate('/professor/create-live-session')}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Session
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading live sessions...</p>
          </div>
        ) : sortedSessions.length === 0 ? (
          <div className="text-center py-8">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Live Sessions</h3>
            <p className="text-gray-600 mb-4">You haven't created any live sessions yet.</p>
            <Button onClick={() => navigate('/professor/create-live-session')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Live Session
            </Button>
          </div>
        ) : (
          sortedSessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Cover Image */}
                    {session.cover_image_url && (
                      <div className="mb-3">
                        <img
                          src={session.cover_image_url}
                          alt={`${session.title} Cover`}
                          className="w-full h-32 object-cover rounded-lg border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{session.title}</CardTitle>
                      {getApprovalStatusBadge(session)}
                      <Badge variant={getStatusColor(getSessionStatus(session))}>
                        {getSessionStatus(session) === 'live' ? 'مباشر الآن' : 
                         getSessionStatus(session) === 'upcoming' ? 'قريباً' :
                         getSessionStatus(session) === 'ended' ? 'منتهي' :
                         session.status ? session.status.charAt(0).toUpperCase() + session.status.slice(1) : 'Unknown'}
                      </Badge>
                    </div>
                      <CardDescription className="mt-1">
                        {session.description}
                      </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {getSessionStatus(session) === 'live' && (
                      <Button
                        onClick={() => handleStartSession(session.id)}
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700 animate-pulse"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        انضم للبث المباشر
                      </Button>
                    )}
                    {getSessionStatus(session) === 'upcoming' && canStartSession(session) && (
                      <Button
                        onClick={() => handleStartSession(session.id)}
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Live Session
                      </Button>
                    )}
                    <StatusControl
                      session={session}
                      onStatusUpdate={fetchSessions}
                      userRole="professor"
                      isOwner={true}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(session.start_time || session.scheduledAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(session.start_time || session.scheduledAt).toLocaleTimeString()} ({session.duration} min)
                  </div>
                  {/* Timer Display */}
                  {/* sessionTimers[session.id] && (
                    <div className={`flex items-center gap-1 ${
                      getSessionStatus(session) === 'live' ? 'text-blue-600 font-semibold' :
                      getSessionStatus(session) === 'ended' ? 'text-gray-500' :
                      'text-green-600 font-semibold'
                    }`}>
                      <Timer className="h-4 w-4" />
                      <span className="font-mono">{sessionTimers[session.id]}</span>
                    </div>
                  ) */}
                </div>

                {session.meetingUrl && (
                  <div className="mt-2">
                    <a
                      href={session.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Join Meeting →
                    </a>
                  </div>
                )}

                {getSessionStatus(session) === 'upcoming' && !canStartSession(session) && (
                  <div className="mt-2 text-sm text-gray-500">
                    يمكن بدء الجلسة قبل 15 دقيقة من الوقت المحدد
                  </div>
                )}
                {getSessionStatus(session) === 'ended' && (
                  <div className="mt-2 text-sm text-gray-500">
                    انتهت هذه الجلسة
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveSessions;

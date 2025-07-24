import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { LiveSession } from '@/types';
import { toast } from '@/lib/toast';
import { Plus, Video, Calendar, Clock, Play, Bell, Timer, Zap } from 'lucide-react';
import StatusControl from '@/components/live-sessions/StatusControl';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LiveSessionsProps {
  professorId: string;
}

const LiveSessions = ({ professorId }: LiveSessionsProps) => {
  const { user } = useAuth();
  console.log('[DEBUG] user:', user);
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionTimers, setSessionTimers] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    scheduledAt: '',
    duration: 60,
    meetingUrl: '',
    presenter: user?.name || '',
    price: 0,
    currency: 'DZD',

    thumbnail: '',
    isPaid: false,
  });

  // Real-time timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate timers for all sessions
  useEffect(() => {
    const timers: {[key: string]: string} = {};
    
    sessions.forEach(session => {
      if (!session.start_time) {
        timers[session.id] = '';
        return;
      }

      const sessionTime = new Date(session.start_time);
      const sessionEndTime = new Date(sessionTime.getTime() + (session.duration || 60) * 60 * 1000);
      
      // Check if session is manually ended
      if (session.status === 'ended' || session.is_ended) {
        timers[session.id] = 'منتهي';
        return;
      }

      if (currentTime < sessionTime) {
        // Session hasn't started yet
        const timeDiff = sessionTime.getTime() - currentTime.getTime();
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        if (hours > 0) {
          timers[session.id] = `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
          timers[session.id] = `${minutes}m ${seconds}s`;
        } else {
          timers[session.id] = `${seconds}s`;
        }
      } else if (currentTime >= sessionTime && currentTime <= sessionEndTime) {
        // Session is live
        timers[session.id] = 'مباشر الآن';
      } else {
        // Session has ended
        timers[session.id] = 'منتهي';
      }
    });
    
    setSessionTimers(timers);
  }, [currentTime, sessions]);

  useEffect(() => {
    if (!professorId) return;
    fetchSessions();
    fetchNotifications();
  }, [professorId]);

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
      toast.error('Failed to load live sessions');
    } finally {
      setIsLoading(false);
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professorId) {
      toast.error('Professor ID is missing. Please log in again.');
      return;
    }
    // Validate required fields
    if (!formData.title || !formData.scheduledAt || !formData.duration || formData.price === undefined || formData.price === null || formData.price === "") {
      toast.error('Please fill in all required fields: title, scheduled date, duration, and price.');
      return;
    }

    try {
      // Only send the required fields to the backend
      const payload = {
        title: formData.title,
        start_time: formData.scheduledAt,
        duration: formData.duration,
        price: formData.price,
      };
      console.log('[DEBUG] Creating live session with payload:', payload);
      await api.createLiveSession({ ...payload, professorId });
      toast.success('Live session scheduled successfully');
      await fetchSessions();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create live session:', error);
      toast.error('Failed to schedule live session');
    }
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      await api.updateLiveSessionStatus(sessionId, 'live');
      toast.success('Live session started successfully');
      navigate(`/streaming/${sessionId}`);
    } catch (error) {
      console.error('Failed to start live session:', error);
      toast.error('Failed to start live session');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      courseId: '',
      scheduledAt: '',
      duration: 60,
      meetingUrl: '',
      presenter: user?.name || '',
      price: 0,
      currency: 'DZD',

      thumbnail: '',
      isPaid: false,
    });
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
    if (!session.start_time) return 'scheduled';
    
    const sessionTime = new Date(session.start_time);
    const sessionEndTime = new Date(sessionTime.getTime() + (session.duration || 60) * 60 * 1000);
    
    // Check if session is manually ended
    if (session.status === 'ended' || session.is_ended) {
      return 'ended';
    }

    if (currentTime < sessionTime) {
      return 'upcoming';
    } else if (currentTime >= sessionTime && currentTime <= sessionEndTime) {
      return 'live';
    } else {
      return 'ended';
    }
  };

  const canStartSession = (session: LiveSession) => {
    if (!session.start_time) return false;
    const sessionTime = new Date(session.start_time);
    const now = new Date();
    const timeDiff = sessionTime.getTime() - now.getTime();
    const minutesUntilStart = timeDiff / (1000 * 60);
    return minutesUntilStart <= 15 && minutesUntilStart >= -session.duration;
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

  if (isLoading) {
    return <div className="py-8 text-center">Loading live sessions...</div>;
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Live Sessions</h2>
          <p className="text-gray-600">Schedule and manage your live teaching sessions</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule Live Session</DialogTitle>
              <DialogDescription>
                Create a new live teaching session for your students.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Session Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Introduction to React Hooks"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What will be covered in this session?"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Scheduled Date & Time</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    max="300"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              {/* <div className="space-y-2">
                <Label htmlFor="presenter">Presenter Name</Label>
                <Input
                  id="presenter"
                  value={formData.presenter}
                  onChange={(e) => setFormData({ ...formData, presenter: e.target.value })}
                  placeholder="Prof. John Doe"
                  required
                />
              </div> */}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  />
                </div>
              </div>



              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  type="url"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>


              <div className="space-y-2">
                <Label htmlFor="meetingUrl">Meeting URL (optional)</Label>
                <Input
                  id="meetingUrl"
                  value={formData.meetingUrl}
                  onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Schedule Session
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No live sessions scheduled</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Schedule your first live session to start teaching.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
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
                  {sessionTimers[session.id] && (
                    <div className={`flex items-center gap-1 ${
                      getSessionStatus(session) === 'live' ? 'text-blue-600 font-semibold' :
                      getSessionStatus(session) === 'ended' ? 'text-gray-500' :
                      'text-green-600 font-semibold'
                    }`}>
                      <Timer className="h-4 w-4" />
                      <span className="font-mono">{sessionTimers[session.id]}</span>
                    </div>
                  )}
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

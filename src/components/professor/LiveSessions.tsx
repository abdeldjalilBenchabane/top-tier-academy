
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
import { Plus, Video, Calendar, Clock, Play } from 'lucide-react';
import StatusControl from '@/components/live-sessions/StatusControl';

interface LiveSessionsProps {
  professorId: string;
}

const LiveSessions = ({ professorId }: LiveSessionsProps) => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    scheduledAt: '',
    duration: 60,
    meetingUrl: '',
  });

  useEffect(() => {
    fetchSessions();
  }, [professorId]);

  const fetchSessions = async () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const now = new Date().toISOString();
      await api.createLiveSession({
        ...formData,
        professorId,
        status: 'scheduled',
        createdAt: now,
        updatedAt: now,
      });
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
      await fetchSessions();
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
    });
  };

  const getStatusColor = (status: LiveSession['status']) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'live': return 'destructive';
      case 'ended': return 'secondary';
      case 'cancelled': return 'outline';
      default: return 'default';
    }
  };

  const canStartSession = (session: LiveSession) => {
    const now = new Date();
    const scheduledTime = new Date(session.scheduledAt);
    const timeDiff = scheduledTime.getTime() - now.getTime();
    const minutesUntilStart = timeDiff / (1000 * 60);
    
    return session.status === 'scheduled' && minutesUntilStart <= 15;
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
                      <Badge variant={getStatusColor(session.status)}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">
                      {session.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {canStartSession(session) && (
                      <Button
                        onClick={() => handleStartSession(session.id)}
                        variant="default"
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
                    {new Date(session.scheduledAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(session.scheduledAt).toLocaleTimeString()} ({session.duration} min)
                  </div>
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
                
                {session.status === 'scheduled' && !canStartSession(session) && (
                  <div className="mt-2 text-sm text-gray-500">
                    Session can be started 15 minutes before scheduled time
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

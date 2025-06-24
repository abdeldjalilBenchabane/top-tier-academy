import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { LiveSession, User } from '@/types';
import { toast } from '@/lib/toast';
import { 
  Video, 
  Calendar, 
  Clock, 
  Users as UsersIcon, 
  Play, 
  Pause, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCw,
  Tag,
  FileVideo,
  Eye,
  TrendingUp,
  Archive
} from 'lucide-react';
import StatusControl from '@/components/live-sessions/StatusControl';

const LiveSessionsOverview = () => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [professors, setProfessors] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsData, usersData, notificationsData] = await Promise.all([
        api.getLiveSessions(),
        api.getUsers(),
        api.getNotifications()
      ]);
      
      setSessions(sessionsData);
      setProfessors(usersData.filter(user => user.role === 'professor'));
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load live sessions data');
    } finally {
      setIsLoading(false);
    }
  };

  const getProfessorName = (professorId: string) => {
    const professor = professors.find(p => p.id === professorId);
    return professor?.name || 'Unknown Professor';
  };

  const getStatusColor = (status: LiveSession['status']) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'live': return 'destructive';
      case 'ended': return 'secondary';
      case 'cancelled': return 'outline';
      case 'starting': return 'default';
      case 'paused': return 'outline';
      case 'technical_issues': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: LiveSession['status']) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-3 w-3" />;
      case 'live': return <Play className="h-3 w-3" />;
      case 'ended': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      case 'starting': return <RotateCw className="h-3 w-3 animate-spin" />;
      case 'paused': return <Pause className="h-3 w-3" />;
      case 'technical_issues': return <AlertTriangle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusCounts = () => {
    const counts = {
      scheduled: sessions.filter(s => s.status === 'scheduled').length,
      live: sessions.filter(s => s.status === 'live').length,
      starting: sessions.filter(s => s.status === 'starting').length,
      paused: sessions.filter(s => s.status === 'paused').length,
      ended: sessions.filter(s => s.status === 'ended').length,
      cancelled: sessions.filter(s => s.status === 'cancelled').length,
      technical_issues: sessions.filter(s => s.status === 'technical_issues').length,
      total: sessions.length,
      totalAttendees: sessions.reduce((sum, s) => sum + (s.attendeesCount || 0), 0),
      recordedSessions: sessions.filter(s => s.isRecorded && s.recordingUrl).length
    };
    return counts;
  };

  const getUpcomingSessions = () => {
    return sessions
      .filter(s => s.status === 'scheduled' && new Date(s.scheduledAt) > new Date())
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 5);
  };

  const getActiveSessions = () => {
    return sessions.filter(s => ['live', 'starting', 'paused'].includes(s.status));
  };

  const getSavedSessions = () => {
    return sessions.filter(s => s.status === 'ended' && s.recordingUrl);
  };

  const recentNotifications = notifications
    .filter(n => n.type === 'live_session_scheduled' || n.type === 'live_session_started')
    .slice(0, 5);

  if (isLoading) {
    return <div className="py-8 text-center">Loading live sessions overview...</div>;
  }

  const statusCounts = getStatusCounts();
  const upcomingSessions = getUpcomingSessions();
  const activeSessions = getActiveSessions();
  const savedSessions = getSavedSessions();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Live Sessions Overview</h2>
        <p className="text-gray-600">Monitor all live sessions across the platform</p>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
            <p className="text-xs text-muted-foreground">All time sessions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{activeSessions.length}</div>
            <p className="text-xs text-muted-foreground">Live, starting, or paused</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.totalAttendees}</div>
            <p className="text-xs text-muted-foreground">Across all sessions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recorded Sessions</CardTitle>
            <FileVideo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.recordedSessions}</div>
            <p className="text-xs text-muted-foreground">Available recordings</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Session Status Breakdown</CardTitle>
          <CardDescription>Current status distribution of all sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{statusCounts.scheduled}</div>
              <div className="text-xs text-gray-500">Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">{statusCounts.live}</div>
              <div className="text-xs text-gray-500">Live</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">{statusCounts.starting}</div>
              <div className="text-xs text-gray-500">Starting</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-600">{statusCounts.paused}</div>
              <div className="text-xs text-gray-500">Paused</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{statusCounts.ended}</div>
              <div className="text-xs text-gray-500">Ended</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-600">{statusCounts.cancelled}</div>
              <div className="text-xs text-gray-500">Cancelled</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-800">{statusCounts.technical_issues}</div>
              <div className="text-xs text-gray-500">Issues</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="all-sessions">All Sessions</TabsTrigger>
          <TabsTrigger value="saved-library">Saved Library</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-red-500" />
                Active Sessions
              </CardTitle>
              <CardDescription>Sessions currently live or starting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeSessions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No active sessions</p>
              ) : (
                activeSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 bg-red-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{session.title}</h4>
                        <p className="text-sm text-gray-600">{getProfessorName(session.professorId)}</p>
                      </div>
                      <Badge variant={getStatusColor(session.status)} className="flex items-center gap-1">
                        {getStatusIcon(session.status)}
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1).replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <UsersIcon className="h-3 w-3" />
                        {session.attendeesCount}/{session.maxAttendees}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.duration}m
                      </div>
                      {session.isRecorded && (
                        <div className="flex items-center gap-1">
                          <FileVideo className="h-3 w-3" />
                          Recording
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Upcoming Sessions
              </CardTitle>
              <CardDescription>Next 5 scheduled sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingSessions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No upcoming sessions</p>
              ) : (
                upcomingSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{session.title}</h4>
                        <p className="text-xs text-gray-600">{getProfessorName(session.professorId)}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {new Date(session.scheduledAt).toLocaleDateString()}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(session.scheduledAt).toLocaleTimeString()} • {session.duration}m
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Sessions</CardTitle>
              <CardDescription>Complete overview of all live sessions with management controls</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Attendees</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Recording</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{session.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-48">
                            {session.description}
                          </div>
                          {session.tags && session.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {session.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  <Tag className="h-2 w-2 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {session.tags.length > 2 && (
                                <span className="text-xs text-gray-400">+{session.tags.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{getProfessorName(session.professorId)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(session.status)} className="flex items-center gap-1 w-fit">
                          {getStatusIcon(session.status)}
                          {session.status.charAt(0).toUpperCase() + session.status.slice(1).replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(session.scheduledAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(session.scheduledAt).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {session.attendeesCount || 0}/{session.maxAttendees || 0}
                        </div>
                        {session.attendeesCount && session.maxAttendees && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full" 
                              style={{width: `${Math.min((session.attendeesCount / session.maxAttendees) * 100, 100)}%`}}
                            ></div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{session.duration}m</div>
                      </TableCell>
                      <TableCell>
                        {session.isRecorded ? (
                          session.recordingUrl ? (
                            <Button size="sm" variant="outline" className="h-6 text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              <FileVideo className="h-2 w-2 mr-1" />
                              Recording
                            </Badge>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">No recording</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 items-center">
                          {session.meetingUrl && (
                            <Button size="sm" variant="outline" className="h-6 text-xs">
                              Join
                            </Button>
                          )}
                          <StatusControl
                            session={session}
                            onStatusUpdate={fetchData}
                            userRole="admin"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved-library" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Saved Sessions Library
              </CardTitle>
              <CardDescription>
                Live sessions that have been saved to the course library as recorded content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No saved sessions</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Finished live sessions will appear here when saved to the library.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {savedSessions.map((session) => (
                    <Card key={session.id} className="border-green-200 bg-green-50">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {session.title}
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                Saved
                              </Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {session.description}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {session.recordingUrl && (
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-2" />
                                View Recording
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <UsersIcon className="h-4 w-4" />
                            Professor: {getProfessorName(session.professorId)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(session.scheduledAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {session.duration} minutes
                          </div>
                          {session.attendeesCount && (
                            <div className="flex items-center gap-1">
                              <UsersIcon className="h-4 w-4" />
                              {session.attendeesCount} attendees
                            </div>
                          )}
                        </div>
                        {session.tags && session.tags.length > 0 && (
                          <div className="flex gap-1 mt-3">
                            {session.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest live session notifications and updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentNotifications.length === 0 ? (
            <p className="text-sm text-gray-500">No recent notifications</p>
          ) : (
            recentNotifications.map((notification) => (
              <div key={notification.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveSessionsOverview;

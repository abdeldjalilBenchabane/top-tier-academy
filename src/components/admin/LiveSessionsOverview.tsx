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
  Archive,
  ExternalLink,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';
import StatusControl from '@/components/live-sessions/StatusControl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const LiveSessionsOverview = () => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [professors, setProfessors] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsData, usersData, notificationsData] = await Promise.all([
        api.get('/live-sessions?all=true'),
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

  const getFilteredSessions = () => {
    if (selectedStatus === 'all') return sessions;
    return sessions.filter(s => s.status === selectedStatus);
  };

  const recentNotifications = notifications
    .filter(n => n.type === 'live_session_scheduled' || n.type === 'live_session_started')
    .slice(0, 5);

  const handleJoinSession = (session: LiveSession) => {
    if (session.meetingUrl) {
      window.open(session.meetingUrl, '_blank');
    }
  };

  const handleViewRecording = (session: LiveSession) => {
    if (session.recordingUrl) {
      window.open(session.recordingUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading live sessions overview...</p>
        </div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();
  const upcomingSessions = getUpcomingSessions();
  const activeSessions = getActiveSessions();
  const savedSessions = getSavedSessions();
  const filteredSessions = getFilteredSessions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Live Sessions Overview</h2>
          <p className="text-muted-foreground">Monitor and manage all live sessions across the platform</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RotateCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
            <p className="text-xs text-muted-foreground">All time sessions</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{activeSessions.length}</div>
            <p className="text-xs text-muted-foreground">Live, starting, or paused</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.totalAttendees}</div>
            <p className="text-xs text-muted-foreground">Across all sessions</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
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
            <div className="text-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer" onClick={() => setSelectedStatus('scheduled')}>
              <div className="text-lg font-semibold text-blue-600">{statusCounts.scheduled}</div>
              <div className="text-xs text-gray-500">Scheduled</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors cursor-pointer" onClick={() => setSelectedStatus('live')}>
              <div className="text-lg font-semibold text-red-600">{statusCounts.live}</div>
              <div className="text-xs text-gray-500">Live</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer" onClick={() => setSelectedStatus('starting')}>
              <div className="text-lg font-semibold text-orange-600">{statusCounts.starting}</div>
              <div className="text-xs text-gray-500">Starting</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors cursor-pointer" onClick={() => setSelectedStatus('paused')}>
              <div className="text-lg font-semibold text-yellow-600">{statusCounts.paused}</div>
              <div className="text-xs text-gray-500">Paused</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors cursor-pointer" onClick={() => setSelectedStatus('ended')}>
              <div className="text-lg font-semibold text-green-600">{statusCounts.ended}</div>
              <div className="text-xs text-gray-500">Ended</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => setSelectedStatus('cancelled')}>
              <div className="text-lg font-semibold text-gray-600">{statusCounts.cancelled}</div>
              <div className="text-xs text-gray-500">Cancelled</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-100 hover:bg-red-200 transition-colors cursor-pointer" onClick={() => setSelectedStatus('technical_issues')}>
              <div className="text-lg font-semibold text-red-800">{statusCounts.technical_issues}</div>
              <div className="text-xs text-gray-500">Issues</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
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
                <div className="text-center py-8">
                  <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No active sessions</h3>
                  <p className="mt-1 text-sm text-gray-500">There are currently no live or starting sessions.</p>
                </div>
              ) : (
                activeSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 bg-red-50 hover:bg-red-100 transition-colors">
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
                        {session.attendeesCount || 0}/{session.maxAttendees || 0}
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
                    {session.meetingUrl && (
                      <div className="mt-3">
                        <Button size="sm" variant="outline" onClick={() => handleJoinSession(session)}>
                          <ExternalLink className="h-3 w-3 mr-2" />
                          Join Session
                        </Button>
                      </div>
                    )}
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
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No upcoming sessions</h3>
                  <p className="mt-1 text-sm text-gray-500">There are no scheduled sessions in the near future.</p>
                </div>
              ) : (
                upcomingSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Sessions</CardTitle>
                  <CardDescription>Complete overview of all live sessions with management controls</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="starting">Starting</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="ended">Ended</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="technical_issues">Technical Issues</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="text-center">
                            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No sessions found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {selectedStatus === 'all' 
                                ? 'No live sessions have been created yet.' 
                                : `No sessions with status "${selectedStatus}" found.`
                              }
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSessions.map((session) => (
                        <TableRow key={session.id} className="hover:bg-gray-50">
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
                                <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => handleViewRecording(session)}>
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
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {session.meetingUrl && (
                                <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => handleJoinSession(session)}>
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Join
                                </Button>
                              )}
                              <StatusControl
                                session={session}
                                onStatusUpdate={fetchData}
                                userRole="admin"
                              />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Session
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Session
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
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
                    <Card key={session.id} className="border-green-200 bg-green-50 hover:bg-green-100 transition-colors">
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
                              <Button size="sm" variant="outline" onClick={() => handleViewRecording(session)}>
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
            <div className="text-center py-8">
              <div className="h-12 w-12 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No recent activity</h3>
              <p className="mt-1 text-sm text-gray-500">No notifications to display at the moment.</p>
            </div>
          ) : (
            recentNotifications.map((notification) => (
              <div key={notification.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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

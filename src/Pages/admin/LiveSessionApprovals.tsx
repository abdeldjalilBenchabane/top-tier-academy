import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/lib/toast';
import { Video, TrendingUp, FileVideo, Clock, Play, CheckCircle, XCircle, RotateCw, Pause, AlertTriangle } from 'lucide-react';

const LiveSessionsAdmin = () => {
    const [pending, setPending] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [allSessions, pendingData] = await Promise.all([
                api.get('/live-sessions?all=true'),
                api.get('/live-sessions/pending')
            ]);
            setSessions(allSessions);
            setPending(pendingData);
        } catch (err) {
            toast.error('Failed to load live sessions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (id) => {
        try {
            await api.patch(`/live-sessions/${id}/approve`);
            toast.success('Session approved!');
            fetchData();
        } catch (err) {
            toast.error('Failed to approve session');
        }
    };

    const handleReject = async (id) => {
        try {
            await api.patch(`/live-sessions/${id}/reject`);
            toast.success('Session rejected!');
            fetchData();
        } catch (err) {
            toast.error('Failed to reject session');
        }
    };

    // Stats helpers
    const now = new Date();
    const overview = sessions.filter((s) => s.is_approved && !s.is_rejected && new Date(s.start_time) > now);
    const library = sessions.filter((s) => s.is_approved && !s.is_rejected && (s.is_ended || new Date(s.start_time) <= now));
    const activeSessions = sessions.filter((s) => ['live', 'starting', 'paused'].includes(s.status));
    const statusCounts = {
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

    const renderCard = (session, showActions = false) => (
        <Card key={session.id} className="overflow-hidden">
            <CardHeader>
                <CardTitle>{session.title}</CardTitle>
                <div className="text-sm text-gray-500">By Prof. {session.professor_name || session.professor_id}</div>
                <div className="text-xs text-gray-400">{new Date(session.start_time).toLocaleString()}</div>
            </CardHeader>
            <CardContent>
                <div>Duration: {session.duration} min</div>
                <div>Price: {session.price} €</div>
            </CardContent>
            {showActions && (
                <CardFooter className="flex gap-2">
                    <Button onClick={() => handleApprove(session.id)} variant="success">Accept</Button>
                    <Button onClick={() => handleReject(session.id)} variant="destructive">Reject</Button>
                </CardFooter>
            )}
        </Card>
    );

    // Status breakdown icons
    const getStatusIcon = (status) => {
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

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Live Sessions Management</h2>
            {/* Pending Approval Section */}
            {loading ? <div>Loading...</div> : (
                <>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="library">Saved Library</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview">
                            {/* Pending Approval */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-4">Pending Approval</h3>
                                {pending.length === 0 ? (
                                    <div className="text-gray-500">Aucune demande en attente.</div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {pending.map((s) => renderCard(s, true))}
                                    </div>
                                )}
                            </div>
                            {/* Stats Cards */}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
                            <Card className="mb-8">
                                <CardHeader>
                                    <CardTitle>Session Status Breakdown</CardTitle>
                                    <CardDescription>Current status distribution of all sessions</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                        {Object.entries(statusCounts).filter(([k]) => k !== 'total' && k !== 'totalAttendees' && k !== 'recordedSessions').map(([status, count]) => (
                                            <div className="text-center" key={status}>
                                                <div className="text-lg font-semibold text-blue-600">{count}</div>
                                                <div className="text-xs text-gray-500 flex items-center justify-center gap-1">{getStatusIcon(status)} {status.replace('_', ' ')}</div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                            {/* Approved Upcoming Sessions */}
                            <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
                            {overview.length === 0 ? <div>No upcoming live sessions.</div> : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {overview.map((s) => renderCard(s))}
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="library">
                            {library.length === 0 ? <div>No saved/ended sessions.</div> : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {library.map((s) => renderCard(s))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
};

export default LiveSessionsAdmin; 
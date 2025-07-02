import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import DashboardStats from '@/components/common/DashboardStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from '@/lib/toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name}!`}
        description="Manage your educational platform"
      />

      <DashboardStats userRole="admin" />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>New course submitted for approval</span>
                  <span className="text-gray-500">1 hour ago</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Professor John Smith registered</span>
                  <span className="text-gray-500">3 hours ago</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Live session saved to library</span>
                  <span className="text-gray-500">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Homepage slide updated</span>
                  <span className="text-gray-500">1 day ago</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/admin/pending')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
                >
                  Review pending courses
                </button>
                <button
                  onClick={() => navigate('/admin/live-sessions')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
                >
                  Manage live sessions
                </button>
                <button
                  onClick={() => navigate('/admin/slides')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
                >
                  Manage homepage slides
                </button>
                <button
                  onClick={() => navigate('/admin/users')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
                >
                  Add new user
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">System Health</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">98.5%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">1.2s</div>
                <div className="text-sm text-gray-600">Avg Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">99.1%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">User Growth</h3>
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📈</div>
                <p>Analytics charts would go here</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Course Performance</h3>
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>Course statistics would go here</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const LiveAppointmentsApproval = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingSessions = async () => {
    setLoading(true);
    try {
      // Fetch all sessions, including unapproved (admin endpoint)
      const data = await api.get('/live-sessions?all=true'); // You may need to implement this endpoint to return all sessions for admin
      setSessions(data.filter((s: any) => !s.is_approved));
    } catch (err) {
      toast.error('Failed to load live sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSessions();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await api.patch(`/live-sessions/${id}/approve`);
      toast.success('Session approved!');
      setSessions(sessions.filter((s: any) => s.id !== id));
    } catch (err) {
      toast.error('Failed to approve session');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border mt-6">
      <h3 className="text-lg font-semibold mb-4">Live Appointments Approval</h3>
      {loading ? (
        <div>Loading...</div>
      ) : sessions.length === 0 ? (
        <div>No pending live appointments.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session: any) => (
            <Card key={session.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{session.title}</CardTitle>
                <div className="text-sm text-gray-500">By Prof. {session.professor_id}</div>
                <div className="text-xs text-gray-400">{new Date(session.start_time).toLocaleString()}</div>
              </CardHeader>
              <CardContent>
                <div>Duration: {session.duration} min</div>
                <div>Price: {session.price} €</div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleApprove(session.id)}>Accept</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

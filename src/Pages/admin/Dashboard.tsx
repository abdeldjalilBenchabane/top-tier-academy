import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import DashboardStats from '@/components/common/DashboardStats';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from '@/lib/toast';
import { Clock, Users, BookOpen, Video, DollarSign, Activity, Database, Zap } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [activityResponse, healthResponse] = await Promise.all([
        api.get('/admin/dashboard/recent-activity?limit=8'),
        api.get('/admin/dashboard/system-health')
      ]);
      
      setRecentActivity(activityResponse.activities || []);
      setSystemHealth(healthResponse);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registration':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'course_submission':
        return <BookOpen className="h-4 w-4 text-green-500" />;
      case 'live_session_submission':
        return <Video className="h-4 w-4 text-purple-500" />;
      case 'point_transaction':
        return <DollarSign className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

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
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {getActivityIcon(activity.type)}
                        <span className="truncate max-w-xs">{activity.title}</span>
                      </div>
                      <span className="text-gray-500 whitespace-nowrap">{formatTimeAgo(activity.time)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/admin/pending')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm transition-colors"
                >
                  Review pending courses
                </button>
                <button
                  onClick={() => navigate('/admin/live-sessions')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm transition-colors"
                >
                  Manage live sessions
                </button>
                <button
                  onClick={() => navigate('/admin/enhanced-slides')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm transition-colors"
                >
                  Manage homepage slides
                </button>
                <button
                  onClick={() => navigate('/admin/users')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm transition-colors"
                >
                  Add new user
                </button>
                <button
                  onClick={() => navigate('/admin/quizzes')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm transition-colors"
                >
                  Review quiz submissions
                </button>
                <button
                  onClick={() => navigate('/admin/private-classes')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm transition-colors"
                >
                  Manage private classes
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">System Health</h3>
            {loading ? (
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="text-center">
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
                  </div>
                ))}
              </div>
            ) : systemHealth ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{systemHealth.performance.uptime}%</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Database className="h-3 w-3" />
                    Uptime
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{systemHealth.performance.avgResponseTime}s</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Zap className="h-3 w-3" />
                    Avg Response
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{systemHealth.performance.successRate}%</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Activity className="h-3 w-3" />
                    Success Rate
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Database className="h-8 w-8 mx-auto mb-2" />
                <p>System health data unavailable</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsCharts />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;

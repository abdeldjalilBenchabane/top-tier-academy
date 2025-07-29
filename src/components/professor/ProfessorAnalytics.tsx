import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  BookOpen, 
  Video, 
  TrendingUp, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfessorAnalyticsProps {
  stats: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ProfessorAnalytics = ({ stats }: ProfessorAnalyticsProps) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'course_created':
        return <BookOpen className="h-4 w-4" />;
      case 'student_enrolled':
        return <Users className="h-4 w-4" />;
      case 'live_session_created':
        return <Video className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'enrolled':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Prepare data for enrollment trends chart
  const enrollmentTrendsData = stats.monthlyTrends?.map((item: any) => ({
    month: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
    enrollments: parseInt(item.enrollments),
    newStudents: parseInt(item.new_students)
  })) || [];

  // Prepare data for course performance chart
  const coursePerformanceData = stats.topCourses?.map((course: any) => ({
    name: course.title.length > 15 ? course.title.substring(0, 15) + '...' : course.title,
    enrollments: parseInt(course.enrollment_count),
    price: parseFloat(course.price) || 0
  })) || [];

  // Course status distribution for pie chart
  const courseStatusData = [
    { name: 'Approved', value: parseInt(stats.courseStats?.approved_courses) || 0 },
    { name: 'Pending', value: parseInt(stats.courseStats?.pending_courses) || 0 },
    { name: 'Draft', value: parseInt(stats.courseStats?.draft_courses) || 0 },
    { name: 'Rejected', value: parseInt(stats.courseStats?.rejected_courses) || 0 }
  ];

  // Live sessions status distribution
  const liveSessionStatusData = [
    { name: 'Scheduled', value: parseInt(stats.liveSessionStats?.scheduled_sessions) || 0 },
    { name: 'Live', value: parseInt(stats.liveSessionStats?.live_sessions) || 0 },
    { name: 'Ended', value: parseInt(stats.liveSessionStats?.ended_sessions) || 0 },
    { name: 'Cancelled', value: parseInt(stats.liveSessionStats?.cancelled_sessions) || 0 }
  ];

  // Live sections status distribution
  const liveSectionStatusData = [
    { name: 'Active', value: parseInt(stats.liveSectionStats?.active_sections) || 0 },
    { name: 'Inactive', value: parseInt(stats.liveSectionStats?.inactive_sections) || 0 },
    { name: 'Pending', value: parseInt(stats.liveSectionStats?.pending_sections) || 0 }
  ];

  // Private classes status distribution
  const privateClassStatusData = [
    { name: 'Accepted', value: parseInt(stats.privateClassStats?.accepted_requests) || 0 },
    { name: 'Pending', value: parseInt(stats.privateClassStats?.pending_requests) || 0 },
    { name: 'Rejected', value: parseInt(stats.privateClassStats?.rejected_requests) || 0 },
    { name: 'Completed', value: parseInt(stats.privateClassStats?.completed_requests) || 0 }
  ];

  // Debug logging
  console.log('Professor Analytics Data:', {
    courseStats: stats.courseStats,
    liveSessionStats: stats.liveSessionStats,
    liveSectionStats: stats.liveSectionStats,
    privateClassStats: stats.privateClassStats,
    courseStatusData,
    liveSessionStatusData,
    liveSectionStatusData,
    privateClassStatusData
  });

  // Helper function to render pie chart or empty state
  const renderPieChart = (data: any[], title: string) => {
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    
    if (totalValue === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-lg font-medium">No {title.toLowerCase()} data</p>
          <p className="text-sm">Start creating content to see statistics</p>
          <div className="mt-4 text-xs">
            {data.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Helper function to render statistics summary
  const renderStatsSummary = (data: any[], title: string) => {
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    
    if (totalValue === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-lg font-medium">No {title.toLowerCase()} data</p>
          <p className="text-sm">Start creating content to see statistics</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="font-medium">{item.name}</span>
            </div>
            <span className="text-lg font-bold">{item.value}</span>
          </div>
        ))}
        <div className="border-t pt-3 mt-3">
          <div className="flex items-center justify-between font-bold">
            <span>Total</span>
            <span>{totalValue}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upcoming Live Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Live Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.upcomingSessions?.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingSessions.map((session: any) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{session.title}</h4>
                    <p className="text-sm text-gray-600">{session.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-gray-500">
                        {formatDate(session.scheduled_at)}
                      </span>
                      <Badge variant="outline" className={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {session.current_participants}/{session.max_participants} participants
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/professor/live-sessions/${session.id}`)}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Video className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No upcoming live sessions</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => navigate('/professor/create-live-session')}
              >
                Create Live Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Enrollment Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Enrollment Trends (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={enrollmentTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="enrollments" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="newStudents" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Course Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Top Courses by Enrollment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coursePerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="enrollments" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Course Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Course Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {renderPieChart(courseStatusData, 'Course Status')}
            
            {renderStatsSummary(courseStatusData, 'Course Status')}
          </div>
        </CardContent>
      </Card>

      {/* Live Sessions & Sections Status */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Live Sessions Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderPieChart(liveSessionStatusData, 'Live Sessions')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Live Sections Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderPieChart(liveSectionStatusData, 'Live Sections')}
          </CardContent>
        </Card>
      </div>

      {/* Private Classes & Comments Status */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Private Classes Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderPieChart(privateClassStatusData, 'Private Classes')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Comments & Quizzes Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-blue-500" />
                  <span>Comments</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{stats.commentStats?.total_comments || 0}</div>
                  <div className="text-sm text-gray-500">
                    {stats.commentStats?.replied_comments || 0} replied
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-green-500" />
                  <span>Quizzes</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{stats.quizStats?.total_quizzes || 0}</div>
                  <div className="text-sm text-gray-500">
                    {stats.quizStats?.approved_quizzes || 0} approved
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivity?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.slice(0, 8).map((activity: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="text-gray-500">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-600">
                      {activity.type === 'student_enrolled' ? 'Student enrolled in' : 
                       activity.type === 'course_created' ? 'Course created:' :
                       activity.type === 'live_session_created' ? 'Live session created:' : ''}
                      {activity.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={getStatusColor(activity.status)}>
                      {activity.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(activity.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessorAnalytics; 
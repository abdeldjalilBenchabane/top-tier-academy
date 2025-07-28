import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ComposedChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { 
  TrendingUp, Users, DollarSign, BookOpen, Video, Package, 
  Award, Target, Activity, ShoppingCart, Star, Eye
} from 'lucide-react';

interface AnalyticsData {
  userGrowth: Array<{ month: string; newUsers: number }>;
  coursePerformance: Array<{ title: string; professorName: string; enrolledStudents: number; createdAt: string; price: number }>;
  revenue: Array<{ month: string; revenue: number; transactions: number }>;
  liveSessions: Array<{ month: string; totalSessions: number; approvedSessions: number; totalParticipants: number }>;
  userActivity: Array<{ role: string; count: number }>;
  courseCategories: Array<{ material: string; courseCount: number; avgPrice: number }>;
  pointPackages: Array<{ packageName: string; points: number; price: number; salesCount: number; totalRevenue: number }>;
  topPointBuyers: Array<{ name: string; email: string; purchaseCount: number; totalSpent: number; totalPoints: number }>;
  liveSessionPopularity: Array<{ title: string; createdAt: string; participantCount: number; isApproved: boolean }>;
  courseEnrollmentTrends: Array<{ month: string; enrollments: number }>;
  professorSales: Array<{ professorName: string; professorEmail: string; coursesCreated: number; liveSessionsCreated: number; totalEnrollments: number; totalCourseRevenue: number }>;
  studentSpending: Array<{ name: string; email: string; purchaseCount: number; totalSpent: number; totalPoints: number; coursesEnrolled: number; liveSessionsAttended: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

const AnalyticsCharts = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard/analytics');
      setData(response);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString()} DZD`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Activity className="h-12 w-12 mx-auto mb-4" />
        <p>No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.revenue.reduce((sum, item) => sum + item.revenue, 0))}
            </div>
            <p className="text-xs opacity-90">All time earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.userActivity.reduce((sum, item) => sum + item.count, 0)}
            </div>
            <p className="text-xs opacity-90">Total registered users</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Course Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.coursePerformance.reduce((sum, item) => sum + item.enrolledStudents, 0)}
            </div>
            <p className="text-xs opacity-90">Total enrollments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Video className="h-4 w-4" />
              Live Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.liveSessions.reduce((sum, item) => sum + item.totalSessions, 0)}
            </div>
            <p className="text-xs opacity-90">Total sessions created</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & User Growth */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Revenue Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={data.revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={formatMonth}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={formatMonth}
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : value, 
                    name === 'revenue' ? 'Revenue' : 'Transactions'
                  ]}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  fill="#00C49F" 
                  stroke="#00C49F" 
                  fillOpacity={0.3}
                  name="Revenue"
                />
                <Bar dataKey="transactions" fill="#8884d8" name="Transactions" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={formatMonth}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={formatMonth}
                  formatter={(value: number) => [value, 'New Users']}
                />
                <Area 
                  type="monotone" 
                  dataKey="newUsers" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Point Buyers & Package Sales */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Top Point Buyers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topPointBuyers.slice(0, 5).map((buyer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{buyer.name}</p>
                      <p className="text-xs text-gray-500">{buyer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(buyer.totalSpent)}</p>
                    <p className="text-xs text-gray-500">{buyer.purchaseCount} purchases</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Point Package Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.pointPackages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="packageName" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'salesCount' ? value : formatCurrency(value), 
                    name === 'salesCount' ? 'Sales' : 'Revenue'
                  ]}
                />
                <Legend />
                <Bar dataKey="salesCount" fill="#8884d8" name="Sales Count" />
                <Bar dataKey="totalRevenue" fill="#82ca9d" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Course Performance & Live Session Popularity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Top Courses by Enrollment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={data.coursePerformance.slice(0, 8)} 
                margin={{ left: 20, right: 20, top: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="title" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => {
                    return value.length > 15 ? value.substring(0, 15) + '...' : value;
                  }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    value, 
                    name === 'enrolledStudents' ? 'Students' : 'Price'
                  ]}
                  labelFormatter={(label) => `Course: ${label}`}
                />
                <Bar 
                  dataKey="enrolledStudents" 
                  fill="#10B981" 
                  name="Enrolled Students"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            {/* Show full course details in a better format */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Course Details:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.coursePerformance.slice(0, 8).map((course, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        course.enrolledStudents > 0 ? 'bg-green-500' : 'bg-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{course.title}</p>
                        <p className="text-xs text-gray-500">by {course.professorName || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${
                        course.enrolledStudents > 0 ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {course.enrolledStudents}
                      </p>
                      <p className="text-xs text-gray-500">students</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Live Session Popularity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.liveSessionPopularity.slice(0, 5).map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{session.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={session.isApproved ? "default" : "secondary"}>
                          {session.isApproved ? "Approved" : "Pending"}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatMonth(session.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{session.participantCount}</p>
                    <p className="text-xs text-gray-500">participants</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Distribution & Course Categories */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              User Distribution by Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.userActivity}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ role, percent }) => `${role} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.userActivity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Users']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-teal-600" />
              Courses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.courseCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ material, percent }) => `${material} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="courseCount"
                >
                  {data.courseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    value, 
                    name === 'courseCount' ? 'Courses' : formatCurrency(value)
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Live Sessions Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-red-600" />
            Live Sessions Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.liveSessions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatMonth}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={formatMonth}
                formatter={(value: number, name: string) => [
                  value, 
                  name === 'totalSessions' ? 'Total Sessions' : 
                  name === 'approvedSessions' ? 'Approved Sessions' : 'Participants'
                ]}
              />
              <Legend />
              <Bar dataKey="totalSessions" fill="#8884d8" name="Total Sessions" />
              <Bar dataKey="approvedSessions" fill="#82ca9d" name="Approved Sessions" />
              <Line 
                type="monotone" 
                dataKey="totalParticipants" 
                stroke="#ff7300" 
                strokeWidth={3}
                name="Participants"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Course Enrollment Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Course Enrollment Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.courseEnrollmentTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatMonth}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={formatMonth}
                formatter={(value: number) => [value, 'Enrollments']}
              />
              <Line 
                type="monotone" 
                dataKey="enrollments" 
                stroke="#00C49F" 
                strokeWidth={3}
                dot={{ fill: '#00C49F', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Professor Sales Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Top Professors by Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.professorSales.slice(0, 5).map((professor, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{professor.professorName}</p>
                      <p className="text-xs text-gray-500">{professor.professorEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{professor.totalEnrollments} enrollments</p>
                    <p className="text-xs text-gray-500">
                      {professor.coursesCreated} courses, {professor.liveSessionsCreated} lives
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              Top Students by Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.studentSpending.slice(0, 5).map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(student.totalSpent)}</p>
                    <p className="text-xs text-gray-500">
                      {student.coursesEnrolled} courses, {student.liveSessionsAttended} lives
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsCharts; 
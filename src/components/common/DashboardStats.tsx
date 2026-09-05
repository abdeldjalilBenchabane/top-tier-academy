import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Video, Clock, DollarSign, BookOpen, HelpCircle, Image, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard = ({ title, value, description, icon, trend }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="h-4 w-4 text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
      {trend && (
        <div className={`text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}% from last month
        </div>
      )}
    </CardContent>
  </Card>
);

interface DashboardStatsProps {
  userRole: 'admin' | 'professor';
}

const DashboardStats = ({ userRole }: DashboardStatsProps) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchAdminStats();
    } else {
      fetchProfessorStats();
    }
  }, [userRole]);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard/stats');
      setStats(response);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessorStats = async () => {
    try {
      setLoading(true);
      const response = await api.getProfessorDashboardStats();
      setStats(response);
    } catch (error) {
      console.error('Error fetching professor stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (userRole === 'admin' && stats) {
    const adminStats = [
      {
        title: 'Total Users',
        value: stats.stats.totalUsers.toLocaleString(),
        description: 'Active students and professors',
        icon: <Users className="h-4 w-4" />,
        trend: { value: stats.trends.userGrowth, isPositive: stats.trends.userGrowth >= 0 }
      },
      {
        title: 'Total Courses',
        value: stats.stats.totalCourses.toLocaleString(),
        description: 'Published courses',
        icon: <BookOpen className="h-4 w-4" />,
        trend: { value: stats.trends.courseGrowth, isPositive: stats.trends.courseGrowth >= 0 }
      },
      {
        title: 'Pending Approvals',
        value: stats.stats.pendingApprovals,
        description: 'Items awaiting review',
        icon: <Clock className="h-4 w-4" />,
        trend: { value: stats.trends.pendingGrowth, isPositive: stats.trends.pendingGrowth <= 0 }
      },
      {
        title: 'Total Revenue',
        value: `${stats.stats.thisMonthRevenue.toLocaleString()} DZD`,
        description: 'This month',
        icon: <DollarSign className="h-4 w-4" />,
        trend: { value: stats.trends.revenueGrowth, isPositive: stats.trends.revenueGrowth >= 0 }
      },
      {
        title: 'Live Sessions',
        value: stats.stats.totalLiveSessions,
        description: 'Total sessions created',
        icon: <Video className="h-4 w-4" />,
        trend: { value: stats.stats.pendingLiveSessions, isPositive: false }
      },
      {
        title: 'Quizzes',
        value: stats.stats.totalQuizzes,
        description: 'Total quizzes created',
        icon: <HelpCircle className="h-4 w-4" />,
        trend: { value: stats.stats.pendingQuizzes, isPositive: false }
      },
      {
        title: 'Slides',
        value: stats.stats.activeSlides,
        description: 'Active homepage slides',
        icon: <Image className="h-4 w-4" />,
        trend: { value: stats.stats.totalSlides - stats.stats.activeSlides, isPositive: false }
      },
      {
        title: 'Private Classes',
        value: stats.stats.totalPrivateRequests,
        description: 'Total requests',
        icon: <Shield className="h-4 w-4" />,
        trend: { value: stats.stats.pendingPrivateRequests, isPositive: false }
      }
    ];

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {adminStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    );
  }

  if (userRole === 'professor' && stats) {
    const professorStats = [
      {
        title: 'Total Courses',
        value: stats.courseStats.total_courses,
        description: `${stats.courseStats.approved_courses} approved, ${stats.courseStats.pending_courses} pending`,
        icon: <BookOpen className="h-4 w-4" />,
        trend: { value: stats.courseStats.approved_courses, isPositive: true }
      },
      {
        title: 'Total Students',
        value: stats.studentStats.total_students,
        description: `${stats.studentStats.total_enrollments} total enrollments`,
        icon: <Users className="h-4 w-4" />,
        trend: { value: stats.studentStats.total_enrollments, isPositive: true }
      },
      {
        title: 'Live Sessions',
        value: stats.liveSessionStats.total_sessions,
        description: `${stats.liveSessionStats.scheduled_sessions} scheduled, ${stats.liveSessionStats.live_sessions} live`,
        icon: <Video className="h-4 w-4" />,
        trend: { value: stats.liveSessionStats.scheduled_sessions, isPositive: true }
      },
      {
        title: 'الدورات',
        value: stats.liveSectionStats.total_sections,
        description: `${stats.liveSectionStats.active_sections} مقبولة, ${stats.liveSectionStats.pending_sections} قيد المراجعة`,
        icon: <Video className="h-4 w-4" />,
        trend: { value: stats.liveSectionStats.active_sections, isPositive: true }
      },
      {
        title: 'Private Classes',
        value: stats.privateClassStats.total_requests,
        description: `${stats.privateClassStats.accepted_requests} accepted, ${stats.privateClassStats.pending_requests} pending`,
        icon: <Users className="h-4 w-4" />,
        trend: { value: stats.privateClassStats.accepted_requests, isPositive: true }
      },
      {
        title: 'Comments',
        value: stats.commentStats.total_comments,
        description: `${stats.commentStats.replied_comments} replied, ${stats.commentStats.pending_replies} pending`,
        icon: <HelpCircle className="h-4 w-4" />,
        trend: { value: stats.commentStats.replied_comments, isPositive: true }
      },
      {
        title: 'Quizzes',
        value: stats.quizStats.total_quizzes,
        description: `${stats.quizStats.approved_quizzes} approved, ${stats.quizStats.pending_quizzes} pending`,
        icon: <HelpCircle className="h-4 w-4" />,
        trend: { value: stats.quizStats.approved_quizzes, isPositive: true }
      },
      {
        title: 'Upcoming Sessions',
        value: stats.upcomingSessions.length,
        description: 'Next 7 days',
        icon: <Clock className="h-4 w-4" />,
        trend: { value: stats.upcomingSessions.length, isPositive: true }
      }
    ];

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {professorStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    );
  }

  return null;
};

export default DashboardStats;

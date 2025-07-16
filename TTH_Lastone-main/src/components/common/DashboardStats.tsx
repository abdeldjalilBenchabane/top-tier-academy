import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Video, Clock, DollarSign } from 'lucide-react';

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
  // Mock data - in a real app, this would come from API calls
  const adminStats = [
    {
      title: 'Total Users',
      value: 1247,
      description: 'Active students and professors',
      icon: <Users className="h-4 w-4" />,
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Total Courses',
      value: 89,
      description: 'Published courses',
      icon: <Video className="h-4 w-4" />,
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Pending Approvals',
      value: 12,
      description: 'Courses awaiting review',
      icon: <Clock className="h-4 w-4" />,
      trend: { value: 3, isPositive: false }
    },
    {
      title: 'Total Revenue',
      value: '$24,580',
      description: 'This month',
      icon: <DollarSign className="h-4 w-4" />,
      trend: { value: 15, isPositive: true }
    }
  ];

  const professorStats = [
    {
      title: 'My Courses',
      value: 8,
      description: 'Published courses',
      icon: <Video className="h-4 w-4" />,
      trend: { value: 2, isPositive: true }
    },
    {
      title: 'Total Students',
      value: 324,
      description: 'Enrolled across all courses',
      icon: <Users className="h-4 w-4" />,
      trend: { value: 18, isPositive: true }
    },
    {
      title: 'Live Sessions',
      value: 5,
      description: 'Scheduled this week',
      icon: <Clock className="h-4 w-4" />,
    },
    {
      title: 'Monthly Earnings',
      value: '$3,240',
      description: 'From course sales',
      icon: <DollarSign className="h-4 w-4" />,
      trend: { value: 22, isPositive: true }
    }
  ];

  const stats = userRole === 'admin' ? adminStats : professorStats;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default DashboardStats;

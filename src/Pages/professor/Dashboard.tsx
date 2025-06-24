import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import DashboardStats from '@/components/common/DashboardStats';
import LiveSessions from '@/components/professor/LiveSessions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QuizResults from '@/components/professor/QuizResults';

const ProfessorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Welcome back, ${user?.name}!`}
        description="Manage your courses, quizzes, and live sessions"
      />
      
      <DashboardStats userRole="professor" />
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="live-sessions">Live Sessions</TabsTrigger>
          <TabsTrigger value="quiz-results">Quiz Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>New student enrolled in React Fundamentals</span>
                  <span className="text-gray-500">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Course "Advanced JavaScript" approved</span>
                  <span className="text-gray-500">1 day ago</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Quiz "React Basics" submitted for review</span>
                  <span className="text-gray-500">1 day ago</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Live session completed</span>
                  <span className="text-gray-500">2 days ago</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/professor/create')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
                >
                  Create new course
                </button>
                <button 
                  onClick={() => navigate('/professor/quiz')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
                >
                  Create new quiz
                </button>
                <button 
                  onClick={() => navigate('/professor/results')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
                >
                  View quiz results
                </button>
                <button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm">
                  Schedule live session
                </button>
                <button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm">
                  View student feedback
                </button>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="live-sessions">
          <LiveSessions professorId={user?.id || '1'} />
        </TabsContent>
        
        <TabsContent value="quiz-results">
          <QuizResults professorId={user?.id || '1'} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfessorDashboard;

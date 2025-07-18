import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { Toaster as Sonner } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { AuthProvider } from './contexts/AuthContext';
import { AvatarProvider } from './contexts/AvatarContext';


// TTH Pages
import TTHHome from './Pages/TTHHome';
import TTHFormulair from './Pages/TTHFormulair';
import TTHLogin from './Pages/TTHLogin';
import TTHForgotPassword from './Pages/TTHForgotPassword';
import TTHResetPassword from './Pages/TTHResetPassword';
import TTHCourseDetail from './Pages/TTHCourseDetails';
import TTHStudentDashboard from './Pages/TTHStudentDashboard.jsx';
import TTHCourses from './Pages/TTHCourses';
import TTHLanguages from './Pages/TTHLanguages';
import TTHLiveClasses from './Pages/TTHLiveClasses';
import Streaming from './Pages/Streaming';
import TTHSession from './Pages/TTHSession';
import TTHPrivateClasses from './Pages/TTHPrivateClasses';
import TTHTeacherProfile from './Pages/TTHTeacherProfile';
import PointsPurchase from './Pages/PointsPurchase';
import PointsSuccess from './Pages/PointsSuccess';
import PointsFailure from './Pages/PointsFailure';
import PointsHistory from './Pages/PointsHistory';

// Schoolhouse Layouts & Pages
import AppLayout from './components/layouts/AppLayout';
import Login from './Pages/Login';
import ForgotPassword from './Pages/ForgotPassword';
import ResetPassword from './Pages/ResetPassword';
import NotFound from './Pages/NotFound';
import Index from './Pages/Index';
// Admin
import AdminDashboard from './Pages/admin/Dashboard';
import AdminStructure from './Pages/admin/Structure';
import AdminPending from './Pages/admin/Pending';
import AdminCourses from './Pages/admin/Courses';
import AdminCourseDetails from './Pages/admin/CourseDetails';
import AdminSettings from './Pages/admin/Settings';
import CourseFilesPage from './Pages/admin/CourseFiles';
import AdminPoints from './Pages/admin/Points';
// Professor
import ProfessorDashboard from './Pages/professor/Dashboard';
import ProfessorCourses from './Pages/professor/Courses';
import ProfessorCreate from './Pages/professor/Create';
import ProfessorSettings from './Pages/professor/Settings';
import ProfessorCourseDetails from './Pages/professor/CourseDetails';
import ProfessorComments from './Pages/professor/Comments';
import CourseCommentsOverview from './Pages/professor/CourseCommentsOverview';
import CourseComments from './Pages/professor/CourseComments';
import ProfessorPrivateClasses from './Pages/professor/PrivateClasses';
// Admin components
import UserManagement from './components/admin/UserManagement';
import HomepageSlides from './components/admin/HomepageSlides';
import EnhancedHomepageSlides from './components/admin/EnhancedHomepageSlides';
import LiveSessionApprovals from './Pages/admin/LiveSessionApprovals';
import QuizManagement from './components/admin/QuizManagement';
// Professor components
import QuizCreation from './components/professor/QuizCreation';
import QuizResults from './components/professor/QuizResults';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const LandingPage = () => <Navigate to="/" replace />;

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AvatarProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* TTH always public */}
                <Route path="/" element={<TTHHome />} />
                <Route path="/register" element={<TTHFormulair />} />
                <Route path="/login" element={<TTHLogin />} />
                <Route path="/forgot-password" element={<TTHForgotPassword />} />
                <Route path="/reset-password" element={<TTHResetPassword />} />
                <Route path="/description" element={<TTHCourseDetail />} />
                <Route path="/TTHStudentDashboard" element={<TTHStudentDashboard />} />
                <Route path="/TTHCourses" element={<TTHCourses />} />
                <Route path="/TTHLanguages" element={<TTHLanguages />} />
                <Route path="/TTHLiveClasses" element={<TTHLiveClasses />} />
                <Route path="/streaming/:id" element={<Streaming />} />
                <Route path="/TTHSession" element={<TTHSession />} />
                <Route path="/TTHPrivateClasses" element={<TTHPrivateClasses />} />
                <Route path="/TTHTeacherProfile" element={<TTHTeacherProfile />} />
                <Route path="/profile" element={<TTHStudentDashboard />} />
                <Route path="/coursesList/courses/:id" element={<TTHCourseDetail />} />
                <Route path="/TTHStudentDashboard" element={<TTHStudentDashboard />} />
                <Route path="/points" element={<PointsPurchase />} />
                <Route path="/points/success" element={<PointsSuccess />} />
                <Route path="/points/failure" element={<PointsFailure />} />
                <Route path="/points/history" element={<PointsHistory />} />


                {/* Schoolhouse public */}
                <Route path="/schoolhouse/login" element={<Login />} />
                <Route path="/schoolhouse/forgot-password" element={<ForgotPassword />} />
                <Route path="/schoolhouse/reset-password" element={<ResetPassword />} />
                <Route path="/schoolhouse" element={<Index />} />

                {/* Admin (protected) */}
                <Route path="/admin/*" element={<AppLayout />}>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="structure" element={<AdminStructure />} />
                  <Route path="pending" element={<AdminPending />} />
                  <Route path="courses" element={<AdminCourses />} />
                  <Route path="courses/:courseId" element={<AdminCourseDetails />} />
                  <Route path="course-files" element={<CourseFilesPage />} />
                  <Route path="quizzes" element={<QuizManagement />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="slides" element={<HomepageSlides />} />
                  <Route path="enhanced-slides" element={<EnhancedHomepageSlides />} />
                  <Route path="live-sessions" element={<LiveSessionApprovals />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="points" element={<AdminPoints />} />
                </Route>

                {/* Professor (protected) */}
                <Route path="/professor/*" element={<AppLayout />}>
                  <Route path="dashboard" element={<ProfessorDashboard />} />
                  <Route path="courses" element={<ProfessorCourses />} />
                  <Route path="courses/:id" element={<ProfessorCourseDetails />} />
                  <Route path="create" element={<ProfessorCreate />} />
                  <Route path="quiz" element={<QuizCreation />} />
                  <Route path="results" element={<QuizResults professorId="1" />} />
                  <Route path="settings" element={<ProfessorSettings />} />
                  <Route path="comments" element={<CourseCommentsOverview />} />
                  <Route path="comments/:courseId" element={<CourseComments />} />
                  <Route path="comments-old" element={<ProfessorComments />} />
                  <Route path="private-classes" element={<ProfessorPrivateClasses />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AvatarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App; 
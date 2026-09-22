import React, { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { Toaster as Sonner } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { AuthProvider } from './contexts/AuthContext';
import { PurchaseConfirmProvider } from './components/ui/TTHPurchaseConfirm';
import { AvatarProvider } from './contexts/AvatarContext';
import { PendingCountProvider } from './contexts/PendingCountContext';
import { LiveSessionsCountProvider } from './contexts/LiveSessionsCountContext';
import { PendingQuizzesCountProvider } from './contexts/PendingQuizzesCountContext';
import { PendingPrivateClassesCountProvider } from './contexts/PendingPrivateClassesCountContext';

// Lazy load all page components
// TTH Pages
const TTHHome = lazy(() => import('./Pages/TTHHome'));
const TTHFormulair = lazy(() => import('./Pages/TTHFormulair'));
const TTHLogin = lazy(() => import('./Pages/TTHLogin'));
const TTHForgotPassword = lazy(() => import('./Pages/TTHForgotPassword'));
const TTHResetPassword = lazy(() => import('./Pages/TTHResetPassword'));
const TTHCourseDetail = lazy(() => import('./Pages/TTHCourseDetails'));
const TTHStudentDashboard = lazy(() => import('./Pages/TTHStudentDashboard.jsx'));
const TTHCourses = lazy(() => import('./Pages/TTHCourses'));
const TTHLanguages = lazy(() => import('./Pages/TTHLanguages'));
const TTHLiveClasses = lazy(() => import('./Pages/TTHLiveClasses'));
const Streaming = lazy(() => import('./Pages/Streaming'));
const TTHSession = lazy(() => import('./Pages/TTHSession'));
const TTHPrivateClasses = lazy(() => import('./Pages/TTHPrivateClasses'));
const TTHTeacherProfile = lazy(() => import('./Pages/TTHTeacherProfile'));
const PointsPurchase = lazy(() => import('./Pages/PointsPurchase'));
const PointsSuccess = lazy(() => import('./Pages/PointsSuccess'));
const PointsFailure = lazy(() => import('./Pages/PointsFailure'));
const PointsHistory = lazy(() => import('./Pages/PointsHistory'));
const TTHPrivacyPolicy = lazy(() => import('./Pages/TTHPrivacyPolicy'));
const TTHSecurity = lazy(() => import('./Pages/TTHSecurity'));
const TTHDeleteAccount = lazy(() => import('./Pages/TTHDeleteAccount'));

// Schoolhouse Layouts & Pages
const AppLayout = lazy(() => import('./components/layouts/AppLayout'));
const Login = lazy(() => import('./Pages/Login'));
const ForgotPassword = lazy(() => import('./Pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./Pages/ResetPassword'));
const NotFound = lazy(() => import('./Pages/NotFound'));
const Index = lazy(() => import('./Pages/Index'));

// Admin Pages
const AdminDashboard = lazy(() => import('./Pages/admin/Dashboard'));
const AdminStructure = lazy(() => import('./Pages/admin/Structure'));
const AdminPending = lazy(() => import('./Pages/admin/Pending'));
const AdminCourses = lazy(() => import('./Pages/admin/Courses'));
const AdminCourseDetails = lazy(() => import('./Pages/admin/CourseDetails'));
const AdminSettings = lazy(() => import('./Pages/admin/Settings'));
const AdminLiveSections = lazy(() => import('./Pages/admin/LiveSections'));
const SendNotification = lazy(() => import('./Pages/admin/SendNotification'));
const AdminPurchases = lazy(() => import('./Pages/admin/Purchases'));
const AdminLiveSectionDetails = lazy(() => import('./Pages/admin/LiveSectionDetails'));
const AdminMobileApp = lazy(() => import('./Pages/admin/MobileApp'));
const CourseFilesPage = lazy(() => import('./Pages/admin/CourseFiles'));
const AdminPoints = lazy(() => import('./Pages/admin/Points'));
const AdminPointCodes = lazy(() => import('./Pages/admin/PointCodes'));
const AdminPointTransactions = lazy(() => import('./Pages/admin/PointTransactions'));
const AdminPrivateClassSettings = lazy(() => import('./Pages/admin/PrivateClassSettings'));
const HomepageMaterials = lazy(() => import('./Pages/admin/HomepageMaterials'));
const FooterContent = lazy(() => import('./Pages/admin/FooterContent'));
const PrivateClasses = lazy(() => import('./Pages/admin/PrivateClasses'));
const PricingManagement = lazy(() => import('./Pages/admin/PricingManagement'));
const EarningsAnalytics = lazy(() => import('./Pages/admin/EarningsAnalytics'));
const StudentComments = lazy(() => import('./components/admin/StudentComments'));
const AdminTeacherCourses = lazy(() => import('./Pages/admin/AdminTeacherCourses'));
const AdminCourseComments = lazy(() => import('./Pages/admin/AdminCourseComments'));
const LiveSectionStudentComments = lazy(() => import('./components/admin/LiveSectionStudentComments'));
const AdminTeacherLiveSections = lazy(() => import('./Pages/admin/AdminTeacherLiveSections'));
const AdminLiveSectionComments = lazy(() => import('./Pages/admin/AdminLiveSectionComments'));

// Professor Pages
const ProfessorDashboard = lazy(() => import('./Pages/professor/Dashboard'));
const ProfessorCourses = lazy(() => import('./Pages/professor/Courses'));
const ProfessorCreate = lazy(() => import('./Pages/professor/Create'));
const LiveSectionsPage = lazy(() => import('./Pages/professor/LiveSections'));
const ProfessorSettings = lazy(() => import('./Pages/professor/Settings'));
const ProfessorCourseDetails = lazy(() => import('./Pages/professor/CourseDetails'));
const ProfessorComments = lazy(() => import('./Pages/professor/Comments'));
const CourseCommentsOverview = lazy(() => import('./Pages/professor/CourseCommentsOverview'));
const CourseComments = lazy(() => import('./Pages/professor/CourseComments'));
const ProfessorPrivateClasses = lazy(() => import('./Pages/professor/PrivateClasses'));
const MyStudents = lazy(() => import('./Pages/professor/MyStudents'));
const LiveSessionsPage = lazy(() => import('./Pages/professor/LiveSessionsPage'));
const EditLiveSessionPage = lazy(() => import('./Pages/professor/EditLiveSession'));
const CreateLiveSessionPage = lazy(() => import('./Pages/professor/CreateLiveSession'));

// Admin components
const UserManagement = lazy(() => import('./components/admin/UserManagement'));
const HomepageSlides = lazy(() => import('./components/admin/HomepageSlides'));
const EnhancedHomepageSlides = lazy(() => import('./components/admin/EnhancedHomepageSlides'));
const LiveSessionApprovals = lazy(() => import('./Pages/admin/LiveSessionApprovals'));
const LiveSessionDetails = lazy(() => import('./Pages/LiveSessionDetails'));
const LiveSessionsOverview = lazy(() => import('./components/admin/LiveSessionsOverview'));
const QuizManagement = lazy(() => import('./components/admin/QuizManagement'));

// Professor live-section comments
const ProfessorLiveSectionCommentsOverview = lazy(() => import('./Pages/professor/LiveSectionCommentsOverview'));
const ProfessorLiveSectionComments = lazy(() => import('./Pages/professor/LiveSectionComments'));

// Professor components
const QuizCreation = lazy(() => import('./components/professor/QuizCreation'));
const QuizResults = lazy(() => import('./Pages/professor/QuizResults'));
const MyQuizzes = lazy(() => import('./Pages/professor/MyQuizzes'));
const EditQuiz = lazy(() => import('./Pages/professor/EditQuiz'));
const QuizTaking = lazy(() => import('./components/student/QuizTaking'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
);

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
        <PurchaseConfirmProvider>
        <AvatarProvider>
          <PendingCountProvider>
            <LiveSessionsCountProvider>
              <PendingQuizzesCountProvider>
                <PendingPrivateClassesCountProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <Suspense fallback={<LoadingSpinner />}>
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
                          <Route path="/TTHLanguages/livesection/:id" element={<LiveSessionDetails />} />
                          <Route path="/TTHStudentDashboard" element={<TTHStudentDashboard />} />
                          <Route path="/points" element={<PointsPurchase />} />
                          <Route path="/points/success" element={<PointsSuccess />} />
                          <Route path="/points/failure" element={<PointsFailure />} />
                          <Route path="/points/history" element={<PointsHistory />} />
                          <Route path="/quiz/:quizId" element={<QuizTaking />} />
                          <Route path="/privacy-policy" element={<TTHPrivacyPolicy />} />
                          <Route path="/security" element={<TTHSecurity />} />
                          <Route path="/delete-account" element={<TTHDeleteAccount />} />

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
                            <Route path="live-sessions" element={<LiveSessionsOverview />} />
                            <Route path="live-sessions/:sessionId/edit" element={<EditLiveSessionPage asAdmin />} />
                            <Route path="live-sections" element={<AdminLiveSections />} />
                            <Route path="send-notification" element={<SendNotification />} />
                            <Route path="live-sections/:sectionId" element={<AdminLiveSectionDetails />} />
                            <Route path="purchases" element={<AdminPurchases />} />
                            <Route path="mobile" element={<AdminMobileApp />} />
                            <Route path="settings" element={<AdminSettings />} />
                            <Route path="points" element={<AdminPoints />} />
                            <Route path="point-codes" element={<AdminPointCodes />} />
                            <Route path="point-transactions" element={<AdminPointTransactions />} />
                            <Route path="private-class-settings" element={<AdminPrivateClassSettings />} />
                            <Route path="private-classes" element={<PrivateClasses />} />
                            <Route path="homepage-materials" element={<HomepageMaterials />} />
                            <Route path="footer-content" element={<FooterContent />} />
                            <Route path="pricing" element={<PricingManagement />} />
                            <Route path="earnings" element={<EarningsAnalytics />} />
                            <Route path="comments" element={<StudentComments />} />
                            <Route path="comments/professor/:professorId" element={<AdminTeacherCourses />} />
                            <Route path="comments/course/:courseId" element={<AdminCourseComments />} />
                            <Route path="live-section-comments" element={<LiveSectionStudentComments />} />
                            <Route path="live-section-comments/professor/:professorId" element={<AdminTeacherLiveSections />} />
                            <Route path="live-section-comments/section/:sectionId" element={<AdminLiveSectionComments />} />
                          </Route>

                          {/* Professor (protected) */}
                          <Route path="/professor/*" element={<AppLayout />}>
                            <Route path="dashboard" element={<ProfessorDashboard />} />
                            <Route path="courses" element={<ProfessorCourses />} />
                            <Route path="courses/:id" element={<ProfessorCourseDetails />} />
                            <Route path="create" element={<ProfessorCreate />} />
                            <Route path="live-sections" element={<LiveSectionsPage />} />
                            <Route path="live-sessions" element={<LiveSessionsPage />} />
                            <Route path="live-sessions/:sessionId/edit" element={<EditLiveSessionPage />} />
                            <Route path="create-live-session" element={<CreateLiveSessionPage />} />
                            <Route path="quiz" element={<QuizCreation />} />
                            <Route path="edit-quiz/:id" element={<EditQuiz />} />
                            <Route path="results" element={<QuizResults />} />
                            <Route path="my-quizzes" element={<MyQuizzes />} />
                            <Route path="settings" element={<ProfessorSettings />} />
                            <Route path="comments" element={<CourseCommentsOverview />} />
                            <Route path="comments/:courseId" element={<CourseComments />} />
                            <Route path="private-classes" element={<ProfessorPrivateClasses />} />
                            <Route path="my-students" element={<MyStudents />} />
                            <Route path="live-section-comments" element={<ProfessorLiveSectionCommentsOverview />} />
                            <Route path="live-section-comments/:sectionId" element={<ProfessorLiveSectionComments />} />
                          </Route>

                          {/* Catch all */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </BrowserRouter>
                  </TooltipProvider>
                </PendingPrivateClassesCountProvider>
              </PendingQuizzesCountProvider>
            </LiveSessionsCountProvider>
          </PendingCountProvider>
        </AvatarProvider>
        </PurchaseConfirmProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
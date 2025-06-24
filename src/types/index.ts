
// Define all our types for the application

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'professor' | 'student';
};

export type Level = {
  id: string;
  name: string;
};

export type Year = {
  id: string;
  name: string;
  levelId: string;
};

export type Speciality = {
  id: string;
  name: string;
  yearId: string;
};

export type Material = {
  id: string;
  name: string;
  specialityId: string;
  price?: number;
};

export type ContentBlock = {
  id: string;
  type: 'text' | 'video' | 'image' | 'pdf';
  title?: string;
  content: string;
  fileType?: string;
  fileSize?: number;
  fileUrl?: string;
};

export type Section = {
  id: string;
  title: string;
  blocks: ContentBlock[];
};

export type Course = {
  id: string;
  title: string;
  description: string;
  sections: Section[];
  materialId?: string;
  createdBy: string;
  createdAt: string;
  approvedAt?: string;
  price?: number;
};

export type PendingCourse = Omit<Course, "materialId" | "approvedAt"> & {
  status: 'pending' | 'rejected' | 'approved' | 'under_review' | 'needs_revision';
  rejectionReason?: string;
  rejectedAt?: string;
  approvedAt?: string;
  materialId?: string;
  reviewedBy?: string;
  price?: number;
};

export type HomeSlide = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  videoUrl?: string;
  mediaType: 'image' | 'video';
  order: number;
  isActive: boolean;
  duration?: number;
  startDate?: string;
  endDate?: string;
  targetAudience?: ('admin' | 'professor' | 'student')[];
  ctaText?: string;
  ctaLink?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  transition?: 'fade' | 'slide' | 'zoom' | 'none';
  altText?: string;
  views?: number;
  clicks?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type LiveSession = {
  id: string;
  title: string;
  description: string;
  courseId: string;
  professorId: string;
  scheduledAt: string;
  duration: number;
  meetingUrl?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled' | 'starting' | 'paused' | 'technical_issues';
  attendeesCount?: number;
  maxAttendees?: number;
  recordingUrl?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isRecorded?: boolean;
  materialId?: string;
};

export type Breadcrumb = {
  name: string;
  href: string;
  current?: boolean;
};

export type NavigationItem = {
  id: string;
  name: string;
  path: string;
};

export type Quiz = {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  materialId?: string;
  createdBy: string;
  createdAt: string;
  timeLimit?: number;
  passingScore: number;
  maxAttempts?: number;
  isActive: boolean;
};

export type QuizQuestion = {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string | number;
  points: number;
  explanation?: string;
};

export type PendingQuiz = Omit<Quiz, "materialId" | "isActive"> & {
  status: 'pending' | 'rejected' | 'approved' | 'under_review' | 'needs_revision';
  rejectionReason?: string;
  rejectedAt?: string;
  approvedAt?: string;
  materialId?: string;
  reviewedBy?: string;
};

export type QuizAttempt = {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  answers: QuizAnswer[];
  score: number;
  totalPoints: number;
  passed: boolean;
  startedAt: string;
  completedAt: string;
  timeSpent: number;
};

export type QuizAnswer = {
  questionId: string;
  answer: string | number | boolean;
  isCorrect: boolean;
  pointsEarned: number;
};

export type QuizResults = {
  quiz: Quiz;
  attempts: QuizAttempt[];
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  averageTimeSpent: number;
};

export type SlideAnalytics = {
  id: string;
  slideId: string;
  views: number;
  clicks: number;
  engagementRate: number;
  date: string;
};

export type BulkOperation = {
  action: 'activate' | 'deactivate' | 'delete' | 'duplicate';
  slideIds: string[];
};

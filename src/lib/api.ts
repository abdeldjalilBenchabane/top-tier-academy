import { User, Level, Year, Speciality, Material, Course, PendingCourse, ContentBlock, HomeSlide, LiveSession, Quiz, QuizQuestion, PendingQuiz, QuizAttempt, QuizAnswer, QuizResults } from '@/types';
import { getAuthToken } from '@/services/api';

// Configurable API base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin + '/api' : '/api');

// Mock data (replace with actual API calls later)
let mockData = {
  users: [
    { id: '1', name: 'John Smith', email: 'smith@school.edu', role: 'professor' },
    { id: '2', name: 'Alice Johnson', email: 'admin@school.edu', role: 'admin' },
    { id: '3', name: 'Bob Wilson', email: 'bob@school.edu', role: 'student' },
    { id: '4', name: 'Dr. Sarah Chen', email: 'chen@school.edu', role: 'professor' },
    { id: '5', name: 'Prof. Michael Brown', email: 'brown@school.edu', role: 'professor' },
  ] as User[],
  levels: [
    { id: '1', name: 'High School' },
    { id: '2', name: 'Middle School' },
  ] as Level[],
  years: [
    { id: '1', name: 'First Year', levelId: '1' },
    { id: '2', name: 'Second Year', levelId: '1' },
    { id: '3', name: 'Third Year', levelId: '2' },
  ] as Year[],
  specialities: [
    { id: '1', name: 'Mathematics', yearId: '1' },
    { id: '2', name: 'Computer Science', yearId: '1' },
    { id: '3', name: 'Physics', yearId: '2' },
  ] as Speciality[],
  materials: [
    { id: '1', name: 'Algebra', specialityId: '1', price: 99.99 },
    { id: '2', name: 'Web Development', specialityId: '2', price: 149.99 },
    { id: '3', name: 'Mechanics', specialityId: '3', price: 129.99 },
  ] as Material[],
  courses: [] as Course[],
  pendingCourses: [
    {
      id: '4',
      title: 'Introduction to React',
      description: 'Learn the basics of React',
      sections: [
        {
          id: '1',
          title: 'Section 1',
          blocks: [
            {
              id: '1',
              type: 'text',
              title: 'Introduction',
              content: 'Welcome to the course!',
            },
          ],
        },
      ],
      createdBy: '1',
      createdAt: new Date().toISOString(),
      status: 'pending',
    },
  ] as PendingCourse[],
  quizzes: [] as Array<Quiz & { materialId?: string }>,
  pendingQuizzes: [
    {
      id: '1',
      title: 'React Fundamentals Quiz',
      description: 'Test your knowledge of React basics',
      questions: [
        {
          id: 'q1',
          question: 'What is JSX?',
          type: 'multiple-choice',
          options: ['JavaScript XML', 'Java Syntax Extension', 'JSON XML', 'JavaScript Extension'],
          correctAnswer: 0,
          points: 2,
          explanation: 'JSX stands for JavaScript XML and allows you to write HTML-like syntax in JavaScript.'
        },
        {
          id: 'q2',
          question: 'React components must return a single parent element.',
          type: 'true-false',
          correctAnswer: true,
          points: 1,
          explanation: 'React components must return a single parent element or use React Fragments.'
        }
      ],
      createdBy: '1',
      createdAt: new Date().toISOString(),
      timeLimit: 30,
      passingScore: 70,
      maxAttempts: 3,
      status: 'pending'
    }
  ] as PendingQuiz[],
  quizAttempts: [
    {
      id: '1',
      quizId: '1',
      studentId: '3',
      studentName: 'Bob Wilson',
      answers: [
        {
          questionId: 'q1',
          answer: 0,
          isCorrect: true,
          pointsEarned: 2
        },
        {
          questionId: 'q2',
          answer: false,
          isCorrect: false,
          pointsEarned: 0
        }
      ],
      score: 67,
      totalPoints: 3,
      passed: false,
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
      timeSpent: 15
    },
    {
      id: '2',
      quizId: '1',
      studentId: '3',
      studentName: 'Bob Wilson',
      answers: [
        {
          questionId: 'q1',
          answer: 0,
          isCorrect: true,
          pointsEarned: 2
        },
        {
          questionId: 'q2',
          answer: true,
          isCorrect: true,
          pointsEarned: 1
        }
      ],
      score: 100,
      totalPoints: 3,
      passed: true,
      startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000).toISOString(),
      timeSpent: 12
    }
  ] as QuizAttempt[],
  homeSlides: [
    {
      id: '1',
      title: 'Welcome to SchoolHouse',
      description: 'Discover amazing courses and enhance your learning experience',
      imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=400&fit=crop',
      mediaType: 'image' as const,
      order: 1,
      isActive: true,
      duration: 5,
      altText: 'Students learning with laptops',
      views: 1250,
      clicks: 45,
      transition: 'fade' as const,
      overlayColor: '#000000',
      overlayOpacity: 0.3,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Expert Instructors',
      description: 'Learn from industry professionals and experienced educators',
      imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop',
      mediaType: 'image' as const,
      order: 2,
      isActive: true,
      duration: 6,
      altText: 'Programming code on screen',
      views: 980,
      clicks: 32,
      transition: 'slide' as const,
      overlayColor: '#1a1a1a',
      overlayOpacity: 0.4,
      ctaText: 'Browse Courses',
      ctaLink: '/courses',
      targetAudience: ['student', 'professor'],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ] as HomeSlide[],
  liveSessions: [
    {
      id: '1',
      title: 'Advanced React Patterns',
      description: 'Deep dive into advanced React concepts and patterns',
      courseId: '1',
      professorId: '1',
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      duration: 90,
      meetingUrl: 'https://meet.example.com/react-patterns',
      status: 'scheduled',
      attendeesCount: 0,
      maxAttendees: 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['React', 'JavaScript', 'Advanced'],
      isRecorded: true,
    },
    {
      id: '2',
      title: 'Mathematics Fundamentals',
      description: 'Basic algebra and geometry concepts',
      courseId: '2',
      professorId: '4',
      scheduledAt: new Date().toISOString(), // Now
      duration: 60,
      meetingUrl: 'https://meet.example.com/math-fundamentals',
      status: 'live',
      attendeesCount: 23,
      maxAttendees: 30,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['Mathematics', 'Basics'],
      isRecorded: false,
    },
    {
      id: '3',
      title: 'Physics Lab Session',
      description: 'Interactive physics experiments and demonstrations',
      courseId: '3',
      professorId: '5',
      scheduledAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      duration: 120,
      meetingUrl: 'https://meet.example.com/physics-lab',
      status: 'ended',
      attendeesCount: 18,
      maxAttendees: 25,
      recordingUrl: 'https://recordings.example.com/physics-lab-123',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      tags: ['Physics', 'Lab', 'Interactive'],
      isRecorded: true,
    },
    {
      id: '4',
      title: 'Database Design Workshop',
      description: 'Learn SQL and database optimization techniques',
      courseId: '4',
      professorId: '1',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      duration: 180,
      meetingUrl: 'https://meet.example.com/database-workshop',
      status: 'cancelled',
      attendeesCount: 0,
      maxAttendees: 40,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['Database', 'SQL', 'Workshop'],
      isRecorded: true,
    },
    {
      id: '5',
      title: 'Web Development Bootcamp',
      description: 'Comprehensive web development training session',
      courseId: '5',
      professorId: '4',
      scheduledAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      duration: 150,
      meetingUrl: 'https://meet.example.com/web-bootcamp',
      status: 'starting',
      attendeesCount: 5,
      maxAttendees: 35,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['Web Development', 'HTML', 'CSS', 'JavaScript'],
      isRecorded: true,
    },
    {
      id: '6',
      title: 'Machine Learning Basics',
      description: 'Introduction to ML algorithms and concepts',
      courseId: '6',
      professorId: '5',
      scheduledAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      duration: 90,
      meetingUrl: 'https://meet.example.com/ml-basics',
      status: 'technical_issues',
      attendeesCount: 12,
      maxAttendees: 30,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['Machine Learning', 'AI', 'Python'],
      isRecorded: false,
    }
  ] as LiveSession[],
  notifications: [
    {
      id: '1',
      type: 'live_session_scheduled' as const,
      message: 'Dr. Sarah Chen has scheduled a new live session: "Mathematics Fundamentals"',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      read: false,
      sessionId: '2',
    },
    {
      id: '2',
      type: 'live_session_started' as const,
      message: 'Live session "Mathematics Fundamentals" by Dr. Sarah Chen has started',
      createdAt: new Date().toISOString(),
      read: false,
      sessionId: '2',
    }
  ] as Array<{
    id: string;
    type: 'live_session_scheduled' | 'live_session_started';
    message: string;
    createdAt: string;
    read: boolean;
    sessionId: string;
  }>,
};

// Utility function to simulate API delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const api = {
  login: async (email: string, password: string): Promise<User> => {
    await delay(500);
    const user = mockData.users.find(user => user.email === email);
    if (user) {
      return user;
    } else {
      throw new Error('Invalid credentials');
    }
  },

  getUsers: async (): Promise<User[]> => {
    await delay(500);
    return mockData.users;
  },
  createUser: async (user: Omit<User, 'id'>): Promise<User> => {
    await delay(500);
    const newUser: User = { id: String(Date.now()), ...user };
    mockData.users.push(newUser);
    return newUser;
  },
  updateUser: async (userId: string, updates: Partial<User>): Promise<User> => {
    await delay(500);
    const userIndex = mockData.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    mockData.users[userIndex] = { ...mockData.users[userIndex], ...updates };
    return mockData.users[userIndex];
  },
  deleteUser: async (userId: string): Promise<void> => {
    await delay(500);
    mockData.users = mockData.users.filter(u => u.id !== userId);
  },

  getHomeSlides: async (): Promise<HomeSlide[]> => {
    await delay(500);
    return mockData.homeSlides.sort((a, b) => a.order - b.order);
  },
  createHomeSlide: async (slide: Omit<HomeSlide, 'id'>): Promise<HomeSlide> => {
    await delay(500);
    const newSlide: HomeSlide = {
      id: String(Date.now()),
      ...slide,
      views: 0,
      clicks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockData.homeSlides.push(newSlide);
    return newSlide;
  },
  updateHomeSlide: async (slideId: string, updates: Partial<HomeSlide>): Promise<HomeSlide> => {
    await delay(500);
    const slideIndex = mockData.homeSlides.findIndex(s => s.id === slideId);
    if (slideIndex === -1) throw new Error('Slide not found');

    mockData.homeSlides[slideIndex] = {
      ...mockData.homeSlides[slideIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return mockData.homeSlides[slideIndex];
  },
  deleteHomeSlide: async (slideId: string): Promise<void> => {
    await delay(500);
    mockData.homeSlides = mockData.homeSlides.filter(s => s.id !== slideId);
  },

  getLiveSessions: async (professorId) => {
    const res = await fetch(`/api/professors/${professorId}/live-sessions`, {
      headers: {
        ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` })
      },
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch live sessions');
    return await res.json();
  },
  createLiveSession: async (session: Omit<LiveSession, 'id'>): Promise<LiveSession> => {
    console.log('[DEBUG] API createLiveSession called with:', session);
    const res = await fetch(`/api/professors/${session.professorId}/live-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` })
      },
      body: JSON.stringify(session),
      credentials: 'include'
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[DEBUG] API Error Response:', res.status, errorText);
      throw new Error(`Failed to create live session: ${res.status} ${errorText}`);
    }

    const result = await res.json();
    console.log('[DEBUG] API createLiveSession success:', result);
    return result;
  },
  updateLiveSession: async (sessionId: string, updates: Partial<LiveSession>): Promise<LiveSession> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/live-sessions/${sessionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update session');
    return res.json();
  },
  updateLiveSessionStatus: async (sessionId: string, status: LiveSession['status']): Promise<LiveSession> => {
    return api.updateLiveSession(sessionId, { status });
  },
  saveLiveSessionToLibrary: async (sessionId: string): Promise<void> => {
    await delay(500);
    const session = mockData.liveSessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session not found');

    // Mark session as saved/archived
    await api.updateLiveSession(sessionId, {
      status: 'ended',
      recordingUrl: session.recordingUrl || `https://recordings.example.com/session-${sessionId}`,
      isRecorded: true
    });

    const professor = mockData.users.find(u => u.id === session.professorId);
    const notification = {
      id: String(Date.now() + Math.random()),
      type: 'live_session_started' as const,
      message: `Live session "${session.title}" by ${professor?.name || 'a professor'} has been saved to the library`,
      createdAt: new Date().toISOString(),
      read: false,
      sessionId: session.id,
    };
    mockData.notifications.push(notification);
  },

  getNotifications: async (): Promise<Array<{
    id: string;
    type: 'live_session_scheduled' | 'live_session_started';
    message: string;
    createdAt: string;
    read: boolean;
    sessionId: string;
  }>> => {
    await delay(500);
    return mockData.notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getLevels: async (): Promise<Level[]> => {
    await delay(500);
    return mockData.levels;
  },
  createLevel: async (level: Omit<Level, 'id'>): Promise<Level> => {
    await delay(500);
    const newLevel: Level = { id: String(Date.now()), ...level };
    mockData.levels.push(newLevel);
    return newLevel;
  },
  getYears: async (levelId?: string): Promise<Year[]> => {
    await delay(500);
    if (levelId) {
      return mockData.years.filter(year => year.levelId === levelId);
    }
    return mockData.years;
  },
  createYear: async (year: Omit<Year, 'id'>): Promise<Year> => {
    await delay(500);
    const newYear: Year = { id: String(Date.now()), ...year };
    mockData.years.push(newYear);
    return newYear;
  },
  getSpecialities: async (yearId?: string): Promise<Speciality[]> => {
    await delay(500);
    if (yearId) {
      return mockData.specialities.filter(speciality => speciality.yearId === yearId);
    }
    return mockData.specialities;
  },
  createSpeciality: async (speciality: Omit<Speciality, 'id'>): Promise<Speciality> => {
    await delay(500);
    const newSpeciality: Speciality = { id: String(Date.now()), ...speciality };
    mockData.specialities.push(newSpeciality);
    return newSpeciality;
  },
  getMaterials: async (specialityId?: string): Promise<Material[]> => {
    await delay(500);
    if (specialityId) {
      return mockData.materials.filter(material => material.specialityId === specialityId);
    }
    return mockData.materials;
  },
  createMaterial: async (material: Omit<Material, 'id'>): Promise<Material> => {
    await delay(500);
    const newMaterial: Material = { id: String(Date.now()), ...material };
    mockData.materials.push(newMaterial);
    return newMaterial;
  },

  getCourses: async (): Promise<Course[]> => {
    await delay(500);
    return mockData.courses;
  },
  getCourseById: async (courseId: string): Promise<Course | null> => {
    await delay(500);
    const course = mockData.courses.find(course => course.id === courseId);
    if (course) {
      return course;
    }

    const pendingCourse = mockData.pendingCourses.find(course => course.id === courseId);
    if (pendingCourse && pendingCourse.status === 'approved') {
      return {
        id: pendingCourse.id,
        materialId: pendingCourse.materialId,
        title: pendingCourse.title,
        description: pendingCourse.description,
        sections: pendingCourse.sections,
        createdBy: pendingCourse.createdBy,
        createdAt: pendingCourse.createdAt,
        approvedAt: pendingCourse.approvedAt,
        price: pendingCourse.price
      };
    }

    return null;
  },
  getPendingCourseById: async (courseId: string): Promise<PendingCourse | null> => {
    await delay(500);
    const pendingCourse = mockData.pendingCourses.find(course => course.id === courseId);
    return pendingCourse || null;
  },
  getProfessorById: async (professorId: string): Promise<User | null> => {
    await delay(500);
    const professor = mockData.users.find(user => user.id === professorId && user.role === 'professor');

    if (professorId && !professor) {
      console.warn(`Professor with ID ${professorId} not found`);
    }

    return professor || null;
  },
  createCourse: async (course: Omit<Course, 'id' | 'createdAt' | 'sections' | 'createdBy' | 'approvedAt' | 'materialId'>, courseData: { sections: Array<{ title: string, blocks: Array<Omit<ContentBlock, 'id'>> }> }): Promise<Course> => {
    await delay(500);

    const newCourse: PendingCourse = {
      id: String(Date.now()),
      ...course,
      sections: courseData.sections.map((section) => ({
        id: String(Date.now() + Math.random() * 1000),
        title: section.title,
        blocks: section.blocks.map((block) => ({
          id: String(Date.now() + Math.random() * 1000),
          type: block.type,
          title: block.title || '',
          content: block.content,
          fileType: block.fileType,
          fileSize: block.fileSize,
          fileUrl: block.fileUrl
        })),
      })),
      createdBy: '1',
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    mockData.pendingCourses.push(newCourse);
    return newCourse as unknown as Course;
  },
  submitCourse: async (courseData: { title: string, description: string, sections: any[], createdBy: string }): Promise<void> => {
    await delay(500);

    const newCourse: PendingCourse = {
      id: String(Date.now()),
      title: courseData.title,
      description: courseData.description,
      sections: courseData.sections.map((section) => ({
        id: section.id || String(Date.now() + Math.random() * 1000),
        title: section.title,
        blocks: section.blocks.map((block: any) => ({
          id: block.id || String(Date.now() + Math.random() * 1000),
          type: block.type,
          title: block.title || '',
          content: block.content,
          fileType: block.fileType,
          fileSize: block.fileSize,
          fileUrl: block.fileUrl
        })),
      })),
      createdBy: courseData.createdBy,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    mockData.pendingCourses.push(newCourse);
  },
  getPendingCourses: async (): Promise<PendingCourse[]> => {
    await delay(500);
    return mockData.pendingCourses;
  },
  updateCourseStatus: async (courseId: string, status: PendingCourse['status'], reviewedBy?: string): Promise<void> => {
    await delay(500);

    const pendingCourse = mockData.pendingCourses.find(course => course.id === courseId);
    if (!pendingCourse) {
      throw new Error('Course not found');
    }

    pendingCourse.status = status;
    if (reviewedBy) {
      pendingCourse.reviewedBy = reviewedBy;
    }
  },
  approveCourse: async (courseId: string, materialId: string, price?: number): Promise<void> => {
    await delay(500);

    const pendingCourse = mockData.pendingCourses.find(course => course.id === courseId);
    if (!pendingCourse) {
      throw new Error('Course not found');
    }

    const professorExists = mockData.users.some(user => user.id === pendingCourse.createdBy);
    if (!professorExists) {
      console.warn(`Professor with ID ${pendingCourse.createdBy} not found for course ${courseId}`);
      pendingCourse.createdBy = mockData.users.find(user => user.role === 'professor')?.id || '1';
    }

    const approvedCourse: Course = {
      id: courseId,
      materialId: materialId,
      title: pendingCourse.title,
      description: pendingCourse.description,
      sections: pendingCourse.sections,
      createdBy: pendingCourse.createdBy,
      createdAt: pendingCourse.createdAt,
      approvedAt: new Date().toISOString(),
      price: price
    };

    mockData.courses.push(approvedCourse);

    pendingCourse.status = 'approved';
    pendingCourse.approvedAt = new Date().toISOString();
    pendingCourse.materialId = materialId;
    pendingCourse.price = price;

    return;
  },
  rejectCourse: async (courseId: string, reason: string): Promise<void> => {
    await delay(500);

    const pendingCourse = mockData.pendingCourses.find(course => course.id === courseId);
    if (!pendingCourse) {
      throw new Error('Course not found');
    }

    pendingCourse.status = 'rejected';
    pendingCourse.rejectionReason = reason;
    pendingCourse.rejectedAt = new Date().toISOString();
  },

  // Quiz management methods
  getQuizzes: async (): Promise<Quiz[]> => {
    await delay(500);
    return mockData.quizzes;
  },

  getPendingQuizzes: async (): Promise<PendingQuiz[]> => {
    await delay(500);
    return mockData.pendingQuizzes;
  },

  submitQuiz: async (quizData: {
    title: string;
    description: string;
    questions: QuizQuestion[];
    timeLimit?: number;
    passingScore: number;
    maxAttempts?: number;
    createdBy: string;
  }): Promise<void> => {
    await delay(500);

    const newQuiz: PendingQuiz = {
      id: String(Date.now()),
      title: quizData.title,
      description: quizData.description,
      questions: quizData.questions,
      createdBy: quizData.createdBy,
      createdAt: new Date().toISOString(),
      timeLimit: quizData.timeLimit,
      passingScore: quizData.passingScore,
      maxAttempts: quizData.maxAttempts,
      status: 'pending'
    };

    mockData.pendingQuizzes.push(newQuiz);
  },

  approveQuiz: async (quizId: string, materialId: string): Promise<void> => {
    await delay(500);

    const pendingQuiz = mockData.pendingQuizzes.find(quiz => quiz.id === quizId);
    if (!pendingQuiz) {
      throw new Error('Quiz not found');
    }

    const approvedQuiz: Quiz & { materialId?: string } = {
      id: quizId,
      materialId: materialId,
      title: pendingQuiz.title,
      description: pendingQuiz.description,
      questions: pendingQuiz.questions,
      createdBy: pendingQuiz.createdBy,
      createdAt: pendingQuiz.createdAt,
      timeLimit: pendingQuiz.timeLimit,
      passingScore: pendingQuiz.passingScore,
      maxAttempts: pendingQuiz.maxAttempts,
      isActive: true
    };

    mockData.quizzes.push(approvedQuiz);

    pendingQuiz.status = 'approved';
    pendingQuiz.approvedAt = new Date().toISOString();
    pendingQuiz.materialId = materialId;
  },

  rejectQuiz: async (quizId: string, reason: string): Promise<void> => {
    await delay(500);

    const pendingQuiz = mockData.pendingQuizzes.find(quiz => quiz.id === quizId);
    if (!pendingQuiz) {
      throw new Error('Quiz not found');
    }

    pendingQuiz.status = 'rejected';
    pendingQuiz.rejectionReason = reason;
    pendingQuiz.rejectedAt = new Date().toISOString();
  },

  // Quiz results methods
  getQuizResults: async (professorId: string): Promise<QuizResults[]> => {
    await delay(500);

    // Get all quizzes created by the professor
    const professorQuizzes = [...mockData.quizzes, ...mockData.pendingQuizzes.filter(q => q.status === 'approved')]
      .filter(quiz => quiz.createdBy === professorId);

    const results: QuizResults[] = [];

    for (const quiz of professorQuizzes) {
      const attempts = mockData.quizAttempts.filter(attempt => attempt.quizId === quiz.id);

      if (attempts.length > 0) {
        const totalAttempts = attempts.length;
        const averageScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts;
        const passedAttempts = attempts.filter(attempt => attempt.passed).length;
        const passRate = (passedAttempts / totalAttempts) * 100;
        const averageTimeSpent = attempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0) / totalAttempts;

        results.push({
          quiz: quiz as Quiz,
          attempts,
          totalAttempts,
          averageScore,
          passRate,
          averageTimeSpent
        });
      }
    }

    return results;
  },

  getQuizResultsById: async (quizId: string): Promise<QuizResults | null> => {
    await delay(500);

    const quiz = [...mockData.quizzes, ...mockData.pendingQuizzes.filter(q => q.status === 'approved')]
      .find(q => q.id === quizId);

    if (!quiz) return null;

    const attempts = mockData.quizAttempts.filter(attempt => attempt.quizId === quizId);

    if (attempts.length === 0) return null;

    const totalAttempts = attempts.length;
    const averageScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts;
    const passedAttempts = attempts.filter(attempt => attempt.passed).length;
    const passRate = (passedAttempts / totalAttempts) * 100;
    const averageTimeSpent = attempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0) / totalAttempts;

    return {
      quiz: quiz as Quiz,
      attempts,
      totalAttempts,
      averageScore,
      passRate,
      averageTimeSpent
    };
  },

  get: async (url: string) => {
    const res = await fetch(`/api${url.startsWith('/') ? url : '/' + url}`, {
      headers: {
        ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` })
      },
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch ' + url);
    return await res.json();
  },

  patch: async (url, body = {}) => {
    const res = await fetch(`/api${url.startsWith('/') ? url : '/' + url}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` })
      },
      body: JSON.stringify(body),
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to patch ' + url);
    return await res.json();
  },

  getLiveSession: async (sessionId: string): Promise<LiveSession> => {
    const res = await fetch(`/api/live-sessions/${sessionId}`, {
      headers: {
        ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` })
      },
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch live session');
    return await res.json();
  },

  purchaseLiveSession: async (sessionId: string, amountPaid: number) => {
    const res = await fetch(`/api/live-sessions/${sessionId}/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` })
      },
      body: JSON.stringify({ amount_paid: amountPaid }),
      credentials: 'include'
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP ${res.status}: ${res.statusText}`;
      const error = new Error(errorMessage);
      (error as any).status = res.status;
      throw error;
    }

    return await res.json();
  },

  checkLiveSessionAccess: async (sessionId: string, studentId: string) => {
    const res = await fetch(`/api/live-sessions/${sessionId}/access?student_id=${studentId}`, {
      headers: {
        ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` })
      },
      credentials: 'include'
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP ${res.status}: ${res.statusText}`;
      const error = new Error(errorMessage);
      (error as any).status = res.status;
      throw error;
    }

    return await res.json();
  },
};

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Clock, 
  Star,
  Users,
  Calendar
} from 'lucide-react';

const CoursesSection = () => {
  const [courseFilter, setCourseFilter] = useState('all');

  const courses = [
    {
      id: 1,
      title: 'البرمجة بـ JavaScript من الصفر',
      instructor: 'د. محمد أحمد',
      category: 'البرمجة',
      progress: 100,
      totalLessons: 25,
      completedLessons: 25,
      duration: '12 ساعة',
      rating: 4.8,
      enrolledStudents: 1250,
      status: 'completed',
      thumbnail: '/placeholder.svg',
      purchaseDate: '2024-01-15',
      completionDate: '2024-02-20'
    },
    {
      id: 2,
      title: 'تطوير تطبيقات الويب بـ React',
      instructor: 'أ. فاطمة علي',
      category: 'تطوير الويب',
      progress: 65,
      totalLessons: 30,
      completedLessons: 19,
      duration: '15 ساعة',
      rating: 4.9,
      enrolledStudents: 890,
      status: 'in_progress',
      thumbnail: '/placeholder.svg',
      purchaseDate: '2024-02-01',
      lastAccessed: '2024-03-15'
    },
    {
      id: 3,
      title: 'أساسيات قواعد البيانات MySQL',
      instructor: 'د. أحمد حسن',
      category: 'قواعد البيانات',
      progress: 30,
      totalLessons: 20,
      completedLessons: 6,
      duration: '10 ساعات',
      rating: 4.7,
      enrolledStudents: 650,
      status: 'in_progress',
      thumbnail: '/placeholder.svg',
      purchaseDate: '2024-03-01',
      lastAccessed: '2024-03-18'
    },
    {
      id: 4,
      title: 'التصميم الجرافيكي باستخدام Photoshop',
      instructor: 'أ. سارة محمود',
      category: 'التصميم',
      progress: 0,
      totalLessons: 18,
      completedLessons: 0,
      duration: '8 ساعات',
      rating: 4.6,
      enrolledStudents: 420,
      status: 'not_started',
      thumbnail: '/placeholder.svg',
      purchaseDate: '2024-03-10'
    }
  ];

  const getStatusBadge = (status, progress) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-cyan-100 text-cyan-500 hover:bg-cyan-100">مكتمل</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">قيد التقدم</Badge>;
      case 'not_started':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">لم يبدأ</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Play className="w-5 h-5 text-blue-600" />;
      case 'not_started':
        return <Clock className="w-5 h-5 text-gray-600" />;
      default:
        return <BookOpen className="w-5 h-5 text-gray-600" />;
    }
  };

  const filteredCourses = courses.filter(course => {
    if (courseFilter === 'all') return true;
    return course.status === courseFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">دوراتي التعليمية</h2>
        <div className="text-sm text-gray-600">
          {courses.length} دورة مشتراة
        </div>
      </div>

      <Tabs value={courseFilter} onValueChange={setCourseFilter} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="all">جميع الدورات</TabsTrigger>
          <TabsTrigger value="in_progress">قيد التقدم</TabsTrigger>
          <TabsTrigger value="completed">مكتملة</TabsTrigger>
          <TabsTrigger value="not_started">لم تبدأ</TabsTrigger>
        </TabsList>

        <TabsContent value={courseFilter} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                <div className="aspect-video bg-gradient-to-r from-blue-400 to-purple-500 relative">
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="text-white text-center">
                      <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-80" />
                      <p className="text-sm opacity-90">صورة الدورة</p>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(course.status, course.progress)}
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2 mb-2">
                    {course.title}
                  </CardTitle>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.instructor}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{course.rating}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>التقدم</span>
                      <span>{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{course.completedLessons} من {course.totalLessons} درس</span>
                      <span>{course.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {course.status === 'completed' 
                          ? `اكتمل في ${course.completionDate}`
                          : `آخر دخول ${course.lastAccessed || course.purchaseDate}`
                        }
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-education-blue hover:bg-education-blue/90"
                      size="sm"
                    >
                      <Play className="w-4 h-4 ml-2" />
                      {course.status === 'not_started' ? 'ابدأ الدورة' : 'متابعة'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="px-3"
                    >
                      <BookOpen className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد دورات في هذه الفئة
              </h3>
              <p className="text-gray-600">
                {courseFilter === 'completed' && 'لم تكمل أي دورة بعد'}
                {courseFilter === 'in_progress' && 'لا توجد دورات قيد التقدم حالياً'}
                {courseFilter === 'not_started' && 'لا توجد دورات لم تبدأ بها'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoursesSection;
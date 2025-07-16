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
import TTHCourseCard from './ui/TTHCourseCard';

const CoursesSection = ({ purchasedCourses }) => {
  console.log('CoursesSection purchasedCourses:', purchasedCourses);
  const [courseFilter, setCourseFilter] = useState('all');

  const courses = purchasedCourses && purchasedCourses.length > 0 ? purchasedCourses : [];

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
        <TabsList className="grid w-full grid-cols-1 mb-6">
          <TabsTrigger value="all">جميع الدورات</TabsTrigger>
        </TabsList>

        <TabsContent value={courseFilter} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.length > 0 ? (
              courses.map((course) => (
                <TTHCourseCard key={course.id} course={course} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500 text-lg font-bold">لا توجد دورات مشتراة بعد</div>
            )}
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
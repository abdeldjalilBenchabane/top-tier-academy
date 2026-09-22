import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { MessageCircle, BookOpen, Calendar, Users } from 'lucide-react';
import { serverDate } from '@/lib/utils';

const CourseCommentsOverview = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCoursesWithCommentCounts();
  }, []);

  const fetchCoursesWithCommentCounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/courses/professor/courses-with-comments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (e) {
      setError('فشل تحميل الدورات');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (courseId) => {
    navigate(`/professor/comments/${courseId}`);
  };

  const getCommentCountColor = (count) => {
    if (count === 0) return 'bg-gray-100 text-gray-600';
    if (count <= 5) return 'bg-green-100 text-green-700';
    if (count <= 15) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getCommentCountText = (count) => {
    if (count === 0) return 'لا توجد تعليقات';
    if (count === 1) return 'تعليق واحد';
    if (count === 2) return 'تعليقان';
    if (count <= 10) return `${count} تعليقات`;
    return `${count} تعليق`;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الدورات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">تعليقات الطلاب على دوراتك</h1>
        <p className="text-gray-600">اختر دورة لعرض تعليقات الطلاب عليها</p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد دورات بعد</h3>
          <p className="text-gray-600 mb-4">قم بإنشاء دورة أولاً لترى تعليقات الطلاب عليها</p>
          <button
            onClick={() => navigate('/professor/create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            إنشاء دورة جديدة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card 
              key={course.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300"
              onClick={() => handleCourseClick(course.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {course.title}
                  </CardTitle>
                  <Badge className={getCommentCountColor(course.comment_count)}>
                    {course.comment_count}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Course Image */}
                  {course.cover_url && (
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                      <img
                        src={course.cover_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Course Description */}
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {course.description || 'لا يوجد وصف للدورة'}
                  </p>
                  
                  {/* Course Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{serverDate(course.created_at).toLocaleDateString('ar-SA')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{getCommentCountText(course.comment_count)}</span>
                    </div>
                  </div>
                  
                  {/* Course Status */}
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={course.status === 'approved' ? 'default' : 'secondary'}
                      className={course.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                    >
                      {course.status === 'approved' ? 'معتمدة' : 'في الانتظار'}
                    </Badge>
                    {course.price && (
                      <span className="text-sm font-medium text-green-600">
                        {course.price} د.ت
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseCommentsOverview; 
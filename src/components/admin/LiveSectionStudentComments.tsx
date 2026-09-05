import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { MessageCircle, User, Video, GraduationCap } from 'lucide-react';

interface Professor {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  total_comments: number;
  total_courses: number;
}

const LiveSectionStudentComments = () => {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfessors();
  }, []);

  const fetchProfessors = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/live-section-professors-with-comments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch professors');
      const data = await res.json();
      setProfessors(data.professors || []);
    } catch (e) {
      setError('فشل تحميل الأساتذة');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getCommentCountColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 text-gray-600';
    if (count <= 10) return 'bg-green-100 text-green-700';
    if (count <= 30) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getCommentCountText = (count: number) => {
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
          <p className="text-gray-600">جاري تحميل الأساتذة...</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">تعليقات حزمة الدورات</h1>
        <p className="text-gray-600">اختر أستاذاً لعرض تعليقات الطلاب على جلساته المباشرة</p>
      </div>

      {professors.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا يوجد أساتذة بعد</h3>
          <p className="text-gray-600">لا توجد تعليقات على أي جلسة مباشرة حتى الآن</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professors.map((professor) => (
            <Card
              key={professor.id}
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300"
              onClick={() => navigate(`/admin/live-section-comments/professor/${professor.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {professor.avatar_url ? (
                      <img
                        src={professor.avatar_url}
                        alt={professor.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-8 w-8 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                      {professor.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500 truncate">{professor.email}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Video className="h-4 w-4 text-blue-600" />
                      <span className="text-gray-600">
                        {professor.total_courses} {professor.total_courses === 1 ? 'جلسة' : 'جلسات'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      <Badge className={getCommentCountColor(professor.total_comments)}>
                        {professor.total_comments}
                      </Badge>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-center text-sm font-medium text-gray-700">
                      {getCommentCountText(professor.total_comments)}
                    </p>
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

export default LiveSectionStudentComments;

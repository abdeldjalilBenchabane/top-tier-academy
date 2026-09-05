import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { MessageCircle, Video, Calendar, ArrowLeft } from 'lucide-react';

interface LiveSection {
  id: number;
  title: string;
  description: string;
  price: number;
  status: string;
  created_at: string;
  cover_url: string | null;
  comment_count: number;
}

const AdminTeacherLiveSections = () => {
  const { professorId } = useParams();
  const [sections, setSections] = useState<LiveSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (professorId) fetchSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professorId]);

  const fetchSections = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/professor/${professorId}/live-sections-with-comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch sections');
      const data = await res.json();
      setSections(data.sections || []);
    } catch (e) {
      setError('فشل تحميل الجلسات المباشرة');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getCommentCountColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 text-gray-600';
    if (count <= 5) return 'bg-green-100 text-green-700';
    if (count <= 15) return 'bg-yellow-100 text-yellow-700';
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
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center text-red-500"><p>{error}</p></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Button variant="ghost" onClick={() => navigate('/admin/live-section-comments')} className="mb-4">
        <ArrowLeft className="h-4 w-4 ml-2" />
        العودة للأساتذة
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">جلسات الأستاذ المباشرة</h1>
        <p className="text-gray-600">اختر جلسة لعرض تعليقات الطلاب عليها</p>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-12">
          <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد جلسات بعد</h3>
          <p className="text-gray-600">هذا الأستاذ لم ينشئ أي جلسة مباشرة حتى الآن</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <Card
              key={section.id}
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300"
              onClick={() => navigate(`/admin/live-section-comments/section/${section.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {section.title}
                  </CardTitle>
                  <Badge className={getCommentCountColor(section.comment_count)}>
                    {section.comment_count}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.cover_url && (
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                      <img src={section.cover_url} alt={section.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {section.description || 'لا يوجد وصف للجلسة'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(section.created_at).toLocaleDateString('ar-SA')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{getCommentCountText(section.comment_count)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={section.status === 'approved' ? 'default' : 'secondary'}
                      className={
                        section.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }
                    >
                      {section.status === 'approved' ? 'معتمدة' : 'في الانتظار'}
                    </Badge>
                    {section.price ? (
                      <span className="text-sm font-medium text-green-600">{section.price} د.ت</span>
                    ) : null}
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

export default AdminTeacherLiveSections;

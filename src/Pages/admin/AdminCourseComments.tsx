import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { ArrowLeft, MessageCircle, Calendar, User, Trash2, Send } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { serverDate } from '@/lib/utils';

interface Comment {
  id: number;
  course_id: number;
  name: string;
  student_name: string;
  user_id: number | null;
  comment: string;
  tab: string;
  rating: number;
  created_at: string;
  reply: string | null;
  threaded_replies: Reply[];
}

interface Reply {
  id: number;
  user_id: number;
  user_name: string;
  reply_text: string;
  user_role: string;
  created_at: string;
}

const AdminCourseComments = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReplyForm, setShowReplyForm] = useState<number | null>(null);
  const [replyText, setReplyText] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    if (courseId) {
      fetchComments();
    }
  }, [courseId]);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/courses/admin/comments/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      const data = await res.json();
      setComments(data.comments || []);
    } catch (e) {
      setError('فشل تحميل التعليقات');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التعليق؟ سيتم حذف جميع الردود أيضاً.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/courses/admin/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to delete comment');
      }

      toast({
        title: 'تم الحذف',
        description: 'تم حذف التعليق بنجاح',
      });

      // Remove comment from state
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      toast({
        title: 'خطأ',
        description: 'فشل حذف التعليق',
        variant: 'destructive',
      });
    }
  };

  const handleAddReply = async (commentId: number) => {
    const reply = replyText[commentId];
    if (!reply || !reply.trim()) {
      toast({
        title: 'خطأ',
        description: 'الرجاء كتابة الرد',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/courses/admin/comments/${commentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reply: reply.trim() })
      });

      if (!res.ok) {
        throw new Error('Failed to add reply');
      }

      const data = await res.json();
      
      toast({
        title: 'تم الإرسال',
        description: 'تم إضافة الرد بنجاح',
      });

      // Update comments with new reply
      setComments(comments.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            threaded_replies: [...c.threaded_replies, data.reply]
          };
        }
        return c;
      }));

      // Clear reply text and hide form
      setReplyText({ ...replyText, [commentId]: '' });
      setShowReplyForm(null);
    } catch (err) {
      console.error('Error adding reply:', err);
      toast({
        title: 'خطأ',
        description: 'فشل إضافة الرد',
        variant: 'destructive',
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-600';
      case 'professor':
        return 'text-blue-600';
      case 'student':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'مدير';
      case 'professor':
        return 'أستاذ';
      case 'student':
        return 'طالب';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل التعليقات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={handleBack}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 ml-2" />
        العودة
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">تعليقات الطلاب</h1>
        <p className="text-gray-600">إدارة التعليقات والرد عليها</p>
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد تعليقات</h3>
          <p className="text-gray-600">لا توجد تعليقات على هذه الدورة بعد</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => (
            <div key={comment.id} className="border rounded-lg p-4 bg-white shadow">
              {/* Comment Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="font-bold text-blue-700">{comment.student_name || comment.name}</span>
                  <span className="text-gray-400 text-xs">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {serverDate(comment.created_at).toLocaleString('ar-SA')}
                  </span>
                  {comment.tab && (
                    <span className="ml-2 text-purple-600 text-xs px-2 py-1 bg-purple-50 rounded">
                      {comment.tab}
                    </span>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <Trash2 className="h-4 w-4 ml-1" />
                  حذف
                </Button>
              </div>

              {/* Comment Text */}
              <div className="mb-3 text-gray-800 bg-gray-50 p-3 rounded">
                {comment.comment}
              </div>

              {/* Rating */}
              {comment.rating && (
                <div className="mb-3 text-yellow-500">
                  {'⭐'.repeat(comment.rating)}
                </div>
              )}

              {/* Threaded Replies */}
              {comment.threaded_replies && comment.threaded_replies.length > 0 && (
                <div className="mt-4 space-y-3 border-r-2 border-blue-200 pr-4 mr-4">
                  {comment.threaded_replies.map((reply) => (
                    <div key={reply.id} className="bg-blue-50 p-3 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold ${getRoleColor(reply.user_role)}`}>
                          {reply.user_name}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-white rounded border">
                          {getRoleBadge(reply.user_role)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {serverDate(reply.created_at).toLocaleString('ar-SA')}
                        </span>
                      </div>
                      <div className="text-gray-700 text-sm">{reply.reply_text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              {showReplyForm === comment.id ? (
                <div className="mt-4 border-t pt-4">
                  <Textarea
                    placeholder="اكتب ردك هنا..."
                    value={replyText[comment.id] || ''}
                    onChange={(e) => setReplyText({ ...replyText, [comment.id]: e.target.value })}
                    className="mb-2"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAddReply(comment.id)}
                      size="sm"
                    >
                      <Send className="h-4 w-4 ml-1" />
                      إرسال الرد
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowReplyForm(null);
                        setReplyText({ ...replyText, [comment.id]: '' });
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReplyForm(comment.id)}
                  >
                    <MessageCircle className="h-4 w-4 ml-1" />
                    رد على التعليق
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCourseComments;


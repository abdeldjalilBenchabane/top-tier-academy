import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { MessageSquare, Reply, BookOpen, Calendar, User } from 'lucide-react';

const StudentCommentsSection = () => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReplyForm, setShowReplyForm] = useState(null);
  const [replyText, setReplyText] = useState({});

  useEffect(() => {
    if (user?.id) {
      fetchStudentComments();
    }
  }, [user?.id]);

  const fetchStudentComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching comments for user ID:', user.id);
      
      // Use the existing comments endpoint with user parameter
      const response = await fetch(`/api/courses/user/comments?userId=${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Comments data:', data);
        setComments(data.comments || []);
      } else {
        console.error('Failed to fetch comments:', response.status);
        setError('فشل تحميل التعليقات');
      }
      
    } catch (e) {
      setError('فشل تحميل التعليقات');
      console.error('Error fetching comments:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddThreadedReply = async (commentId) => {
    const text = replyText[commentId];
    if (!text || !text.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/courses/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reply_text: text })
      });
      
      if (response.ok) {
        const result = await response.json();
        // Update the comments state to include the new reply
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              threaded_replies: [...(comment.threaded_replies || []), result.reply]
            };
          }
          return comment;
        }));
        
        // Clear the reply text and hide the form
        setReplyText(prev => ({ ...prev, [commentId]: '' }));
        setShowReplyForm(null);
      } else {
        const err = await response.json();
        alert('فشل إرسال الرد: ' + (err.error || response.status));
      }
    } catch (err) {
      alert('فشل إرسال الرد: ' + err.message);
      console.error('Error adding reply:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">تعليقاتي</h2>
        </div>
        <button 
          onClick={fetchStudentComments}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'جاري التحميل...' : 'تحديث'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500">جاري تحميل التعليقات...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد تعليقات</h3>
          <p className="text-gray-500">لم تقم بإضافة أي تعليقات بعد</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => (
            <div key={comment.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              {/* Comment Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">أنت</span>
                      <span className="mx-2 text-gray-400 text-sm">{formatDate(comment.created_at)}</span>
                    </div>
                  </div>
                  
                  {/* Course Info */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <BookOpen className="w-4 h-4" />
                    <Link 
                      to={`/course/${comment.course_id}`} 
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {comment.course_title}
                    </Link>
                    <span className="text-gray-400">•</span>
                    <span>{comment.tab || 'تعليق'}</span>
                  </div>
                </div>
              </div>

              {/* Comment Content */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-gray-800 leading-relaxed">{comment.comment}</p>
              </div>

              {/* Threaded Replies */}
              {comment.threaded_replies && comment.threaded_replies.length > 0 && (
                <div className="space-y-3 mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Reply className="w-4 h-4" />
                    الردود ({comment.threaded_replies.length})
                  </h4>
                  {comment.threaded_replies.map((reply, replyIndex) => (
                    <div 
                      key={reply.id} 
                      className={`pr-4 border-r-4 p-4 rounded-lg ${
                        reply.user_role === 'professor' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-green-500 bg-green-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          reply.user_role === 'professor' ? 'bg-blue-600' : 'bg-green-600'
                        }`}>
                          {reply.user_name?.charAt(0) || '?'}
                        </div>
                        <span className={`font-semibold text-sm ${
                          reply.user_role === 'professor' ? 'text-blue-900' : 'text-green-900'
                        }`}>
                          {reply.user_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({reply.user_role === 'professor' ? 'المدرس' : 'الطالب'})
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(reply.created_at)}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        reply.user_role === 'professor' ? 'text-blue-800' : 'text-green-800'
                      }`}>
                        {reply.reply_text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Legacy single reply (for backward compatibility) */}
              {comment.reply && (!comment.threaded_replies || comment.threaded_replies.length === 0) && (
                <div className="bg-blue-50 border-r-4 border-blue-400 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-semibold text-blue-900">رد المدرس</span>
                  </div>
                  <p className="text-blue-800">{comment.reply}</p>
                </div>
              )}
              
              {/* Add Reply Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowReplyForm(comment.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2"
                >
                  <Reply className="w-4 h-4" />
                  رد على هذا التعليق
                </button>
              </div>
              
              {/* Reply Form */}
              {showReplyForm === comment.id && (
                <div className="mt-4 pr-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <textarea
                    value={replyText[comment.id] || ''}
                    onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                    placeholder="اكتب ردك هنا..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleAddThreadedReply(comment.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      إرسال الرد
                    </button>
                    <button
                      onClick={() => setShowReplyForm(null)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentCommentsSection; 
import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { serverDate } from '@/lib/utils';

const ProfessorComments = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reply, setReply] = useState({});
  const [showReplyForm, setShowReplyForm] = useState(null);
  const [replyText, setReplyText] = useState({});

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/courses/professor/comments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setComments(data.comments || []);
    } catch (e) {
      setError('فشل تحميل التعليقات');
    } finally {
      setLoading(false);
    }
  };

  const handleReplyChange = (commentId, value) => {
    setReply(r => ({ ...r, [commentId]: value }));
  };

  const handleReplySubmit = async (commentId) => {
    const replyText = reply[commentId];
    if (!replyText) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/courses/professor/comments/${commentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reply: replyText })
      });
      const data = await res.json();
      if (data.success) {
        setComments(comments => comments.map(c => c.id === commentId ? { ...c, reply: replyText } : c));
        setReply(r => ({ ...r, [commentId]: '' }));
      }
    } catch (e) {
      alert('فشل إرسال الرد');
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">تعليقات الطلاب على دوراتك</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {loading ? (
        <div>جاري التحميل...</div>
      ) : comments.length === 0 ? (
        <div>لا توجد تعليقات بعد.</div>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => (
            <div key={comment.id} className="border rounded-lg p-4 bg-white shadow">
              <div className="mb-2">
                <span className="font-bold text-blue-700">{comment.student_name || comment.name}</span>
                <span className="mx-2 text-gray-400 text-xs">{serverDate(comment.created_at).toLocaleString()}</span>
                <span className="ml-2 text-purple-600 text-xs">({comment.tab})</span>
              </div>
              <div className="mb-1 text-sm text-gray-500">الدورة: {comment.course_title}</div>
              <div className="mb-2 text-gray-800">{comment.comment}</div>
              
              {/* Threaded Replies */}
              {comment.threaded_replies && comment.threaded_replies.length > 0 && (
                <div className="mt-3 space-y-2">
                  {comment.threaded_replies.map((reply, replyIndex) => (
                    <div 
                      key={reply.id} 
                      className={`pr-4 border-r-4 p-3 rounded-lg ${
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
                          {serverDate(reply.created_at).toLocaleString()}
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
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded mb-2 text-blue-900">
                  <span className="font-semibold">ردك:</span> {comment.reply}
                </div>
              )}
              
              {/* Add Reply Button */}
              <div className="mt-3">
                <button
                  onClick={() => setShowReplyForm(comment.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  رد على هذا التعليق
                </button>
              </div>
              
              {/* Reply Form */}
              {showReplyForm === comment.id && (
                <div className="mt-3 pr-4 border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <textarea
                    value={replyText[comment.id] || ''}
                    onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                    placeholder="اكتب ردك هنا..."
                    className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                    rows="3"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleAddThreadedReply(comment.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                      إرسال الرد
                    </button>
                    <button
                      onClick={() => setShowReplyForm(null)}
                      className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
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

export default ProfessorComments; 
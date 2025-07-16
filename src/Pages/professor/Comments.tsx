import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';

const ProfessorComments = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reply, setReply] = useState({});

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
                <span className="font-bold text-blue-700">{comment.name}</span>
                <span className="mx-2 text-gray-400 text-xs">{new Date(comment.created_at).toLocaleString()}</span>
                <span className="ml-2 text-purple-600 text-xs">({comment.tab})</span>
              </div>
              <div className="mb-1 text-sm text-gray-500">الدورة: {comment.course_title}</div>
              <div className="mb-2 text-gray-800">{comment.comment}</div>
              {comment.reply ? (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded mb-2 text-blue-900">
                  <span className="font-semibold">ردك:</span> {comment.reply}
                </div>
              ) : (
                <div className="flex gap-2 items-end">
                  <Textarea
                    value={reply[comment.id] || ''}
                    onChange={e => handleReplyChange(comment.id, e.target.value)}
                    placeholder="اكتب ردك هنا..."
                    className="flex-1"
                  />
                  <Button onClick={() => handleReplySubmit(comment.id)}>إرسال</Button>
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
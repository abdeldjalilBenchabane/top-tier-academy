import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { ArrowLeft, MessageCircle, Calendar } from 'lucide-react';

const LiveSectionComments = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [section, setSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReplyForm, setShowReplyForm] = useState(null);
  const [replyText, setReplyText] = useState({});

  useEffect(() => {
    if (sectionId) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');

      const sectionRes = await fetch(`/api/live-sections/${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (sectionRes.ok) {
        const sectionData = await sectionRes.json();
        setSection(sectionData);
      }

      const commentsRes = await fetch(`/api/professor/live-section-comments/${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.comments || []);
      } else {
        throw new Error('Failed to fetch comments');
      }
    } catch (e) {
      setError('فشل تحميل التعليقات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReply = async (commentId) => {
    const text = replyText[commentId];
    if (!text || !text.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/live-sections/comments/${commentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reply_text: text }),
      });
      if (response.ok) {
        const result = await response.json();
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, threaded_replies: [...(c.threaded_replies || []), result.reply] }
              : c
          )
        );
        setReplyText((prev) => ({ ...prev, [commentId]: '' }));
        setShowReplyForm(null);
      } else {
        const err = await response.json();
        alert('فشل إرسال الرد: ' + (err.error || response.status));
      }
    } catch (err) {
      alert('فشل إرسال الرد: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <Button onClick={() => navigate('/professor/live-section-comments')} className="mt-4">
            العودة للجلسات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/professor/live-section-comments')}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          العودة لجميع الجلسات
        </Button>

        {section && (
          <div className="bg-white rounded-lg border p-4 mb-6">
            <div className="flex items-start gap-4">
              {section.cover_image_url && (
                <img
                  src={section.cover_image_url}
                  alt={section.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{section.title}</h1>
                <p className="text-gray-600 mb-2">{section.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{comments.length} تعليق</span>
                  </div>
                  {section.created_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>أنشئت في {new Date(section.created_at).toLocaleDateString('ar-SA')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد تعليقات بعد</h3>
          <p className="text-gray-600">لم يعلق أي طالب على هذه الجلسة بعد</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="border rounded-lg p-4 bg-white shadow">
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {(comment.student_name || comment.name)?.charAt(0) || '?'}
                  </div>
                  <span className="font-bold text-blue-700">
                    {comment.student_name || comment.name}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                  {comment.tab && <span className="ml-2 text-purple-600 text-xs">({comment.tab})</span>}
                </div>
                {comment.rating ? (
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: comment.rating }).map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                    <span className="text-sm text-gray-500">({comment.rating}/5)</span>
                  </div>
                ) : null}
              </div>
              <div className="mb-2 text-gray-800">{comment.comment}</div>

              {comment.threaded_replies && comment.threaded_replies.length > 0 && (
                <div className="mt-3 space-y-2">
                  {comment.threaded_replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`pr-4 border-r-4 p-3 rounded-lg ${
                        reply.user_role === 'professor'
                          ? 'border-blue-500 bg-blue-50'
                          : reply.user_role === 'admin'
                          ? 'border-red-500 bg-red-50'
                          : 'border-green-500 bg-green-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            reply.user_role === 'professor'
                              ? 'bg-blue-600'
                              : reply.user_role === 'admin'
                              ? 'bg-red-600'
                              : 'bg-green-600'
                          }`}
                        >
                          {reply.user_name?.charAt(0) || '?'}
                        </div>
                        <span className="font-semibold text-sm">{reply.user_name}</span>
                        <span className="text-xs text-gray-500">
                          (
                          {reply.user_role === 'professor'
                            ? 'المدرس'
                            : reply.user_role === 'admin'
                            ? 'المدير'
                            : 'الطالب'}
                          )
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(reply.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{reply.reply_text}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3">
                <button
                  onClick={() => setShowReplyForm(comment.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  رد على هذا التعليق
                </button>
              </div>

              {showReplyForm === comment.id && (
                <div className="mt-3 pr-4 border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <textarea
                    value={replyText[comment.id] || ''}
                    onChange={(e) => setReplyText((p) => ({ ...p, [comment.id]: e.target.value }))}
                    placeholder="اكتب ردك هنا..."
                    className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                    rows="3"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleAddReply(comment.id)}
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

export default LiveSectionComments;

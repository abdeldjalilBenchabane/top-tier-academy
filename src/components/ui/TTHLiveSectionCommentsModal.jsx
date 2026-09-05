import React, { useEffect, useState } from 'react';
import { X, Star, Send, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LiveSectionCommentsModal({ section, open, onClose }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });
  const [showReplyForm, setShowReplyForm] = useState(null);
  const [replyText, setReplyText] = useState({});

  useEffect(() => {
    if (open && section?.id) {
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, section?.id]);

  useEffect(() => {
    if (user?.name && !newReview.name) {
      setNewReview((prev) => ({ ...prev, name: user.name }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/live-sections/${section.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (e) {
      console.error('Error fetching live section comments:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (rating) => setNewReview((p) => ({ ...p, rating }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.name.trim() || !newReview.comment.trim()) return;
    if (!user || !user.id) {
      alert('يجب تسجيل الدخول لإضافة تعليق');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/live-sections/${section.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newReview.name,
          comment: newReview.comment,
          user_id: user.id,
          tab: 'reviews',
          rating: newReview.rating || 5,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [{ ...data.comment, threaded_replies: [] }, ...prev]);
        setNewReview({ name: user.name || '', rating: 5, comment: '' });
      } else {
        const err = await res.json().catch(() => ({}));
        alert('فشل إرسال التعليق: ' + (err.error || res.status));
      }
    } catch (err) {
      alert('فشل إرسال التعليق: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (commentId) => {
    const text = replyText[commentId];
    if (!text || !text.trim()) return;
    if (!user || !user.id) {
      alert('يجب تسجيل الدخول لإضافة رد');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/live-sections/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reply_text: text }),
      });
      if (res.ok) {
        const result = await res.json();
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
        const err = await res.json().catch(() => ({}));
        alert('فشل إرسال الرد: ' + (err.error || res.status));
      }
    } catch (err) {
      alert('فشل إرسال الرد: ' + err.message);
    }
  };

  if (!open) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: 'Nunito, Rowdies, Poppins, sans-serif' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#194cbf] to-[#61a1ff] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <h3 className="font-bold text-lg">إسأل الاستاذ</h3>
          </div>
          <button onClick={onClose} className="text-white/90 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <p className="text-sm text-blue-900 font-semibold line-clamp-1">{section?.title}</p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-gray-100 rounded-xl p-4 mb-4 shadow flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={newReview.name}
                onChange={(e) => setNewReview((p) => ({ ...p, name: e.target.value }))}
                placeholder="اسمك"
                className="flex-1 rounded-lg border border-blue-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 text-right"
                required
              />
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => handleRatingChange(i + 1)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={i < newReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                      size={20}
                    />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={newReview.comment}
              onChange={(e) => setNewReview((p) => ({ ...p, comment: e.target.value }))}
              placeholder="اكتب تعليقك هنا..."
              className="rounded-lg border border-blue-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 text-right min-h-[80px]"
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-[#194cbf] to-[#61a1ff] hover:from-[#1340a0] hover:to-[#4a8de8] text-white font-normal py-2 px-6 rounded-sm shadow transition disabled:opacity-60"
              >
                {submitting ? 'جاري الإرسال...' : 'أضف تعليقك'}
              </button>
            </div>
          </form>

          {/* List */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">لا توجد تعليقات بعد. كن أول من يعلق!</div>
          ) : (
            <div className="space-y-4">
              {comments.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {review.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900">{review.name}</p>
                        {review.rating ? (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="text-yellow-400 fill-current" size={14} />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>

                  {/* Threaded replies */}
                  {review.threaded_replies && review.threaded_replies.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {review.threaded_replies.map((reply) => (
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
                                  ? 'bg-[#194cbf]'
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

                  {/* Reply trigger */}
                  <div className="mt-3">
                    <button
                      onClick={() => setShowReplyForm(review.id)}
                      className="text-[#194cbf] hover:text-blue-800 text-sm font-medium"
                    >
                      رد على هذا التعليق
                    </button>
                  </div>

                  {/* Reply form */}
                  {showReplyForm === review.id && (
                    <div className="mt-3 pr-4 border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <textarea
                        value={replyText[review.id] || ''}
                        onChange={(e) =>
                          setReplyText((prev) => ({ ...prev, [review.id]: e.target.value }))
                        }
                        placeholder="اكتب ردك هنا..."
                        className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                        rows="3"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleAddReply(review.id)}
                          className="px-3 py-1 bg-[#194cbf] text-white rounded-md text-sm hover:bg-blue-700 inline-flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
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
      </div>
    </div>
  );
}

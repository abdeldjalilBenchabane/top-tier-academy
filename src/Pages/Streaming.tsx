
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Heart, MessageSquare, Share2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Streaming = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const live = {
    id: id,
    title: 'ورشة تطوير البرمجيات المتقدمة',
    presenter: 'أحمد محمد علي',
    viewers: 1247,
    likes: 89,
    description: 'تعلم أحدث تقنيات تطوير البرمجيات والممارسات الأفضل في البرمجة مع خبراء المجال',
    isLive: true
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-blue-800 text-white" dir="rtl">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة إلى الرئيسية
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-red-500 px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              مباشر
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Users className="w-4 h-4" />
              <span>{live.viewers.toLocaleString()} مشاهد</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-3">
          <div className="bg-black rounded-xl overflow-hidden shadow-2xl">
            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative">
              {/* Placeholder Video Player */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <div className="w-0 h-0 border-l-[10px] border-l-white border-y-[6px] border-y-transparent mr-1"></div>
                  </div>
                  <p className="text-white/80">البث المباشر جاري التحميل...</p>
                </div>
              </div>
              
              {/* Video Controls */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button size="sm" variant="secondary" className="bg-black/50 hover:bg-black/70 text-white border-0">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Video Info */}
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h1 className="text-2xl font-bold mb-2">{live.title}</h1>
            <p className="text-gray-300 mb-4">مقدم من: {live.presenter}</p>
            <p className="text-gray-400 leading-relaxed">{live.description}</p>
            
            <div className="flex items-center gap-4 mt-6">
              <Button className="bg-red-500 hover:bg-red-600 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                إعجاب ({live.likes})
              </Button>
              <Button variant="outline" className="border-white/20 bg-white/15 text-white hover:bg-white/10 flex  items-center gap-2">
                <Share2 className="w-4 h-4" />
                مشاركة
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 h-[600px] flex flex-col">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/20">
              <MessageSquare className="w-5 h-5" />
              <h3 className="font-semibold">الدردشة المباشرة</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {/* Chat Messages */}
              <div className="bg-white/5 rounded-lg p-3">
                <div className="font-medium text-sm text-blue-300">محمد أحمد</div>
                <div className="text-sm text-gray-300">شكراً على المعلومات القيمة!</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="font-medium text-sm text-cyan-300">فاطمة علي</div>
                <div className="text-sm text-gray-300">هل يمكن إعادة شرح الجزء الأخير؟</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="font-medium text-sm text-purple-300">عبدالله سعد</div>
                <div className="text-sm text-gray-300">محتوى ممتاز كالعادة 👏</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="اكتب رسالتك..."
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                إرسال
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Streaming;

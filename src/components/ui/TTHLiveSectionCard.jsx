import React, { useState, useEffect } from 'react';
import { useConfirmPurchase } from '@/components/ui/TTHPurchaseConfirm';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, ArrowRight, CheckCircle, AlertTriangle, Loader2, Lock, Video } from 'lucide-react';
import { pointsAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const LiveSectionCard = ({ section }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState(null);
  const [buySuccess, setBuySuccess] = useState(false);
  const { user } = useAuth ? useAuth() : { user: null };
  const cover = section.cover_url || section.cover_image_url || '/default-course-cover.png';
  
  // Create the path string like TTHCourseCard
  const getPathString = () => {
    if (section.speciality_name && section.material_name) {
      // Show: "Speciality - Material" (like education courses)
      return `${section.speciality_name} - ${section.material_name}`;
    } else if (section.material_name) {
      // Show: Just "Material" (no speciality)
      return section.material_name;
    } else if (section.speciality_name) {
      // Show: Just "Speciality" (no material)
      return section.speciality_name;
    } else {
      return 'جلسة لايف'; // Fallback
    }
  };

  const title = section.title; // Keep original title like course cards
  const path = getPathString();
  const price = section.price ? `${section.price} دج` : 'مجاني';
  const purchased = section.purchased || buySuccess;

  // Check purchase status on component mount
  useEffect(() => {
    if (user && section.id) {
      checkPurchaseStatus();
    }
  }, [user, section.id]);

  const checkPurchaseStatus = async () => {
    try {
      const response = await fetch(`/api/live-sections/${section.id}/access`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.hasPurchased) {
          setBuySuccess(true);
        }
      }
    } catch (err) {
      console.error('Error checking purchase status:', err);
    }
  };

  const confirmPurchase = useConfirmPurchase();

  const handleBuyLiveSection = async () => {
    if (!user) {
      alert('يجب تسجيل الدخول كطالب لشراء هذه الجلسة.');
      return;
    }
    if (user.role !== 'student') {
      alert('يجب أن تكون مسجلاً كطالب لشراء هذه الجلسة.');
      return;
    }
    
    // For free live sections, don't ask for confirmation
    if (section.price && section.price > 0) {
      if (!(await confirmPurchase({
        title: section.title,
        price: section.price,
        kindLabel: 'شراء دورة بالنقاط',
      }))) {
        return;
      }
    }
    
    setBuyLoading(true);
    setBuyError(null);
    setBuySuccess(false);
    try {
      // Use the live session purchase API
      const res = await pointsAPI.buyLiveSession(section.id);
      if (res.success) {
        setBuySuccess(true);
        alert('تم شراء الجلسة بنجاح! سيتم توجيهك إلى تفاصيل الجلسة.');
        window.location.href = `/TTHLanguages/livesection/${section.id}`;
      } else {
        setBuyError(res.error || 'حدث خطأ أثناء الشراء');
      }
    } catch (err) {
      if (err && err.message && err.message.includes('Not enough points')) {
        setBuyError('ليس لديك نقاط كافية. يرجى شراء المزيد من النقاط.');
      } else if (err && err.message && err.message.includes('already purchased')) {
        setBuyError('لقد اشتريت هذه الجلسة من قبل.');
      } else {
        setBuyError('حدث خطأ أثناء الشراء');
      }
    } finally {
      setBuyLoading(false);
    }
  };

  return (
    <div
      className={`relative flex h-full flex-col bg-white rounded-2xl shadow-lg overflow-hidden w-full max-w-[400px] border border-gray-100 rtl transition-all duration-500 ease-out cursor-pointer ${isHovered ? 'scale-[1.02] shadow-2xl' : 'hover:shadow-xl'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ fontFamily: 'Nunito, Rowdies, Poppins, sans-serif' }}
      onClick={() => {
        // Allow navigation for everyone - they'll see locked content if not purchased
        window.location.href = `/TTHLanguages/livesection/${section.id}`;
      }}
    >
      <div className="relative mt-9 border overflow-hidden">
        <div className={`transform transition-all duration-700 ease-out ${isHovered ? 'scale-110' : 'scale-100'}`}> 
          <img
            src={cover}
            alt={section.title}
            className="w-full h-36 object-cover"
            onError={e => { e.target.src = '/default-course-cover.png'; }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
        {/* Live badge */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-blue-500/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow">
          <Video className="w-4 h-4 mr-1" /> لايف
        </div>
        {/* Lock/Check icon indicator */}
        {purchased ? (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow">
            <CheckCircle className="w-4 h-4 mr-1" /> تم الشراء
          </div>
        ) : (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-gray-300/90 text-gray-700 px-3 py-1 rounded-full text-xs font-bold shadow">
            <Lock className="w-4 h-4 mr-1" /> غير مملوك
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 space-y-2.5">
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Video className="w-4 h-4 text-[#194cbf]" />
            </div>
            <span className="text-sm font-medium text-gray-700">{path}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Clock className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">جلسة لايف</span>
          </div>
        </div>
        <h3 className="text-base font-bold text-blue-800 leading-snug hover:text-[#194cbf] transition-colors duration-300 text-right font-rowdies line-clamp-2 min-h-[2.6rem]">
          {title}
        </h3>
        {section.professor_name && (
          <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
            <span className="font-medium">الأستاذ:</span>
            <span className="text-[#194cbf] font-semibold">{section.professor_name}</span>
          </div>
        )}
        
        <p className="text-gray-600 text-[13px] leading-relaxed line-clamp-2 min-h-[2.4rem] text-right font-poppins">
          {section.description}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          {/* Watch button if user owns the live section */}
          {user && purchased && (
            <Link to={`/TTHLanguages/livesection/${section.id}`}>
              <button
                className="group flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[#194cbf] to-[#61a1ff] hover:from-[#1340a0] hover:to-[#4a8de8] transform transition-all duration-300 ease-out shadow-lg hover:shadow-xl"
                onClick={e => { e.stopPropagation(); }}
              >
                انضم الآن
                <ArrowRight className="w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Link>
          )}
          {/* Price display */}
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-blue-500 bg-clip-text text-transparent">
            {price}
          </div>
        </div>
        {/* Buy with points button and messages */}
        {user && user.role === 'student' && !purchased && (
          <div className="mt-4 flex flex-col gap-2">
            <button
              className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-[#194cbf] to-[#61a1ff] hover:from-[#1340a0] hover:to-[#4a8de8] text-white font-extrabold text-lg shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleBuyLiveSection}
              disabled={buyLoading}
            >
              {buyLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> جاري الشراء...
                </span>
              ) : !section.price || section.price === 0 || section.price === '0' ? 'احصل عليه مجاناً' : 'شراء الجلسة بالنقاط'}
            </button>
            {buyError && (
              <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded p-2 text-sm font-bold mt-1">
                <AlertTriangle className="w-4 h-4" />
                {buyError.includes('نقاط كافية') ? (
                  <>
                    {buyError} <Link to="/points" className="underline text-blue-700 ml-2">شراء النقاط</Link>
                  </>
                ) : buyError}
              </div>
            )}
          </div>
        )}
        {/* If not logged in, show buy button that redirects to login after alert */}
        {!user && !purchased && (
          <div className="mt-4 flex flex-col gap-2">
            <button
              className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-[#194cbf] to-[#61a1ff] hover:from-[#1340a0] hover:to-[#4a8de8] text-white font-extrabold text-lg shadow-lg transition-all duration-300"
              onClick={e => {
                e.stopPropagation();
                alert('يجب تسجيل الدخول كطالب لشراء هذه الجلسة.');
                window.location.href = '/login';
              }}
            >
              {!section.price || section.price === 0 || section.price === '0' ? 'احصل عليه مجاناً' : 'شراء الجلسة بالنقاط'}
            </button>
          </div>
        )}

      </div>
      <div className={`absolute inset-0 opacity-0 pointer-events-none transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full ${isHovered ? 'opacity-100' : ''}`} />
    </div>
  );
};

export default LiveSectionCard; 
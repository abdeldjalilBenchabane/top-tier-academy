import React, { useState, useEffect } from 'react';
import { useConfirmPurchase } from '@/components/ui/TTHPurchaseConfirm';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, ArrowRight, CheckCircle, AlertTriangle, Loader2, Lock } from 'lucide-react';
import { pointsAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const CourseCard = ({ course }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState(null);
  const [buySuccess, setBuySuccess] = useState(false);
  const { user } = useAuth ? useAuth() : { user: null };
  const cover = course.cover_url || course.image || '/default-course-cover.png';
  
  let path;
  if (course.material_name) {
    // Education course path: Show shorter path
    if (course.speciality_name) {
      // Show: "Speciality - Material"
      path = `${course.speciality_name} - ${course.material_name}`;
    } else {
      // Show: Just "Material" (no speciality)
      path = course.material_name;
    }
  } else if (course.language_name && course.language_level_name) {
    // Language course path: "Language Level"
    path = `${course.language_name} ${course.language_level_name}`;
  } else {
    path = 'مسار غير محدد'; // Fallback
  }

  // Check localStorage on mount to restore purchased status (iOS Safari fix)
  useEffect(() => {
    try {
      const purchasedCourses = JSON.parse(localStorage.getItem('purchasedCourses') || '[]');
      if (purchasedCourses.includes(course.id)) {
        course.purchased = true;
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [course.id]);

  const price = course.price ? `${course.price} دج` : 'مجاني';
  const purchased = course.purchased || buySuccess;

  const confirmPurchase = useConfirmPurchase();

  const handleBuyWithPoints = async (e) => {
    e.stopPropagation(); // Prevent card click from triggering
    
    if (!user) {
      alert('يجب تسجيل الدخول كطالب لشراء هذا الكورس.');
      return;
    }
    if (user.role !== 'student') {
      alert('يجب أن تكون مسجلاً كطالب لشراء هذا الكورس.');
      return;
    }
    if (!(await confirmPurchase({
      title: course.title,
      price: course.price,
      kindLabel: 'شراء درس بالنقاط',
    }))) {
      return;
    }
    setBuyLoading(true);
    setBuyError(null);
    setBuySuccess(false);
    try {
      const res = await pointsAPI.buyCourse(course.id);
      if (res.success) {
        // Update state immediately
        setBuySuccess(true);
        
        // Update the course object directly (mutable update for immediate UI feedback)
        course.purchased = true;
        
        // Trigger points update event to refresh navbar
        window.dispatchEvent(new CustomEvent('pointsUpdated', { 
          detail: { points: res.newBalance } 
        }));
        
        // Force a re-render by updating state
        // Use requestAnimationFrame to ensure state updates before alert
        requestAnimationFrame(() => {
          // Store purchase in localStorage for persistence (iOS Safari fix)
          try {
            const purchasedCourses = JSON.parse(localStorage.getItem('purchasedCourses') || '[]');
            if (!purchasedCourses.includes(course.id)) {
              purchasedCourses.push(course.id);
              localStorage.setItem('purchasedCourses', JSON.stringify(purchasedCourses));
            }
          } catch (e) {
            console.error('Error saving to localStorage:', e);
          }
          
          // Show alert and redirect after state has updated
          setTimeout(() => {
            alert('تم شراء الكورس بنجاح! سيتم توجيهك إلى محتوى الكورس.');
            // Use window.location.replace for iOS Safari compatibility
            window.location.replace(`/coursesList/courses/${course.id}`);
          }, 50);
        });
      } else {
        setBuyError(res.error || 'حدث خطأ أثناء الشراء');
      }
    } catch (err) {
      if (err && err.message && err.message.includes('Not enough points')) {
        setBuyError('ليس لديك نقاط كافية. يرجى شراء المزيد من النقاط.');
      } else if (err && err.message && err.message.includes('already purchased')) {
        setBuyError('لقد اشتريت هذا الكورس من قبل.');
        // Mark as purchased even if error says already purchased
        setBuySuccess(true);
        course.purchased = true;
        // Save to localStorage
        try {
          const purchasedCourses = JSON.parse(localStorage.getItem('purchasedCourses') || '[]');
          if (!purchasedCourses.includes(course.id)) {
            purchasedCourses.push(course.id);
            localStorage.setItem('purchasedCourses', JSON.stringify(purchasedCourses));
          }
        } catch (e) {
          // Ignore localStorage errors
        }
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
      onClick={() => window.location.href = `/coursesList/courses/${course.id}`}
    >
      <div className="relative mt-9 border overflow-hidden">
        <div className={`transform transition-all duration-700 ease-out ${isHovered ? 'scale-110' : 'scale-100'}`}> 
          <img
            src={cover}
            alt={course.title}
            className="w-full h-36 object-cover"
            onError={e => { e.target.src = '/default-course-cover.png'; }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
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
              <BookOpen className="w-4 h-4 text-[#194cbf]" />
            </div>
            <span className="text-sm font-medium text-gray-700">{path}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Clock className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">{course.duration || ''}</span>
          </div>
        </div>
        {/* Two lines, always: a one-line title and a three-line one used to
            make two cards side by side different heights. */}
        <h3 className="text-base font-bold text-blue-800 leading-snug hover:text-[#194cbf] transition-colors duration-300 text-right font-rowdies line-clamp-2 min-h-[2.6rem]">
          {course.title}
        </h3>
        {course.created_by_name && (
          <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
            <span className="font-medium">الأستاذ:</span>
            <span className="text-[#194cbf] font-semibold">{course.created_by_name}</span>
          </div>
        )}
        <p className="text-gray-600 text-[13px] leading-relaxed line-clamp-2 min-h-[2.4rem] text-right font-poppins">
          {course.description}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          {/* Watch button if user owns the course */}
          {user && purchased && (
            <Link to={`/coursesList/courses/${course.id}`}>
              <button
                className="group flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[#194cbf] to-[#61a1ff] hover:from-[#1340a0] hover:to-[#4a8de8] transform transition-all duration-300 ease-out shadow-lg hover:shadow-xl"
                onClick={e => { e.stopPropagation(); }}
              >
                مشاهدة
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
        {user && user.role === 'student' && course.price !== null && course.price !== undefined && !purchased && (
          <div className="mt-4 flex flex-col gap-2">
            <button
              className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-[#194cbf] to-[#61a1ff] hover:from-[#1340a0] hover:to-[#4a8de8] text-white font-extrabold text-lg shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={(e) => {
                e.stopPropagation();
                handleBuyWithPoints(e);
              }}
              disabled={buyLoading}
            >
              {buyLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> جاري الشراء...
                </span>
              ) : course.price === 0 ? 'احصل عليه مجاناً' : 'شراء بالدفع بالنقاط'}
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
        {!user && course.price !== null && course.price !== undefined && !purchased && (
          <div className="mt-4 flex flex-col gap-2">
            <button
              className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-[#194cbf] to-[#61a1ff] hover:from-[#1340a0] hover:to-[#4a8de8] text-white font-extrabold text-lg shadow-lg transition-all duration-300"
              onClick={e => {
                e.stopPropagation();
                alert('يجب تسجيل الدخول كطالب لشراء هذا الكورس.');
                window.location.href = '/login';
              }}
            >
              {course.price === 0 ? 'احصل عليه مجاناً' : 'شراء بالدفع بالنقاط'}
            </button>
          </div>
        )}
      </div>
      <div className={`absolute inset-0 opacity-0 pointer-events-none transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full ${isHovered ? 'opacity-100' : ''}`} />
    </div>
  );
};

export default CourseCard; 
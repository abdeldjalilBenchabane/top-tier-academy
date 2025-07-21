import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, ArrowRight, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { pointsAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const CourseCard = ({ course }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState(null);
  const [buySuccess, setBuySuccess] = useState(false);
  const { user } = useAuth ? useAuth() : { user: null };
  const cover = course.cover_url || course.image || '/default-course-cover.png';
  let path = course.material_name || '';
  if (!path && course.language_level_id && course.language_level_name) {
    path = course.language_level_name;
  }
  const price = course.price ? `${course.price} دج` : 'مجاني';
  const purchased = course.purchased || buySuccess;

  const handleBuyWithPoints = async () => {
    setBuyLoading(true);
    setBuyError(null);
    setBuySuccess(false);
    try {
      const res = await pointsAPI.buyCourse(course.id);
      if (res.success) {
        setBuySuccess(true);
        window.dispatchEvent(new CustomEvent('pointsUpdated', { detail: { points: -parseInt(course.price) } }));
      } else {
        setBuyError(res.error || 'حدث خطأ أثناء الشراء');
      }
    } catch (err) {
      if (err && err.message && err.message.includes('Not enough points')) {
        setBuyError('ليس لديك نقاط كافية. يرجى شراء المزيد من النقاط.');
      } else if (err && err.message && err.message.includes('already purchased')) {
        setBuyError('لقد اشتريت هذا الكورس من قبل.');
      } else {
        setBuyError('حدث خطأ أثناء الشراء');
      }
    } finally {
      setBuyLoading(false);
    }
  };

  return (
    <div
      className={`relative bg-white rounded-3xl shadow-lg overflow-hidden w-full max-w-[400px] border border-gray-100 rtl transition-all duration-500 ease-out cursor-pointer ${isHovered ? 'scale-105 shadow-2xl' : 'hover:shadow-xl'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ fontFamily: 'Nunito, Rowdies, Poppins, sans-serif' }}
    >
      <div className="relative mt-9 border overflow-hidden">
        <div className={`transform transition-all duration-700 ease-out ${isHovered ? 'scale-110' : 'scale-100'}`}> 
          <img
            src={cover}
            alt={course.title}
            className="w-full h-48 object-cover"
            onError={e => { e.target.src = '/default-course-cover.png'; }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
        {purchased && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow">
            <CheckCircle className="w-4 h-4 mr-1" /> تم الشراء
          </div>
        )}
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BookOpen className="w-4 h-4 text-blue-600" />
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
        <h3 className="text-xl font-bold text-blue-800 leading-tight hover:text-blue-600 transition-colors duration-300 text-right font-rowdies">
          {course.title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 text-right font-poppins">
          {course.description}
        </p>
        <div className="flex items-center justify-between pt-4">
          <Link to={`/coursesList/courses/${course.id}`}>
            <button
              className={`group flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform transition-all duration-300 ease-out shadow-lg hover:shadow-xl ${isHovered ? 'translate-x-1' : ''}`}
              onClick={e => { e.stopPropagation(); }}
          >
            التسجيل الآن
              <ArrowRight className={`w-4 h-4 transform transition-transform duration-300 ${isHovered ? 'translate-x-1' : 'group-hover:translate-x-1'}`} />
          </button>
          </Link>
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-blue-500 bg-clip-text text-transparent">
            {price}
          </div>
        </div>
        {/* Buy with points button and messages */}
        {course.price && course.price > 0 && !purchased && (
          <div className="mt-4 flex flex-col gap-2">
            <button
              className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-lg shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleBuyWithPoints}
              disabled={buyLoading}
            >
              {buyLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> جاري الشراء...
                </span>
              ) : 'شراء بالدفع بالنقاط'}
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
            {buySuccess && (
              <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded p-2 text-sm font-bold mt-1">
                <CheckCircle className="w-4 h-4" /> تم شراء الكورس بنجاح!
              </div>
            )}
          </div>
        )}
      </div>
      <div className={`absolute inset-0 opacity-0 pointer-events-none transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full ${isHovered ? 'opacity-100' : ''}`} />
    </div>
  );
};

export default CourseCard; 
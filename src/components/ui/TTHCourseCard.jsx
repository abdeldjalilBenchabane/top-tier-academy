import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, ArrowRight } from 'lucide-react'
const CourseCard = ({ course }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const cover = course.cover_url || course.image || '/default-course-cover.png';
  // Path: material_name for education, fallback to language/level for language courses
  let path = course.material_name || '';
  if (!path && course.language_level_id && course.language_level_name) {
    path = course.language_level_name;
  }
  // Price: use course.price if present, otherwise 'مجاني'
  const price = course.price ? `${course.price} دج` : 'مجاني';
  return (
    <div
      className={`
        relative bg-white rounded-3xl shadow-lg overflow-hidden w-full max-w-[400px] 
        transform transition-all duration-500 ease-out cursor-pointer
        ${isHovered ? 'scale-105 shadow-2xl' : 'hover:shadow-xl'}
        border border-gray-100 rtl
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative mt-9 border overflow-hidden">
        <div className={`
          transform transition-all duration-700 ease-out
          ${isHovered ? 'scale-110' : 'scale-100'}
        `}>
          <img
            src={cover}
            alt={course.title}
            className="w-full h-48 object-cover"
            onError={e => { e.target.src = '/default-course-cover.png'; }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {path}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Clock className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {course.duration || ''}
            </span>
          </div>
        </div>
        <h3 className="text-xl font-bold text-blue-800 leading-tight hover:text-blue-600 transition-colors duration-300 text-right">
          {course.title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 text-right">
          {course.description}
        </p>
        <div className="flex items-center justify-between pt-4">
           <Link to={`/coursesList/courses/${course.id}`}><button
            className={`
              group flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white
              bg-gradient-to-r from-blue-800 to-blue-500 hover:from-blue-700 hover:to-blue-700
              transform transition-all duration-300 ease-out shadow-lg hover:shadow-xl
              ${isHovered ? 'translate-x-1' : ''}
            `}
            onClick={(e) => {
              e.stopPropagation();
              console.log('Enrolling in course:', course.title);
            }}
          >
            التسجيل الآن
            <ArrowRight className={`
              w-4 h-4 transform transition-transform duration-300
              ${isHovered ? 'translate-x-1' : 'group-hover:translate-x-1'}
            `} />
          </button>
          </Link>
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-blue-500 bg-clip-text text-transparent">
            {price}
          </div>
        </div>
      </div>
      <div className={`
        absolute inset-0 opacity-0 pointer-events-none transition-opacity duration-500
        bg-gradient-to-r from-transparent via-white/10 to-transparent
        transform -skew-x-12 translate-x-full
        ${isHovered ? 'opacity-100' : ''}
      `} />
    </div>
  );
};

export default CourseCard; 
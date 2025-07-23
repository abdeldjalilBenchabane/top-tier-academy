import React, { useEffect, useState } from "react";
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";
import CourseCard from "../components/ui/TTHCourseCard";
import SearchFilter from "../components/ui/TTHSearchFilter";
import { pointsAPI } from '@/services/api';

export default function Courses() {
  const [coursesByPath, setCoursesByPath] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllCourses() {
      setLoading(true);
      try {
        const res = await fetch('/api/courses?status=approved');
        let allCourses = await res.json();
        
        let purchasedIds = [];
        if (localStorage.getItem('token')) {
          try {
            const purchasedRes = await pointsAPI.getMyCourses();
            purchasedIds = purchasedRes.courseIds || [];
          } catch (e) { /* ignore if not logged in */ }
        }

        allCourses = allCourses.map(course => ({ ...course, purchased: purchasedIds.includes(course.id) }));

        // Fetch material prices for education courses
        let materialsData = [];
        try {
          const materialsRes = await fetch('/api/courses/materials/list');
          if (materialsRes.ok) {
            materialsData = await materialsRes.json();
          }
        } catch (e) { /* ignore */ }

        allCourses = allCourses.map(course => {
          // For education courses, use material price if course price is 0/null
          if (!course.language_level_id) {
            let price = course.price;
            if (!price || price === 0) {
              const material = materialsData.find(m => m.name === course.material_name);
              price = material ? material.price : 0;
            }
            return { ...course, price };
          }
          return course;
        });

        // Dynamically group courses by a combined path, filtering out language courses
        const groupedCourses = allCourses.reduce((acc, course) => {
          if (course.level_name && course.year_name && !course.language_level_id) {
            const pathName = `${course.level_name} - ${course.year_name}`;
            if (!acc[pathName]) {
              acc[pathName] = [];
            }
            acc[pathName].push(course);
          }
          return acc;
        }, {});
        
        setCoursesByPath(groupedCourses);

      } catch (e) {
        console.error("Failed to fetch or group courses:", e);
        setCoursesByPath({});
      } finally {
        setLoading(false);
      }
    }
    fetchAllCourses();
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        
        <section className="relative overflow-hidden mt-[2px] bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
          </div>
          
          <div className="relative container mx-auto px-4 py-16 md:py-24">
            <div className="text-right max-w-4xl mx-auto">
              <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold font-nunito leading-tight mb-6">
                <span className="block mb-2">انضم الى</span>
                <span className="bg-gradient-to-r from-purple-300 to-purple-100 bg-clip-text text-transparent">
                  نخبة من الحصص الفريدة
                </span>
              </h1>
              <p className="text-blue-100 text-lg md:text-xl lg:text-2xl font-bold font-poppins leading-relaxed mb-8">
                حدد المرحلة الدراسية المناسبة لك
              </p>
              
              {/* Stats ou badges */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-end mt-8">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                  <span className="font-bold">100+</span> حصة متاحة
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                  <span className="font-bold">1000+</span> طالب
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                  <span className="font-bold">⭐ 4.9</span> تقييم
                </div>
              </div>
            </div>
          </div>
        </section>

      
        <section className="py-8 bg-white shadow-sm">
          <div className="container mx-auto px-4">
            <SearchFilter />
          </div>
        </section>

        {/* Courses Section by Path */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 space-y-16">
            {loading ? (
              <div className="text-center">Loading...</div>
            ) : Object.keys(coursesByPath).length > 0 ? (
              Object.keys(coursesByPath).map(pathName => (
                coursesByPath[pathName] && coursesByPath[pathName].length > 0 && (
                  <div key={pathName}>
            <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-rowdies mb-4 relative">
                  <span className="text-gray-800">حصص </span>
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          {pathName}
                  </span>
                </h2>
              </div>
              <div 
                dir="rtl" 
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8 justify-items-center"
              >
                      {coursesByPath[pathName].map((course, index) => (
                  <div
                    key={course.id}
                          className="w-full max-w-sm"
                          style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>
                  </div>
                )
              ))
            ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">لا توجد دروس متاحة حالياً</h3>
                  <p className="text-gray-600">سيتم إضافة دروس جديدة قريباً</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
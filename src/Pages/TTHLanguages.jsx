import React from "react";
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";
import CourseCard from "../components/ui/TTHCourseCard";
import LanguageFilter from "../components/ui/TTHLanguageFilter";
import { languageCourses } from "../data";

export default function Languages() {
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <section className="relative overflow-hidden mt-[2px] bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
          </div>
          <div className="relative container mx-auto px-4 py-16 md:py-24">
            <div className="text-right max-w-4xl mx-auto">
              <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold font-nunito leading-tight mb-6">
                <span className="block mb-2">تعلّم</span>
                <span className="bg-gradient-to-r from-purple-300 to-purple-100 bg-clip-text text-transparent">
                  اللغات العالمية
                </span>
              </h1>
              <p className="text-blue-100 text-lg md:text-xl lg:text-2xl font-bold font-poppins leading-relaxed mb-8">
                اختر اللغة والمستوى المناسب  لك
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


        {/* Language Filters */}
        <LanguageFilter />
        {/* Section Title */}
        <div className="text-center mb-8">
          <h2 className="text-primary text-3xl font-bold font-rowdies leading-[24px]">
            <span className="text-primary">دورات </span>
            <span style={{ color: '#22d3ee' }}>اللغات</span>
          </h2>
        </div>
        {/* Languages Grid */}
        <div className="relative">
          <div dir="rtl" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  xl:grid-cols-3 gap-8 justify-items-center relative z-10">
            {languageCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
              />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 
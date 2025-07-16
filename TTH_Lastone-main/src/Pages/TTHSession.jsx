import React from "react";
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";
import CourseCard from "../components/ui/TTHCourseCard";
import SearchFilter from "../components/ui/TTHSearchFilter";
import { courseData } from "../data";

export default function Session() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between" >
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-grow">
        {/* Hero Section */}
        <div className="text-right mb-12">
          <h1 className="text-brand text-4xl font-bold font-nunito leading-[55px] mb-4">
            <span className="text-brand">انضم الى </span>
            <span style={{ color: '#22d3ee' }}>الدورات</span>
          </h1>
          <p className="text-primary text-2xl text-gray-600 font-bold font-poppins leading-[30px] mb-8">
            حدد المرحلة الدراسية المناسبة لك
          </p>
        </div>
        {/* Search Filters */}
        <SearchFilter />
        {/* Section Title */}
        <div className="text-center mb-8">
          <h2 className="text-primary text-3xl font-bold font-rowdies leading-[24px]">
            <span className="text-primary">الدورات </span>
            <span style={{ color: '#22d3ee' }}>المتاحة</span> 
          </h2>
        </div>
        {/* Sessions Grid */}
        <div className="relative">
          <div dir="rtl" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  xl:grid-cols-3 gap-8 justify-items-center relative z-10">
            {courseData.map((course) => (
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
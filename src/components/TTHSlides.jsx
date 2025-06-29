import React, { useState, useEffect } from 'react';
import { slidesAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, ChevronRight, Play, ExternalLink } from 'lucide-react';
import SearchBar from './TTHSearchBar';

const TTHSlides = () => {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    try {
      setIsLoading(true);
      const role = user?.role || 'student';
      const response = await slidesAPI.getActive(role);
      setSlides(response.slides || []);
    } catch (error) {
      console.error('Error loading slides:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (slides.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleSlideClick = async (slideId) => {
    try {
      await slidesAPI.trackClick(slideId, navigator.userAgent);
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  const handleSlideView = async (slideId) => {
    try {
      await slidesAPI.trackView(slideId, navigator.userAgent);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  useEffect(() => {
    if (slides[currentSlide]) {
      handleSlideView(slides[currentSlide].id);
    }
  }, [currentSlide, slides]);

  if (isLoading) {
    return (
      <div className="h-[120vh] md:h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (slides.length === 0) {
    return null; // Don't render anything if no slides
  }

  const currentSlideData = slides[currentSlide];

  return (
    <section className="relative text-white bg-cover bg-center h-[120vh] md:h-screen min-h-screen flex flex-col md:flex-row items-center justify-between p-6 mt-[0.1rem] md:p-12 transition-all duration-1000 ease-in-out"
      style={{
        backgroundImage: currentSlideData.image_url 
          ? `url('public/Etudiente1.PNG')`
          : `url('public/Etudiente1.PNG')`
      }}
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 transition-all duration-1000 ease-in-out"
        style={{
          backgroundColor: currentSlideData.overlay_color || '#000000',
          opacity: currentSlideData.overlay_opacity || 0.3,
        }}
      />

      {/* Content - Left Side */}
      <div dir='rtl' className="relative z-10 max-w-2xl w-[90%] sm:w-[40%]">
        <p className="text-gray-200 text-center sm:text-right md:text-[1.28rem] opacity-60 mb-4">
          {currentSlideData.description || "المعلمون المميزون يصنعون مستقبل الأجيال"}
        </p>
        <div className="flex flex-col sm:items-start items-center mb-16 space-y-4">
          <div className="text-4xl md:text-5xl font-semibold">
            {currentSlideData.title || "ابدأ"} <span className="text-cyan-400">{currentSlideData.title ? "" : "رحلتك "}</span>{currentSlideData.title ? "" : "التعليمية"}
          </div>
          {!currentSlideData.title && (
            <>
              <div className="text-4xl md:text-5xl font-bold">من بيتك مع أفضل</div>
              <div className="text-4xl md:text-5xl font-bold">الأساتذة في الجزائر</div>
            </>
          )}
        </div>
        <div className="flex md:flex-row items-center md:justify-start justify-center gap-4">
          {currentSlideData.cta_text && currentSlideData.cta_link ? (
            <button 
              onClick={() => handleSlideClick(currentSlideData.id)}
              className="text-white border rounded-sm px-6 py-2 shadow hover:opacity-50"
            >
              {currentSlideData.cta_text}
            </button>
          ) : (
            <>
              <button className="text-white border rounded-sm px-6 py-2 shadow hover:opacity-50">عرض الدورات</button>
              <button className="px-6 py-2 hover:opacity-50">الحصص المباشرة</button>
            </>
          )}
        </div>
        <SearchBar />
      </div>

      {/* Right Side - Video or Image */}
      <div className="relative z-10 mt-10 md:mt-0 md:ml-8">
        {currentSlideData.media_type === 'video' && currentSlideData.video_url ? (
          <video
            className="w-72 md:w-96 object-cover drop-shadow-lg rounded-lg"
            autoPlay
            muted
            loop
            playsInline
            controls
          >
            <source src={currentSlideData.video_url} type="video/mp4" />
          </video>
        ) : (
          <img
            src={currentSlideData.image_url || "/public/phoo2.PNG"}
            alt={currentSlideData.alt_text || "Étudiante"}
            className="w-72 md:w-96 object-cover drop-shadow-lg"
          />
        )}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-200 z-20"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-200 z-20"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Alt Text for Accessibility */}
      {currentSlideData.alt_text && (
        <div className="sr-only">{currentSlideData.alt_text}</div>
      )}
    </section>
  );
};

export default TTHSlides; 
import React, { useState, useEffect, useRef } from 'react';
import { slidesAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, ChevronRight, Play, ExternalLink } from 'lucide-react';
import SearchBar from './TTHSearchBar';

const TTHSlides = () => {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const { user } = useAuth();
  const videoRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    try {
      setIsLoading(true);
      const role = user?.role || 'student';
      const response = await slidesAPI.getActive(role);
      
      console.log('Raw slides response:', response);
      
      // Transform snake_case to camelCase
      const transformedSlides = (response.slides || []).map(slide => ({
        id: slide.id,
        title: slide.title,
        description: slide.description,
        imageUrl: slide.image_url,
        videoUrl: slide.video_url,
        mediaType: slide.media_type,
        order: slide.order,
        isActive: slide.is_active,
        duration: slide.duration,
        startDate: slide.start_date,
        endDate: slide.end_date,
        targetAudience: slide.target_audience_roles || ['student'],
        ctaText: slide.cta_text,
        ctaLink: slide.cta_link,
        overlayColor: slide.overlay_color,
        overlayOpacity: slide.overlay_opacity,
        transition: slide.transition,
        altText: slide.alt_text,
        views: slide.views,
        clicks: slide.clicks,
        createdAt: slide.created_at,
        updatedAt: slide.updated_at,
      }));
      
      console.log('Transformed slides:', transformedSlides);
      setSlides(transformedSlides);
    } catch (error) {
      console.error('Error loading slides:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle slide transitions
  useEffect(() => {
    if (slides.length > 1) {
      const currentSlideData = slides[currentSlide];
      console.log('Current slide data:', currentSlideData);
      
      // Clear existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // If current slide is a video, don't auto-advance
      if (currentSlideData?.mediaType === 'video' && currentSlideData?.videoUrl) {
        console.log('Video slide detected, waiting for video to end');
        setIsVideoPlaying(true);
        return;
      }

      // For images, auto-advance every 2 seconds
      console.log('Image slide detected, auto-advancing in 2 seconds');
      setIsVideoPlaying(false);
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 2000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [currentSlide, slides]);

  // Handle video end event
  const handleVideoEnd = () => {
    console.log('Video ended, advancing to next slide');
    if (slides.length > 1) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }
  };

  // Handle video play/pause
  const handleVideoPlay = () => {
    setIsVideoPlaying(true);
  };

  const handleVideoPause = () => {
    setIsVideoPlaying(false);
  };

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

  const handleCTAClick = async (slide) => {
    try {
      console.log('CTA Click - Slide data:', slide);
      console.log('CTA Text:', slide.ctaText);
      console.log('CTA Link:', slide.ctaLink);
      
      // Track the click
      await handleSlideClick(slide.id);
      
      // Handle navigation
      const link = slide.ctaLink;
      if (link) {
        console.log('Processing link:', link);
        // Check if it's an external link (starts with http:// or https://)
        if (link.startsWith('http://') || link.startsWith('https://')) {
          console.log('External link detected, opening in new tab');
          // External link - open in new tab
          window.open(link, '_blank', 'noopener,noreferrer');
        } else {
          console.log('Internal link detected, navigating');
          // Internal link - navigate using React Router
          // If it starts with /, it's an internal route
          if (link.startsWith('/')) {
            // For now, use window.location for internal navigation
            // You can replace this with React Router navigation if needed
            window.location.href = link;
          } else {
            // Treat as relative path
            window.location.href = '/' + link.replace(/^\/+/, '');
          }
        }
      } else {
        console.log('No CTA link found');
      }
    } catch (error) {
      console.error('Error handling CTA click:', error);
    }
  };

  const handleSlideView = async (slideId) => {
    try {
      await slidesAPI.trackView(slideId, navigator.userAgent);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  // Count each slide once per visit.
  //
  // The carousel moves on every two seconds, and this used to record a view on
  // every move — so one visitor left on the landing page produced thirty views
  // a minute, for ever, counting the same handful of slides over and over.
  // That is what grew slide_analytics to 83,000 rows, and none of it said
  // anything a single view per slide does not.
  const viewedSlides = useRef(new Set());

  useEffect(() => {
    const slide = slides[currentSlide];
    if (!slide || viewedSlides.current.has(slide.id)) return;
    viewedSlides.current.add(slide.id);
    handleSlideView(slide.id);
  }, [currentSlide, slides]);

  if (isLoading) {
    return (
      <div className="h-[120vh] md:h-screen bg-gradient-to-br from-[#194cbf] to-[#61a1ff] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (slides.length === 0) {
    return null; // Don't render anything if no slides
  }

  const currentSlideData = slides[currentSlide];
  
  // Debug current slide data
  console.log('Current slide data:', currentSlideData);
  console.log('CTA Text:', currentSlideData?.ctaText);
  console.log('CTA Link:', currentSlideData?.ctaLink);

  return (
    <section className="relative text-white bg-cover bg-center h-[120vh] md:h-screen min-h-screen flex flex-col md:flex-row items-center justify-between p-6 mt-0 md:p-12 transition-all duration-1000 ease-in-out"
      style={{
        backgroundImage: 
           `url('/Etudiente1.PNG')`
      }}
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 transition-all duration-1000 ease-in-out"
        style={{
          
          opacity: currentSlideData.overlayOpacity || 0.3,
        }}
      />

      {/* Content - Left Side */}
      <div dir='rtl' className="relative z-10 max-w-2xl w-[90%] sm:w-[40%]">
        <p className="text-gray-200 text-center sm:text-right md:text-[1.28rem] opacity-60 mb-4">
          {currentSlideData.description || "المعلمون المميزون يصنعون مستقبل الأجيال"}
        </p>
        <div className="flex flex-col sm:items-start items-center ">
          <div className="text-4xl md:text-5xl font-semibold leading-[3.5rem] md:leading-[4.5rem] mb-16">
            {currentSlideData.title ? (
              (() => {
                const words = currentSlideData.title.trim().split(/\s+/).filter(Boolean);
                if (words.length === 1) {
                  return words[0];
                } else if (words.length === 2) {
                  return <>{words[0]} <span className="text-cyan-400">{words[1]}</span></>;
                } else {
                  return <>{words[0]} <span className="text-cyan-400">{words[1]}</span> {words.slice(2).join(' ')}</>;
                }
              })()
            ) : (
              <>
                ابدأ <span className="text-cyan-400">رحلتك </span>التعليمية
              </>
            )}
          </div>
        </div>
        <div className="flex md:flex-row items-center md:justify-start justify-center gap-4">
          {currentSlideData.ctaText && currentSlideData.ctaLink ? (
            <button 
              onClick={() => handleCTAClick(currentSlideData)}
              className="text-white border rounded-sm px-6 py-2 shadow hover:opacity-50"
            >
              {currentSlideData.ctaText}
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
      <div className="relative z-10 mt-2 md:mt-0 md:ml-8 self-start md:self-center" style={{ margin: 'auto' }}>
        {currentSlideData.mediaType === 'video' && currentSlideData.videoUrl ? (
          <video
            ref={videoRef}
            className="w-72 md:w-96 object-cover drop-shadow-lg rounded-lg"
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
          >
            <source src={currentSlideData.videoUrl} type="video/mp4" />
            <source src={currentSlideData.videoUrl} type="video/webm" />
            <source src={currentSlideData.videoUrl} type="video/ogg" />
          </video>
        ) : (
          <img
            src={currentSlideData.imageUrl || "/phoo2.PNG"}
            alt={currentSlideData.altText || "Étudiante"}
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
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
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
      {currentSlideData.altText && (
        <div className="sr-only">{currentSlideData.altText}</div>
      )}
    </section>
  );
};

export default TTHSlides; 
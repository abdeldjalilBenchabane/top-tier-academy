import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Download, FileText, Star, Clock, Globe, CheckCircle, BookOpen, Award, Users, Calendar, Eye, X, Image as ImageIcon, Video as VideoIcon, FileText as FileTextIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/Button";
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { useAuth } from '../contexts/AuthContext';

const levelLabels = {
    "primaire": "ابتدائي",
    "college": "إعدادي",
    "lycee": "ثانوي"
};

const subjectLabels = {
    "arabe": "اللغة العربية",
    "math": "الرياضيات",
    "science": "العلوم",
    "francais": "اللغة الفرنسية",
    "anglais": "اللغة الإنقليزية",
};

export default function CourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });
    const [reviews, setReviews] = useState([]);
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [relatedCourses, setRelatedCourses] = useState([]);
    
    // New state for interactive curriculum
    const [expandedSections, setExpandedSections] = useState(new Set());
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);
    
    // New state for main video player
    const [mainVideoUrl, setMainVideoUrl] = useState(null);
    const [mainVideoTitle, setMainVideoTitle] = useState('');
    
    // New state for content navigation
    const [allContent, setAllContent] = useState([]);
    const [currentContentIndex, setCurrentContentIndex] = useState(0);
    const [currentContent, setCurrentContent] = useState(null);
    
    // New state for language course prices
    const [languageCoursePrices, setLanguageCoursePrices] = useState({});
    
    // New state for threaded replies
    const [showReplyForm, setShowReplyForm] = useState(null);
    const [replyText, setReplyText] = useState({});

    const { user } = useAuth();

    useEffect(() => {
        const fetchCourseData = async () => {
            setLoading(true);
            try {
                // Fetch course details
                const courseRes = await fetch(`/api/courses/${id}`);
                if (!courseRes.ok) {
                    throw new Error('Course not found');
                }
                const courseData = await courseRes.json();
                setCourse(courseData);

                // Prepare all content for navigation
                const content = prepareAllContent(courseData);
                setAllContent(content);
                
                // Set initial content
                if (content.length > 0) {
                    setCurrentContent(content[0]);
                    setCurrentContentIndex(0);
                    updateMainPlayer(content[0]);
                }

                // Fetch related courses from the same material path
                if (courseData.specialityId) {
                    // For education courses with speciality - get courses with same speciality_id
                    console.log('Course has specialityId:', courseData.specialityId);
                    const relatedRes = await fetch(`/api/courses?speciality_id=${courseData.specialityId}&status=approved`);
                    if (relatedRes.ok) {
                        const allCourses = await relatedRes.json();
                        console.log('All courses with same speciality:', allCourses);
                        console.log('Current course ID:', id, 'Type:', typeof id);
                        // Filter out current course and show other education courses with same speciality
                        const filtered = allCourses
                            .filter(c => {
                                const isNotCurrent = c.id !== parseInt(id);
                                const hasSpeciality = c.speciality_id;
                                const isNotLanguage = !c.language_level_id;
                                console.log(`Course ${c.id}: isNotCurrent=${isNotCurrent}, hasSpeciality=${hasSpeciality}, isNotLanguage=${isNotLanguage}`);
                                return isNotCurrent && hasSpeciality && isNotLanguage;
                            })
                            .slice(0, 4);
                        console.log('Filtered courses:', filtered);
                        setRelatedCourses(filtered);
                    }
                } else if (courseData.materialId) {
                    // For education courses - get courses with same material_id
                    const relatedRes = await fetch(`/api/courses?material_id=${courseData.materialId}&status=approved`);
                    if (relatedRes.ok) {
                        const allCourses = await relatedRes.json();
                        // Filter out current course and courses without material_id (language courses)
                        const filtered = allCourses
                            .filter(c => {
                                const isNotCurrent = c.id !== parseInt(id);
                                const hasMaterial = c.material_id;
                                const isNotLanguage = !c.language_level_id;
                                return isNotCurrent && hasMaterial && isNotLanguage;
                            })
                            .slice(0, 4);
                        setRelatedCourses(filtered);
                    }
                } else if (courseData.language_level_id) {
                    // For language courses - get courses with same language
                    const relatedRes = await fetch('/api/courses?status=approved');
                    if (relatedRes.ok) {
                        const allCourses = await relatedRes.json();
                        // Get all language courses with the same language
                        const languageCourses = allCourses.filter(c => 
                            c.id !== parseInt(id) && 
                            c.language_level_id && 
                            !c.material_id
                        );
                        
                        // Get language levels for this course
                        const languageLevelsRes = await fetch('/api/language-levels');
                        if (languageLevelsRes.ok) {
                            const allLevels = await languageLevelsRes.json();
                            const currentLevel = allLevels.find(l => l.id === courseData.language_level_id);
                            
                            if (currentLevel) {
                                // Get courses with same language but different levels
                                const sameLanguageCourses = languageCourses.filter(c => {
                                    const courseLevel = allLevels.find(l => l.id === c.language_level_id);
                                    return courseLevel && courseLevel.language_id === currentLevel.language_id;
                                });
                                
                                setRelatedCourses(sameLanguageCourses.slice(0, 4));
                            } else {
                                setRelatedCourses(languageCourses.slice(0, 4));
                            }
                        } else {
                            setRelatedCourses(languageCourses.slice(0, 4));
                        }
                    }
                } else {
                    // For courses without material_id or language_level_id - show other similar courses
                    const relatedRes = await fetch('/api/courses?status=approved');
                    if (relatedRes.ok) {
                        const allCourses = await relatedRes.json();
                        // Filter out current course and show other courses without specific paths
                        const filtered = allCourses
                            .filter(c => c.id !== parseInt(id) && !c.material_id && !c.language_level_id)
                            .slice(0, 4);
                        setRelatedCourses(filtered);
                    }
                }

                // Fetch language course prices for language courses
                if (courseData.language_level_id || relatedCourses.some(c => c.language_level_id)) {
                    try {
                        const pricesRes = await fetch('/api/courses/language-course-prices');
                        if (pricesRes.ok) {
                            const prices = await pricesRes.json();
                            const pricesMap = {};
                            prices.forEach(price => {
                                pricesMap[`${price.course_id}-${price.language_level_id}`] = price.price;
                            });
                            setLanguageCoursePrices(pricesMap);
                        }
                    } catch (err) {
                        console.error('Failed to fetch language course prices:', err);
                    }
                }

                // Fetch reviews for the course
                const reviewsRes = await fetch(`/api/courses/${id}/comments?tab=reviews`);
                if (reviewsRes.ok) {
                    const reviewsData = await reviewsRes.json();
                    setReviews(reviewsData.comments || []);
                } else {
                    console.error('Failed to fetch reviews for course:', id);
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCourseData();
        }
    }, [id]);

    // New functions for interactive curriculum
    const toggleSection = (sectionIndex) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionIndex)) {
            newExpanded.delete(sectionIndex);
        } else {
            newExpanded.add(sectionIndex);
        }
        setExpandedSections(newExpanded);
    };

    const handleVideoClick = (videoUrl, title) => {
        // Find the content index and update navigation
        const contentIndex = allContent.findIndex(content => 
            content.type === 'video' && content.url === videoUrl
        );
        if (contentIndex !== -1) {
            setCurrentContentIndex(contentIndex);
            setCurrentContent(allContent[contentIndex]);
            updateMainPlayer(allContent[contentIndex]);
        }
        
        // Scroll to top to show the updated content
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleImageClick = (imageUrl, title) => {
        setSelectedImage({ url: imageUrl, title });
        setShowImageModal(true);
    };

    const handlePdfClick = (pdfUrl, title) => {
        setSelectedPdf({ url: pdfUrl, title });
        setShowPdfModal(true);
    };

    const handleDownload = (fileUrl, fileName) => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getBlockIcon = (type) => {
        switch (type) {
            case 'video':
                return <VideoIcon className="text-red-500" size={16} />;
            case 'image':
                return <ImageIcon className="text-green-500" size={16} />;
            case 'pdf':
                return <FileTextIcon className="text-blue-500" size={16} />;
            default:
                return <FileTextIcon className="text-gray-500" size={16} />;
        }
    };

    const getBlockTypeLabel = (type) => {
        switch (type) {
            case 'video':
                return 'فيديو';
            case 'image':
                return 'صورة';
            case 'pdf':
                return 'ملف PDF';
            case 'text':
                return 'نص';
            default:
                return 'محتوى';
        }
    };

    // Function to prepare all content for navigation
    const prepareAllContent = (courseData) => {
        const content = [];
        courseData.sections?.forEach((section, sectionIndex) => {
            section.blocks?.forEach((block, blockIndex) => {
                if (block.type === 'video' && block.files?.length > 0) {
                    content.push({
                        type: 'video',
                        url: block.files[0].file_path,
                        title: block.title || `فيديو ${sectionIndex + 1}.${blockIndex + 1}`,
                        sectionTitle: section.title,
                        sectionIndex,
                        blockIndex
                    });
                } else if (block.type === 'image' && block.files?.length > 0) {
                    content.push({
                        type: 'image',
                        url: block.files[0].file_path,
                        title: block.title || `صورة ${sectionIndex + 1}.${blockIndex + 1}`,
                        sectionTitle: section.title,
                        sectionIndex,
                        blockIndex
                    });
                } else if (block.type === 'pdf' && block.files?.length > 0) {
                    content.push({
                        type: 'pdf',
                        url: block.files[0].file_path,
                        title: block.title || `ملف PDF ${sectionIndex + 1}.${blockIndex + 1}`,
                        fileName: block.files[0].original_name,
                        sectionTitle: section.title,
                        sectionIndex,
                        blockIndex
                    });
                } else if (block.type === 'text' && block.content) {
                    content.push({
                        type: 'text',
                        content: block.content,
                        title: block.title || `نص ${sectionIndex + 1}.${blockIndex + 1}`,
                        sectionTitle: section.title,
                        sectionIndex,
                        blockIndex
                    });
                }
            });
        });
        return content;
    };

    // Navigation functions
    const goToNextContent = () => {
        if (currentContentIndex < allContent.length - 1) {
            const nextIndex = currentContentIndex + 1;
            setCurrentContentIndex(nextIndex);
            setCurrentContent(allContent[nextIndex]);
            updateMainPlayer(allContent[nextIndex]);
        }
    };

    const goToPreviousContent = () => {
        if (currentContentIndex > 0) {
            const prevIndex = currentContentIndex - 1;
            setCurrentContentIndex(prevIndex);
            setCurrentContent(allContent[prevIndex]);
            updateMainPlayer(allContent[prevIndex]);
        }
    };

    const updateMainPlayer = (content) => {
        if (content.type === 'video') {
            setMainVideoUrl(content.url);
            setMainVideoTitle(content.title);
            setIsVideoPlaying(true);
        } else if (content.type === 'image') {
            setMainVideoUrl(null);
            setMainVideoTitle(content.title);
        } else if (content.type === 'pdf') {
            setMainVideoUrl(null);
            setMainVideoTitle(content.title);
        } else if (content.type === 'text') {
            setMainVideoUrl(null);
            setMainVideoTitle(content.title);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">جاري تحميل الدرس...</p>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">الدرس غير موجود</h1>
                    <Button onClick={() => navigate("/TTHCourses")}>العودة للصفحة الرئيسية</Button>
                </div>
            </div>
        );
    }

    const handleReviewChange = (e) => {
        const { name, value } = e.target;
        setNewReview((prev) => ({ ...prev, [name]: value }));
    };

    const handleRatingChange = (rating) => {
        setNewReview((prev) => ({ ...prev, rating }));
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!newReview.name.trim() || !newReview.comment.trim()) return;
        if (!user || !user.id) {
            alert('يجب تسجيل الدخول لإضافة تعليق');
            return;
        }
        try {
            const response = await fetch(`/api/courses/${id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newReview.name,
                    comment: newReview.comment,
                    user_id: user.id,
                    tab: 'reviews',
                    rating: newReview.rating || 5
                }),
            });
            if (response.ok) {
                const newReviewData = await response.json();
                setReviews(prev => [newReviewData.comment, ...prev]);
        setNewReview({ name: '', rating: 5, comment: '' });
            } else {
                const err = await response.json();
                alert('فشل إرسال التعليق: ' + (err.error || response.status));
                console.error('Failed to submit review:', response.status, err);
            }
        } catch (err) {
            alert('فشل إرسال التعليق: ' + err.message);
            console.error('Error submitting review:', err);
        }
    };

    const handleAddReply = async (commentId) => {
        const text = replyText[commentId];
        if (!text || !text.trim()) return;
        if (!user || !user.id) {
            alert('يجب تسجيل الدخول لإضافة رد');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/courses/comments/${commentId}/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reply_text: text })
            });
            
            if (response.ok) {
                const result = await response.json();
                // Update the reviews state to include the new reply
                setReviews(prev => prev.map(review => {
                    if (review.id === commentId) {
                        return {
                            ...review,
                            threaded_replies: [...(review.threaded_replies || []), result.reply]
                        };
                    }
                    return review;
                }));
                
                // Clear the reply text and hide the form
                setReplyText(prev => ({ ...prev, [commentId]: '' }));
                setShowReplyForm(null);
            } else {
                const err = await response.json();
                alert('فشل إرسال الرد: ' + (err.error || response.status));
            }
        } catch (err) {
            alert('فشل إرسال الرد: ' + err.message);
            console.error('Error adding reply:', err);
        }
    };

    // Calculate course statistics
    const totalLessons = course.sections?.reduce((total, section) => 
        total + (section.blocks?.length || 0), 0) || 0;
    const totalDuration = course.sections?.reduce((total, section) => 
        total + (section.blocks?.length || 0) * 15, 0) || 0; // Assume 15 min per lesson
    const rating = 4.8; // Mock rating
    const studentsCount = "1,234"; // Mock student count

    // Get first video file for preview
    const firstVideo = course.sections?.flatMap(section => 
        section.blocks?.filter(block => 
            block.type === 'video' && block.files?.length > 0
        ) || []
    )[0];

    const videoUrl = firstVideo?.files?.[0]?.file_path || null;

    return (
        <div dir="rtl" className="min-h-screen bg-gray-50">
            {/* Header */}
            <Navbar />
            <div className="border-b border-blue-100" />
            
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-10">
                    {/* Video Preview */}
                    <div className="w-full lg:w-1/2 order-2 lg:order-1 mt-8 lg:mt-0">
                        <div className="bg-black rounded-2xl overflow-hidden shadow-xl border-4 border-white/20 relative">
                            {/* Navigation Buttons */}
                            {allContent.length > 1 && (
                                <>
                                    <button
                                        onClick={goToPreviousContent}
                                        disabled={currentContentIndex === 0}
                                        className={`absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all ${
                                            currentContentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                                        }`}
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button
                                        onClick={goToNextContent}
                                        disabled={currentContentIndex === allContent.length - 1}
                                        className={`absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all ${
                                            currentContentIndex === allContent.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                                        }`}
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </>
                            )}
                            
                            <div className="relative aspect-video">
                                {currentContent?.type === 'video' && mainVideoUrl ? (
                                    <video
                                        controls
                                        src={mainVideoUrl}
                                        className="w-full h-full rounded-2xl"
                                        poster={course.cover_url || "/placeholder.svg"}
                                        onPlay={() => setIsVideoPlaying(true)}
                                        onPause={() => setIsVideoPlaying(false)}
                                    >
                                        <source src={mainVideoUrl} type="video/mp4" />
                                        متصفحك لا يدعم عرض الفيديو.
                                    </video>
                                ) : currentContent?.type === 'image' ? (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                        <img
                                            src={currentContent.url}
                                            alt={currentContent.title}
                                            className="max-w-full max-h-full object-contain rounded-2xl"
                                        />
                                    </div>
                                ) : currentContent?.type === 'pdf' ? (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                        <div className="text-center text-white">
                                            <FileTextIcon size={64} className="mx-auto mb-4" />
                                            <h3 className="text-xl font-bold mb-2">{currentContent.title}</h3>
                                            <p className="text-gray-300 mb-4">ملف PDF</p>
                                            <button
                                                onClick={() => handleDownload(currentContent.url, currentContent.fileName)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                                            >
                                                <Download size={16} />
                                                تحميل الملف
                                            </button>
                                        </div>
                                    </div>
                                ) : currentContent?.type === 'text' ? (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                        <div className="text-center text-white max-w-md mx-auto p-6">
                                            <FileTextIcon size={64} className="mx-auto mb-4" />
                                            <h3 className="text-xl font-bold mb-4">{currentContent.title}</h3>
                                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-right">
                                                <p className="text-white leading-relaxed">{currentContent.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <img 
                                            src={course.cover_url || "/placeholder.svg"} 
                                            alt={course.title} 
                                            className="w-full h-full object-cover" 
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                            <Play size={64} className="text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Content Info */}
                            {currentContent && (
                                <div className="bg-white/10 backdrop-blur-sm p-3 text-center">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <span className="text-xs text-blue-200 bg-blue-600/30 px-2 py-1 rounded">
                                            {currentContent.sectionTitle}
                                        </span>
                                        <span className="text-xs text-gray-300">
                                            {currentContentIndex + 1} من {allContent.length}
                                        </span>
                        </div>
                                    <p className="text-white font-medium text-sm">{currentContent.title}</p>
                    </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Course Info */}
                    <div className="w-full lg:w-1/2 order-1 lg:order-2">
                        <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg">{course.title}</h1>
                        <p className="text-xl text-blue-100 mb-6 font-medium drop-shadow-sm">{course.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-6 mb-6">
                            <div className="flex items-center gap-1">
                                <Star className="text-yellow-400 fill-current" size={22} />
                                <span className="font-bold text-lg">{rating}</span>
                                <span className="text-blue-100">({studentsCount} طالب)</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock size={20} />
                                <span>{Math.round(totalDuration / 60)} ساعة</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Play size={20} />
                                <span>{totalLessons} درس</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Globe size={20} />
                                <span>العربية</span>
                            </div>
                        </div>
                        
                        <p className="text-blue-100 font-semibold">
                            من إعداد <span className="text-white font-bold">{course.created_by_name}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="lg:grid lg:grid-cols-3 gap-10">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Course Statistics */}
                        <div className="bg-white rounded-xl shadow-lg mb-8 p-6 border border-blue-100">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{totalLessons}</div>
                                    <div className="text-sm text-gray-600">درس</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">{Math.round(totalDuration / 60)}</div>
                                    <div className="text-sm text-gray-600">ساعة</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{rating}</div>
                                    <div className="text-sm text-gray-600">تقييم</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">{studentsCount}</div>
                                    <div className="text-sm text-gray-600">طالب</div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-xl shadow-lg mb-8 border border-blue-100">
                            <div className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-purple-50 rounded-t-3xl">
                                <nav className="flex px-8">
                                    {[
                                        { id: "curriculum", label: "المنهج" },
                                        { id: "overview", label: "نظرة عامة" },
                                        { id: "reviews", label: "إسأل الاستاذ" }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`py-5 ml-9 px-2 border-b-4 font-bold text-base transition-all duration-200 ${activeTab === tab.id
                                                ? "border-purple-500 text-purple-700 bg-purple-50 rounded-t-2xl shadow"
                                                : "border-transparent text-purple-400 hover:text-purple-700 hover:border-purple-200"
                                                }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                            <div className="p-8">
                                {activeTab === "overview" && (
                                    <div className="space-y-8">
                                        {/* Learning Objectives */}
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <Award className="text-blue-600" size={24} />
                                                ما ستتعلمه
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {course.sections?.slice(0, 6).map((section, index) => (
                                                    <div key={index} className="flex items-start gap-3">
                                                        <CheckCircle className="text-cyan-500 mt-0.5 flex-shrink-0" size={18} />
                                                        <span className="text-gray-700">{section.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Prerequisites */}
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <BookOpen className="text-purple-400" size={24} />
                                                المتطلبات المسبقة
                                            </h3>
                                            <ul className="space-y-2">
                                                <li className="flex items-start gap-3">
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                                    <span className="text-gray-700">معرفة أساسية باللغة العربية</span>
                                                    </li>
                                                <li className="flex items-start gap-3">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                                    <span className="text-gray-700">الرغبة في التعلم والتطوير</span>
                                                </li>
                                                <li className="flex items-start gap-3">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                                    <span className="text-gray-700">لا حاجة لخبرة سابقة</span>
                                                </li>
                                            </ul>
                                        </div>

                                        {/* Course Description */}
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4">وصف الدرس</h3>
                                            <p className="text-gray-700 leading-relaxed">{course.description}</p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "curriculum" && (
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6">محتوى الدرس</h3>
                                        {course.sections?.map((section, sectionIndex) => (
                                            <div key={sectionIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                                                <div 
                                                    className="bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                                                    onClick={() => toggleSection(sectionIndex)}
                                                >
                                                    <h4 className="font-semibold text-gray-900">{section.title}</h4>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm text-gray-600">{section.blocks?.length || 0} درس</span>
                                                        <div className={`transform transition-transform ${expandedSections.has(sectionIndex) ? 'rotate-180' : ''}`}>
                                                            ▼
                                                </div>
                                                    </div>
                                                </div>
                                                {expandedSections.has(sectionIndex) && (
                                                    <div className="p-4 bg-white">
                                                        <ul className="space-y-3">
                                                            {section.blocks?.filter(block => block.type !== 'text').map((block, blockIndex) => {
                                                                const fileUrl = block.files?.[0]?.file_path || block.fileUrl || block.content;
                                                                const fileName = block.files?.[0]?.original_name || block.title || `ملف ${blockIndex + 1}`;
                                                                
                                                                return (
                                                                    <li key={blockIndex} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                                                        <div className="flex items-center gap-3 flex-1">
                                                                            {getBlockIcon(block.type)}
                                                                            <span className="text-gray-700 font-medium">{block.title || `محتوى ${blockIndex + 1}`}</span>
                                                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                                                {getBlockTypeLabel(block.type)}
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        <div className="flex items-center gap-2">
                                                                            {block.type === 'video' && fileUrl && (
                                                                                <button
                                                                                    onClick={() => handleVideoClick(fileUrl, block.title)}
                                                                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                                                >
                                                                                    <Play size={14} />
                                                                                    مشاهدة
                                                                                </button>
                                                                            )}
                                                                            
                                                                            {block.type === 'image' && fileUrl && (
                                                                                <button
                                                                                    onClick={() => handleImageClick(fileUrl, block.title)}
                                                                                    className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm font-medium"
                                                                                >
                                                                                    <Eye size={14} />
                                                                                    عرض
                                                                                </button>
                                                                            )}
                                                                            
                                                                            {block.type === 'pdf' && fileUrl && (
                                                                                <div className="flex items-center gap-2">
                                                                                    <button
                                                                                        onClick={() => handlePdfClick(fileUrl, block.title)}
                                                                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                                                    >
                                                                                        <Eye size={14} />
                                                                                        عرض
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleDownload(fileUrl, fileName)}
                                                                                        className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm font-medium"
                                                                                    >
                                                                                        <Download size={14} />
                                                                                        تحميل
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                            </li>
                                                                );
                                                            })}
                                                    </ul>
                                                        
                                                        {/* Display text content directly */}
                                                        {section.blocks?.map((block, blockIndex) => {
                                                            if (block.type === 'text' && block.content) {
                                                                return (
                                                                    <div key={`text-${blockIndex}`} className="mt-4 p-4 bg-gray-50 rounded-lg border-r-4 border-purple-500">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <FileTextIcon className="text-purple-500" size={16} />
                                                                            <span className="text-sm font-medium text-gray-700">{block.title || `نص ${blockIndex + 1}`}</span>
                                                                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                                                                نص
                                                                            </span>
                                                </div>
                                                                        <div className="text-gray-700 leading-relaxed text-sm">
                                                                            {block.content}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === "reviews" && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-bold text-blue-900">تقييمات الطلاب</h3>
                                            <div className="flex items-center gap-2">
                                                <Star className="text-yellow-400 fill-current" size={20} />
                                                <span className="font-bold text-lg">{rating}</span>
                                                <span className="text-gray-400">({studentsCount} تقييم)</span>
                                            </div>
                                        </div>

                                        {/* Add Review Form */}
                                        <form onSubmit={handleReviewSubmit} className="bg-gray-100 rounded-xl p-4 mb-6 shadow flex flex-col gap-4">
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={newReview.name}
                                                    onChange={handleReviewChange}
                                                    placeholder="اسمك"
                                                    className="flex-1 rounded-lg border border-blue-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 text-right"
                                                    required
                                                />
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <button
                                                            type="button"
                                                            key={i}
                                                            onClick={() => handleRatingChange(i + 1)}
                                                            className="focus:outline-none"
                                                        >
                                                            <Star 
                                                                className={`${i < newReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                                                size={20} 
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <textarea
                                                name="comment"
                                                value={newReview.comment}
                                                onChange={handleReviewChange}
                                                placeholder="اكتب تعليقك هنا..."
                                                className="rounded-lg border border-blue-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 text-right min-h-[60px]"
                                                required
                                            />
                                            <div className="flex justify-end">
                                                <button
                                                    type="submit"
                                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-normal py-2 px-6 rounded-sm shadow transition"
                                                >
                                                    أضف تقييمك
                                                </button>
                                            </div>
                                        </form>

                                        <div className="space-y-4">
                                            {reviews.map((review, index) => (
                                                <div key={index} className="border-b border-gray-200 pb-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                                                {(review.name && review.name.length > 0) ? review.name.charAt(0) : '?'}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-blue-900">{review.name}</p>
                                                                <div className="flex items-center gap-1">
                                                                    {Array.from({ length: review.rating }).map((_, i) => (
                                                                        <Star key={i} className="text-yellow-400 fill-current" size={14} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm text-gray-400">{review.date}</span>
                                                    </div>
                                                    <p className="text-gray-700 pr-13">{review.comment}</p>
                                                    
                                                    {/* Threaded Replies */}
                                                    {review.threaded_replies && review.threaded_replies.length > 0 && (
                                                        <div className="mt-3 space-y-2">
                                                            {review.threaded_replies.map((reply, replyIndex) => (
                                                                <div 
                                                                    key={reply.id} 
                                                                    className={`pr-4 border-r-4 p-3 rounded-lg ${
                                                                        reply.user_role === 'professor' 
                                                                            ? 'border-blue-500 bg-blue-50' 
                                                                            : 'border-green-500 bg-green-50'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                                                            reply.user_role === 'professor' ? 'bg-blue-600' : 'bg-green-600'
                                                                        }`}>
                                                                            {reply.user_name?.charAt(0) || '?'}
                                                                        </div>
                                                                        <span className={`font-semibold text-sm ${
                                                                            reply.user_role === 'professor' ? 'text-blue-900' : 'text-green-900'
                                                                        }`}>
                                                                            {reply.user_name}
                                                                        </span>
                                                                        <span className="text-xs text-gray-500">
                                                                            ({reply.user_role === 'professor' ? 'المدرس' : 'الطالب'})
                                                                        </span>
                                                                        <span className="text-xs text-gray-400">
                                                                            {new Date(reply.created_at).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                    <p className={`text-sm ${
                                                                        reply.user_role === 'professor' ? 'text-blue-800' : 'text-green-800'
                                                                    }`}>
                                                                        {reply.reply_text}
                                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                                    )}
                                                    
                                                    {/* Legacy single reply (for backward compatibility) */}
                                                    {review.reply && (!review.threaded_replies || review.threaded_replies.length === 0) && (
                                                        <div className="mt-3 pr-4 border-r-4 border-blue-500 bg-blue-50 p-3 rounded-lg">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                                    {course.created_by_name?.charAt(0) || 'م'}
                                                                </div>
                                                                <span className="font-semibold text-blue-900 text-sm">{course.created_by_name}</span>
                                                                <span className="text-xs text-gray-500">(المدرس)</span>
                                                            </div>
                                                            <p className="text-blue-800 text-sm">{review.reply}</p>
                                    </div>
                                )}
                                                    
                                                    {/* Add Reply Button */}
                                                    <div className="mt-3">
                                                        <button
                                                            onClick={() => setShowReplyForm(review.id)}
                                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                        >
                                                            رد على هذا التعليق
                                                        </button>
                                                    </div>
                                                    
                                                    {/* Reply Form */}
                                                    {showReplyForm === review.id && (
                                                        <div className="mt-3 pr-4 border border-gray-200 rounded-lg p-3 bg-gray-50">
                                                            <textarea
                                                                value={replyText[review.id] || ''}
                                                                onChange={(e) => setReplyText(prev => ({ ...prev, [review.id]: e.target.value }))}
                                                                placeholder="اكتب ردك هنا..."
                                                                className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                                                                rows="3"
                                                            />
                                                            <div className="flex gap-2 mt-2">
                                                                <button
                                                                    onClick={() => handleAddReply(review.id)}
                                                                    className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                                                                >
                                                                    إرسال الرد
                                                                </button>
                                                                <button
                                                                    onClick={() => setShowReplyForm(null)}
                                                                    className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
                                                                >
                                                                    إلغاء
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        {/* Action Card */}
                        <Card className="mb-6 sticky top-4">
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {/* Price Display */}
                                    {(course.price || course.material_price) && (
                                        <div className="text-center mb-4">
                                            <div className="text-3xl font-bold text-green-600">
                                                {course.material_price || course.price} د.ت
                                            </div>
                                            <div className="text-sm text-gray-600">سعر الدرس</div>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center pt-4 gap-3">
                                        {course.sections?.some(section => 
                                            section.blocks?.some(block => 
                                                block.type === 'document' && block.files?.length > 0
                                            )
                                        ) && (
                                            <Button className="flex-1 flex justify-center items-center bg-blue-600 text-white font-normal shadow hover:bg-blue-700 transition">
                                                    <FileText size={18} className="absolute mr-[-1rem]" />
                                                تحميل الملفات
                                            </Button>
                                        )}
                                        <Button variant="outline" className="flex-1 text-blue-900 hover:bg-gray-50">
                                            <Play size={18} className="absolute mr-[-8.35rem]" />
                                            مشاهدة الدرس
                                            </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Instructor Card */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="text-lg">المدرس</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                        {course.created_by_name?.charAt(0) || 'م'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-lg">{course.created_by_name}</h3>
                                        <p className="text-gray-600">مدرس محترف</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Related Courses */}
                        {relatedCourses.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">دروس مشابهة</CardTitle>
                            </CardHeader>
                            <CardContent>
                                    <div className="space-y-3">
                                        {relatedCourses.map((relatedCourse) => {
                                            const price = languageCoursePrices[`${relatedCourse.id}-${relatedCourse.language_level_id}`];
                                            // For education courses, use material_price, for language courses use the price from language_course_prices
                                            const displayPrice = relatedCourse.material_price || price;

                                            return (
                                        <div
                                            key={relatedCourse.id}
                                                    className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
                                                    onClick={() => navigate(`/coursesList/courses/${relatedCourse.id}`)}
                                                >
                                                    {/* Price on the left */}
                                                    <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[60px]">
                                                        <div className="text-lg font-bold text-green-600">
                                                            {displayPrice ? `${displayPrice} د.ت` : 'مجاناً'}
                                                        </div>
                                                        {displayPrice && (
                                                            <div className="text-xs text-gray-500">د.ت</div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Course image */}
                                                    <div className="flex-shrink-0">
                                                        <img
                                                            src={relatedCourse.cover_url || "/placeholder.svg"}
                                                alt={relatedCourse.title}
                                                            className="w-16 h-12 object-cover rounded-lg"
                                            />
                                                    </div>
                                                    
                                                    {/* Course info */}
                                            <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2 leading-tight mb-1">
                                                    {relatedCourse.title}
                                                </h4>
                                                        <p className="text-xs text-gray-600 mb-2">{relatedCourse.created_by_name}</p>
                                                        <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1">
                                                        <Star className="text-yellow-400 fill-current" size={12} />
                                                                <span className="text-xs font-medium">4.8</span>
                                                                <span className="text-xs text-gray-500">(123)</span>
                                                    </div>
                                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                <Play size={10} />
                                                                <span>15 درس</span>
                                                </div>
                                            </div>
                                        </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </CardContent>
                        </Card>
                        )}
                    </div>
                </div>
            </div>
            
            <Footer />

            {/* Video Modal */}
            {showVideoModal && selectedVideo && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold">{selectedVideo.title}</h3>
                            <button
                                onClick={() => setShowVideoModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-4">
                            <video
                                controls
                                src={selectedVideo.url}
                                className="w-full rounded-lg"
                                autoPlay
                            >
                                <source src={selectedVideo.url} type="video/mp4" />
                                متصفحك لا يدعم عرض الفيديو.
                            </video>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Modal */}
            {showImageModal && selectedImage && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold">{selectedImage.title}</h3>
                            <button
                                onClick={() => setShowImageModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-4">
                            <img
                                src={selectedImage.url}
                                alt={selectedImage.title}
                                className="w-full h-auto rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Modal */}
            {showPdfModal && selectedPdf && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold">{selectedPdf.title}</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDownload(selectedPdf.url, selectedPdf.title)}
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                    <Download size={16} />
                                    تحميل
                                </button>
                                <button
                                    onClick={() => setShowPdfModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 h-full">
                            <iframe
                                src={selectedPdf.url}
                                className="w-full h-full rounded-lg"
                                title={selectedPdf.title}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
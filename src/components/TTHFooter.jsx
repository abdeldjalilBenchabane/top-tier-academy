import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Footer() {
    const [footerContent, setFooterContent] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFooterContent();
    }, []);

    const fetchFooterContent = async () => {
        try {
            const response = await fetch('/api/footer-content');
            if (response.ok) {
                const data = await response.json();
                
                // Organize content by sections
                const organizedContent = {};
                data.forEach(item => {
                    if (!organizedContent[item.section_name]) {
                        organizedContent[item.section_name] = {};
                    }
                    organizedContent[item.section_name][item.content_key] = item.content_value;
                });
                
                setFooterContent(organizedContent);
            } else {
                console.error('Failed to fetch footer content');
            }
        } catch (error) {
            console.error('Error fetching footer content:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to get content safely
    const getContent = (section, key, defaultValue = '') => {
        return footerContent[section]?.[key] || defaultValue;
    };

    if (loading) {
        return (
            <footer className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pt-12 pb-6" dir="rtl">
                <div className="container mx-auto px-4">
                    <div className="text-center py-8">
                        <div className="text-lg">جاري التحميل...</div>
                    </div>
                </div>
            </footer>
        );
    }

    return (
        <footer className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pt-12 pb-6" dir="rtl">
            <div className="container mx-auto px-4">
                {/* Sections Principales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

                    {/* Section 1 : Logo + Description */}
                    <div>
                        <div className="mb-4">
                            <img 
                                src="/1.png" 
                                alt="TTH Logo" 
                                className="h-10 w-auto"
                            />
                        </div>
                        <p className="text-gray-200">
                            {getContent('platform', 'description', 'تحتاج دعم أكثر؟ اطلب حصة خاصة مع أستاذك المفضل')}
                        </p>
                        {/* Réseaux Sociaux */}
                        <div className="flex gap-4 mt-4">
                            <a href={getContent('social', 'facebook', '#')} aria-label="Facebook">
                                <FaFacebook className="text-gray-200 hover:text-purple-200 text-xl transition-colors" />
                            </a>
                            <a href={getContent('social', 'twitter', '#')} aria-label="Twitter">
                                <FaTwitter className="text-gray-200 hover:text-purple-200 text-xl transition-colors" />
                            </a>
                            <a href={getContent('social', 'instagram', '#')} aria-label="Instagram">
                                <FaInstagram className="text-gray-200 hover:text-purple-200 text-xl transition-colors" />
                            </a>
                            <a href={getContent('social', 'youtube', '#')} aria-label="YouTube">
                                <FaYoutube className="text-gray-200 hover:text-purple-200 text-xl transition-colors" />
                            </a>
                        </div>
                    </div>

                    {/* Section 2 : Liens Rapides */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4 border-b border-blue-200 pb-2">روابط سريعة</h4>
                        <ul className="space-y-2">
                            <li><Link to="/" className="text-gray-200 hover:text-blue-200 transition">
                                {getContent('quick_links', 'home', 'الصفحة الرئيسية')}
                            </Link></li>
                            <li><Link to="/private-classes" className="text-gray-200 hover:text-purple-200 transition">
                                {getContent('quick_links', 'private_classes', 'حصص خاصة')}
                            </Link></li>
                            <li><a href="#" className="text-gray-200 hover:text-purple-200 transition">
                                {getContent('quick_links', 'courses', 'الدورات المتاحة')}
                            </a></li>
                            <li><a href="#" className="text-gray-200 hover:text-purple-200 transition">
                                {getContent('quick_links', 'teachers', 'الأساتذة')}
                            </a></li>
                            <li><a href="#" className="text-gray-200 hover:text-purple-200 transition">
                                {getContent('quick_links', 'certificates', 'الشهادات')}
                            </a></li>
                        </ul>
                    </div>

                    {/* Section 3 : Contact */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4 border-b border-purple-200 pb-2">اتصل بنا</h4>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2">
                                <FaPhone className="text-purple-200" />
                                <span className="text-gray-200">
                                    {getContent('contact', 'phone', '+213 123 456 789')}
                                </span>
                            </li>
                            <li className="flex items-center gap-2">
                                <FaEnvelope className="text-purple-200" />
                                <span className="text-gray-200">
                                    {getContent('contact', 'email', 'contact@example.com')}
                                </span>
                            </li>
                            <li className="flex items-center gap-2">
                                <FaMapMarkerAlt className="text-purple-200" />
                                <span className="text-gray-200">
                                    {getContent('contact', 'address', 'الجزائر العاصمة، الجزائر')}
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Section 4 : Newsletter */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4 border-b border-purple-200 pb-2">النشرة البريدية</h4>
                        <p className="text-gray-200 mb-3">
                            {getContent('newsletter', 'description', 'اشترك ليصلك كل جديد عن الدورات والعروض.')}
                        </p>
                        <form className="flex flex-col gap-2">
                            <input
                                type="email"
                                placeholder={getContent('newsletter', 'placeholder', 'بريدك الإلكتروني')}
                                className="px-4 py-2 rounded bg-white/20 border border-white/30 focus:outline-none focus:border-white text-white placeholder-gray-300"
                            />
                            <button
                                type="submit"
                                className="bg-white hover:bg-purple-100 text-blue-600 py-2 px-4 rounded transition font-medium"
                            >
                                {getContent('newsletter', 'button_text', 'اشتراك')}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-blue-200/30 pt-6 text-center text-gray-200">
                    <p>© {new Date().getFullYear()} {getContent('copyright', 'company_name', 'اسم المنصة')}. {getContent('copyright', 'rights_text', 'جميع الحقوق محفوظة.')}</p>
                </div>
            </div>
        </footer>
    );
}
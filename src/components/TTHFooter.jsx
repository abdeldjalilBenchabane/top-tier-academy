import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Footer() {
    const [footerContent, setFooterContent] = useState({});
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        fetchFooterContent();
        
        // Listen for footer updates from admin panel
        const handleFooterUpdate = () => {
            fetchFooterContent();
        };
        
        window.addEventListener('footer-updated', handleFooterUpdate);
        
        return () => {
            window.removeEventListener('footer-updated', handleFooterUpdate);
        };
    }, []);

    // Helper function to get content safely
    const getContent = (section, key, defaultValue = '') => {
        const value = footerContent[section]?.[key];
        return value !== undefined && value !== null ? value : defaultValue;
    };

    if (loading) {
        return (
            <footer className="bg-gradient-to-r from-[#194cbf] to-[#61a1ff] text-white pt-12 pb-6" dir="rtl">
                <div className="container mx-auto px-4">
                    <div className="text-center py-8">
                        <div className="text-lg">جاري التحميل...</div>
                    </div>
                </div>
            </footer>
        );
    }

    return (
        <footer className="bg-gradient-to-r from-[#194cbf] to-[#61a1ff] text-white pt-12 pb-6" dir="rtl">
            <div className="container mx-auto px-4">
                {/* Sections Principales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

                    {/* Section 1 : Logo + Description */}
                    <div>
                        <div className="mb-4">
                            <img 
                                src="/1.png" 
                                alt="TTH Logo" 
                                className="h-20 w-auto"
                                style={{height: '100px', width: 'auto'}}
                            />
                        </div>
                        <p className="text-gray-200">
                            {getContent('platform', 'description', '')}
                        </p>
                        {/* Réseaux Sociaux */}
                        <div className="flex gap-4 mt-4">
                            {getContent('social', 'facebook', '') && (
                                <a href={getContent('social', 'facebook', '#')} aria-label="Facebook">
                                    <FaFacebook className="text-gray-200 hover:text-blue-200 text-xl transition-colors" />
                                </a>
                            )}
                            {getContent('social', 'twitter', '') && (
                                <a href={getContent('social', 'twitter', '#')} aria-label="Twitter">
                                    <FaTwitter className="text-gray-200 hover:text-blue-200 text-xl transition-colors" />
                                </a>
                            )}
                            {getContent('social', 'instagram', '') && (
                                <a href={getContent('social', 'instagram', '#')} aria-label="Instagram">
                                    <FaInstagram className="text-gray-200 hover:text-blue-200 text-xl transition-colors" />
                                </a>
                            )}
                            {getContent('social', 'youtube', '') && (
                                <a href={getContent('social', 'youtube', '#')} aria-label="YouTube">
                                    <FaYoutube className="text-gray-200 hover:text-blue-200 text-xl transition-colors" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Section 2 : Liens Rapides */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4 border-b border-blue-200 pb-2">روابط سريعة</h4>
                        <ul className="space-y-2">
                            <li><Link to="/" className="text-gray-200 hover:text-blue-200 transition">
                                {getContent('quick_links', 'home', '')}
                            </Link></li>
                            <li><Link to="/private-classes" className="text-gray-200 hover:text-blue-200 transition">
                                {getContent('quick_links', 'private_classes', '')}
                            </Link></li>
                            <li><a href="#" className="text-gray-200 hover:text-blue-200 transition">
                                {getContent('quick_links', 'courses', '')}
                            </a></li>
                            <li><a href="#" className="text-gray-200 hover:text-blue-200 transition">
                                {getContent('quick_links', 'teachers', '')}
                            </a></li>
                            <li><a href="#" className="text-gray-200 hover:text-blue-200 transition">
                                {getContent('quick_links', 'certificates', '')}
                            </a></li>
                        </ul>
                    </div>

                    {/* Section 3 : Contact */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4 border-b border-blue-200 pb-2">اتصل بنا</h4>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2">
                                <FaPhone className="text-blue-200" />
                                <span className="text-gray-200">
                                    {getContent('contact', 'phone', '')}
                                </span>
                            </li>
                            <li className="flex items-center gap-2">
                                <FaEnvelope className="text-blue-200" />
                                <span className="text-gray-200">
                                    {getContent('contact', 'email', '')}
                                </span>
                            </li>
                            <li>
                                <a 
                                    href="https://maps.app.goo.gl/miY7LMfdmyqhHoXV6" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-gray-200 hover:text-blue-200 transition cursor-pointer"
                                >
                                    <FaMapMarkerAlt className="text-blue-200" />
                                    <span>
                                        {getContent('contact', 'address', '')}
                                    </span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Section 4 : Newsletter */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4 border-b border-blue-200 pb-2">النشرة البريدية</h4>
                        <p className="text-gray-200 mb-3">
                            {getContent('newsletter', 'description', '')}
                        </p>
                        <form className="flex flex-col gap-2">
                            <input
                                type="email"
                                placeholder={getContent('newsletter', 'placeholder', '')}
                                className="px-4 py-2 rounded bg-white/20 border border-white/30 focus:outline-none focus:border-white text-white placeholder-gray-300"
                            />
                            <button
                                type="submit"
                                className="bg-white hover:bg-blue-100 text-[#194cbf] py-2 px-4 rounded transition font-medium"
                            >
                                {getContent('newsletter', 'button_text', '')}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-blue-200/30 pt-6 text-center text-gray-200">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <img 
                            src="/1.png" 
                            alt="TTH Logo" 
                            className="h-12 w-auto"
                        />
                        <p>© {new Date().getFullYear()}. {getContent('copyright', 'rights_text', '')}</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
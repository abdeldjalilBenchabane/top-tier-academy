import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pt-12 pb-6" dir="rtl">
            <div className="container mx-auto px-4">
                {/* Sections Principales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

                    {/* Section 1 : Logo + Description */}
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-blue-200">اسم المنصة</h3>
                        <p className="text-gray-200">
                            تحتاج دعم أكثر؟ اطلب حصة خاصة مع أستاذك المفضل
                        </p>
                        {/* Réseaux Sociaux */}
                        <div className="flex gap-4 mt-4">
                            <a href="#" aria-label="Facebook">
                                <FaFacebook className="text-gray-200 hover:text-blue-200 text-xl transition-colors" />
                            </a>
                            <a href="#" aria-label="Twitter">
                                <FaTwitter className="text-gray-200 hover:text-blue-200 text-xl transition-colors" />
                            </a>
                            <a href="#" aria-label="Instagram">
                                <FaInstagram className="text-gray-200 hover:text-blue-200 text-xl transition-colors" />
                            </a>
                            <a href="#" aria-label="YouTube">
                                <FaYoutube className="text-gray-200 hover:text-blue-200 text-xl transition-colors" />
                            </a>
                        </div>
                    </div>

                    {/* Section 2 : Liens Rapides */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4 border-b border-blue-200 pb-2">روابط سريعة</h4>
                        <ul className="space-y-2">
                            <li><Link to="/" className="text-gray-200 hover:text-blue-200 transition">الصفحة الرئيسية</Link></li>
                            <li><Link to="/private-classes" className="text-gray-200 hover:text-blue-200 transition">حصص خاصة</Link></li>
                            <li><a href="#" className="text-gray-200 hover:text-blue-200 transition">الدورات المتاحة</a></li>
                            <li><a href="#" className="text-gray-200 hover:text-blue-200 transition">الأساتذة</a></li>
                            <li><a href="#" className="text-gray-200 hover:text-blue-200 transition">الشهادات</a></li>
                        </ul>
                    </div>

                    {/* Section 3 : Contact */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4 border-b border-blue-200 pb-2">اتصل بنا</h4>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2">
                                <FaPhone className="text-blue-200" />
                                <span className="text-gray-200">+213 123 456 789</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <FaEnvelope className="text-blue-200" />
                                <span className="text-gray-200">contact@example.com</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <FaMapMarkerAlt className="text-blue-200" />
                                <span className="text-gray-200">الجزائر العاصمة، الجزائر</span>
                            </li>
                        </ul>
                    </div>

                    {/* Section 4 : Newsletter */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4 border-b border-blue-200 pb-2">النشرة البريدية</h4>
                        <p className="text-gray-200 mb-3">اشترك ليصلك كل جديد عن الدورات والعروض.</p>
                        <form className="flex flex-col gap-2">
                            <input
                                type="email"
                                placeholder="بريدك الإلكتروني"
                                className="px-4 py-2 rounded bg-white/20 border border-white/30 focus:outline-none focus:border-white text-white placeholder-gray-300"
                            />
                            <button
                                type="submit"
                                className="bg-white hover:bg-blue-100 text-blue-600 py-2 px-4 rounded transition font-medium"
                            >
                                اشتراك
                            </button>
                        </form>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-blue-200/30 pt-6 text-center text-gray-200">
                    <p>© {new Date().getFullYear()} اسم المنصة. جميع الحقوق محفوظة.</p>
                </div>
            </div>
        </footer>
    );
}
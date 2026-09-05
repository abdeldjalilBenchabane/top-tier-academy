import React, { useState } from 'react';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/services/api';
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";

const TTHForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            await authAPI.forgotPassword(email, 'tth');
            setMessage('إذا كان هناك حساب بهذا البريد الإلكتروني، تم إرسال رابط إعادة تعيين كلمة المرور.');
        } catch (error) {
            console.error('Forgot password error:', error);
            setError(error.message || 'حدث خطأ أثناء إرسال طلب إعادة تعيين كلمة المرور');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { value } = e.target;
        const filteredValue = value.replace(/<[^>]*>?/gm, '');
        setEmail(filteredValue);
        setError('');
        setMessage('');
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#f8fafc]">
            {/* Animated Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/30 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            
            <div className="relative z-10 flex flex-col min-h-screen">
                <Navbar />
                
                <div className="flex-grow flex items-center justify-center px-4 py-12">
                    <div className="w-full max-w-md animate-fadeIn">
                        {/* Header */}
                        <div className="text-center mb-10">
                            <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">نسيت كلمة المرور؟</h1>
                            <p className="text-lg text-gray-500 font-medium">أدخل بريدك الإلكتروني لاستعادة الوصول</p>
                        </div>
                        
                        {/* Forgot Password Card */}
                        <div className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden">
                            {/* Inner Glow */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Email Field */}
                                <div className="space-y-2">
                                    <label className="block text-gray-800 font-bold text-sm mr-1" htmlFor="email">
                                        <FaEnvelope className="inline ml-2 text-[#194cbf]" /> البريد الإلكتروني
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={email}
                                        onChange={handleChange}
                                        className="premium-input"
                                        placeholder="أدخل بريدك الإلكتروني"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Success Message */}
                                {message && (
                                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl animate-fadeIn">
                                        <p className="text-green-700 text-sm font-medium">{message}</p>
                                    </div>
                                )}

                                {/* Error Message */}
                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-fadeIn">
                                        <p className="text-red-700 text-sm font-medium flex items-center">
                                            <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {error}
                                        </p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="premium-button"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-3"></div>
                                            جاري الإرسال...
                                        </div>
                                    ) : (
                                        'إرسال رابط استعادة كلمة المرور'
                                    )}
                                </button>
                            </form>

                            {/* Back to Login */}
                            <div className="mt-8 text-center border-t border-gray-200/50 pt-6">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="text-[#194cbf] hover:text-blue-800 font-black transition-all duration-200 flex items-center justify-center mx-auto hover:scale-105"
                                >
                                    <FaArrowLeft className="ml-2" />
                                    العودة إلى تسجيل الدخول
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </div>
    );
};

export default TTHForgotPassword; 
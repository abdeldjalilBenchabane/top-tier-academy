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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Navbar />
            <div className="flex items-center justify-center min-h-screen px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">نسيت كلمة المرور؟</h1>
                        <p className="text-gray-600">أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور</p>
                    </div>
                    
                    {/* Forgot Password Form */}
                    <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
                        <form onSubmit={handleSubmit}>
                            {/* Email Field */}
                            <div className="mb-6">
                                <label className="block text-gray-700 font-semibold mb-3" htmlFor="email">
                                    <FaEnvelope className="inline ml-2 text-blue-600" /> البريد الإلكتروني
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur placeholder-gray-400 transition-all duration-300"
                                    placeholder="أدخل بريدك الإلكتروني"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Success Message */}
                            {message && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                                    <p className="text-green-700 text-sm">{message}</p>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <p className="text-red-700 text-sm flex items-center">
                                        <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
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
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                                        جاري الإرسال...
                                    </div>
                                ) : (
                                    'إرسال رابط إعادة التعيين'
                                )}
                            </button>
                        </form>

                        {/* Back to Login */}
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200 flex items-center justify-center mx-auto"
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
    );
};

export default TTHForgotPassword; 
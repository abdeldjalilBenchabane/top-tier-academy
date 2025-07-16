import React, { useState, useEffect } from 'react';
import { FaLock, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '@/services/api';
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";

const TTHResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setError('رابط إعادة تعيين كلمة المرور غير صالح');
            setIsVerifying(false);
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await authAPI.verifyResetToken(token);
                setTokenValid(true);
                setUserInfo(response.user);
            } catch (error) {
                console.error('Token verification error:', error);
                setError('رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية');
            } finally {
                setIsVerifying(false);
            }
        };

        verifyToken();
    }, [token]);

    const validate = () => {
        const newErrors = {};

        if (formData.newPassword.length < 8) {
            newErrors.newPassword = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
        }

        if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            await authAPI.resetPassword(token, formData.newPassword);
            setMessage('تم إعادة تعيين كلمة المرور بنجاح! سيتم توجيهك إلى صفحة تسجيل الدخول.');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            console.error('Reset password error:', error);
            setError(error.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const filteredValue = value.replace(/<[^>]*>?/gm, '');
        setFormData(prev => ({ ...prev, [name]: filteredValue }));
        setErrors(prev => ({ ...prev, [name]: '' }));
        setError('');
        setMessage('');
    };

    if (isVerifying) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <Navbar />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">جاري التحقق من الرابط...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <Navbar />
                <div className="flex items-center justify-center min-h-screen px-4 py-12">
                    <div className="w-full max-w-md">
                        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20 text-center">
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-red-700">{error}</p>
                            </div>
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
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Navbar />
            <div className="flex items-center justify-center min-h-screen px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">إعادة تعيين كلمة المرور</h1>
                        <p className="text-gray-600">
                            مرحباً {userInfo?.name}، أدخل كلمة المرور الجديدة
                        </p>
                    </div>
                    
                    {/* Reset Password Form */}
                    <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
                        <form onSubmit={handleSubmit}>
                            {/* New Password Field */}
                            <div className="mb-6">
                                <label className="block text-gray-700 font-semibold mb-3" htmlFor="newPassword">
                                    <FaLock className="inline ml-2 text-blue-600" /> كلمة المرور الجديدة
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="newPassword"
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur placeholder-gray-400 transition-all duration-300"
                                        placeholder="أدخل كلمة المرور الجديدة"
                                        required
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {errors.newPassword && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center">
                                        <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.newPassword}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div className="mb-6">
                                <label className="block text-gray-700 font-semibold mb-3" htmlFor="confirmPassword">
                                    <FaLock className="inline ml-2 text-blue-600" /> تأكيد كلمة المرور
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur placeholder-gray-400 transition-all duration-300"
                                        placeholder="أعد إدخال كلمة المرور الجديدة"
                                        required
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center">
                                        <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.confirmPassword}
                                    </p>
                                )}
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
                                        جاري إعادة التعيين...
                                    </div>
                                ) : (
                                    'إعادة تعيين كلمة المرور'
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

export default TTHResetPassword; 
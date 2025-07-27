import React, { useState } from 'react';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })
    const [errors, setErrors] = useState({})
    const [Loading, setLoading] = useState(false)
    const navigate = useNavigate();
    const { login } = useAuth();

    const validate = () => {
        const NewError = {}
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (formData.password.length < 8) NewError.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
        if (!emailRegex.test(formData.email)) NewError.email = 'بريد إلكتروني غير صالح';

        setErrors(NewError)
        return Object.keys(NewError).length === 0
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const user = await login(formData.email, formData.password);
            console.log('Login successful:', user);
            
            // Redirect based on user role
            if (user.role === 'admin') {
                navigate('/admin/dashboard');
            } else if (user.role === 'professor') {
                navigate('/professor/dashboard');
            } else {
                navigate('/'); // Student or fallback
            }

            alert('تم تسجيل الدخول بنجاح!');
        } catch (error) {
            console.error('Login error:', error);
            alert(`فشل تسجيل الدخول: ${error.message || 'حاول مرة أخرى لاحقًا'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const filteredValue = value.replace(/<[^>]*>?/gm, '');
        setFormData(prev => ({ ...prev, [name]: filteredValue }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Navbar />
            <div className="flex items-center justify-center min-h-screen px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        {/* Logo */}
                        <div className="mb-6 flex justify-center">
                            <img 
                                src="/2.svg" 
                                alt="Schoolhouse Logo" 
                                className="h-16 w-auto"
                            />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">مرحباً بك مرة أخرى</h1>
                        <p className="text-gray-600">سجل دخولك للوصول إلى حسابك</p>
                    </div>
                    
                    {/* Login Form */}
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
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur placeholder-gray-400 transition-all duration-300"
                                placeholder="أدخل بريدك الإلكتروني"
                                required
                                    disabled={Loading}
                            />
                            {errors.email && <p className="text-red-500 text-sm mt-2 flex items-center">
                                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.email}
                            </p>}
                        </div>

                        {/* Password Field */}
                        <div className="mb-6">
                            <label className="block text-gray-700 font-semibold mb-3" htmlFor="password">
                                <FaLock className="inline ml-2 text-blue-600" /> كلمة المرور
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur placeholder-gray-400 transition-all duration-300"
                                placeholder="أدخل كلمة المرور"
                                required
                                    disabled={Loading}
                            />
                            {errors.password && <p className="text-red-500 text-sm mt-2 flex items-center">
                                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.password}
                            </p>}
                        </div>

                        {/* Forgot Password Link */}
                        <div className="mb-6 text-right">
                            <button
                                type="button"
                                onClick={() => navigate('/forgot-password')}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
                            >
                                نسيت كلمة المرور؟
                            </button>
                        </div>

                            {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={Loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {Loading ? (
                                <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                                    جاري تسجيل الدخول...
                                </div>
                            ) : (
                                'تسجيل الدخول'
                            )}
                        </button>
                    </form>

                        {/* Additional Links */}
                        <div className="mt-6 text-center">
                            <p className="text-gray-600">
                                ليس لديك حساب؟{' '}
                                <button
                                    onClick={() => navigate('/register')}
                                    className="text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200"
                                >
                                    إنشاء حساب جديد
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Login; 
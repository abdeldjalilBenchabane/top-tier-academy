import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaIdCard } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";

const Formulair = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        nationalId: '',
        role: 'student'
    })
    const [errors, setErrors] = useState({})
    const [Loading, setLoading] = useState(false)
    const navigate = useNavigate();
    const { register } = useAuth();

    const validate = () => {
        const NewError = {}
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^(\+?\d{1,3}[- ]?)?\d{10}$/;

        if (formData.password.length < 8) NewError.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
        if (formData.password !== formData.confirmPassword) NewError.confirmPassword = 'كلمات المرور غير متطابقة';
        if (!formData.name.trim()) NewError.name = 'الاسم الكامل مطلوب';
        if (!emailRegex.test(formData.email)) NewError.email = 'بريد إلكتروني غير صالح';
        if (!phoneRegex.test(formData.phoneNumber)) NewError.phoneNumber = 'رقم هاتف غير صالح';

        setErrors(NewError)
        return Object.keys(NewError).length === 0
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            // Prepare user data for registration
            const userData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            };

            const user = await register(userData);
            console.log('Registration successful:', user);
            
            // Redirect based on user role
            if (user.role === 'admin') {
                navigate('/admin/dashboard');
            } else if (user.role === 'professor') {
                navigate('/professor/dashboard');
            } else {
                navigate('/'); // Student or fallback
            }

            alert('تم التسجيل بنجاح! سيتم توجيهك إلى لوحة التحكم.');
        } catch (error) {
            console.error('Registration error:', error);
            alert(`فشل التسجيل: ${error.message || 'حاول مرة أخرى لاحقًا'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const filteredValue = value.replace(/<[^>]*>?/gm, '');
        setFormData(prev => ({ ...prev, [name]: filteredValue }));
    };

    const handleRoleChange = (e) => {
        setFormData(prev => ({ ...prev, role: e.target.value }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Navbar />
            <div className="flex items-center justify-center min-h-screen px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">إنشاء حساب جديد</h1>
                        <p className="text-gray-600">انضم إلينا وابدأ رحلة التعلم</p>
                    </div>
                    
                    {/* Registration Form */}
                    <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
                    <form onSubmit={handleSubmit}>
                            {/* Name Field */}
                        <div className="mb-6">
                                <label className="block text-gray-700 font-semibold mb-3" htmlFor="name">
                                <FaUser className="inline ml-2 text-blue-600" /> الاسم الكامل
                            </label>
                            <input
                                type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur placeholder-gray-400 transition-all duration-300"
                                placeholder="أدخل اسمك الكامل"
                                required
                                    disabled={Loading}
                            />
                                {errors.name && <p className="text-red-500 text-sm mt-2 flex items-center">
                                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                    {errors.name}
                            </p>}
                        </div>

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

                            {/* Role Field */}
                            <div className="mb-6">
                                <label className="block text-gray-700 font-semibold mb-3" htmlFor="role">
                                    نوع الحساب
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleRoleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur transition-all duration-300"
                                    disabled={Loading}
                                >
                                    <option value="student">طالب</option>
                                    
                                </select>
                            </div>

                            {/* Phone Number Field */}
                            <div className="mb-6">
                                <label className="block text-gray-700 font-semibold mb-3" htmlFor="phoneNumber">
                                    <FaPhone className="inline ml-2 text-blue-600" /> رقم الهاتف
                                </label>
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur placeholder-gray-400 transition-all duration-300"
                                    placeholder="أدخل رقم هاتفك"
                                    disabled={Loading}
                                />
                                {errors.phoneNumber && <p className="text-red-500 text-sm mt-2 flex items-center">
                                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.phoneNumber}
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

                            {/* Confirm Password Field */}
                        <div className="mb-6">
                                <label className="block text-gray-700 font-semibold mb-3" htmlFor="confirmPassword">
                                    <FaLock className="inline ml-2 text-blue-600" /> تأكيد كلمة المرور
                            </label>
                            <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur placeholder-gray-400 transition-all duration-300"
                                    placeholder="أعد إدخال كلمة المرور"
                                required
                                    disabled={Loading}
                            />
                                {errors.confirmPassword && <p className="text-red-500 text-sm mt-2 flex items-center">
                                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                    {errors.confirmPassword}
                            </p>}
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
                                        جاري إنشاء الحساب...
                                </div>
                            ) : (
                                    'إنشاء الحساب'
                            )}
                        </button>
                    </form>

                        {/* Additional Links */}
                        <div className="mt-6 text-center">
                            <p className="text-gray-600">
                                لديك حساب بالفعل؟{' '}
                                <button
                                    onClick={() => navigate('/login')}
                                    className="text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200"
                                >
                                    تسجيل الدخول
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

export default Formulair;
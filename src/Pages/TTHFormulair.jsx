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
        <div className="min-h-screen relative overflow-hidden bg-[#f8fafc]">
            {/* Animated Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/30 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            
            <div className="relative z-10 flex flex-col min-h-screen">
                <Navbar />
                
                <div className="flex-grow flex items-center justify-center px-4 py-12">
                    <div className="w-full max-w-lg animate-fadeIn">
                        {/* Header */}
                        <div className="text-center mb-10">
                            <h1 className="text-5xl font-black text-gray-900 mb-3 tracking-tight">إنشاء حساب</h1>
                            <p className="text-lg text-gray-500 font-medium">ابدأ رحلتك التعليمية معنا اليوم</p>
                        </div>
                        
                        {/* Register Card */}
                        <div className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden">
                            {/* Inner Glow */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name Field */}
                                    <div className="space-y-2">
                                        <label className="block text-gray-800 font-bold text-sm mr-1" htmlFor="name">
                                            <FaUser className="inline ml-2 text-[#194cbf]" /> الاسم الكامل
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="premium-input"
                                            placeholder="اسمك الكامل"
                                            required
                                            disabled={Loading}
                                        />
                                        {errors.name && <p className="text-red-500 text-xs mt-1 mr-1">{errors.name}</p>}
                                    </div>

                                    {/* Email Field */}
                                    <div className="space-y-2">
                                        <label className="block text-gray-800 font-bold text-sm mr-1" htmlFor="email">
                                            <FaEnvelope className="inline ml-2 text-[#194cbf]" /> البريد الإلكتروني
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="premium-input"
                                            placeholder="example@mail.com"
                                            required
                                            disabled={Loading}
                                        />
                                        {errors.email && <p className="text-red-500 text-xs mt-1 mr-1">{errors.email}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Role Field */}
                                    <div className="space-y-2">
                                        <label className="block text-gray-800 font-bold text-sm mr-1" htmlFor="role">
                                            نوع الحساب
                                        </label>
                                        <select
                                            id="role"
                                            name="role"
                                            value={formData.role}
                                            onChange={handleRoleChange}
                                            className="premium-input appearance-none"
                                            disabled={Loading}
                                        >
                                            <option value="student">طالب</option>
                                        </select>
                                    </div>

                                    {/* Phone Field */}
                                    <div className="space-y-2">
                                        <label className="block text-gray-800 font-bold text-sm mr-1" htmlFor="phoneNumber">
                                            <FaPhone className="inline ml-2 text-[#194cbf]" /> رقم الهاتف
                                        </label>
                                        <input
                                            type="tel"
                                            id="phoneNumber"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            className="premium-input"
                                            placeholder="06XXXXXXXX"
                                            disabled={Loading}
                                        />
                                        {errors.phoneNumber && <p className="text-red-500 text-xs mt-1 mr-1">{errors.phoneNumber}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Password Field */}
                                    <div className="space-y-2">
                                        <label className="block text-gray-800 font-bold text-sm mr-1" htmlFor="password">
                                            <FaLock className="inline ml-2 text-[#194cbf]" /> كلمة المرور
                                        </label>
                                        <input
                                            type="password"
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="premium-input"
                                            placeholder="********"
                                            required
                                            disabled={Loading}
                                        />
                                        {errors.password && <p className="text-red-500 text-xs mt-1 mr-1">{errors.password}</p>}
                                    </div>

                                    {/* Confirm Password Field */}
                                    <div className="space-y-2">
                                        <label className="block text-gray-800 font-bold text-sm mr-1" htmlFor="confirmPassword">
                                            <FaLock className="inline ml-2 text-[#194cbf]" /> تأكيد كلمة المرور
                                        </label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="premium-input"
                                            placeholder="********"
                                            required
                                            disabled={Loading}
                                        />
                                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 mr-1">{errors.confirmPassword}</p>}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={Loading}
                                    className="premium-button mt-4"
                                >
                                    {Loading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-3"></div>
                                            جاري المعالجة...
                                        </div>
                                    ) : (
                                        'إنشاء حساب جديد'
                                    )}
                                </button>
                            </form>

                            {/* Additional Links */}
                            <div className="mt-8 text-center border-t border-gray-200/50 pt-6">
                                <p className="text-gray-500 font-medium">
                                    لديك حساب بالفعل؟{' '}
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="text-[#194cbf] hover:text-blue-800 font-black transition-all duration-200 hover:underline underline-offset-4"
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
        </div>
    );
};

export default Formulair;
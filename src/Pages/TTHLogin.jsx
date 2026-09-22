import React, { useState } from 'react';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
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

            // Modern success notification
            toast.success('Welcome back!', {
                description: `Successfully logged in as ${user.name || user.email}`,
                duration: 3000,
                icon: <CheckCircle className="h-4 w-4 text-white" />,
                style: {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
                },
            });
        } catch (error) {
            console.error('Login error:', error);
            // Modern error notification
            toast.error('Login Failed', {
                description: error.message || 'Please check your credentials and try again',
                duration: 5000,
                icon: <AlertCircle className="h-4 w-4 text-white" />,
                style: {
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(255, 107, 107, 0.3)',
                },
            });
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
                            <div className="mb-6 flex justify-center transform hover:scale-110 transition-transform duration-500">
                                <img 
                                    src="/2.svg" 
                                    alt="Schoolhouse Logo" 
                                    className="h-20 w-auto drop-shadow-lg"
                                />
                            </div>
                            <h1 className="text-5xl font-black text-gray-900 mb-3 tracking-tight">مرحباً بك</h1>
                            <p className="text-lg text-gray-500 font-medium">سجل دخولك للوصول إلى عالم المعرفة</p>
                        </div>
                        
                        {/* Login Card */}
                        <div className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden">
                            {/* Inner Glow */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Email Field */}
                                <div className="space-y-2">
                                    <label className="block text-gray-800 font-bold text-sm mr-1" htmlFor="email">
                                        <FaEnvelope className="inline ml-2 text-[#194cbf]" /> البريد الإلكتروني
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="premium-input group-hover:border-blue-300 transition-colors"
                                            placeholder="أدخل بريدك الإلكتروني"
                                            required
                                            disabled={Loading}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-red-500 text-xs mt-1 mr-1 flex items-center animate-bounce">
                                            <AlertCircle className="w-3 h-3 ml-1" />
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="block text-gray-800 font-bold text-sm" htmlFor="password">
                                            <FaLock className="inline ml-2 text-[#194cbf]" /> كلمة المرور
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/forgot-password')}
                                            className="text-[#194cbf] hover:text-blue-800 text-xs font-bold transition-colors duration-200"
                                        >
                                            نسيت كلمة المرور؟
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="premium-input pr-12 group-hover:border-blue-300 transition-colors"
                                            placeholder="أدخل كلمة المرور"
                                            required
                                            disabled={Loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-red-500 text-xs mt-1 mr-1 flex items-center animate-bounce">
                                            <AlertCircle className="w-3 h-3 ml-1" />
                                            {errors.password}
                                        </p>
                                    )}
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
                                            جاري التحميل...
                                        </div>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            تسجيل الدخول
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                            </svg>
                                        </span>
                                    )}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="my-8 flex items-center">
                                <div className="flex-grow border-t border-gray-200/50"></div>
                                <span className="mx-4 text-gray-400 text-sm font-medium">أو</span>
                                <div className="flex-grow border-t border-gray-200/50"></div>
                            </div>

                            {/* Additional Links */}
                            <div className="text-center">
                                <p className="text-gray-500 font-medium">
                                    ليس لديك حساب؟{' '}
                                    <button
                                        onClick={() => navigate('/register')}
                                        className="text-[#194cbf] hover:text-blue-800 font-black transition-all duration-200 hover:underline underline-offset-4"
                                    >
                                        انضم إلينا الآن
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

export default Login; 
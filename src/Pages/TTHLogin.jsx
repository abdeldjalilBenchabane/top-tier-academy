import React, { useState } from 'react';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })
    const [errors, setErrors] = useState({})
    const [Loading, setLoading] = useState(false)

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
           
            console.log('Login data:', formData);
            await new Promise(resolve => setTimeout(resolve, 1500));

            alert('تم تسجيل الدخول بنجاح!');

        } catch (error) {
            console.error('Error:', error);
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
        <div className="min-h-screen bg-[url('public/Etudiente1.PNG')] bg-cover bg-center bg-fixed" dir="rtl">
            <Navbar />
            
            {/* Overlay */}
            <div className="min-h-screen bg-gradient-to-br from-blue-900/60 to-purple-900/60 backdrop-blur-sm flex items-center justify-center py-8 px-2 sm:px-0">
                <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 animate-fadeIn" style={{boxShadow: '0 20px 40px 0 rgba(0, 0, 0, 0.1)'}}>
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">تسجيل الدخول</h2>
                        <p className="text-gray-600 mt-2">أدخل بياناتك للوصول إلى حسابك</p>
                    </div>
                    
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
                            />
                            {errors.password && <p className="text-red-500 text-sm mt-2 flex items-center">
                                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.password}
                            </p>}
                        </div>

                        <button
                            type="submit"
                            disabled={Loading}
                            className={`w-full py-3 px-4 rounded-xl font-bold shadow-lg transition-all duration-300 ${
                                Loading 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-105'
                            } text-white`}
                        >
                            {Loading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    جاري تسجيل الدخول...
                                </div>
                            ) : (
                                'تسجيل الدخول'
                            )}
                        </button>
                    </form>
                </div>
            </div>
            
            <Footer />
        </div>
    )
}

export default Login; 
import React from 'react';
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";
import usePageMeta from '@/hooks/usePageMeta';

const Section = ({ title, children }) => (
    <section className="mb-8">
        <h2 className="text-xl font-black text-gray-900 mb-3">{title}</h2>
        <div className="text-gray-600 leading-8 space-y-3">{children}</div>
    </section>
);

const TTHSecurity = () => {

  usePageMeta({

    title: 'الأمان وحماية البيانات',

    description: 'إجراءات Top Tier Academy لحماية حساب الطالب وبياناته ومدفوعاته على المنصة.',

    path: '/security',

  });

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#f8fafc]" dir="rtl">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/30 blur-[120px]"></div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <Navbar />

                <div className="flex-grow px-4 py-14">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-10">
                            <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">الأمان</h1>
                            <p className="text-gray-500 font-medium">آخر تحديث: 18 أغسطس 2026</p>
                        </div>

                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-12">
                            <p className="text-gray-600 leading-8 mb-8">
                                أمان حسابك وبياناتك أولوية بالنسبة لنا في <strong>Top Tier Academy</strong>. توضح هذه الصفحة
                                الإجراءات التي نتبعها لحماية منصتنا، وما يمكنك القيام به للحفاظ على أمان حسابك.
                            </p>

                            <Section title="١. حماية البيانات أثناء النقل والتخزين">
                                <ul className="list-disc pr-6 space-y-2">
                                    <li>جميع الاتصالات بين تطبيقك أو متصفحك وخوادمنا تتم عبر اتصال مشفّر (HTTPS/TLS).</li>
                                    <li>كلمات المرور لا تُخزَّن أبدًا كنص صريح، بل يتم تشفيرها (hashing) بخوارزميات معتمدة قبل حفظها.</li>
                                    <li>تسجيل الدخول يعتمد على رموز جلسة (tokens) محدودة الصلاحية، ويتم إلغاؤها تلقائيًا بعد فترة من عدم النشاط.</li>
                                    <li>الملفات والصور التي يتم رفعها تُخزَّن على خدمات تخزين سحابي آمنة ومشفّرة.</li>
                                </ul>
                            </Section>

                            <Section title="٢. التحكم في الوصول">
                                <p>
                                    تعتمد المنصة على نظام صلاحيات يحدد ما يمكن لكل نوع حساب (طالب، أستاذ، مشرف) الوصول إليه.
                                    كما أن المحتوى المدفوع (الدورات والحصص المباشرة) محمي ولا يمكن الوصول إليه إلا بعد التحقق من
                                    عملية الشراء، حتى لو كان المستخدم يملك رابطًا مباشرًا للمحتوى.
                                </p>
                            </Section>

                            <Section title="٣. أمان الحصص المباشرة">
                                <ul className="list-disc pr-6 space-y-2">
                                    <li>يتم إنشاء رمز وصول (token) مؤقت وفريد لكل مستخدم عند دخوله حصة مباشرة، بحيث لا يمكن الانضمام دون التحقق من صلاحية الدخول.</li>
                                    <li>يملك الأستاذ صلاحيات إدارة الحصة، مثل كتم صوت المشاركين أو إخراجهم عند الحاجة.</li>
                                    <li>لا يتم تفعيل الكاميرا أو الميكروفون على جهازك إلا بعد موافقتك الصريحة.</li>
                                </ul>
                            </Section>

                            <Section title="٤. مراقبة ومنع الاحتيال">
                                <p>
                                    نطبّق آليات تحقق على عمليات الشراء والمعاملات المتعلقة بالنقاط لمنع التكرار غير المقصود أو
                                    إساءة الاستخدام، ونراجع الأنشطة غير الاعتيادية على الحسابات للحفاظ على سلامة المنصة.
                                </p>
                            </Section>

                            <Section title="٥. مسؤوليتك كمستخدم">
                                <p>يمكنك المساهمة في حماية حسابك من خلال:</p>
                                <ul className="list-disc pr-6 space-y-2">
                                    <li>استخدام كلمة مرور قوية وفريدة، غير مستخدمة في مواقع أخرى.</li>
                                    <li>عدم مشاركة بيانات الدخول (البريد الإلكتروني وكلمة المرور) مع أي شخص آخر.</li>
                                    <li>تسجيل الخروج عند استخدام جهاز مشترك أو عام.</li>
                                    <li>التبليغ الفوري في حال الاشتباه بدخول غير مصرح به إلى حسابك.</li>
                                </ul>
                            </Section>

                            <Section title="٦. الإبلاغ عن مشكلة أمنية">
                                <p>
                                    إذا اكتشفت ثغرة أمنية أو مشكلة تتعلق بأمان المنصة، نرجو إبلاغنا فورًا حتى نتمكن من معالجتها
                                    بسرعة، وذلك عبر:
                                </p>
                                <ul className="list-disc pr-6 space-y-2">
                                    <li>البريد الإلكتروني: <a href="mailto:toptieracademy.setif@gmail.com" className="text-[#194cbf] font-bold hover:underline">toptieracademy.setif@gmail.com</a></li>
                                    <li>الهاتف: 036821908 / 0563273309 / 0777768983</li>
                                </ul>
                            </Section>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
};

export default TTHSecurity;

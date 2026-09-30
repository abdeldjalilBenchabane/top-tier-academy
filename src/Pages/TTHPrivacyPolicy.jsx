import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";
import usePageMeta from '@/hooks/usePageMeta';

const Section = ({ title, children }) => (
    <section className="mb-8">
        <h2 className="text-xl font-black text-gray-900 mb-3">{title}</h2>
        <div className="text-gray-600 leading-8 space-y-3">{children}</div>
    </section>
);

const TTHPrivacyPolicy = () => {

  usePageMeta({

    title: 'سياسة الخصوصية',

    description: 'كيف تجمع Top Tier Academy بياناتك وتستعملها وتحميها، وما هي حقوقك في الوصول إليها أو حذفها.',

    path: '/privacy-policy',

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
                            <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">سياسة الخصوصية</h1>
                            <p className="text-gray-500 font-medium">آخر تحديث: 18 أغسطس 2026</p>
                        </div>

                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-12">
                            <p className="text-gray-600 leading-8 mb-8">
                                توضح سياسة الخصوصية هذه كيفية جمع منصة <strong>Top Tier Academy</strong> ("المنصة"، "نحن") لبيانات
                                مستخدميها واستخدامها وحمايتها، سواء عبر الموقع الإلكتروني أو تطبيق الهاتف. باستخدامك للمنصة فإنك
                                توافق على الممارسات الموضحة أدناه.
                            </p>

                            <Section title="١. المعلومات التي نجمعها">
                                <p>نقوم بجمع الأنواع التالية من المعلومات عند إنشائك لحساب أو استخدامك للمنصة:</p>
                                <ul className="list-disc pr-6 space-y-2">
                                    <li><strong>معلومات الحساب:</strong> الاسم الكامل، البريد الإلكتروني، رقم الهاتف، وكلمة المرور (يتم تخزينها بشكل مشفّر ولا يمكن لأي شخص الاطلاع عليها كنص صريح).</li>
                                    <li><strong>بيانات الدفع والنقاط:</strong> سجل عمليات الشراء، رصيد النقاط، وتاريخ المعاملات المالية داخل المنصة.</li>
                                    <li><strong>بيانات الاستخدام:</strong> الدورات والحصص التي تشاهدها أو تشترك بها، تقدمك التعليمي، وتعليقاتك وتقييماتك.</li>
                                    <li><strong>الوصول إلى الكاميرا والميكروفون:</strong> عند مشاركتك في حصة مباشرة (بث فيديو حي)، يتم استخدام الكاميرا والميكروفون فقط أثناء الحصة وبموافقتك الصريحة عبر إذن النظام.</li>
                                    <li><strong>الملفات المرفوعة:</strong> الصور الشخصية أو الملفات التي تقوم برفعها (مثل صورة الملف الشخصي).</li>
                                    <li><strong>بيانات تقنية:</strong> نوع الجهاز، إصدار التطبيق أو المتصفح، وعنوان IP، لأغراض الأمان وتحسين الأداء.</li>
                                </ul>
                            </Section>

                            <Section title="٢. كيف نستخدم معلوماتك">
                                <ul className="list-disc pr-6 space-y-2">
                                    <li>لتوفير خدمات المنصة وإدارة حسابك ووصولك إلى الدورات والحصص المباشرة.</li>
                                    <li>لمعالجة عمليات الشراء وإدارة رصيد النقاط الخاص بك.</li>
                                    <li>لإرسال إشعارات ضرورية تتعلق بحسابك أو حصصك (مثل تذكير بموعد حصة، أو رد على تعليقك).</li>
                                    <li>لتحسين المنصة وإصلاح الأعطال وتحليل الاستخدام بشكل عام.</li>
                                    <li>للحفاظ على أمان المنصة ومنع الاحتيال أو إساءة الاستخدام.</li>
                                    <li>للامتثال للالتزامات القانونية والمحاسبية.</li>
                                </ul>
                            </Section>

                            <Section title="٣. مشاركة المعلومات مع أطراف ثالثة">
                                <p>لا نقوم ببيع بياناتك الشخصية لأي جهة. قد نشارك بعض البيانات مع مزودي خدمات موثوقين نستخدمهم لتشغيل المنصة فقط، مثل:</p>
                                <ul className="list-disc pr-6 space-y-2">
                                    <li>مزود خدمة البث المباشر للفيديو والصوت (Agora) أثناء الحصص المباشرة فقط.</li>
                                    <li>مزود التخزين السحابي لحفظ الملفات والصور بشكل آمن.</li>
                                    <li>مزود خدمة الدفع الإلكتروني لمعالجة عمليات شراء النقاط.</li>
                                    <li>مزود خدمة البريد الإلكتروني لإرسال إشعارات الحساب وإعادة تعيين كلمة المرور.</li>
                                </ul>
                                <p>قد نكشف عن بياناتك أيضًا إذا طُلب ذلك بموجب القانون أو أمر قضائي.</p>
                            </Section>

                            <Section title="٤. أمان البيانات">
                                <p>
                                    نتخذ إجراءات تقنية وتنظيمية لحماية بياناتك، تشمل تشفير الاتصال بين جهازك وخوادمنا، وتشفير كلمات
                                    المرور، والتحكم في الصلاحيات حسب نوع الحساب (طالب، أستاذ، مشرف). لمزيد من التفاصيل، راجع
                                    {' '}<Link to="/security" className="text-[#194cbf] font-bold hover:underline">صفحة الأمان</Link>.
                                </p>
                            </Section>

                            <Section title="٥. الاحتفاظ بالبيانات">
                                <p>
                                    نحتفظ ببيانات حسابك طالما بقي الحساب نشطًا. عند حذف الحساب، تتم إزالة بياناتك الشخصية وفق ما هو
                                    موضح في {' '}<Link to="/delete-account" className="text-[#194cbf] font-bold hover:underline">صفحة حذف الحساب</Link>،
                                    باستثناء السجلات المالية والمحاسبية التي قد نحتفظ بها للمدة التي يفرضها القانون المعمول به.
                                </p>
                            </Section>

                            <Section title="٦. حقوقك">
                                <ul className="list-disc pr-6 space-y-2">
                                    <li>الحق في الوصول إلى بياناتك الشخصية ومراجعتها.</li>
                                    <li>الحق في تصحيح أي معلومات غير دقيقة عبر إعدادات الملف الشخصي.</li>
                                    <li>الحق في طلب حذف حسابك وبياناتك.</li>
                                    <li>الحق في الاعتراض على استخدام بياناتك لأغراض معينة، عبر التواصل معنا.</li>
                                </ul>
                            </Section>

                            <Section title="٧. خصوصية القاصرين">
                                <p>
                                    تُقدَّم بعض دوراتنا وحصصنا لفئة الطلاب الذين قد يكونون دون سن ١٨ عامًا. في هذه الحالة، يتحمل
                                    ولي الأمر مسؤولية إنشاء الحساب أو الموافقة على استخدام المنصة نيابة عن القاصر، ونشجع أولياء
                                    الأمور على الإشراف على استخدام أبنائهم للمنصة.
                                </p>
                            </Section>

                            <Section title="٨. التغييرات على هذه السياسة">
                                <p>
                                    قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سيتم نشر أي تغييرات جوهرية على هذه الصفحة مع
                                    تحديث تاريخ "آخر تحديث" أعلاه.
                                </p>
                            </Section>

                            <Section title="٩. تواصل معنا">
                                <p>لأي استفسار يتعلق بالخصوصية أو بياناتك الشخصية، يمكنك التواصل معنا عبر:</p>
                                <ul className="list-disc pr-6 space-y-2">
                                    <li>البريد الإلكتروني: <a href="mailto:toptieracademy.setif@gmail.com" className="text-[#194cbf] font-bold hover:underline">toptieracademy.setif@gmail.com</a></li>
                                    <li>الهاتف: 0777768983 / 036008230</li>
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

export default TTHPrivacyPolicy;

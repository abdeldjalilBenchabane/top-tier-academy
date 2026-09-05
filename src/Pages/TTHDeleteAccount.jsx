import React from 'react';
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";

const Section = ({ title, children }) => (
    <section className="mb-8">
        <h2 className="text-xl font-black text-gray-900 mb-3">{title}</h2>
        <div className="text-gray-600 leading-8 space-y-3">{children}</div>
    </section>
);

const TTHDeleteAccount = () => {
    return (
        <div className="min-h-screen relative overflow-hidden bg-[#f8fafc]" dir="rtl">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/30 blur-[120px]"></div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <Navbar />

                <div className="flex-grow px-4 py-14">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-10">
                            <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">حذف الحساب</h1>
                            <p className="text-gray-500 font-medium">آخر تحديث: 18 أغسطس 2026</p>
                        </div>

                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-12">
                            <p className="text-gray-600 leading-8 mb-8">
                                نحترم حقك في التحكم الكامل ببياناتك، ويمكنك في أي وقت طلب حذف حسابك في <strong>Top Tier Academy</strong>
                                {' '}بشكل نهائي. توضح هذه الصفحة ما يعنيه ذلك وكيفية تقديم الطلب.
                            </p>

                            <Section title="١. قبل أن تبدأ">
                                <p>يرجى الانتباه إلى ما يلي قبل طلب حذف حسابك:</p>
                                <ul className="list-disc pr-6 space-y-2">
                                    <li>لن تتمكن بعد الحذف من الوصول إلى الدورات أو الحصص المباشرة التي اشتريتها سابقًا.</li>
                                    <li>أي رصيد نقاط متبقٍ في حسابك سيُفقد ولا يمكن استرجاعه بعد إتمام عملية الحذف.</li>
                                    <li>عملية الحذف نهائية ولا يمكن التراجع عنها بعد معالجتها.</li>
                                </ul>
                            </Section>

                            <Section title="٢. ما الذي يتم حذفه">
                                <ul className="list-disc pr-6 space-y-2">
                                    <li>معلومات ملفك الشخصي (الاسم، البريد الإلكتروني، رقم الهاتف، كلمة المرور).</li>
                                    <li>الصور أو الملفات الشخصية التي رفعتها إلى المنصة.</li>
                                    <li>نشاطك على المنصة مثل التعليقات المرتبطة بحسابك الشخصي.</li>
                                </ul>
                            </Section>

                            <Section title="٣. ما الذي قد نحتفظ به">
                                <p>
                                    قد نحتفظ ببعض البيانات، مثل سجلات المعاملات المالية وعمليات الشراء، للمدة التي يفرضها القانون
                                    المحاسبي والضريبي المعمول به، حتى بعد حذف الحساب. يتم الاحتفاظ بهذه السجلات لأغراض قانونية
                                    ومحاسبية فقط، ولا تُستخدم لأي غرض آخر.
                                </p>
                            </Section>

                            <Section title="٤. كيفية طلب حذف حسابك">
                                <p>لا يتوفر حاليًا حذف تلقائي فوري داخل التطبيق، ويتم تنفيذ الطلب يدويًا من فريقنا للتحقق من هويتك وحماية حسابك من طلبات الحذف الاحتيالية. لطلب حذف حسابك، يرجى اتباع الخطوات التالية:</p>
                                <ol className="list-decimal pr-6 space-y-2">
                                    <li>أرسل بريدًا إلكترونيًا إلى <a href="mailto:toptieracademy.setif@gmail.com?subject=%D8%B7%D9%84%D8%A8%20%D8%AD%D8%B0%D9%81%20%D8%A7%D9%84%D8%AD%D8%B3%D8%A7%D8%A8" className="text-[#194cbf] font-bold hover:underline">toptieracademy.setif@gmail.com</a> يفضّل أن يكون من نفس البريد الإلكتروني المسجّل في حسابك.</li>
                                    <li>اكتب في عنوان الرسالة: "طلب حذف الحساب".</li>
                                    <li>أرفق في نص الرسالة: الاسم الكامل، ورقم الهاتف المستخدم عند التسجيل، لتأكيد هويتك.</li>
                                    <li>بديلاً عن ذلك، يمكنك الاتصال بنا مباشرة على أحد الأرقام: 036821908 / 0563273309 / 0777768983.</li>
                                </ol>
                            </Section>

                            <Section title="٥. مدة المعالجة">
                                <p>
                                    سيتم التحقق من طلبك ومعالجته خلال مدة أقصاها ٣٠ يومًا من تاريخ استلامه، وسنُرسل لك تأكيدًا عبر
                                    البريد الإلكتروني عند إتمام حذف حسابك.
                                </p>
                            </Section>

                            <Section title="٦. لديك استفسار؟">
                                <p>
                                    إذا كان لديك أي سؤال بخصوص حذف حسابك أو ترغب فقط في تعطيله مؤقتًا بدلاً من حذفه نهائيًا، تواصل
                                    معنا عبر البريد الإلكتروني أو الهاتف المذكورين أعلاه وسنساعدك.
                                </p>
                            </Section>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
};

export default TTHDeleteAccount;

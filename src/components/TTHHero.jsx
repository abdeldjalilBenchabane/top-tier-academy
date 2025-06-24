import React from 'react';

import SearchBar from '../components/TTHSearchBar';

export default function Hero() {


    return (
        <section className=" text-white bg-[url('public/Etudiente1.PNG')] bg-cover bg-center h-[120vh] md:h-screen min-h-screen flex flex-col md:flex-row items-center justify-between p-6 md:p-12">
            <div dir='rtl' className="max-w-2xl w-[90%]  sm:w-[40%]">
                <p className="text-gray-2 text-center sm:text-right  md:text-[1.28rem]  opacity-60 mb-4">المعلمون المميزون يصنعون مستقبل الأجيال</p>
                <div className="flex flex-col sm:items-start items-center mb-16 space-y-4">
                    <div className="text-4xl md:text-5xl font-semibold">
                        ابدأ <span className="text-cyan-400">رحلتك </span>التعليمية
                    </div>
                    <div className="text-4xl md:text-5xl font-bold">من بيتك مع أفضل</div>
                    <div className="text-4xl md:text-5xl font-bold">الأساتذة في الجزائر</div>
                </div>
                <div className="flex   md:flex-row items-center md:justify-start justify-center gap-4">
                    <button className=" text-white border rounded-sm  px-6 py-2  shadow hover:opacity-50">عرض الدورات</button>
                    <button className="  px-6 py-2  hover:opacity-50">الحصص المباشرة</button>

                </div>
                <SearchBar></SearchBar>
            </div>

            {/* Right Image */}
            <div className="mt-10 md:mt-0 md:ml-8">
                <img
                    src="/public/phoo2.PNG"
                    alt="Étudiante"
                    className="w-72 md:w-96 object-cover drop-shadow-lg"
                />
            </div>
        </section>
    );
}

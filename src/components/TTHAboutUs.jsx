import React, { useEffect } from 'react';
import { useInView } from "react-intersection-observer";
import { motion, useAnimation } from "framer-motion";

const AboutUs = () => {
    const controls = useAnimation();
    const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });

    useEffect(() => {
        if (inView) {
            controls.start("visible");
        }
    }, [controls, inView]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3,
                ease: "easeInOut"
            }
        }
    };

    const slideFromLeft = {
        hidden: { opacity: 0, x: -100 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.8,
                ease: "easeIn"
            }
        }
    };

    const slideFromRight = {
        hidden: { opacity: 0, x: 100 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.5,
                ease: "easeIn"
            }
        }
    };

    return (
        <section className="relative overflow-hidden">
            {/* Images décoratives - Responsive */}
            <img
                className='hidden md:block absolute h-16 md:h-20 lg:h-24 w-48 md:w-64 lg:w-72 right-0 top-16 md:top-24 z-10'
                src="/form1.PNG"
                alt="Decoration"
            />
            <img
                className='hidden md:block absolute h-16 md:h-20 lg:h-24 w-40 md:w-48 lg:w-56 left-0 top-[50rem] z-10'
                src="/form3.PNG"
                alt="Decoration"
            />
            <img
                className='hidden md:block absolute h-20 md:h-24 lg:h-28 w-48 md:w-64 lg:w-72 left-0 bottom-0 z-10'
                src="/form2.PNG"
                alt="Decoration"
            />

            <motion.section
                ref={ref}
                initial="hidden"
                animate={controls}
                variants={containerVariants}
                className='flex flex-col justify-center items-center pt-6 md:pt-12 lg:pt-16'
            >
                {/* Titre principal */}
                <motion.h1
                    className='text-2xl md:text-3xl lg:text-4xl text-[#2F327D] font-bold text-center mt-4 px-4 relative z-20'
                    variants={slideFromRight}
                >
                    ماذا<span className='text-cyan-400'> نوفر</span>
                </motion.h1>

                {/* Section 1 - حصص مباشرة */}
                <div dir='rtl' className='w-full min-h-[80vh] md:min-h-screen flex items-center justify-center py-8 md:py-12 lg:py-16'>
                    <div className='container mx-auto px-4 md:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center max-w-7xl'>
                        <motion.div
                            className='flex flex-col justify-center order-1 lg:order-1 text-center lg:text-right'
                            variants={slideFromRight}
                        >
                            <motion.h1 className='text-2xl md:text-3xl lg:text-4xl text-[#2F327D] font-bold mb-4 md:mb-6'>
                                حصص <span className='text-cyan-400'>مباشرة </span>للتلاميذ
                            </motion.h1>
                            <motion.p className='text-gray-500 text-base md:text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0'>
                                نقدم لك فرصة حضور دروس مباشرة مع أفضل الأساتذة، تمامًا كما في الفصول الدراسية.
                                يمكنك طرح الأسئلة، التفاعل مع المعلم وفهم الدرس بكل تفاصيله
                            </motion.p>
                        </motion.div>

                        <motion.div
                            variants={slideFromLeft}
                            className='flex justify-center items-center order-2 lg:order-2'
                        >
                            <motion.img
                                whileHover={{ scale: 1.02 }}
                                src='photo1.PNG'
                                alt='حصص مباشرة'
                                className='w-full max-w-md md:max-w-lg lg:max-w-xl h-auto '
                            />
                        </motion.div>
                    </div>
                </div>

                {/* Section 2 - كل ما تحتاجه */}
                <div className='w-full min-h-[80vh] md:min-h-screen flex items-center justify-center py-8 md:py-12 lg:py-16'>
                    <div className='container mx-auto px-4 md:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center max-w-7xl'>
                        <motion.div
                            className='flex flex-col justify-center order-1 lg:order-1 text-center lg:text-right'
                            variants={slideFromRight}
                        >

                            <motion.h1 className='text-2xl md:text-3xl lg:text-4xl text-[#2F327D] font-bold mb-4 md:mb-6'>
                                كل ما تحتاجه <span className='text-cyan-400'>كما في القسم</span>
                            </motion.h1>
                            <motion.p className='text-gray-500 text-base md:text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0'>
                                كل ما يمكنك فعله في القسم التقليدي، يمكنك القيام به معنا عبر الإنترنت! نوفر لك ملفات الدروس،
                                تمارين جاهزة، وسلاسل يمكن تحميلها والعمل بها في أي وقت
                            </motion.p>
                        </motion.div>

                        <motion.div
                            className='flex justify-center items-center order-2 lg:order-2'
                            variants={slideFromLeft}
                        >

                            <motion.img
                                whileHover={{ scale: 1.02 }}
                                className='w-full max-w-md md:max-w-lg lg:max-w-xl h-auto '
                                src='photo2.PNG'
                                alt='كل ما تحتاجه'
                            />
                        </motion.div>
                    </div>
                </div>

                {/* Section 3 - دروس خصوصية */}
                <div dir='rtl' className='w-full min-h-[80vh] md:min-h-screen flex items-center justify-center py-8 md:py-12 lg:py-16'>
                    <div className='container mx-auto px-4 md:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center max-w-7xl'>
                        <motion.div
                            className='flex flex-col justify-center order-1 lg:order-1 text-center lg:text-right'
                            variants={slideFromRight}
                        >
                            <motion.h1 className='text-2xl md:text-3xl lg:text-4xl text-[#2F327D] font-bold mb-4 md:mb-6'>
                                دروس<span className='text-cyan-400'> خصوصية فردية</span>
                            </motion.h1>
                            <motion.p className='text-gray-500 text-base md:text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0'>
                                هل تريد طلب حصص خاصة مع أستاذ؟ يمكنك اختيار الأستاذ الذي يناسبك، تحديد الموعد الذي يناسب وقتك،
                                والدراسة معه عبر الإنترنت بكل راحة وسهولة.
                            </motion.p>
                        </motion.div>

                        <motion.div
                            className='flex justify-center items-center order-2 lg:order-2'
                            variants={slideFromLeft}
                        >
                            <motion.img
                                whileHover={{ scale: 1.02 }}
                                src='photo3.PNG'
                                alt='دروس خصوصية'
                                className='w-full max-w-md md:max-w-lg lg:max-w-xl h-auto '
                            />
                        </motion.div>
                    </div>
                </div>
            </motion.section>

        </section>
    )
}

export default AboutUs;
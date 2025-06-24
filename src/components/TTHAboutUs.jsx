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
        <section>
            <img
                className='sm:block absolute h-20 hidden   w-72 right-0 mt-[6rem] '
                src="/public/form1.PNG"
                alt=""

            />
            <img
                className='absolute h-20 sm:block hidden w-56 mt-[40rem]  '
                src="/public/form3.PNG"
                alt=""

            />
            <motion.section
                ref={ref}
                initial="hidden"
                animate={controls}
                variants={containerVariants}
                className='flex flex-col justify-center items-center mt-9'
            >
                <motion.h1
                    className='text-3xl text-[#2F327D] font-bold text-center mt-4 relative'
                    variants={slideFromRight}
                >
                    ماذا<span className='text-cyan-400'> نوفر</span>

                </motion.h1>

                {/*  section 1 */}
                <div dir='rtl' className='h-screen  grid grid-cols-1 justify-center sm:grid-cols-2'>
                     <motion.div
                        className='sm:w-[70%] sm:mr-32 mr-6   flex flex-col   justify-center mt-16'
                        variants={slideFromRight}
                    >
                        <motion.h1 className='text-3xl text-[#2F327D] font-bold   mb-9'>
                            حصص <span className='text-cyan-400'>مباشرة </span>للتلاميذ
                        </motion.h1>
                        <motion.p className='text-gray-500  text-lg'>
                            نقدم لك فرصة حضور دروس مباشرة مع أفضل الأساتذة، تمامًا كما في الفصول الدراسية.
                            يمكنك طرح الأسئلة، التفاعل مع المعلم<br /> وفهم الدرس بكل تفاصيله
                        </motion.p>
                    </motion.div>
                    <motion.div
                        variants={slideFromLeft}
                        className='flex items-center'
                    >
                        <motion.img
                            whileHover={{ scale: 1.02 }}
                            src='public/photo1.PNG'
                            alt=''
                        />
                    </motion.div>
                   
                </div>

                {/*  section 2 */}
                <div className='sm:w-[80%] w-[85%]  grid grid-cols-1 mt-20 sm:grid-cols-2 relative'>

                    <motion.div
                        className='flex flex-col   justify-center  sm:w-[90%] mt-[-2rem]'
                        variants={slideFromRight}
                    >
                        <motion.h1 className='text-3xl text-[#2F327D] font-bold text-end'>
                            كل ما تحتاجه <span className='text-cyan-400'>كما في القسم</span>
                        </motion.h1>
                        <motion.p className='text-gray-500 text-end text-lg mt-9'>
                            كل ما يمكنك فعله في القسم التقليدي، يمكنك القيام به معنا عبر الإنترنت! نوفر لك ملفات الدروس،
                            تمارين جاهزة، وسلاسل يمكن تحميلها والعمل بها في أي وقت
                        </motion.p>
                    </motion.div>
                    <motion.div
                        className='flex justify-end mr-[-2rem] items-center'
                        variants={slideFromLeft}
                    >
                        <motion.img
                            whileHover={{ scale: 1.02 }}
                            className='sm:w-[90%] w-full'
                            src='public/photo2.PNG'
                            alt=''
                        />
                    </motion.div>
                </div>

                {/*  section 3 */}
                <div dir='rtl' className='h-screen w-[90%] grid grid-cols-1 sm:grid-cols-2'>
                    <motion.div
                        className='flex flex-col sm:mr-16 mr-5 justify-center'
                        variants={slideFromRight}
                    >
                        <motion.h1 className='text-3xl text-[#2F327D] font-bold  mb-9'>
                            دروس<span className='text-cyan-400'> خصوصية فردية</span>
                        </motion.h1>
                        <motion.p className='text-gray-500  text-lg'>
                            هل تريد طلب حصص خاصة مع أستاذ؟ يمكنك اختيار الأستاذ <br />الذي يناسبك، تحديد الموعد الذي يناسب وقتك،
                            والدراسة <br />معه عبر الإنترنت بكل راحة وسهولة.
                        </motion.p>
                    </motion.div>
                    <motion.div
                        className='flex items-center'
                        variants={slideFromLeft}
                    >
                        <motion.img
                            whileHover={{ scale: 1.02 }}
                            src='public/photo3.PNG'
                            alt=''
                        />
                    </motion.div>

                </div>
            </motion.section>
            <img
                className='absolute h-28 hidden sm:block  w-72 left-0 mt-[-6rem]'
                src="/public/form2.PNG"
                alt=""

            />
            <h1 className='text-[#2F327D]  text-4xl text-center m-11 font-semibold'>ما يمكنك  <span className='text-cyan-400'>دراسته </span>هنا</h1>
        </section>
    )
}

export default AboutUs;
import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "./ui/Card"
import { Star, Quote, ChevronRight, Users, Award, Heart } from "lucide-react"

export default function TestimonialsSection() {
  const [visibleTestimonials, setVisibleTestimonials] = useState(3)
  const [hoveredCard, setHoveredCard] = useState(null)

  const testimonials = [
    {
      id: 1,
      name: "محسن كفوس",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "تلميذ ابتدائي",
      rating: 5,
      text: "هادي المنصة عاونتني بزاف في قرايتي. الدروس ساهلة نفهمها والمعلّمين يشرحو مليح.",
      course: "السنة الخامسة ابتدائي",
      gradient: "from-[#194cbf] to-[#61a1ff]"
    },
    {
      id: 2,
      name: "سميرة بن عيسى",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "تلميذة متوسطة",
      rating: 5,
      text: "فرحانة كي وليت نفهم المواد خير. المنصة منظّمة وتسهّل علينا القراءة.",
      course: "السنة الرابعة متوسط",
      gradient: "from-pink-500 to-red-500"
    },
    {
      id: 3,
      name: "كمال زروقي",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "تلميذ ثانوي",
      rating: 5,
      text: "المنصة هايلة بزاف. الشرح واضح والتطبيقات عاونوني نراجع للبكالوريا.",
      course: "شعبة علوم تجريبية",
      gradient: "from-green-500 to-teal-500"
    },
    {
      id: 4,
      name: "فاطمة الزهراء رحماني",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "تلميذة ثانوي",
      rating: 5,
      text: "بدّلتلي طريقة المراجعة كامل. المحتوى عصري والأساتذة يجاوبو على كامل أسئلتي.",
      course: "الهندسة الكهربائية – جامعة سطيف",
      gradient: "from-orange-500 to-yellow-500"
    },
    {
      id: 5,
      name: "إلياس قادة",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "تلميذ ثانوي",
      rating: 5,
      text: "المنصة ساهلة الاستعمال والمحتوى في المستوى. ننصح كامل الطلبة بيها.",
      course: "علوم الحاسوب – جامعة الجزائر",
      gradient: "from-[#194cbf] to-[#61a1ff]"
    },
    {
      id: 6,
      name: "نور الهدى عماري",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "تلميذة متوسطة",
      rating: 5,
      text: "أفضل منصة تعليمية جربتها حتى الآن. الشروحات واضحة والتمارين مفيدة جدًا.",
      course: "الطب العام – جامعة وهران",
      gradient: "from-[#194cbf] to-[#61a1ff]"
    },
  ]

  // Load more testimonials when scrolling to bottom
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        if (visibleTestimonials < testimonials.length) {
          setVisibleTestimonials((prev) => Math.min(prev + 3, testimonials.length))
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [visibleTestimonials, testimonials.length])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  }

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.8
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  }

  const floatingAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }

  return (
    <div className="relative overflow-hidden  dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 py-20 px-4">
      
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-20 h-20 bg-blue-200 rounded-full opacity-20"
          animate={floatingAnimation}
        />
        <motion.div
          className="absolute top-40 right-40 w-16 h-16 bg-blue-300 rounded-full opacity-20"
          animate={{ ...floatingAnimation, transition: { ...floatingAnimation.transition, delay: 1 } }}
        />
        <motion.div
          className="absolute top-20 right-10 w-12 h-12 bg-pink-200 rounded-full opacity-20"
          animate={{ ...floatingAnimation, transition: { ...floatingAnimation.transition, delay: 2 } }}
        />
      </div>

      <div className="container mx-auto relative z-10">
       
        <div className="text-center mb-16" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#194cbf] to-[#61a1ff] rounded-full mb-6"
          >
            <Heart className="w-8 h-8 text-white" />
          </motion.div>
          
          <motion.h2
            className="text-5xl font-bold mb-6 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-300"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            آراء طلابنا
          </motion.h2>
          
          <motion.p
            className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            استمع إلى ما يقوله طلابنا عن تجربتهم التعليمية على منصتنا
          </motion.p>

         
          <motion.div
            className="flex justify-center gap-8 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-400">
              <Users className="w-5 h-5" />
              <span className="font-semibold">+10,000 طالب</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-400">
              <Award className="w-5 h-5" />
              <span className="font-semibold">تقييم 4.9/5</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          dir="rtl"
        >
          <AnimatePresence>
            {testimonials.slice(0, visibleTestimonials).map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                variants={cardVariants}
                layout
                onHoverStart={() => setHoveredCard(testimonial.id)}
                onHoverEnd={() => setHoveredCard(null)}
                className="relative group"
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                 
                  <div className={`h-1 bg-gradient-to-r ${testimonial.gradient}`} />
                  
                  
                  <div className="absolute top-4 left-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Quote className="w-12 h-12 text-slate-600" />
                  </div>

                  <CardContent className="p-8 relative z-10">
                   
                    <div className="flex items-center mb-6">
                      <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                        {testimonial.name.charAt(0)}
                        <motion.div
                          className="absolute inset-0 rounded-full bg-white/20"
                          initial={{ scale: 0 }}
                          animate={{ scale: hoveredCard === testimonial.id ? 1 : 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <div className="mr-4">
                        <p className="font-bold text-lg text-slate-800 dark:text-white">{testimonial.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{testimonial.role}</p>
                        {/* <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{testimonial.course}</p> */}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.1 * i, type: "spring", stiffness: 200 }}
                        >
                          <Star
                            className={`h-5 w-5 ${
                              i < testimonial.rating 
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-gray-300"
                            }`}
                          />
                        </motion.div>
                      ))}
                    </div>

                    {/* Testimonial text */}
                    <motion.p 
                      className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      "{testimonial.text}"
                    </motion.p>

                    {/* Hover effect overlay */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredCard === testimonial.id ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Load More Button */}
        {visibleTestimonials < testimonials.length && (
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              onClick={() => setVisibleTestimonials((prev) => Math.min(prev + 3, testimonials.length))}
              className="group relative overflow-hidden bg-gradient-to-r from-[#194cbf] to-[#61a1ff] text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              dir="rtl"
            >
              <span className="relative z-10 flex items-center gap-2">
                عرض المزيد من الآراء
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#194cbf] to-[#61a1ff]"
                initial={{ x: "100%" }}
                whileHover={{ x: "0%" }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
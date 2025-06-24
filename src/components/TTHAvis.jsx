import React,{ useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "./ui/Card"
import { Star } from "lucide-react"

export default function TestimonialsSection() {
  const [visibleTestimonials, setVisibleTestimonials] = useState(3)


  const testimonials = [
    {
      id: 1,
      name: "أحمد محمد",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "طالب هندسة",
      rating: 5,
      text: "هذه المنصة غيرت طريقة دراستي بشكل كامل. المحتوى ممتاز والمدرسون رائعون!",
    },
    {
      id: 2,
      name: "سارة أحمد",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "طالبة طب",
      rating: 5,
      text: "أنا سعيدة جدًا بالتقدم الذي أحرزته منذ بدأت التعلم على هذه المنصة. الدروس منظمة بشكل رائع.",
    },
    {
      id: 3,
      name: "محمد علي",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "طالب علوم حاسوب",
      rating: 4,
      text: "المنصة سهلة الاستخدام والمحتوى التعليمي عالي الجودة. أوصي بها لجميع الطلاب.",
    },
    {
      id: 4,
      name: "فاطمة حسن",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "طالبة أدب",
      rating: 5,
      text: "لقد ساعدتني هذه المنصة على تحسين مهاراتي بشكل كبير. المدرسون متفاعلون ويقدمون دعمًا ممتازًا.",
    },
    {
      id: 5,
      name: "خالد عمر",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "طالب اقتصاد",
      rating: 4,
      text: "تجربة تعليمية فريدة من نوعها. المحتوى حديث ومواكب للتطورات في مجال تخصصي.",
    },
    {
      id: 6,
      name: "نور الهدى",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "طالبة علم نفس",
      rating: 5,
      text: "أفضل منصة تعليمية جربتها حتى الآن. الشروحات واضحة والتمارين مفيدة جدًا.",
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

  return (
    <div className="container mx-auto py-16 px-4 bg-gradient-to-b mt-6 from-white to-[#a2c4ff] dark:from-slate-950 dark:to-slate-900">
      <div className="text-center mb-12" dir="rtl">
        <motion.h2
          className="text-3xl font-bold mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          آراء طلابنا
        </motion.h2>
        <motion.p
          className="text-muted-foreground max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          استمع إلى ما يقوله طلابنا عن تجربتهم التعليمية على منصتنا
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" dir="rtl">
        {testimonials.slice(0, visibleTestimonials).map((testimonial, index) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="h-full"
          >
            <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center mb-4">
               
                <div className="bg-gray-500 rounded-full h-10 w-10"></div>
               
                  <div className="mr-4">
                    <p className="font-medium">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < testimonial.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed flex-grow">{testimonial.text}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {visibleTestimonials < testimonials.length && (
        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => setVisibleTestimonials((prev) => Math.min(prev + 3, testimonials.length))}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
            dir="rtl"
          >
            عرض المزيد من الآراء
          </button>
        </motion.div>
      )}
    </div>
  )
}
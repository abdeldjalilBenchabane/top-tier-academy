import React, { useState } from "react"
import { BookOpen, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "./ui/Card"
import { Button } from "./ui/Button"

export default function FanCard() {

  const [selectedCard, setSelectedCard] = useState("science")
  const [selectedLanguage, setSelectedLanguage] = useState("french")
  const [selectedEducationLevel, setSelectedEducationLevel] = useState("high")

  const cardData = {
    languages: {
      title: "اللغات",
      description: (
        <div className="space-y-4 text-right">
          <p className="text-gray-700 leading-relaxed mb-4">
            نقدم ثلاث لغات رئيسية مع مستويات تعليمية متنوعة وفقًا للإطار الأوروبي المرجعي المشترك للغات:
          </p>

          <div className="flex justify-start gap-3 mb-4">
            <Button
              variant="outline"
              onClick={() => setSelectedLanguage("french")}
              className={`transition-all ${selectedLanguage === "french" ? "bg-blue-50 border-blue-300 text-blue-700" : ""
                }`}
            >
              الفرنسية
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedLanguage("english")}
              className={`transition-all ${selectedLanguage === "english" ? "bg-cyan-50 border-cyan-300 text-cyan-700" : ""
                }`}
            >
              الإنجليزية
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedLanguage("spanish")}
              className={`transition-all ${selectedLanguage === "spanish" ? "bg-orange-50 border-orange-500 text-amber-700" : ""
                }`}
            >
              الإسبانية
            </Button>


          </div>

          {selectedLanguage === "french" && (
            <div className="bg-blue-50 p-4 w-2/3 rounded-lg border border-blue-100">
              <h4 className="font-bold text-blue-700 mb-2">الفرنسية</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-blue-600">مبتدئ</span>
                  <div className="flex gap-2">
                    <span className="font-medium text-blue-800">A1</span>
                    <span className="font-medium text-blue-800">A2</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600">متوسط</span>
                  <div className="flex gap-2">
                    <span className="font-medium text-blue-800">B1</span>
                    <span className="font-medium text-blue-800">B2</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600">متقدم</span>
                  <div className="flex gap-2">
                    <span className="font-medium text-blue-800">C1</span>
                    <span className="font-medium text-blue-800">C2</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedLanguage === "english" && (
            <div className="bg-green-50 p-4 rounded-lg border w-2/3  border-green-100">
              <h4 className="font-bold text-green-700 mb-2">الإنجليزية</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-green-600">مبتدئ</span>
                  <div className="flex gap-2">
                    <span className="font-medium text-green-800">A1</span>
                    <span className="font-medium text-green-800">A2</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-600">متوسط</span>
                  <div className="flex gap-2">
                    <span className="font-medium text-green-800">B1</span>
                    <span className="font-medium text-green-800">B2</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-600">متقدم</span>
                  <div className="flex gap-2">
                    <span className="font-medium text-green-800">C1</span>
                    <span className="font-medium text-green-800">C2</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedLanguage === "spanish" && (
            <div className="bg-amber-50 p-4 w-2/3 rounded-lg border border-amber-100">
              <h4 className="font-bold text-amber-700 mb-2">الإسبانية</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-amber-600">مبتدئ</span>
                  <div className="flex gap-2">
                    <span className="font-medium text-amber-800">A1</span>
                    <span className="font-medium text-amber-800">A2</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amber-600">متوسط</span>
                  <div className="flex gap-2">
                    <span className="font-medium text-amber-800">B1</span>
                    <span className="font-medium text-amber-800">B2</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amber-600">متقدم</span>
                  <div className="flex gap-2">
                    <span className="font-medium text-amber-800">C1</span>
                    <span className="font-medium text-amber-800">C2</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ),
      icon: <BookOpen className="h-8 w-8" />,
      gradient: "from-blue-400 via-blue-500 to-blue-600",
      shadowColor: "shadow-blue-500/25",
      borderColor: "border-blue-600",
    },
    science: {
      title: "جميع المواد",
      description: (
        <div className="space-y-4 text-right">
          <p className="text-gray-700 leading-relaxed mb-4">
            المواد الدراسية الأساسية حسب المراحل التعليمية:
          </p>

          <div className="flex justify-start gap-3 mb-4">
            <Button
              variant="outline"
              onClick={() => setSelectedEducationLevel("high")}
              className={`transition-all ${selectedEducationLevel === "high" ? "bg-cyan-50 border-cyan-300 text-cyan-700" : ""
                }`}
            >
              الثانوي
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedEducationLevel("middle")}
              className={`transition-all ${selectedEducationLevel === "middle" ? "bg-orange-50 border-orange-300 text-orange-700" : ""
                }`}
            >
              المتوسط
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedEducationLevel("primary")}
              className={`transition-all ${selectedEducationLevel === "primary" ? "bg-blue-50 border-blue-300 text-blue-700" : ""
                }`}
            >
              الإبتدائي
            </Button>
          </div>

          {selectedEducationLevel === "primary" && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-bold text-blue-700 mb-2">المرحلة الإبتدائية</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>اللغة العربية</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>الرياضيات</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>التربية الإسلامية</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>التربية العلمية</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>التربية المدنية</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>اللغة الفرنسية</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>اللغة الإنجليزية</span>
                </div>
              </div>
            </div>
          )}

          {selectedEducationLevel === "middle" && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <h4 className="font-bold text-orange-700 mb-2">المرحلة المتوسطة</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span>اللغة العربية</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span>الرياضيات</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span>العلوم الطبيعية</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span>الفيزياء</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span>التاريخ والجغرافيا</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span>اللغة الفرنسية</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span>اللغة الإنجليزية</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span>التربية الإسلامية</span>
                </div>
              </div>
            </div>
          )}

          {selectedEducationLevel === "high" && (
            <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-100">
              <h4 className="font-bold text-cyan-700 mb-2">المرحلة الثانوية</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  <span>اللغة العربية</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  <span>الرياضيات</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  <span>العلوم الطبيعية</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  <span>الفيزياء</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  <span>الكيمياء</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  <span>التاريخ والجغرافيا</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  <span>الفلسفة</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  <span>اللغة الفرنسية</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  <span>اللغة الإنجليزية</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  <span>العلوم الإسلامية</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ),
      icon: <GraduationCap className="h-8 w-8" />,
      gradient: "from-cyan-400 via-cyan-500 to-cyan-600",
      shadowColor: "shadow-cyan-500/25",
      borderColor: "border-cyan-600",
    },
  }

  const toggleCard = () => {
    setSelectedCard(selectedCard === "languages" ? "science" : "languages")
  }

  const selectCard = (card) => {
    setSelectedCard(card)
  }

  return (
    <div className="flex mt-10   flex-col md:flex-row gap-8 p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="w-full md:w-1/2 relative">

        <div className="flex justify-center gap-4 mb-9">
          <Button
            variant="outline"
            size="icon"
            onClick={() => selectCard("science")}
            className={`rounded-full transition-all duration-300 ${selectedCard === "science"
              ? "bg-cyan-500 text-white border-cyan-500 shadow-lg"
              : "hover:bg-green-50 hover:border-cyan-300"
              }`}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => selectCard("languages")}
            className={`rounded-full transition-all duration-300 ${selectedCard === "languages"
              ? "bg-blue-500 text-white border-blue-500 shadow-lg"
              : "hover:bg-blue-50 hover:border-blue-300"
              }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative h-[350px] flex items-center justify-center">
          {/* Language Card */}
          <Card
            className={`absolute cursor-pointer transition-all duration-500 ease-out p-6 w-72 h-96 flex flex-col items-center justify-center gap-4 border-2 backdrop-blur-sm ${selectedCard === "languages"
              ? `z-20 rotate-0 translate-x-0 scale-105 ${cardData.languages.borderColor} ${cardData.languages.shadowColor} shadow-2xl`
              : "z-10 rotate-12 translate-x-8 translate-y-4 scale-95 opacity-75 hover:opacity-90 hover:scale-100 shadow-lg"
              }`}
            onClick={toggleCard}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${cardData.languages.gradient} opacity-10 rounded-lg`}
            />
            <div
              className={`rounded-full p-6 bg-gradient-to-br ${cardData.languages.gradient} text-white shadow-lg transform transition-transform duration-300 ${selectedCard === "languages" ? "scale-110" : "scale-100"
                }`}
            >
              <BookOpen className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-[#2F327D]">اللغات</h3>
            <p className="text-center text-sm text-gray-600 px-4 leading-relaxed">اكتشف عالم اللغات والتواصل</p>

            <div
              className={`w-16 h-1 bg-gradient-to-r ${cardData.languages.gradient} rounded-full mt-2 transition-all duration-300 ${selectedCard === "languages" ? "scale-100" : "scale-0"
                }`}
            />
          </Card>

          {/* Science Card */}
          <Card
            className={`absolute cursor-pointer transition-all duration-500 ease-out p-6 w-72 h-96 flex flex-col items-center justify-center gap-4 border-2 backdrop-blur-sm ${selectedCard === "science"
              ? `z-20 rotate-0 translate-x-0 scale-105 ${cardData.science.borderColor} ${cardData.science.shadowColor} shadow-2xl`
              : "z-10 -rotate-12 -translate-x-8 translate-y-4 scale-95 opacity-75 hover:opacity-90 hover:scale-100 shadow-lg"
              }`}
            onClick={toggleCard}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${cardData.science.gradient} opacity-10 rounded-lg`} />
            <div
              className={`rounded-full p-6 bg-gradient-to-br ${cardData.science.gradient} text-white shadow-lg transform transition-transform duration-300 ${selectedCard === "science" ? "scale-110" : "scale-100"
                }`}
            >
              <GraduationCap className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">العلوم</h3>
            <p className="text-center text-sm text-gray-600 px-4 leading-relaxed">استكشف أسرار العلم والاكتشاف</p>
            <div
              className={`w-16 h-1 bg-gradient-to-r ${cardData.science.gradient} rounded-full transition-all duration-300 ${selectedCard === "science" ? "scale-100" : "scale-0"
                }`}
            />
          </Card>
        </div>

        {/* Card indicators */}
        <div className="flex  justify-center gap-2 mt-10">
          <div
            className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${selectedCard === "languages"
              ? `bg-gradient-to-r ${cardData.languages.gradient} scale-125`
              : "bg-gray-300 hover:bg-gray-400"
              }`}
            onClick={() => selectCard("languages")}
          />
          <div
            className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${selectedCard === "science"
              ? `bg-gradient-to-r ${cardData.science.gradient} scale-125`
              : "bg-gray-300 hover:bg-gray-400"
              }`}
            onClick={() => selectCard("science")}
          />
        </div>
      </div>


      <div className="w-full md:w-1/2 space-y-6 text-right ">
        <div className="transform transition-all duration-500 ease-out">
          <h2
            className={`text-[2rem] font-bold mb-4 bg-gradient-to-r ${cardData[selectedCard].gradient} bg-clip-text text-transparent`}
          >
            {cardData[selectedCard].title}
          </h2>
          <div
            className={`w-full h-[2px]  bg-gradient-to-r ${cardData[selectedCard].gradient} rounded-full mb-6 mr-auto transition-all duration-500`}
          />
          <p className="text-gray-700 leading-relaxed text-lg animate-in fade-in duration-500">
            {cardData[selectedCard].description}
          </p>
        </div>


        <Button
          onClick={toggleCard}
          className={`bg-gradient-to-r ${cardData[selectedCard].gradient} hover:scale-105 transition-all duration-300 shadow-lg text-white px-8 py-3 rounded-full`}
        >
          تبديل البطاقة
        </Button>
      </div>
    </div>
  )
}

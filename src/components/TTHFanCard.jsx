import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { BookOpen, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "./ui/Card"
import { Button } from "./ui/Button"

export default function FanCard() {

  const [selectedCard, setSelectedCard] = useState("science")
  const [selectedLanguage, setSelectedLanguage] = useState("")
  const [selectedEducationLevel, setSelectedEducationLevel] = useState("high")
  
  // Dynamic data state
  const [educationMaterials, setEducationMaterials] = useState([])
  const [languageMaterials, setLanguageMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  // How many approved live sections exist per material, so the landing page
  // reflects what is actually on the platform instead of a static list.
  const [contentByMaterial, setContentByMaterial] = useState({})
  const navigate = useNavigate()

  // Arabic level names as stored in the levels table, keyed by the level_type
  // used on the homepage.
  const LEVEL_NAME = {
    primary: "التعليم الابتدائي",
    middle: "التعليم المتوسط",
    high: "التعليم الثانوي",
  }

  const openEducation = (levelType, materialName) => {
    const params = new URLSearchParams()
    if (LEVEL_NAME[levelType]) params.set("level", LEVEL_NAME[levelType])
    if (materialName) params.set("material", materialName)
    navigate(`/TTHSession?${params.toString()}`)
  }

  const openLanguage = (languageName) => {
    const params = new URLSearchParams()
    if (languageName) params.set("language", languageName)
    navigate(`/TTHLanguages?${params.toString()}`)
  }

  // Fetch materials data
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true)
        
        // Fetch education materials
        try {
          const educationResponse = await fetch('/api/homepage-materials/education')
          console.log('Education response:', educationResponse.status)
          if (educationResponse.ok) {
            const educationData = await educationResponse.json()
            console.log('Education data:', educationData)
            setEducationMaterials(educationData)
          } else {
            console.error('Education response not ok:', educationResponse.status, educationResponse.statusText)
          }
        } catch (error) {
          console.error('Error fetching education materials:', error)
        }
        
        // Fetch language materials
        try {
          const languageResponse = await fetch('/api/homepage-materials/languages')
          console.log('Language response:', languageResponse.status)
          if (languageResponse.ok) {
            const languageData = await languageResponse.json()
            console.log('Language data:', languageData)
            setLanguageMaterials(languageData)
          } else {
            console.error('Language response not ok:', languageResponse.status, languageResponse.statusText)
          }
        } catch (error) {
          console.error('Error fetching language materials:', error)
        }
      } catch (error) {
        console.error('Error fetching materials:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMaterials()

    // Count approved live sections per material name.
    ;(async () => {
      try {
        const res = await fetch('/api/live-sections/approved')
        if (!res.ok) return
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data.liveSections || data.sections || [])
        const counts = {}
        list.forEach(s => { if (s.material_name) counts[s.material_name] = (counts[s.material_name] || 0) + 1 })
        setContentByMaterial(counts)
      } catch (e) {
        // Availability is a nice-to-have; the list still renders without it.
      }
    })()
  }, [])

  // Helper functions to get filtered materials
  const getEducationMaterialsByLevel = (levelType) => {
    return educationMaterials.filter(material => material.level_type === levelType)
  }

  const getLanguageMaterialsByLevel = (levelType) => {
    return languageMaterials.filter(material => material.level_type === levelType && material.name === selectedLanguage)
  }

  // Get unique languages from the database
  const getUniqueLanguages = () => {
    const uniqueLanguages = [...new Set(languageMaterials.map(material => material.name))]
    return uniqueLanguages
  }

  // Set initial selected language when data loads
  useEffect(() => {
    console.log('Language materials changed:', languageMaterials)
    console.log('Selected language:', selectedLanguage)
    if (languageMaterials.length > 0 && !selectedLanguage) {
      const uniqueLanguages = getUniqueLanguages()
      console.log('Unique languages:', uniqueLanguages)
      if (uniqueLanguages.length > 0) {
        setSelectedLanguage(uniqueLanguages[0])
      }
    }
  }, [languageMaterials, selectedLanguage])

  const cardData = {
    languages: {
      title: "اللغات",
      description: (
        <div className="space-y-4 text-right">
          <div className="text-gray-700 leading-relaxed mb-4">
            نقدم ثلاث لغات رئيسية مع مستويات تعليمية متنوعة وفقًا للإطار الأوروبي المرجعي المشترك للغات:
          </div>

          <div className="flex flex-wrap justify-start gap-2 sm:gap-3 mb-4">
            {loading ? (
              <div className="text-gray-500">جاري التحميل...</div>
            ) : getUniqueLanguages().length > 0 ? (
              getUniqueLanguages().map((language, index) => {
                const colors = [
                  "bg-blue-50 border-blue-300 text-blue-700",
                  "bg-cyan-50 border-cyan-300 text-cyan-700", 
                  "bg-orange-50 border-orange-300 text-orange-700",
                  "bg-green-50 border-green-300 text-green-700",
                  "bg-blue-50 border-blue-300 text-[#61a1ff]"
                ]
                const colorClass = colors[index % colors.length]
                
                return (
                  <Button
                    key={language}
                    variant="outline"
                    onClick={() => setSelectedLanguage(language)}
                    className={`text-xs sm:text-sm transition-all ${selectedLanguage === language ? colorClass : ""}`}
                  >
                    {language}
                  </Button>
                )
              })
            ) : (
              <div className="text-gray-500">لا توجد لغات متاحة</div>
            )}
          </div>

          {selectedLanguage && (
            <div className="bg-blue-50 p-3 sm:p-4 w-full sm:w-2/3 rounded-lg border border-blue-100">
              <h4 className="font-bold text-blue-700 mb-2 text-sm sm:text-base">{selectedLanguage}</h4>
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center text-gray-500">جاري التحميل...</div>
                ) : (
                  <>
                    {getLanguageMaterialsByLevel("beginner").map((material, index) => (
                      <button key={material.id || index} type="button" onClick={() => openLanguage(material.name)} className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 text-right hover:underline">
                        <span className="text-[#194cbf] text-xs sm:text-sm">{material.name}</span>
                        <div className="flex gap-1 sm:gap-2">
                          <span className="font-medium text-blue-800 text-xs sm:text-sm">A1</span>
                          <span className="font-medium text-blue-800 text-xs sm:text-sm">A2</span>
                        </div>
                      </button>
                    ))}
                    {getLanguageMaterialsByLevel("intermediate").map((material, index) => (
                      <button key={material.id || index} type="button" onClick={() => openLanguage(material.name)} className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 text-right hover:underline">
                        <span className="text-[#194cbf] text-xs sm:text-sm">{material.name}</span>
                        <div className="flex gap-1 sm:gap-2">
                          <span className="font-medium text-blue-800 text-xs sm:text-sm">B1</span>
                          <span className="font-medium text-blue-800 text-xs sm:text-sm">B2</span>
                        </div>
                      </button>
                    ))}
                    {getLanguageMaterialsByLevel("advanced").map((material, index) => (
                      <button key={material.id || index} type="button" onClick={() => openLanguage(material.name)} className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 text-right hover:underline">
                        <span className="text-[#194cbf] text-xs sm:text-sm">{material.name}</span>
                        <div className="flex gap-1 sm:gap-2">
                          <span className="font-medium text-blue-800 text-xs sm:text-sm">C1</span>
                          <span className="font-medium text-blue-800 text-xs sm:text-sm">C2</span>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}


        </div>
      ),
      icon: <BookOpen className="h-8 w-8" />,
      gradient: "from-blue-400 via-blue-500 to-blue-600",
      shadowColor: "shadow-blue-500/25",
      borderColor: "border-[#194cbf]",
    },
    science: {
      title: "جميع المواد",
      description: (
        <div className="space-y-4 text-right">
          <div className="text-gray-700 leading-relaxed mb-4">
            المواد الدراسية الأساسية حسب المراحل التعليمية:
          </div>

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
                {loading ? (
                  <div className="col-span-2 text-center text-gray-500">جاري التحميل...</div>
                ) : getEducationMaterialsByLevel("primary").length > 0 ? (
                  getEducationMaterialsByLevel("primary").map((material, index) => (
                    <button
                      key={material.id || index}
                      type="button"
                      onClick={() => openEducation("primary", material.name)}
                      className="flex items-center gap-2 text-right hover:text-blue-700 hover:underline transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>{material.name}</span>
                      {contentByMaterial[material.name] > 0 && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 rounded-full px-1.5">
                          {contentByMaterial[material.name]}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-gray-500">لا توجد مواد متاحة</div>
                )}
              </div>
            </div>
          )}

          {selectedEducationLevel === "middle" && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <h4 className="font-bold text-orange-700 mb-2">المرحلة المتوسطة</h4>
              <div className="grid grid-cols-2 gap-2">
                {loading ? (
                  <div className="col-span-2 text-center text-gray-500">جاري التحميل...</div>
                ) : getEducationMaterialsByLevel("middle").length > 0 ? (
                  getEducationMaterialsByLevel("middle").map((material, index) => (
                    <button
                      key={material.id || index}
                      type="button"
                      onClick={() => openEducation("middle", material.name)}
                      className="flex items-center gap-2 text-right hover:text-orange-700 hover:underline transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span>{material.name}</span>
                      {contentByMaterial[material.name] > 0 && (
                        <span className="text-[10px] font-bold text-orange-700 bg-orange-100 rounded-full px-1.5">
                          {contentByMaterial[material.name]}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-gray-500">لا توجد مواد متاحة</div>
                )}
              </div>
            </div>
          )}

          {selectedEducationLevel === "high" && (
            <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-100">
              <h4 className="font-bold text-cyan-700 mb-2">المرحلة الثانوية</h4>
              <div className="grid grid-cols-2 gap-2">
                {loading ? (
                  <div className="col-span-2 text-center text-gray-500">جاري التحميل...</div>
                ) : getEducationMaterialsByLevel("high").length > 0 ? (
                  getEducationMaterialsByLevel("high").map((material, index) => (
                    <button
                      key={material.id || index}
                      type="button"
                      onClick={() => openEducation("high", material.name)}
                      className="flex items-center gap-2 text-right hover:text-cyan-700 hover:underline transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                      <span>{material.name}</span>
                      {contentByMaterial[material.name] > 0 && (
                        <span className="text-[10px] font-bold text-cyan-700 bg-cyan-100 rounded-full px-1.5">
                          {contentByMaterial[material.name]}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-gray-500">لا توجد مواد متاحة</div>
                )}
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
    <div className="mt-10 max-w-5xl mx-auto px-6" dir="rtl">
      <div className='w-full py-12 md:py-16 lg:py-20 relative z-20'>
        <h1 className='text-[#2F327D] text-2xl md:text-3xl lg:text-4xl text-center font-semibold px-4'>
          ما يمكنك <span className='text-cyan-400'>دراسته </span>هنا
        </h1>
      </div>

    <div className="flex flex-col md:flex-row gap-8 py-2">
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
          <div className="text-gray-700 leading-relaxed text-lg animate-in fade-in duration-500">
            {cardData[selectedCard].description}
          </div>
        </div>


        <Button
          onClick={toggleCard}
          className={`bg-gradient-to-r ${cardData[selectedCard].gradient} hover:scale-105 transition-all duration-300 shadow-lg text-white px-8 py-3 rounded-full`}
        >
          تبديل البطاقة
        </Button>
      </div>
    </div>
    </div>
  )
}

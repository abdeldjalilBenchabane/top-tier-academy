import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Play, CheckCircle, Clock } from "lucide-react"

const CoursesList = () => {
  const courses = [
    {
      id: 1,
      title: "Mathématiques - Terminale S",
      description: "Fonctions, limites, dérivées, intégrales et probabilités pour préparer le baccalauréat scientifique.",
      progress: 85,
      status: "en_cours",
      duration: "Année scolaire",
      modules: 12,
      completedModules: 10,
      nextLesson: "Intégrales par parties",
      difficulty: "Avancé",
      thumbnail: "/placeholder.svg"
    },
    {
      id: 2,
      title: "Physique-Chimie - Terminale S",
      description: "Mécanique, thermodynamique, électricité et chimie organique niveau terminale.",
      progress: 60,
      status: "en_cours",
      duration: "Année scolaire",
      modules: 10,
      completedModules: 6,
      nextLesson: "Les ondes mécaniques",
      difficulty: "Avancé",
      thumbnail: "/placeholder.svg"
    },
    {
      id: 3,
      title: "Philosophie - Terminale",
      description: "Introduction à la philosophie : conscience, liberté, vérité et justice.",
      progress: 40,
      status: "en_cours",
      duration: "Année scolaire",
      modules: 8,
      completedModules: 3,
      nextLesson: "Le désir et l'existence",
      difficulty: "Intermédiaire",
      thumbnail: "/placeholder.svg"
    },
    {
      id: 4,
      title: "Histoire-Géographie - Terminale S",
      description: "Le monde contemporain : géopolitique, mondialisation et enjeux du XXIe siècle.",
      progress: 70,
      status: "en_cours",
      duration: "Année scolaire",
      modules: 9,
      completedModules: 6,
      nextLesson: "La Chine et le monde",
      difficulty: "Intermédiaire",
      thumbnail: "/placeholder.svg"
    },
    {
      id: 5,
      title: "Sciences de la Vie et de la Terre",
      description: "Génétique, évolution, géologie et écosystèmes niveau terminale scientifique.",
      progress: 55,
      status: "en_cours",
      duration: "Année scolaire",
      modules: 8,
      completedModules: 4,
      nextLesson: "La génétique humaine",
      difficulty: "Intermédiaire",
      thumbnail: "/placeholder.svg"
    },
    {
      id: 6,
      title: "Anglais LV1 - Terminale",
      description: "Perfectionnement de l'anglais : expression écrite et orale, littérature anglophone.",
      progress: 80,
      status: "presque_fini",
      duration: "Année scolaire",
      modules: 6,
      completedModules: 5,
      nextLesson: "Shakespeare et son époque",
      difficulty: "Intermédiaire",
      thumbnail: "/placeholder.svg"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_cours": return "bg-blue-500"
      case "presque_fini": return "bg-green-500"
      case "pas_commence": return "bg-gray-400"
      default: return "bg-blue-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "en_cours": return "En cours"
      case "presque_fini": return "Presque terminé"
      case "pas_commence": return "Pas commencé"
      default: return "En cours"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Débutant": return "bg-green-100 text-green-800"
      case "Intermédiaire": return "bg-yellow-100 text-yellow-800"
      case "Avancé": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen py-10 px-2 md:px-8 bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-blue-900 tracking-tight">Mes Cours</h2>
          <div className="flex space-x-2">
            <Badge variant="outline" className="bg-cyan-100 text-cyan-700 border-cyan-300 font-semibold px-3 py-1">
              {courses.filter(c => c.status === "en_cours").length} en cours
            </Badge>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 font-semibold px-3 py-1">
              {courses.filter(c => c.progress === 100).length} terminés
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {courses.map((course) => (
            <Card key={course.id} className="bg-white rounded-2xl shadow-xl border-0 hover:scale-[1.025] hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-blue-900 mb-2">{course.title}</CardTitle>
                    <p className="text-base text-gray-600 mb-4">
                      {course.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className={getStatusColor(course.status) + " text-white font-semibold px-2 py-1"}>
                        {getStatusText(course.status)}
                      </Badge>
                      <Badge variant="outline" className={getDifficultyColor(course.difficulty) + " font-semibold px-2 py-1"}>
                        {course.difficulty}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-5">
                  {/* Progression */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-blue-900">Progression</span>
                      <span className="text-sm font-bold text-cyan-600">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-4 rounded-full bg-cyan-100" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{course.completedModules}/{course.modules} modules</span>
                      <span>{course.duration}</span>
                    </div>
                  </div>

                  {/* Prochaine leçon */}
                  {course.status !== "pas_commence" && (
                    <div className="bg-cyan-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <BookOpen className="h-4 w-4 text-cyan-500" />
                        <span className="text-sm font-semibold text-blue-900">Prochaine leçon</span>
                      </div>
                      <p className="text-sm text-cyan-700 font-medium">{course.nextLesson}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    {course.status === "pas_commence" ? (
                      <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow">
                        <Play className="h-4 w-4 mr-2" />
                        Commencer
                      </Button>
                    ) : (
                      <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow">
                        <Play className="h-4 w-4 mr-2" />
                        Continuer
                      </Button>
                    )}
                    <Button variant="outline" className="flex-1 border-cyan-200 text-cyan-700 font-bold rounded-lg">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Détails
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CoursesList

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Clock, Video, FileText, Users } from "lucide-react"
import { useState } from "react"

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())

  const events = [
    {
      id: 1,
      title: "Cours en direct - React Hooks",
      type: "cours",
      date: "2024-06-24",
      time: "14:00 - 15:30",
      instructor: "Prof. Martin",
      participants: 25,
      status: "à_venir"
    },
    {
      id: 2,
      title: "Examen - JavaScript ES6+",
      type: "examen",
      date: "2024-06-25",
      time: "10:00 - 12:00",
      instructor: "Prof. Dubois",
      duration: "2h",
      status: "à_venir"
    },
    {
      id: 3,
      title: "Rendu Projet - Application React",
      type: "devoir",
      date: "2024-06-26",
      time: "23:59",
      instructor: "Prof. Martin",
      status: "urgent"
    },
    {
      id: 4,
      title: "Session de Questions/Réponses",
      type: "support",
      date: "2024-06-27",
      time: "16:00 - 17:00",
      instructor: "Équipe Support",
      participants: 15,
      status: "à_venir"
    },
    {
      id: 5,
      title: "Workshop - Design Thinking",
      type: "workshop",
      date: "2024-06-28",
      time: "09:00 - 12:00",
      instructor: "Prof. Leroy",
      participants: 20,
      status: "à_venir"
    }
  ]

  const getEventIcon = (type: string) => {
    switch (type) {
      case "cours": return <Video className="h-4 w-4" />
      case "examen": return <FileText className="h-4 w-4" />
      case "devoir": return <FileText className="h-4 w-4" />
      case "support": return <Users className="h-4 w-4" />
      case "workshop": return <Users className="h-4 w-4" />
      default: return <CalendarIcon className="h-4 w-4" />
    }
  }

  const getEventColor = (type: string, status: string) => {
    if (status === "urgent") return "bg-red-100 border-red-200 text-red-800"
    
    switch (type) {
      case "cours": return "bg-blue-100 border-blue-200 text-blue-800"
      case "examen": return "bg-orange-100 border-orange-200 text-orange-800"
      case "devoir": return "bg-purple-100 border-purple-200 text-purple-800"
      case "support": return "bg-green-100 border-green-200 text-green-800"
      case "workshop": return "bg-indigo-100 border-indigo-200 text-indigo-800"
      default: return "bg-gray-100 border-gray-200 text-gray-800"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "cours": return "Cours en direct"
      case "examen": return "Examen"
      case "devoir": return "Devoir à rendre"
      case "support": return "Support"
      case "workshop": return "Workshop"
      default: return type
    }
  }

  // Grouper les événements par date
  const groupedEvents = events.reduce((acc, event) => {
    const date = event.date
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {} as Record<string, typeof events>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Planning & Calendrier</h2>
        <Button variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100">
          <CalendarIcon className="h-4 w-4 mr-2" />
          Synchroniser avec Google Calendar
        </Button>
      </div>

      {/* Vue d'ensemble cette semaine */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <CalendarIcon className="h-5 w-5" />
            <span>Cette Semaine</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">5</div>
              <div className="text-sm text-muted-foreground">Événements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">2</div>
              <div className="text-sm text-muted-foreground">Examens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">1</div>
              <div className="text-sm text-muted-foreground">Devoir urgent</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des événements */}
      <div className="space-y-4">
        {Object.entries(groupedEvents).map(([date, dayEvents]) => (
          <Card key={date}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {new Date(date).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dayEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className={`p-4 rounded-lg border-l-4 ${getEventColor(event.type, event.status)} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getEventIcon(event.type)}
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(event.type)}
                          </Badge>
                          {event.status === "urgent" && (
                            <Badge className="bg-red-500 text-xs">Urgent</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{event.time}</span>
                          </div>
                          <span>• {event.instructor}</span>
                          {event.participants && (
                            <span>• {event.participants} participants</span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        {event.type === "cours" && (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            Rejoindre
                          </Button>
                        )}
                        {event.type === "devoir" && (
                          <Button size="sm" variant="outline">
                            Soumettre
                          </Button>
                        )}
                        {event.type === "examen" && (
                          <Button size="sm" variant="outline">
                            Préparer
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Calendar
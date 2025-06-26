
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, MessageSquare, AlertTriangle, Trophy, BookOpen, Clock } from "lucide-react"
import { useState } from "react"

const Notifications = () => {
  const [filter, setFilter] = useState("all")

  const notifications = [
    {
      id: 1,
      type: "message",
      title: "Nouveau message de Prof. Martin",
      message: "Votre projet React a été évalué. Excellent travail ! Consultez vos notes.",
      time: "Il y a 5 minutes",
      read: false,
      priority: "normal",
      course: "Développement React"
    },
    {
      id: 2,
      type: "alert",
      title: "Devoir à rendre demain",
      message: "N'oubliez pas de soumettre votre projet d'application React avant 23h59 demain.",
      time: "Il y a 1 heure",
      read: false,
      priority: "urgent",
      course: "Développement React"
    },
    {
      id: 3,
      type: "achievement",
      title: "Nouveau certificat disponible !",
      message: "Félicitations ! Vous avez terminé le cours JavaScript ES6+. Téléchargez votre certificat.",
      time: "Il y a 2 heures",
      read: false,
      priority: "normal",
      course: "JavaScript ES6+"
    },
    {
      id: 4,
      type: "course",
      title: "Nouveau cours disponible",
      message: "Le cours 'Vue.js pour Débutants' est maintenant disponible dans votre parcours.",
      time: "Il y a 3 heures",
      read: true,
      priority: "normal",
      course: "Nouveau"
    },
    {
      id: 5,
      type: "reminder",
      title: "Cours en direct dans 30 minutes",
      message: "Le cours 'React Hooks Avancés' commence à 14h00. Préparez vos questions !",
      time: "Il y a 10 minutes",
      read: false,
      priority: "urgent",
      course: "Développement React"
    },
    {
      id: 6,
      type: "message",
      title: "Message de l'équipe pédagogique",
      message: "Nouvelle session de questions/réponses ajoutée à votre planning pour vendredi.",
      time: "Hier",
      read: true,
      priority: "normal",
      course: "Support"
    }
  ]

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message": return <MessageSquare className="h-4 w-4" />
      case "alert": return <AlertTriangle className="h-4 w-4" />
      case "achievement": return <Trophy className="h-4 w-4" />
      case "course": return <BookOpen className="h-4 w-4" />
      case "reminder": return <Clock className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === "urgent") return "border-l-red-500 bg-red-50"
    
    switch (type) {
      case "message": return "border-l-blue-500 bg-blue-50"
      case "alert": return "border-l-orange-500 bg-orange-50"
      case "achievement": return "border-l-green-500 bg-green-50"
      case "course": return "border-l-purple-500 bg-purple-50"
      case "reminder": return "border-l-yellow-500 bg-yellow-50"
      default: return "border-l-gray-500 bg-gray-50"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "message": return "Message"
      case "alert": return "Alerte"
      case "achievement": return "Réussite"
      case "course": return "Cours"
      case "reminder": return "Rappel"
      default: return type
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === "all") return true
    if (filter === "unread") return !notification.read
    if (filter === "urgent") return notification.priority === "urgent"
    return notification.type === filter
  })

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <Badge className="bg-red-500">
              {unreadCount} non lues
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm">
          Tout marquer comme lu
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={filter === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("all")}
              className={filter === "all" ? "bg-blue-600" : ""}
            >
              Toutes ({notifications.length})
            </Button>
            <Button 
              variant={filter === "unread" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("unread")}
              className={filter === "unread" ? "bg-blue-600" : ""}
            >
              Non lues ({unreadCount})
            </Button>
            <Button 
              variant={filter === "urgent" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("urgent")}
              className={filter === "urgent" ? "bg-blue-600" : ""}
            >
              Urgentes ({notifications.filter(n => n.priority === "urgent").length})
            </Button>
            <Button 
              variant={filter === "message" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("message")}
              className={filter === "message" ? "bg-blue-600" : ""}
            >
              Messages
            </Button>
            <Button 
              variant={filter === "achievement" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("achievement")}
              className={filter === "achievement" ? "bg-blue-600" : ""}
            >
              Réussites
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des notifications */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => (
          <Card 
            key={notification.id} 
            className={`border-l-4 ${getNotificationColor(notification.type, notification.priority)} 
              ${!notification.read ? 'shadow-md' : 'opacity-75'} 
              hover:shadow-lg transition-all cursor-pointer`}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${notification.priority === "urgent" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(notification.type)}
                      </Badge>
                      {notification.priority === "urgent" && (
                        <Badge className="bg-red-500 text-xs">Urgent</Badge>
                      )}
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                  </div>
                  <h3 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-600'} mb-1`}>
                    {notification.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs bg-gray-50">
                      {notification.course}
                    </Badge>
                    <div className="flex space-x-2">
                      {notification.type === "achievement" && (
                        <Button size="sm" variant="outline" className="text-xs">
                          Voir certificat
                        </Button>
                      )}
                      {notification.type === "alert" && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                          Action requise
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune notification</h3>
            <p className="text-muted-foreground">
              {filter === "all" 
                ? "Vous n'avez aucune notification pour le moment."
                : `Aucune notification correspondant au filtre "${filter}".`
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Notifications
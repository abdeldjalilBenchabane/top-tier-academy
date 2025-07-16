
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { MessageSquare, HelpCircle, BookOpen, Video, Phone, Mail, Search, ChevronDown } from "lucide-react"
import { useState } from "react"

const Support = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const faqData = [
    {
      id: 1,
      category: "compte",
      question: "Comment modifier mon mot de passe ?",
      answer: "Allez dans Paramètres > Sécurité > Changer le mot de passe. Vous devrez saisir votre mot de passe actuel puis le nouveau. Un email de confirmation vous sera envoyé."
    },
    {
      id: 2,
      category: "cours",
      question: "Comment télécharger mes certificats ?",
      answer: "Rendez-vous dans la section 'Mes Certificats' de votre dashboard. Cliquez sur le bouton 'Télécharger PDF' à côté du certificat souhaité. Le fichier sera téléchargé automatiquement."
    },
    {
      id: 3,
      category: "technique",
      question: "Les vidéos ne se chargent pas correctement",
      answer: "Vérifiez votre connexion internet. Si le problème persiste, essayez de vider le cache de votre navigateur ou utilisez un autre navigateur. Vous pouvez aussi réduire la qualité vidéo dans les paramètres du lecteur."
    },
    {
      id: 4,
      category: "cours",
      question: "Comment rattraper un cours manqué en direct ?",
      answer: "Tous les cours en direct sont automatiquement enregistrés et disponibles dans votre espace cours sous l'onglet 'Replays' dans les 24h suivant la diffusion."
    },
    {
      id: 5,
      category: "compte",
      question: "Comment désactiver les notifications ?",
      answer: "Allez dans Paramètres > Notifications. Vous pouvez désactiver sélectivement les différents types de notifications selon vos préférences."
    },
    {
      id: 6,
      category: "technique",
      question: "L'application mobile ne synchronise pas mes progrès",
      answer: "Assurez-vous d'être connecté avec le même compte sur tous vos appareils. La synchronisation peut prendre quelques minutes. Si le problème persiste, déconnectez-vous et reconnectez-vous."
    }
  ]

  const supportChannels = [
    {
      icon: MessageSquare,
      title: "Chat en direct",
      description: "Discutez avec notre équipe support",
      status: "En ligne",
      action: "Démarrer une conversation",
      available: true
    },
    {
      icon: Mail,
      title: "Email",
      description: "support@plateforme-elearning.com",
      status: "Réponse sous 24h",
      action: "Envoyer un email",
      available: true
    },
    {
      icon: Phone,
      title: "Téléphone",
      description: "+33 1 23 45 67 89",
      status: "Lun-Ven 9h-18h",
      action: "Appeler maintenant",
      available: false
    },
    {
      icon: Video,
      title: "Visioconférence",
      description: "Assistance personnalisée",
      status: "Sur rendez-vous",
      action: "Prendre RDV",
      available: true
    }
  ]

  const quickLinks = [
    {
      icon: BookOpen,
      title: "Guide de démarrage",
      description: "Découvrez comment utiliser la plateforme",
      link: "#"
    },
    {
      icon: Video,
      title: "Tutoriels vidéo",
      description: "Apprenez en regardant nos tutoriels",
      link: "#"
    },
    {
      icon: HelpCircle,
      title: "Centre d'aide",
      description: "Documentation complète",
      link: "#"
    }
  ]

  const categories = [
    { id: "all", label: "Toutes", count: faqData.length },
    { id: "compte", label: "Compte", count: faqData.filter(f => f.category === "compte").length },
    { id: "cours", label: "Cours", count: faqData.filter(f => f.category === "cours").length },
    { id: "technique", label: "Technique", count: faqData.filter(f => f.category === "technique").length }
  ]

  const filteredFaq = faqData.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Support & Aide</h2>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <MessageSquare className="h-4 w-4 mr-2" />
          Contact rapide
        </Button>
      </div>

      {/* Canaux de support */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {supportChannels.map((channel, index) => (
          <Card key={index} className={`hover:shadow-lg transition-all duration-300 ${!channel.available ? 'opacity-75' : ''}`}>
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`p-3 rounded-full ${channel.available ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                  <channel.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{channel.title}</h3>
                  <p className="text-sm text-muted-foreground mb-1">{channel.description}</p>
                  <Badge variant={channel.available ? "default" : "secondary"} className="text-xs">
                    {channel.status}
                  </Badge>
                </div>
                <Button 
                  size="sm" 
                  variant={channel.available ? "default" : "outline"}
                  disabled={!channel.available}
                  className={channel.available ? "bg-blue-600 hover:bg-blue-700 w-full" : "w-full"}
                >
                  {channel.action}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQ */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5 text-purple-500" />
                <span>Foire Aux Questions (FAQ)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans la FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtres par catégorie */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={selectedCategory === category.id ? "bg-blue-600" : ""}
                  >
                    {category.label} ({category.count})
                  </Button>
                ))}
              </div>

              {/* Questions et réponses */}
              <Accordion type="single" collapsible className="w-full">
                {filteredFaq.map((item) => (
                  <AccordionItem key={item.id} value={`item-${item.id}`}>
                    <AccordionTrigger className="text-left hover:text-blue-600">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {filteredFaq.length === 0 && (
                <div className="text-center py-8">
                  <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun résultat trouvé</h3>
                  <p className="text-muted-foreground">
                    Essayez de modifier votre recherche ou contactez notre support.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar droite */}
        <div className="space-y-6">
          {/* Liens rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Liens Utiles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickLinks.map((link, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                    <link.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{link.title}</h4>
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Conseiller pédagogique */}
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-800">Conseiller Pédagogique</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-purple-700">
                  Besoin d'aide pour votre parcours d'apprentissage ? Nos conseillers sont là pour vous accompagner.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-purple-700">Julie Martin - En ligne</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-purple-700">Marc Dubois - Occupé</span>
                  </div>
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contacter un conseiller
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statut du service */}
          <Card>
            <CardHeader>
              <CardTitle>Statut du Service</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Plateforme</span>
                  <Badge className="bg-green-100 text-green-800">Opérationnel</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Vidéos</span>
                  <Badge className="bg-green-100 text-green-800">Opérationnel</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Chat support</span>
                  <Badge className="bg-green-100 text-green-800">Opérationnel</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">API</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-3">
                Voir la page de statut
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Support
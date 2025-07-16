
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Phone, MapPin, Shield, Eye, Bell, Globe, Camera } from "lucide-react"
import { useState } from "react"

const ProfileSettings = () => {
  const [profile, setProfile] = useState({
    firstName: "Marie",
    lastName: "Dubois",
    email: "marie.dubois@email.com",
    phone: "+33 6 12 34 56 78",
    location: "Paris, France",
    bio: "Étudiante passionnée par le développement web et le design UI/UX.",
    avatar: "/placeholder.svg"
  })

  const [preferences, setPreferences] = useState({
    language: "fr",
    theme: "light",
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    courseReminders: true,
    weeklyProgress: true
  })

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    passwordLastChanged: "2024-05-15",
    activeSessions: 2
  })

  const handleProfileUpdate = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handlePreferenceToggle = (field: string) => {
    setPreferences(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Paramètres du Profil</h2>
        <Button className="bg-blue-600 hover:bg-blue-700">
          Sauvegarder les modifications
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations personnelles */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-500" />
                <span>Informations Personnelles</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Photo de profil */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar} alt={profile.firstName} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                    {profile.firstName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Changer la photo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG ou GIF. Taille max 2MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => handleProfileUpdate("firstName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => handleProfileUpdate("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleProfileUpdate("email", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => handleProfileUpdate("phone", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="location">Localisation</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => handleProfileUpdate("location", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="bio">Biographie</Label>
                <textarea
                  id="bio"
                  className="w-full p-3 border rounded-md resize-none"
                  rows={3}
                  value={profile.bio}
                  onChange={(e) => handleProfileUpdate("bio", e.target.value)}
                  placeholder="Parlez-nous de vous..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Préférences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-green-500" />
                <span>Préférences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">Langue</Label>
                  <select 
                    title="a"
                    id="language"
                    className="w-full p-2 border rounded-md"
                    value={preferences.language}
                    onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="theme">Thème</Label>
                  <select 
                    title="b"
                    id="theme"
                    className="w-full p-2 border rounded-md"
                    value={preferences.theme}
                    onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                  >
                    <option value="light">Clair</option>
                    <option value="dark">Sombre</option>
                    <option value="auto">Automatique</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-yellow-500" />
                <span>Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Notifications par email</Label>
                    <p className="text-xs text-muted-foreground">Recevez des mises à jour par email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={preferences.emailNotifications}
                    onCheckedChange={() => handlePreferenceToggle("emailNotifications")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pushNotifications">Notifications push</Label>
                    <p className="text-xs text-muted-foreground">Notifications sur votre appareil</p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={preferences.pushNotifications}
                    onCheckedChange={() => handlePreferenceToggle("pushNotifications")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketingEmails">Emails marketing</Label>
                    <p className="text-xs text-muted-foreground">Nouveautés et offres spéciales</p>
                  </div>
                  <Switch
                    id="marketingEmails"
                    checked={preferences.marketingEmails}
                    onCheckedChange={() => handlePreferenceToggle("marketingEmails")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="courseReminders">Rappels de cours</Label>
                    <p className="text-xs text-muted-foreground">Rappels pour vos cours planifiés</p>
                  </div>
                  <Switch
                    id="courseReminders"
                    checked={preferences.courseReminders}
                    onCheckedChange={() => handlePreferenceToggle("courseReminders")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="weeklyProgress">Rapport hebdomadaire</Label>
                    <p className="text-xs text-muted-foreground">Résumé de vos progrès chaque semaine</p>
                  </div>
                  <Switch
                    id="weeklyProgress"
                    checked={preferences.weeklyProgress}
                    onCheckedChange={() => handlePreferenceToggle("weeklyProgress")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar droite */}
        <div className="space-y-6">
          {/* Sécurité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-red-500" />
                <span>Sécurité</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Authentification 2FA</Label>
                    <p className="text-xs text-muted-foreground">
                      {security.twoFactorEnabled ? "Activée" : "Désactivée"}
                    </p>
                  </div>
                  <Switch
                    checked={security.twoFactorEnabled}
                    onCheckedChange={(checked) => 
                      setSecurity(prev => ({ ...prev, twoFactorEnabled: checked }))
                    }
                  />
                </div>

                <div className="border-t pt-3">
                  <Label>Mot de passe</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Dernière modification: {new Date(security.passwordLastChanged).toLocaleDateString('fr-FR')}
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Changer le mot de passe
                  </Button>
                </div>

                <div className="border-t pt-3">
                  <Label>Sessions actives</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    {security.activeSessions} appareils connectés
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Voir l'historique
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques du profil */}
          <Card>
            <CardHeader>
              <CardTitle>Votre Profil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Membre depuis</span>
                  <span className="text-sm font-medium">Mars 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cours terminés</span>
                  <span className="text-sm font-medium">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Certificats obtenus</span>
                  <span className="text-sm font-medium">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Temps d'étude total</span>
                  <span className="text-sm font-medium">45h</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full mt-4">
                Voir le profil public
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ProfileSettings
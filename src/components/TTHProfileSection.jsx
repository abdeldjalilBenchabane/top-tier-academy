import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/Badge';
import { 
  User, 
  Settings, 
  LogOut, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Award,
  Shield,
  Bell,
  Lock,
  Eye,
  Languages
} from 'lucide-react';

const ProfileSection = () => {
  const [editMode, setEditMode] = useState(false);

  const studentProfile = {
    name: 'أحمد محمد علي',
    email: 'ahmed.mohamed@example.com',
    phone: '+966 50 123 4567',
    location: 'الرياض، السعودية',
    joinDate: 'سبتمبر 2023',
    level: 'متوسط',
    totalCourses: 12,
    completedCourses: 8,
    certificates: 6,
    studyHours: 145,
    streak: 23
  };

  const achievements = [
    { id: 1, title: 'أول دورة مكتملة', icon: Award, color: 'text-yellow-600', earned: true },
    { id: 2, title: 'مبرمج نشط', icon: Shield, color: 'text-blue-600', earned: true },
    { id: 3, title: 'طالب مثابر', icon: Calendar, color: 'text-green-600', earned: false }
  ];

  const settingsOptions = [
    {
      category: 'الحساب',
      items: [
        { id: 'profile', label: 'تعديل الملف الشخصي', icon: User },
        { id: 'password', label: 'تغيير كلمة المرور', icon: Lock },
        { id: 'privacy', label: 'الخصوصية والأمان', icon: Eye }
      ]
    },
    {
      category: 'التفضيلات',
      items: [
        { id: 'notifications', label: 'الإشعارات', icon: Bell },
        { id: 'language', label: 'اللغة', icon: Languages }
      ]
    }
  ];

  const handleLogout = () => {
    console.log('تسجيل الخروج...');
    alert('تم تسجيل الخروج بنجاح');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="bg-education-blue text-white text-2xl font-bold">
                  أم
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={() => setEditMode(!editMode)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 text-center md:text-right space-y-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{studentProfile.name}</h2>
                <Badge className="bg-education-blue/10 text-education-blue hover:bg-education-blue/20">
                  {studentProfile.level}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{studentProfile.email}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{studentProfile.phone}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{studentProfile.location}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>انضم في {studentProfile.joinDate}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(!editMode)}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                الإعدادات
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>إحصائياتي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{studentProfile.totalCourses}</div>
                  <div className="text-sm text-gray-600">إجمالي الدورات</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{studentProfile.completedCourses}</div>
                  <div className="text-sm text-gray-600">دورات مكتملة</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{studentProfile.certificates}</div>
                  <div className="text-sm text-gray-600">شهادات</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{studentProfile.studyHours}</div>
                  <div className="text-sm text-gray-600">ساعات دراسة</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>الإنجازات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      achievement.earned
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <achievement.icon className={`w-8 h-8 mx-auto mb-2 ${achievement.color}`} />
                    <div className="text-center">
                      <div className="font-medium text-sm">{achievement.title}</div>
                      {achievement.earned && (
                        <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-100">
                          مكتسب
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                الإعدادات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {settingsOptions.map((category) => (
                <div key={category.category}>
                  <h4 className="font-medium text-gray-900 mb-2">{category.category}</h4>
                  <div className="space-y-1">
                    {category.items.map((item) => (
                      <Button
                        key={item.id}
                        variant="ghost"
                        className="w-full justify-start text-right h-auto p-3 hover:bg-gray-50"
                      >
                        <item.icon className="w-4 h-4 ml-2" />
                        <span className="text-sm">{item.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  className="w-full justify-center gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>إحصائيات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">أيام متتالية</span>
                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                  {studentProfile.streak} يوم
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">معدل الإكمال</span>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  {Math.round((studentProfile.completedCourses / studentProfile.totalCourses) * 100)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">الساعات هذا الشهر</span>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  24 ساعة
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
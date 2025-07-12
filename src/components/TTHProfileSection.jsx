import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
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
  Languages,
  Loader2,
  Upload,
  X,
  Camera
} from 'lucide-react';
import { useAvatar } from '../contexts/AvatarContext';
import { AvatarUpload } from './ui/AvatarUpload';

const ProfileSection = () => {
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { avatarUrl, updateAvatar, refreshAvatar } = useAvatar();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile and stats in parallel
      const [profileRes, statsRes] = await Promise.all([
        fetch('/api/users/student/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('/api/users/student/overview', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      if (!profileRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const [profileData, statsData] = await Promise.all([
        profileRes.json(),
        statsRes.json()
      ]);

      setProfile(profileData);
      setStudentStats(statsData);
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('فشل في تحميل بيانات الملف الشخصي');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (avatarUrl) => {
    // Update local profile state
    setProfile(prev => ({
      ...prev,
      avatar_url: avatarUrl
    }));
    // Refresh profile data
    fetchProfileData();
  };

  // Keep achievements static as requested
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
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  // Get first letter of name for avatar fallback
  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="mr-3 text-gray-600">جاري تحميل الملف الشخصي...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchProfileData} variant="outline">
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  // Format join date
  const formatJoinDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <AvatarUpload
              size="xl"
              name={profile?.name}
              onUploadSuccess={handleUploadSuccess}
              className="h-24 w-24"
            />

            <div className="flex-1 text-center md:text-right space-y-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profile?.name || 'اسم المستخدم'}</h2>
                <Badge className="bg-education-blue/10 text-education-blue hover:bg-education-blue/20">
                  طالب
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{profile?.email || 'غير محدد'}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>انضم في {formatJoinDate(profile?.created_at)}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <User className="w-4 h-4" />
                  <span>الدورات: {studentStats?.totalCourses ?? 0}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Award className="w-4 h-4" />
                  <span>المكتملة: {studentStats?.completedCourses ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettingsOpen(true)}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات التعلم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{studentStats?.totalCourses ?? 0}</div>
                <div className="text-sm text-gray-600">إجمالي الدورات</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{studentStats?.completedCourses ?? 0}</div>
                <div className="text-sm text-gray-600">الدورات المكتملة</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{studentStats?.totalHours ?? 0}</div>
                <div className="text-sm text-gray-600">ساعات الدراسة</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{studentStats?.upcomingLives ?? 0}</div>
                <div className="text-sm text-gray-600">الجلسات القادمة</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements Card */}
        <Card>
          <CardHeader>
            <CardTitle>الإنجازات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 transition-all ${achievement.earned
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

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              الإعدادات
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {settingsOptions.map((category) => (
              <div key={category.category}>
                <h4 className="font-medium text-gray-900 mb-3 text-right">{category.category}</h4>
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileSection;
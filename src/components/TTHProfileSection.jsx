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
import { useAuth } from '../contexts/AuthContext';

const ProfileSection = () => {
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { avatarUrl, updateAvatar, refreshAvatar } = useAvatar();
  const { updateUser } = useAuth();

  // Ajoute les états pour les modales avancées
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [openPrivacyModal, setOpenPrivacyModal] = useState(false);
  const [openNotificationsModal, setOpenNotificationsModal] = useState(false);

  // Ajoute les états pour les formulaires
  const [profileForm, setProfileForm] = useState({ name: profile?.name || '', email: profile?.email || '' });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [privacyForm, setPrivacyForm] = useState({ isPrivate: false });
  const [notificationsForm, setNotificationsForm] = useState({ enabled: true });

  // Ajoute les états pour les messages de succès/erreur
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Met à jour le formulaire profil quand profile change
  useEffect(() => {
    setProfileForm({ name: profile?.name || '', email: profile?.email || '' });
  }, [profile]);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile and stats in parallel
      const [profileRes, statsRes] = await Promise.all([
        fetch('/api/auth/me', {
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

      setProfile(profileData.user);
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
    { id: 3, title: 'طالب مثابر', icon: Calendar, color: 'text-blue-600', earned: false }
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
        { id: 'notifications', label: 'الإشعارات', icon: Bell }
      ]
    }
  ];

  const handleLogout = () => {
    console.log('تسجيل الخروج...');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleSettingsAction = (action) => {
    switch (action) {
      case 'profile':
        setOpenProfileModal(true);
        break;
      case 'password':
        setOpenPasswordModal(true);
        break;
      case 'privacy':
        setOpenPrivacyModal(true);
        break;
      case 'notifications':
        setOpenNotificationsModal(true);
        break;
      default:
        alert('Fonctionnalité à venir');
    }
  };

  // Handlers de soumission avec API réelle
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setProfileMessage('');

    try {
      const response = await fetch('/api/users/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: profileForm.name
        })
      });

      const data = await response.json();

      if (response.ok) {
        setProfileMessage('تم تحديث الملف الشخصي بنجاح!');
        setProfile(prev => ({ ...prev, name: profileForm.name }));
        // Update auth context
        updateUser({ name: profileForm.name });
        setTimeout(() => {
          setOpenProfileModal(false);
          setProfileMessage('');
        }, 2000);
      } else {
        setProfileMessage(data.error || 'حدث خطأ أثناء تحديث الملف الشخصي');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileMessage('حدث خطأ في الاتصال');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setPasswordMessage('');

    try {
      const response = await fetch('/api/users/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage('تم تغيير كلمة المرور بنجاح!');
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setOpenPasswordModal(false);
          setPasswordMessage('');
        }, 2000);
      } else {
        setPasswordMessage(data.error || 'حدث خطأ أثناء تغيير كلمة المرور');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordMessage('حدث خطأ في الاتصال');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrivacySubmit = (e) => {
    e.preventDefault();
    setTimeout(() => {
      alert('تم حفظ إعدادات الخصوصية!');
      setOpenPrivacyModal(false);
    }, 700);
  };

  const handleNotificationsSubmit = (e) => {
    e.preventDefault();
    setTimeout(() => {
      alert('تم حفظ إعدادات الإشعارات!');
      setOpenNotificationsModal(false);
    }, 700);
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

      {/* Settings Modal */}
      <Dialog dir="rtl" open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              الإعدادات
            </DialogTitle>
          </DialogHeader>

          <div dir='rtl' className="space-y-6">
            {settingsOptions.map((category) => (
              <div key={category.category}>
                <h4 className="font-medium text-gray-900 mb-3 text-right">{category.category}</h4>
                <div className="space-y-1">
                  {category.items.map((item) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className="w-full justify-start text-right h-auto p-3 hover:bg-gray-50"
                      onClick={() => handleSettingsAction(item.id)}
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

      {/* Ajoute les Dialog avancés pour chaque action */}
      <Dialog open={openProfileModal} onOpenChange={setOpenProfileModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل الملف الشخصي</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleProfileSubmit}>
            <div>
              <label className="block mb-1 font-medium">الاسم</label>
              <input type="text" className="w-full border rounded p-2" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block mb-1 font-medium">البريد الإلكتروني</label>
              <input type="email" className="w-full border rounded p-2" value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenProfileModal(false)}>إلغاء</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'حفظ التغييرات'}</Button>
            </div>
            {profileMessage && (
              <p className={`text-sm ${profileMessage.includes('بنجاح') ? 'text-green-600' : 'text-red-600'}`}>
                {profileMessage}
              </p>
            )}
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={openPasswordModal} onOpenChange={setOpenPasswordModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تغيير كلمة المرور</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <div>
              <label className="block mb-1 font-medium">كلمة المرور الحالية</label>
              <input type="password" className="w-full border rounded p-2" value={passwordForm.oldPassword} onChange={e => setPasswordForm(f => ({ ...f, oldPassword: e.target.value }))} required />
            </div>
            <div>
              <label className="block mb-1 font-medium">كلمة المرور الجديدة</label>
              <input type="password" className="w-full border rounded p-2" value={passwordForm.newPassword} onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} required minLength={6} />
            </div>
            <div>
              <label className="block mb-1 font-medium">تأكيد كلمة المرور الجديدة</label>
              <input type="password" className="w-full border rounded p-2" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))} required minLength={6} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenPasswordModal(false)}>إلغاء</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'تغيير'}</Button>
            </div>
            {passwordMessage && (
              <p className={`text-sm ${passwordMessage.includes('بنجاح') ? 'text-green-600' : 'text-red-600'}`}>
                {passwordMessage}
              </p>
            )}
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={openPrivacyModal} onOpenChange={setOpenPrivacyModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>الخصوصية والأمان</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handlePrivacySubmit}>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPrivate" checked={privacyForm.isPrivate} onChange={e => setPrivacyForm(f => ({ ...f, isPrivate: e.target.checked }))} />
              <label htmlFor="isPrivate" className="font-medium">اجعل ملفي الشخصي خاصًا</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenPrivacyModal(false)}>إلغاء</Button>
              <Button type="submit">حفظ</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={openNotificationsModal} onOpenChange={setOpenNotificationsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إعدادات الإشعارات</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleNotificationsSubmit}>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="notifEnabled" checked={notificationsForm.enabled} onChange={e => setNotificationsForm(f => ({ ...f, enabled: e.target.checked }))} />
              <label htmlFor="notifEnabled" className="font-medium">تفعيل الإشعارات</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenNotificationsModal(false)}>إلغاء</Button>
              <Button type="submit">حفظ</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileSection;
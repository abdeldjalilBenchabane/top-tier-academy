import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Calendar } from './ui/TTHCal';
import { 
  Video, 
  Clock, 
  Users, 
  Calendar as CalendarIcon,
  Bell,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const CalendarSection = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const liveSessions = [
    {
      id: 1,
      title: 'جلسة مباشرة: أساسيات React Hooks',
      instructor: 'أ. فاطمة علي',
      course: 'تطوير تطبيقات الويب بـ React',
      date: '2024-03-25',
      time: '15:00',
      duration: '90 دقيقة',
      attendees: 45,
      maxAttendees: 50,
      status: 'upcoming',
      description: 'سنتعلم في هذه الجلسة كيفية استخدام React Hooks بطريقة فعالة وأمثلة عملية.',
      meetingLink: 'https://zoom.us/j/123456789'
    },
    {
      id: 2,
      title: 'ورشة عمل: تحسين الاستعلامات في MySQL',
      instructor: 'د. أحمد حسن',
      course: 'أساسيات قواعد البيانات MySQL',
      date: '2024-03-26',
      time: '18:00',
      duration: '120 دقيقة',
      attendees: 28,
      maxAttendees: 40,
      status: 'upcoming',
      description: 'ورشة عملية لتعلم كيفية كتابة استعلامات SQL محسنة وسريعة.',
      meetingLink: 'https://zoom.us/j/987654321'
    },
    {
      id: 3,
      title: 'جلسة أسئلة وأجوبة: JavaScript المتقدم',
      instructor: 'د. محمد أحمد',
      course: 'البرمجة بـ JavaScript من الصفر',
      date: '2024-03-22',
      time: '16:00',
      duration: '60 دقيقة',
      attendees: 35,
      maxAttendees: 60,
      status: 'completed',
      description: 'جلسة مخصصة للإجابة على أسئلة الطلاب حول المفاهيم المتقدمة في JavaScript.',
      recording: 'https://example.com/recording/123'
    }
  ];

  const upcomingSessions = liveSessions.filter(session => session.status === 'upcoming');
  const completedSessions = liveSessions.filter(session => session.status === 'completed');

  const getSessionBadge = (status) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100">قادمة</Badge>;
      case 'live':
        return <Badge className="bg-orange-100 text-orange-500 hover:bg-orange-100 animate-pulse">مباشرة الآن</Badge>;
      case 'completed':
        return <Badge className="bg-cyan-100 text-cyan-500 hover:bg-cyan-100">مكتملة</Badge>;
      default:
        return null;
    }
  };

  const hasSessionOnDate = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return liveSessions.some(session => session.date === dateString);
  };

  const getSessionsForDate = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return liveSessions.filter(session => session.date === dateString);
  };

  const selectedDateSessions = selectedDate ? getSessionsForDate(selectedDate) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">التقويم الأكاديمي</h2>
        <div className="text-sm text-gray-600">
          {upcomingSessions.length} جلسة مباشرة قادمة
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-education-blue" />
                التقويم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ar}
                className="rounded-md border-0 p-0"
                modifiers={{
                  hasSession: (date) => hasSessionOnDate(date)
                }}
                modifiersStyles={{
                  hasSession: {
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '50%'
                  }
                }}
              />
              <div className="mt-4 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>أيام بها جلسات مباشرة</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions for Selected Date */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? (
                  `الجلسات في ${format(selectedDate, 'dd MMMM yyyy', { locale: ar })}`
                ) : (
                  'الجلسات المباشرة'
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateSessions.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateSessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">{session.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{session.course}</p>
                          <p className="text-sm text-gray-700">{session.description}</p>
                        </div>
                        <div className="mr-4">
                          {getSessionBadge(session.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{session.instructor}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{session.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          <span>{session.duration}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{session.attendees}/{session.maxAttendees}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {session.status === 'upcoming' && (
                          <>
                            <Button size="sm" className="bg-education-blue hover:bg-education-blue/90">
                              <Video className="w-4 h-4 ml-2" />
                              انضم للجلسة
                            </Button>
                            <Button variant="outline" size="sm">
                              <Bell className="w-4 h-4 ml-2" />
                              تذكير
                            </Button>
                          </>
                        )}
                        {session.status === 'completed' && session.recording && (
                          <Button variant="outline" size="sm">
                            <Video className="w-4 h-4 ml-2" />
                            مشاهدة التسجيل
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">لا توجد جلسات مباشرة في هذا التاريخ</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-education-blue" />
            الجلسات القادمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{session.title}</h4>
                  {getSessionBadge(session.status)}
                </div>
                <p className="text-sm text-gray-600 mb-3">{session.course}</p>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{session.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{session.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{session.instructor}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Video className="w-4 h-4" />
                    <span>{session.duration}</span>
                  </div>
                </div>

                <Button size="sm" className="w-full bg-education-blue hover:bg-education-blue/90">
                  <Bell className="w-4 h-4 ml-2" />
                  تعيين تذكير
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarSection;
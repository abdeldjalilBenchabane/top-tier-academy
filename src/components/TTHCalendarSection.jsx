import React, { useState, useEffect } from 'react';
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
  MapPin,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const CalendarSection = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [liveSessions, setLiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [sessionsPerPage] = useState(6);

  // Filter states
  const [filterType, setFilterType] = useState('all'); // all, upcoming, completed, purchased
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLiveSessions();
  }, []);

  const fetchLiveSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/users/student/live-sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch live sessions');
      }

      const data = await response.json();
      setLiveSessions(data);
    } catch (err) {
      console.error('Error fetching live sessions:', err);
      setError('فشل في تحميل الجلسات المباشرة');
    } finally {
      setLoading(false);
    }
  };

  // Filter sessions based on search and filter type
  const filteredSessions = liveSessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.professor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.course.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === 'all' ||
      (filterType === 'upcoming' && session.status === 'upcoming') ||
      (filterType === 'completed' && session.status === 'completed') ||
      (filterType === 'purchased' && session.accessType === 'purchased');

    return matchesSearch && matchesFilter;
  });

  const upcomingSessions = liveSessions.filter(session => session.status === 'upcoming');
  const completedSessions = liveSessions.filter(session => session.status === 'completed');

  // Pagination
  const indexOfLastSession = currentPage * sessionsPerPage;
  const indexOfFirstSession = indexOfLastSession - sessionsPerPage;
  const currentSessions = filteredSessions.slice(indexOfFirstSession, indexOfLastSession);
  const totalPages = Math.ceil(filteredSessions.length / sessionsPerPage);

  const getSessionBadge = (status, accessType) => {
    if (accessType === 'purchased') {
      return <Badge className="bg-green-100 text-green-600 hover:bg-green-100">مشترى</Badge>;
    }

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

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setFilterType('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="mr-3 text-gray-600">جاري تحميل الجلسات المباشرة...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchLiveSessions} variant="outline">
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

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
                <CalendarIcon className="w-5 h-5" />
                التقويم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ar}
                className="rounded-md border-0 p-4 mr-6 font-semibold"
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
              <div className="mt-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>أيام بها جلسات مباشرة</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions for Selected Date */}
        <div className="lg:col-span-2 ">
          <Card className='h-full'>
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
                <div>
                  {/* Sessions count */}
                  <div className="mb-4 text-sm text-gray-600">
                    {selectedDateSessions.length} جلسة في هذا اليوم
                  </div>

                  {/* Compact sessions grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedDateSessions.map((session) => (
                      <div key={session.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1 line-clamp-1">{session.title}</h4>
                            <p className="text-xs text-gray-600 mb-1 line-clamp-1">{session.course}</p>
                          </div>
                          <div className="mr-2 flex-shrink-0">
                            {getSessionBadge(session.status, session.accessType)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span className="truncate">{session.professor}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{session.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            <span>{session.duration}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{session.attendees}/{session.maxAttendees}</span>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          {session.status === 'upcoming' && session.accessType === 'purchased' && (
                            <>
                              <Button size="sm" className="bg-education-blue hover:bg-education-blue/90 text-xs px-2 py-1 h-7">
                                <Video className="w-3 h-3 ml-1" />
                                انضم
                              </Button>
                              <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-7">
                                <Bell className="w-3 h-3 ml-1" />
                                تذكير
                              </Button>
                            </>
                          )}
                          {session.status === 'upcoming' && session.accessType === 'public' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-7">
                              <Video className="w-3 h-3 ml-1" />
                              شراء ({session.price} دج)
                            </Button>
                          )}
                          {session.status === 'completed' && session.meetingLink && (
                            <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-7">
                              <Video className="w-3 h-3 ml-1" />
                              تسجيل
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-education-blue" />
            جميع الجلسات المباشرة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="البحث في الجلسات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الجلسات</option>
              <option value="upcoming">الجلسات القادمة</option>
              <option value="completed">الجلسات المكتملة</option>
              <option value="purchased">الجلسات المشتراة</option>
            </select>

            {/* Reset */}
            <Button
              variant="outline"
              onClick={resetFilters}
              className="whitespace-nowrap"
            >
              إعادة تعيين
            </Button>
          </div>

          {/* Results count */}
          <div className="mb-4 text-sm text-gray-600">
            عرض {currentSessions.length} من {filteredSessions.length} جلسة
          </div>

          {/* Sessions Grid */}
          {currentSessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm line-clamp-2">{session.title}</h4>
                    {getSessionBadge(session.status, session.accessType)}
                  </div>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-1">{session.course}</p>

                  <div className="space-y-2 text-xs text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      <span>{session.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{session.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{session.professor}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      <span>{session.duration}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {session.accessType === 'purchased' ? (
                      <Button size="sm" className="w-full bg-education-blue hover:bg-education-blue/90 text-xs">
                        <Bell className="w-3 h-3 ml-1" />
                        تعيين تذكير
                      </Button>
                    ) : (
                      <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-xs">
                        <Video className="w-3 h-3 ml-1" />
                        شراء ({session.price} دج)
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Video className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">لا توجد جلسات تطابق البحث</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronRight className="w-4 h-4" />
                السابق
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarSection;
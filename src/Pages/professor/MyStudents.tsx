import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, BookOpen, Video, GraduationCap, Calendar, Mail, Phone } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';

interface Student {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  enrollment_date: string;
  last_activity?: string;
  progress?: number;
  status: string;
  content_type: string;
  content_title: string;
  content_id: number;
}

const MyStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user?.id) {
      fetchStudents();
    }
  }, [user]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/professor/students`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      } else {
        console.error('Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.content_title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesContentType = contentTypeFilter === 'all' || student.content_type === contentTypeFilter;
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;

    return matchesSearch && matchesContentType && matchesStatus;
  });

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="h-4 w-4" />;
      case 'live_session':
        return <Video className="h-4 w-4" />;
      case 'live_section':
        return <GraduationCap className="h-4 w-4" />;
      case 'private_class':
        return <Users className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'course':
        return 'bg-blue-100 text-blue-800';
      case 'live_session':
        return 'bg-green-100 text-green-800';
      case 'live_section':
        return 'bg-purple-100 text-purple-800';
      case 'private_class':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'enrolled':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUniqueStudents = () => {
    const uniqueStudents = new Map();
    filteredStudents.forEach(student => {
      if (!uniqueStudents.has(student.id)) {
        uniqueStudents.set(student.id, {
          ...student,
          content_count: 1,
          content_types: [student.content_type],
          courses: [],
          live_sessions: [],
          live_sections: [],
          private_classes: [],
          course_count: 0,
          live_session_count: 0,
          live_section_count: 0,
          private_class_count: 0
        });
      } else {
        const existing = uniqueStudents.get(student.id);
        existing.content_count++;
        if (!existing.content_types.includes(student.content_type)) {
          existing.content_types.push(student.content_type);
        }
      }
      
      // Add content details
      const studentData = uniqueStudents.get(student.id);
      switch (student.content_type) {
        case 'course':
          studentData.courses.push(student.content_title);
          studentData.course_count++;
          break;
        case 'live_session':
          studentData.live_sessions.push(student.content_title);
          studentData.live_session_count++;
          break;
        case 'live_section':
          studentData.live_sections.push(student.content_title);
          studentData.live_section_count++;
          break;
        case 'private_class':
          studentData.private_classes.push({ title: student.content_title, status: student.status });
          studentData.private_class_count++;
          break;
      }
    });
    return Array.from(uniqueStudents.values());
  };

  const uniqueStudents = getUniqueStudents();

  const stats = {
    totalStudents: uniqueStudents.length,
    totalEnrollments: filteredStudents.length,
    courses: uniqueStudents.reduce((sum, student) => sum + student.course_count, 0),
    liveSessions: uniqueStudents.reduce((sum, student) => sum + student.live_session_count, 0),
    liveSections: uniqueStudents.reduce((sum, student) => sum + student.live_section_count, 0),
    privateClasses: uniqueStudents.reduce((sum, student) => sum + student.private_class_count, 0)
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Students"
          description="View all your students across different content types"
        />
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-gray-500">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Students"
        description="View all your students across different content types"
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <div className="text-sm text-gray-500">Unique Students</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.courses}</div>
                <div className="text-sm text-gray-500">Course Enrollments</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.liveSessions}</div>
                <div className="text-sm text-gray-500">Live Sessions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{stats.liveSections}</div>
                <div className="text-sm text-gray-500">Live Sections</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{stats.privateClasses}</div>
                <div className="text-sm text-gray-500">Private Classes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <div>
                <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
                <div className="text-sm text-gray-500">Total Enrollments</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Summary */}
      {uniqueStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Student Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uniqueStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">{student.name}</h4>
                      <p className="text-sm text-gray-500">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <span>{student.course_count} courses</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Video className="h-4 w-4 text-green-600" />
                      <span>{student.live_session_count} sessions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4 text-purple-600" />
                      <span>{student.live_section_count} sections</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-orange-600" />
                      <span>{student.private_class_count} private</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {student.content_count} total
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by student name, email, or content title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Content Types</SelectItem>
                <SelectItem value="course">Courses</SelectItem>
                <SelectItem value="live_session">Live Sessions</SelectItem>
                <SelectItem value="live_section">Live Sections</SelectItem>
                <SelectItem value="private_class">Private Classes</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="enrolled">Enrolled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Students ({uniqueStudents.length})</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="live_sessions">Live Sessions</TabsTrigger>
          <TabsTrigger value="live_sections">Live Sections</TabsTrigger>
          <TabsTrigger value="private_classes">Private Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniqueStudents.map((student) => (
              <Card key={student.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{student.name}</h3>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{student.content_count} total</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Enrolled: {formatDate(student.enrollment_date)}</span>
                  </div>
                  {student.last_activity && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Last activity: {formatDate(student.last_activity)}</span>
                    </div>
                  )}
                  
                  {/* Content Breakdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3 text-blue-600" />
                        <span className="text-gray-700">Courses:</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{student.course_count}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Video className="h-3 w-3 text-green-600" />
                        <span className="text-gray-700">Live Sessions:</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{student.live_session_count}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3 text-purple-600" />
                        <span className="text-gray-700">Live Sections:</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{student.live_section_count}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-orange-600" />
                        <span className="text-gray-700">Private Classes:</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{student.private_class_count}</Badge>
                    </div>
                  </div>

                  {/* Content Details (Collapsible) */}
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      View Details
                    </summary>
                    <div className="mt-2 space-y-2 text-xs">
                      {student.courses.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-600">Courses:</p>
                          <ul className="list-disc list-inside text-gray-500 ml-2">
                            {student.courses.map((course, index) => (
                              <li key={index}>{course}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {student.live_sections.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-600">Live Sections:</p>
                          <ul className="list-disc list-inside text-gray-500 ml-2">
                            {student.live_sections.map((section, index) => (
                              <li key={index}>{section}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {student.private_classes.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-600">Private Classes:</p>
                          <ul className="list-disc list-inside text-gray-500 ml-2">
                            {student.private_classes.map((pc, index) => (
                              <li key={index}>{pc.title} ({pc.status})</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </details>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {['courses', 'live_sessions', 'live_sections', 'private_classes'].map((contentType) => (
          <TabsContent key={contentType} value={contentType} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents
                .filter(student => student.content_type === contentType.replace('_', ''))
                .map((student) => (
                  <Card key={`${student.id}-${student.content_id}`} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{student.name}</h3>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(student.status)}>
                          {student.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Content:</p>
                        <p className="text-sm text-gray-600">{student.content_title}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Enrolled: {formatDate(student.enrollment_date)}</span>
                      </div>
                      {student.last_activity && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Last activity: {formatDate(student.last_activity)}</span>
                        </div>
                      )}
                      {student.progress !== undefined && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Progress:</p>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${student.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{student.progress}% complete</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default MyStudents; 
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { PendingCourse } from '@/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Inbox, User, Calendar, CheckCircle, XCircle, Video, BookOpen, Globe, Clock, RotateCw } from 'lucide-react';
import PathSelector from '@/components/admin/PathSelector';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';
import { usePendingCount } from '@/contexts/PendingCountContext';
import { Textarea } from '@/components/ui/textarea';

interface PendingLiveSection {
  id: number;
  title: string;
  description: string;
  price: number;
  cover_image_url?: string;
  status: string;
  created_at: string;
  professor_name: string;
  professor_email: string;
  live_sessions_count: number;
  root_type: 'education' | 'language';
  level_name?: string;
  year_name?: string;
  speciality_name?: string;
  material_name?: string;
  language_name?: string;
  language_level_name?: string;
}

const PendingPage = () => {
  const navigate = useNavigate();
  const { refreshPendingCount } = usePendingCount();
  const [pendingCourses, setPendingCourses] = useState<PendingCourse[]>([]);
  const [pendingLiveSections, setPendingLiveSections] = useState<PendingLiveSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<PendingCourse | null>(null);
  const [showPathSelector, setShowPathSelector] = useState(false);
  const [liveSectionRejectDialogOpen, setLiveSectionRejectDialogOpen] = useState(false);
  const [liveSectionRejectReason, setLiveSectionRejectReason] = useState('');
  const [sectionToReject, setSectionToReject] = useState<PendingLiveSection | null>(null);
  const [approvingCourse, setApprovingCourse] = useState<string | null>(null);
  const [rejectingCourse, setRejectingCourse] = useState<string | null>(null);
  const [approvingLiveSection, setApprovingLiveSection] = useState<number | null>(null);
  const [rejectingLiveSection, setRejectingLiveSection] = useState<number | null>(null);


  // Calculate counts for live sections
  const pendingLiveSectionsCount = pendingLiveSections.filter(s => s.status === 'pending').length;
  const rejectedLiveSectionsCount = pendingLiveSections.filter(s => s.status === 'rejected').length;

  const fetchPendingCourses = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPendingCourses();
      setPendingCourses(data);
    } catch (error) {
      console.error('Failed to fetch pending courses:', error);
      toast.error('Failed to load pending courses');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingLiveSections = async () => {
    try {
      const response = await fetch('/api/admin/live-sections/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch live sections');
      }

      const data = await response.json();
      setPendingLiveSections(data);
    } catch (error) {
      console.error('Failed to fetch live sections:', error);
      toast.error('Failed to load live sections');
    }
  };

  useEffect(() => {
    fetchPendingCourses();
    fetchPendingLiveSections();
  }, []);

  const handleApprovalSuccess = () => {
    setShowPathSelector(false);
    setSelectedCourse(null);
    fetchPendingCourses();
    refreshPendingCount(); // Refresh the sidebar count
    toast.success('Course processed successfully');
  };

  const handleLiveSectionReject = async () => {
    if (!sectionToReject) return;
    
    setRejectingLiveSection(sectionToReject.id);
    try {
      await fetch(`/api/admin/live-sections/${sectionToReject.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason: liveSectionRejectReason })
      });
      
      fetchPendingLiveSections();
      refreshPendingCount();
      toast.success('Live section rejected successfully');
      setLiveSectionRejectDialogOpen(false);
      setLiveSectionRejectReason('');
      setSectionToReject(null);
    } catch (error) {
      console.error('Error rejecting live section:', error);
      toast.error('Failed to reject live section');
    } finally {
      setRejectingLiveSection(null);
    }
  };

  const openLiveSectionRejectDialog = (section: PendingLiveSection) => {
    setSectionToReject(section);
    setLiveSectionRejectDialogOpen(true);
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const pendingCoursesCount = pendingCourses.filter(c => c.status === 'pending').length;
  const rejectedCoursesCount = pendingCourses.filter(c => c.status === 'rejected').length;

  const getPathDisplay = (section: PendingLiveSection) => {
    if (section.root_type === 'education') {
      return `${section.level_name} > ${section.year_name} > ${section.speciality_name} > ${section.material_name}`;
    } else {
      return `${section.language_name} > ${section.language_level_name}`;
    }
  };

  const getPathIcon = (rootType: string) => {
    return rootType === 'education' ? <BookOpen className="h-4 w-4" /> : <Globe className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Pending Approvals" 
        description="Review and assign submitted courses"
      />
      
      {(pendingCourses.length === 0 && pendingLiveSections.length === 0) ? (
        <EmptyState
          title="No Pending Approvals"
          description="All submitted courses and live sections have been reviewed."
          icon={<Inbox className="h-12 w-12 text-gray-400" />}
        />
      ) : (
        <Tabs defaultValue="courses">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="courses">
                Courses
                {(pendingCoursesCount + rejectedCoursesCount) > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {pendingCoursesCount + rejectedCoursesCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="live-sections">
                Live Sections
                {(pendingLiveSectionsCount + rejectedLiveSectionsCount) > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {pendingLiveSectionsCount + rejectedLiveSectionsCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="courses" className="mt-0">
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">
                  Pending
                  {pendingCoursesCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {pendingCoursesCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected
                  {rejectedCoursesCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {rejectedCoursesCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending" className="mt-0">
                {pendingCourses.filter(c => c.status === 'pending').length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingCourses
                      .filter(course => course.status === 'pending')
                      .map(course => (
                        <Card key={course.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                            <div className="flex items-center text-sm text-gray-500">
                              <User className="h-3.5 w-3.5 mr-1" />
                              <span>Professor</span>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pb-2">
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {course.description}
                            </p>
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              <span>Submitted: {formatDate(course.createdAt)}</span>
                            </div>
                          </CardContent>
                          
                          <CardFooter className="flex justify-end gap-2">
                            <Button 
                              variant="destructive"
                              disabled={approvingCourse === course.id || rejectingCourse === course.id}
                              onClick={async () => {
                                setRejectingCourse(course.id);
                                const reason = window.prompt('Enter rejection reason (optional):') || '';
                                try {
                                  await api.rejectCourseAdmin(course.id, reason);
                                  toast.success('Course rejected');
                                  fetchPendingCourses();
                                  refreshPendingCount();
                                } catch (err) {
                                  toast.error('Failed to reject course');
                                } finally {
                                  setRejectingCourse(null);
                                }
                              }}
                            >
                              {rejectingCourse === course.id ? (
                                <>
                                  <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                                  Rejecting...
                                </>
                              ) : (
                                'Reject'
                              )}
                            </Button>
                            <Button 
                              variant="outline"
                              disabled={approvingCourse === course.id || rejectingCourse === course.id}
                              onClick={async () => {
                                setApprovingCourse(course.id);
                                try {
                                  await api.approveCourseAdmin(course.id);
                                  toast.success('Course approved');
                                  refreshPendingCount();
                                  navigate('/admin/courses');
                                } catch (err) {
                                  toast.error('Failed to approve course');
                                } finally {
                                  setApprovingCourse(null);
                                }
                              }}
                            >
                              {approvingCourse === course.id ? (
                                <>
                                  <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                                  Approving...
                                </>
                              ) : (
                                'Approve'
                              )}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No Pending Courses"
                    description="There are no courses waiting for review."
                    icon={<CheckCircle className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </TabsContent>
          
              <TabsContent value="rejected" className="mt-0">
                {pendingCourses.filter(c => c.status === 'rejected').length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingCourses
                      .filter(course => course.status === 'rejected')
                      .map(course => (
                        <Card key={course.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                            <div className="flex items-center text-sm text-gray-500">
                              <User className="h-3.5 w-3.5 mr-1" />
                              <span>Professor</span>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pb-2">
                            <div className="flex items-center text-sm text-red-500 mb-2">
                              <XCircle className="h-4 w-4 mr-1" />
                              <span>Rejected</span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {course.description}
                            </p>
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              <span>Rejected on: {formatDate(course.rejectedAt || '')}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No Rejected Courses"
                    description="There are no rejected courses."
                    icon={<XCircle className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="live-sections" className="mt-0">
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">
                  Pending
                  {pendingLiveSectionsCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {pendingLiveSectionsCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected
                  {rejectedLiveSectionsCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {rejectedLiveSectionsCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending" className="mt-0">
                {pendingLiveSections.filter(s => s.status === 'pending').length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingLiveSections
                      .filter(section => section.status === 'pending')
                      .map((section) => (
                        <Card key={section.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg line-clamp-1">{section.title}</CardTitle>
                            <div className="flex items-center text-sm text-gray-500">
                              <User className="h-3.5 w-3.5 mr-1" />
                              <span>{section.professor_name}</span>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pb-2">
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {section.description}
                            </p>
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              <span>Submitted: {formatDate(section.created_at)}</span>
                            </div>
                          </CardContent>
                          
                          <CardFooter className="flex justify-end gap-2">
                            <Button 
                              variant="destructive"
                              disabled={approvingLiveSection === section.id || rejectingLiveSection === section.id}
                              onClick={() => openLiveSectionRejectDialog(section)}
                            >
                              {rejectingLiveSection === section.id ? (
                                <>
                                  <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                                  Rejecting...
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="default"
                              disabled={approvingLiveSection === section.id || rejectingLiveSection === section.id}
                              onClick={async () => {
                                setApprovingLiveSection(section.id);
                                try {
                                  await fetch(`/api/admin/live-sections/${section.id}/approve`, {
                                    method: 'POST',
                                    headers: {
                                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                                    }
                                  });
                                  fetchPendingLiveSections();
                                  refreshPendingCount();
                                  toast.success('Live section approved successfully');
                                } catch (error) {
                                  console.error('Error approving live section:', error);
                                  toast.error('Failed to approve live section');
                                } finally {
                                  setApprovingLiveSection(null);
                                }
                              }}
                            >
                              {approvingLiveSection === section.id ? (
                                <>
                                  <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                                  Approving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </>
                              )}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No Pending Live Sections"
                    description="All live sections have been reviewed."
                    icon={<Video className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </TabsContent>

              <TabsContent value="rejected" className="mt-0">
                {pendingLiveSections.filter(s => s.status === 'rejected').length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingLiveSections
                      .filter(section => section.status === 'rejected')
                      .map((section) => (
                        <Card key={section.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg line-clamp-1">{section.title}</CardTitle>
                            <div className="flex items-center text-sm text-gray-500">
                              <User className="h-3.5 w-3.5 mr-1" />
                              <span>{section.professor_name}</span>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pb-2">
                            <div className="flex items-center text-sm text-red-500 mb-2">
                              <XCircle className="h-4 w-4 mr-1" />
                              <span>Rejected</span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {section.description}
                            </p>
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              <span>Rejected on: {formatDate(section.updated_at || '')}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No Rejected Live Sections"
                    description="There are no rejected live sections."
                    icon={<XCircle className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      )}

      {/* Live Section Rejection Dialog */}
      <Dialog open={liveSectionRejectDialogOpen} onOpenChange={setLiveSectionRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Live Section</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject "{sectionToReject?.title}"? Please provide a reason for the rejection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="liveSectionRejectReason" className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason
              </label>
              <Textarea
                id="liveSectionRejectReason"
                placeholder="Enter the reason for rejection..."
                value={liveSectionRejectReason}
                onChange={(e) => setLiveSectionRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setLiveSectionRejectDialogOpen(false);
              setLiveSectionRejectReason('');
              setSectionToReject(null);
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleLiveSectionReject}
              disabled={!liveSectionRejectReason.trim() || rejectingLiveSection === sectionToReject?.id}
            >
              {rejectingLiveSection === sectionToReject?.id ? (
                <>
                  <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject Section'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingPage;

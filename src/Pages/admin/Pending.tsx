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
import { Inbox, User, Calendar, CheckCircle, XCircle, Video, BookOpen, Globe } from 'lucide-react';
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
  const [selectedLiveSection, setSelectedLiveSection] = useState<PendingLiveSection | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

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
      const response = await fetch('/api/admin/live-sections/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending live sections');
      }

      const data = await response.json();
      setPendingLiveSections(data);
    } catch (error) {
      console.error('Failed to fetch pending live sections:', error);
      toast.error('Failed to load pending live sections');
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

  const handleLiveSectionApprove = async (sectionId: number) => {
    try {
      const response = await fetch(`/api/admin/live-sections/${sectionId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to approve live section');
      }

      toast.success('Live section approved successfully!');
      fetchPendingLiveSections();
      refreshPendingCount();
    } catch (error) {
      console.error('Error approving live section:', error);
      toast.error('Failed to approve live section');
    }
  };

  const handleLiveSectionReject = async () => {
    if (!selectedLiveSection || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      const response = await fetch(`/api/admin/live-sections/${selectedLiveSection.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason })
      });

      if (!response.ok) {
        throw new Error('Failed to reject live section');
      }

      toast.success('Live section rejected successfully!');
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedLiveSection(null);
      fetchPendingLiveSections();
      refreshPendingCount();
    } catch (error) {
      console.error('Error rejecting live section:', error);
      toast.error('Failed to reject live section');
    }
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
  const pendingLiveSectionsCount = pendingLiveSections.filter(s => s.status === 'pending').length;

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
                {pendingLiveSectionsCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {pendingLiveSectionsCount}
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
                              onClick={async () => {
                                const reason = window.prompt('Enter rejection reason (optional):') || '';
                                try {
                                  await api.rejectCourseAdmin(course.id, reason);
                                  toast.success('Course rejected');
                                  fetchPendingCourses();
                                } catch (err) {
                                  toast.error('Failed to reject course');
                                }
                              }}
                            >
                              Reject
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await api.approveCourseAdmin(course.id);
                                  toast.success('Course approved');
                                  navigate('/admin/courses');
                                } catch (err) {
                                  toast.error('Failed to approve course');
                                }
                              }}
                            >
                              Approve
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
            {pendingLiveSections.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingLiveSections.map((section) => (
                  <Card key={section.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      {section.cover_image_url && (
                        <img
                          src={section.cover_image_url}
                          alt="Live Section Cover"
                          className="w-full h-28 object-cover rounded-t-md mb-2 border"
                          style={{ minHeight: '7rem', background: '#f3f4f6' }}
                        />
                      )}
                      {!section.cover_image_url && (
                        <div className="w-full h-28 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-md mb-2 flex items-center justify-center">
                          <Video className="h-8 w-8 text-white" />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg line-clamp-2" title={section.title}>
                          {section.title}
                        </CardTitle>
                        <Badge variant="outline" className="bg-yellow-50">
                          <Clock className="h-3 w-3 mr-1 text-yellow-500" />
                          <span className="text-yellow-700">Pending</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-2">
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {section.description}
                      </p>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center text-xs text-gray-500">
                          <User className="h-3.5 w-3.5 mr-1" />
                          <span>{section.professor_name}</span>
                        </div>
                        
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          <span>Submitted: {formatDate(section.created_at)}</span>
                        </div>
                        
                        <div className="flex items-center text-xs text-gray-500">
                          <Video className="h-3.5 w-3.5 mr-1" />
                          <span>{section.live_sessions_count} sessions</span>
                        </div>
                        
                        <div className="flex items-center text-xs text-gray-500">
                          {getPathIcon(section.root_type)}
                          <span className="ml-1 line-clamp-1">{getPathDisplay(section)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-green-600">
                          {section.price} دج
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="flex gap-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleLiveSectionApprove(section.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedLiveSection(section);
                          setShowRejectDialog(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
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
        </Tabs>
      )}

      {/* Reject Live Section Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Live Section</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting "{selectedLiveSection?.title}".
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
            
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason('');
                  setSelectedLiveSection(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleLiveSectionReject}
                disabled={!rejectReason.trim()}
              >
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
    </div>
  );
};

export default PendingPage;

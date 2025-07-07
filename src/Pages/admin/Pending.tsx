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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Inbox, User, Calendar, CheckCircle, XCircle } from 'lucide-react';
import PathSelector from '@/components/admin/PathSelector';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';

const PendingPage = () => {
  const navigate = useNavigate();
  const [pendingCourses, setPendingCourses] = useState<PendingCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<PendingCourse | null>(null);
  const [showPathSelector, setShowPathSelector] = useState(false);

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

  useEffect(() => {
    fetchPendingCourses();
  }, []);

  const handleApprovalSuccess = () => {
    setShowPathSelector(false);
    setSelectedCourse(null);
    fetchPendingCourses();
    toast.success('Course processed successfully');
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
      
      {pendingCourses.length === 0 ? (
        <EmptyState
          title="No Pending Approvals"
          description="All submitted courses have been reviewed."
          icon={<Inbox className="h-12 w-12 text-gray-400" />}
        />
      ) : (
        <Tabs defaultValue="pending">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
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
          </div>
          
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
      )}
      
    </div>
  );
};

export default PendingPage;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { PendingCourse } from '@/types';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, BookOpen, Calendar, FileText, Plus, Layers } from 'lucide-react';
import { toast as toastLib } from '@/lib/toast';
import PathSelector from '@/components/admin/PathSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const ProfessorCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<PendingCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPathSelector, setShowPathSelector] = useState(false);
  const [selectedDraftCourse, setSelectedDraftCourse] = useState<PendingCourse | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        console.log('[ProfessorCourses] user:', user);
        if (!user) return;
        const res = await fetch(`/api/courses?created_by=${user.id}`);
        const data = await res.json();
        console.log('[ProfessorCourses] API response:', data);
        setCourses(data);
        console.log('[ProfessorCourses] setCourses:', data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        toastLib.error('Failed to load course data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  const pendingCount = courses.filter(c => c.status === 'pending').length;
  const rejectedCount = courses.filter(c => c.status === 'rejected').length;
  const draftCount = courses.filter(c => c.status === 'draft').length;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Courses" 
        description="View and manage your course submissions"
        action={
          <Button asChild>
            <Link to="/professor/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Link>
          </Button>
        }
      />
      
      {courses.length === 0 ? (
        <EmptyState
          title="No Courses Yet"
          description="You haven't created any courses yet. Get started by creating your first course."
          icon={<BookOpen className="h-12 w-12 text-gray-400" />}
          action={{
            label: "Create First Course",
            onClick: () => window.location.href = '/professor/create'
          }}
        />
      ) : (
        <Tabs defaultValue={draftCount > 0 ? 'drafts' : 'pending'}>
          <TabsList className="mb-4">
            <TabsTrigger value="drafts">
              Drafts
              {draftCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {draftCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected
              {rejectedCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {rejectedCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="drafts" className="mt-0">
            {draftCount > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {courses
                  .filter(course => course.status === 'draft')
                  .map(course => (
                    <Card key={course.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                          <Badge variant="outline" className="bg-gray-100 text-gray-700">Draft</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {course.description}
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          <span>Created: {formatDate(course.created_at)}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 flex flex-col gap-2">
                        <Button variant="outline" className="w-full flex items-center justify-center" onClick={() => navigate(`/professor/courses/${course.id}`)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Finish & Edit
                        </Button>
                        <Button variant="default" className="w-full flex items-center justify-center" onClick={() => { setSelectedDraftCourse(course); setShowPathSelector(true); }}>
                          <Layers className="h-4 w-4 mr-2" />
                          Choose Path
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            ) : (
              <EmptyState
                title="No Drafts"
                description="You don't have any draft courses."
                icon={<BookOpen className="h-12 w-12 text-gray-400" />}
              />
            )}
          </TabsContent>
          
          <TabsContent value="pending" className="mt-0">
            {courses.filter(c => c.status === 'pending').length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {courses
                  .filter(course => course.status === 'pending')
                  .map(course => (
                    <Card key={course.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                          <Badge variant="outline" className="bg-yellow-50">
                            <Clock className="h-3 w-3 mr-1 text-yellow-500" />
                            <span className="text-yellow-700">Pending</span>
                          </Badge>
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
                      
                      <CardFooter className="pt-0">
                        <Button variant="outline" className="w-full flex items-center justify-center" onClick={() => navigate(`/professor/courses/${course.id}`)}>
                          <FileText className="h-4 w-4 mr-2" />
                          View/Edit
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            ) : (
              <EmptyState
                title="No Pending Courses"
                description="You don't have any courses pending approval."
                icon={<Clock className="h-12 w-12 text-gray-400" />}
              />
            )}
          </TabsContent>
          
          <TabsContent value="rejected" className="mt-0">
            {courses.filter(c => c.status === 'rejected').length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {courses
                  .filter(course => course.status === 'rejected')
                  .map(course => (
                    <Card key={course.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                          <Badge variant="outline" className="bg-red-50">
                            <XCircle className="h-3 w-3 mr-1 text-red-500" />
                            <span className="text-red-700">Rejected</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pb-2">
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {course.description}
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          <span>Rejected: {formatDate(course.rejectedAt || '')}</span>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="pt-0 flex gap-2">
                        <Button variant="outline" className="flex-1 flex items-center justify-center" onClick={() => navigate(`/professor/courses/${course.id}`)}>
                          <FileText className="h-4 w-4 mr-2" />
                          View/Edit
                        </Button>
                        <Button className="flex-1 flex items-center justify-center">
                          Edit & Resubmit
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            ) : (
              <EmptyState
                title="No Rejected Courses"
                description="You don't have any rejected courses."
                icon={<XCircle className="h-12 w-12 text-gray-400" />}
              />
            )}
          </TabsContent>
          
          <TabsContent value="approved" className="mt-0">
            <EmptyState
              title="No Approved Courses"
              description="You don't have any approved courses yet."
              icon={<CheckCircle className="h-12 w-12 text-gray-400" />}
            />
          </TabsContent>
        </Tabs>
      )}
      {/* PathSelector Dialog for Drafts */}
      <Dialog open={showPathSelector} onOpenChange={setShowPathSelector}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Course Path</DialogTitle>
            <DialogDescription>
              Select the educational structure or language path for this course. This helps students find your course in the right place.
            </DialogDescription>
          </DialogHeader>
          {selectedDraftCourse && (
            <PathSelector
              pendingCourse={selectedDraftCourse}
              onSuccess={() => { setShowPathSelector(false); setSelectedDraftCourse(null); /* reload courses */ window.location.reload(); }}
              onCancel={() => { setShowPathSelector(false); setSelectedDraftCourse(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessorCourses;

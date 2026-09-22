
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, CheckCircle, XCircle, Clock, Users, RotateCw } from 'lucide-react';
import { api } from '@/lib/api';
import { PendingQuiz, User } from '@/types';
import { toast } from '@/lib/toast';
import { usePendingQuizzesCount } from '@/contexts/PendingQuizzesCountContext';
import { serverDate } from '@/lib/utils';


const QuizManagement = () => {
  const [pendingQuizzes, setpendingQuizzes] = useState<PendingQuiz[]>([]);
  const [professors, setProfessors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingQuiz, setApprovingQuiz] = useState<string | null>(null);
  const [rejectingQuiz, setRejectingQuiz] = useState<string | null>(null);
  const { refreshPendingQuizzesCount } = usePendingQuizzesCount();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizzesData, professorsData] = await Promise.all([
          api.getPendingQuizzes(),
          api.getUsers()
        ]);
        console.log('Fetched quizzes data:', quizzesData);
        setpendingQuizzes(quizzesData);
        setProfessors(professorsData.filter(user => user.role === 'professor'));
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load quizzes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getProfessorName = (professorId: string) => {
    const professor = professors.find(p => p.id === professorId);
    return professor?.name || 'Unknown Professor';
  };

  const getStatusBadge = (status: PendingQuiz['status']) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      under_review: 'bg-blue-100 text-blue-800',
      needs_revision: 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge className={variants[status]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const handleApproveQuiz = async (quiz: PendingQuiz) => {
    setApprovingQuiz(quiz.id);
    try {
      await api.approveQuiz(quiz.id);
      toast.success('Quiz approved successfully');
      const updatedQuizzes = await api.getPendingQuizzes();
      setpendingQuizzes(updatedQuizzes);
      refreshPendingQuizzesCount();
    } catch (error) {
      console.error('Error approving quiz:', error);
      toast.error('Failed to approve quiz');
    } finally {
      setApprovingQuiz(null);
    }
  };

  const handleRejectQuiz = async (quizId: string) => {
    setRejectingQuiz(quizId);
    try {
      await api.rejectQuiz(quizId, 'Quiz not approved');
      toast.success('Quiz rejected');
      const updatedQuizzes = await api.getPendingQuizzes();
      setpendingQuizzes(updatedQuizzes);
      refreshPendingQuizzesCount();
    } catch (error) {
      console.error('Error rejecting quiz:', error);
      toast.error('Failed to reject quiz');
    } finally {
      setRejectingQuiz(null);
    }
  };



  if (isLoading) {
    return <div className="py-8 text-center">Loading quizzes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quiz Management</h2>
          <p className="text-gray-600">Review and approve professor-submitted quizzes</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingQuizzes.filter(q => q.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {pendingQuizzes.filter(q => q.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {pendingQuizzes.filter(q => q.status === 'rejected').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {pendingQuizzes.reduce((total, quiz) => total + (quiz.questions?.length || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Submissions</CardTitle>
          <CardDescription>Review and manage professor quiz submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Professor</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Time Limit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingQuizzes.map((quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell className="font-medium">{quiz.title}</TableCell>
                  <TableCell>{quiz.courseTitle || 'Unknown Course'}</TableCell>
                  <TableCell>{quiz.professorName || getProfessorName(quiz.createdBy)}</TableCell>
                  <TableCell>{quiz.questions?.length || 0}</TableCell>
                  <TableCell>{quiz.timeLimit ? `${quiz.timeLimit} min` : 'No limit'}</TableCell>
                  <TableCell>{getStatusBadge(quiz.status)}</TableCell>
                  <TableCell>{serverDate(quiz.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{quiz.title}</DialogTitle>
                            <DialogDescription>
                              Review quiz details and questions
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p className="text-gray-600">{quiz.description}</p>
                            
                            {/* Course and Path Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-semibold text-gray-800 mb-2">Course Information</h4>
                              <div className="grid grid-cols-1 gap-2 text-sm">
                                <div><strong>Course:</strong> {quiz.courseTitle || 'Unknown Course'}</div>
                                <div><strong>Professor:</strong> {quiz.professorName || getProfessorName(quiz.createdBy)}</div>
                                <div><strong>Created:</strong> {serverDate(quiz.createdAt).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</div>
                              </div>
                            </div>
                            
                            {/* Educational Path */}
                            {(quiz.levelName || quiz.yearName || quiz.specialityName || quiz.materialName) && (
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-blue-800 mb-2">Educational Path</h4>
                                <div className="flex items-center gap-2 text-sm text-blue-700">
                                  {quiz.levelName && <span className="font-medium">{quiz.levelName}</span>}
                                  {quiz.yearName && (
                                    <>
                                      <span>→</span>
                                      <span className="font-medium">{quiz.yearName}</span>
                                    </>
                                  )}
                                  {quiz.specialityName && (
                                    <>
                                      <span>→</span>
                                      <span className="font-medium">{quiz.specialityName}</span>
                                    </>
                                  )}
                                  {quiz.materialName && (
                                    <>
                                      <span>→</span>
                                      <span className="font-medium">{quiz.materialName}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div><strong>Time Limit:</strong> {quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No limit'}</div>
                              <div><strong>Passing Score:</strong> {quiz.passingScore}%</div>
                              <div><strong>Max Attempts:</strong> {quiz.maxAttempts || 'Unlimited'}</div>
                              <div><strong>Questions:</strong> {quiz.questions?.length || 0}</div>
                            </div>
                            <div className="space-y-3">
                                <h4 className="font-semibold">Questions: {quiz.questions?.length || 0}</h4>
                                {console.log('Quiz questions:', quiz.questions)}
                                {quiz.questions?.map((question, index) => (
                                <div key={question.id} className="border p-3 rounded">
                                  <div className="font-medium">{index + 1}. {question.question}</div>
                                  <div className="text-sm text-gray-600 mt-1">Type: {question.type} | Points: {question.points}</div>
                                  {question.options && (
                                    <div className="mt-2">
                                      <div className="text-sm font-medium">Options:</div>
                                      <ul className="list-disc list-inside text-sm">
                                        {question.options.map((option, optIndex) => (
                                          <li key={optIndex} className={optIndex === question.correctAnswer ? 'text-green-600 font-medium' : ''}>
                                            {option} {optIndex === question.correctAnswer && '(Correct)'}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {question.explanation && (
                                    <div className="mt-2 text-sm text-gray-600">
                                      <strong>Explanation:</strong> {question.explanation}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {quiz.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={approvingQuiz === quiz.id || rejectingQuiz === quiz.id}
                            onClick={() => handleApproveQuiz(quiz)}
                            className="text-green-600 hover:text-green-700"
                          >
                            {approvingQuiz === quiz.id ? (
                              <>
                                <RotateCw className="h-4 w-4 animate-spin" />
                              </>
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={approvingQuiz === quiz.id || rejectingQuiz === quiz.id}
                            onClick={() => handleRejectQuiz(quiz.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            {rejectingQuiz === quiz.id ? (
                              <>
                                <RotateCw className="h-4 w-4 animate-spin" />
                              </>
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>


    </div>
  );
};

export default QuizManagement;

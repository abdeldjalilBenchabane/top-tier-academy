
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { PendingQuiz, User } from '@/types';
import { toast } from '@/lib/toast';
import PathSelector from './PathSelector';

const QuizManagement = () => {
  const [pendingQuizzes, setpendingQuizzes] = useState<PendingQuiz[]>([]);
  const [professors, setProfessors] = useState<User[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<PendingQuiz | null>(null);
  const [showPathSelector, setShowPathSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizzesData, professorsData] = await Promise.all([
          api.getPendingQuizzes(),
          api.getUsers()
        ]);
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

  const handleApproveQuiz = (quiz: PendingQuiz) => {
    setSelectedQuiz(quiz);
    setShowPathSelector(true);
  };

  const handleRejectQuiz = async (quizId: string) => {
    try {
      await api.rejectQuiz(quizId, 'Quiz not approved');
      toast.success('Quiz rejected');
      const updatedQuizzes = await api.getPendingQuizzes();
      setpendingQuizzes(updatedQuizzes);
    } catch (error) {
      console.error('Error rejecting quiz:', error);
      toast.error('Failed to reject quiz');
    }
  };

  const handlePathSelectorSuccess = async () => {
    setShowPathSelector(false);
    setSelectedQuiz(null);
    const updatedQuizzes = await api.getPendingQuizzes();
    setpendingQuizzes(updatedQuizzes);
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
              {pendingQuizzes.reduce((total, quiz) => total + quiz.questions.length, 0)}
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
                  <TableCell>{getProfessorName(quiz.createdBy)}</TableCell>
                  <TableCell>{quiz.questions.length}</TableCell>
                  <TableCell>{quiz.timeLimit ? `${quiz.timeLimit} min` : 'No limit'}</TableCell>
                  <TableCell>{getStatusBadge(quiz.status)}</TableCell>
                  <TableCell>{new Date(quiz.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>{quiz.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p className="text-gray-600">{quiz.description}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div><strong>Time Limit:</strong> {quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No limit'}</div>
                              <div><strong>Passing Score:</strong> {quiz.passingScore}%</div>
                              <div><strong>Max Attempts:</strong> {quiz.maxAttempts || 'Unlimited'}</div>
                              <div><strong>Questions:</strong> {quiz.questions.length}</div>
                            </div>
                            <div className="space-y-3">
                              <h4 className="font-semibold">Questions:</h4>
                              {quiz.questions.map((question, index) => (
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
                            onClick={() => handleApproveQuiz(quiz)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectQuiz(quiz.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
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

      {showPathSelector && selectedQuiz && (
        <Dialog open={showPathSelector} onOpenChange={setShowPathSelector}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Quiz to Educational Path</DialogTitle>
            </DialogHeader>
            <PathSelector
              pendingCourse={selectedQuiz as any}
              onSuccess={handlePathSelectorSuccess}
              onCancel={() => setShowPathSelector(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default QuizManagement;

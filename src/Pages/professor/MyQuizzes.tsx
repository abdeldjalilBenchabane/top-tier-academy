import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Eye, Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { QuizQuestion } from '@/types';

interface Quiz {
  id: string;
  title: string;
  description: string;
  courseTitle: string;
  timeLimit: number;
  passingScore: number;
  maxAttempts: number;
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
  questions: QuizQuestion[];
}

export default function MyQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyQuizzes();
  }, []);

  // Refresh quizzes when returning to the page
  useEffect(() => {
    const handleFocus = () => {
      fetchMyQuizzes();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchMyQuizzes = async () => {
    try {
      setLoading(true);
      const data = await api.getMyQuizzes();
      setQuizzes(data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Failed to fetch quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setShowViewDialog(true);
  };

  const handleEditQuiz = (quiz: Quiz) => {
    // Navigate to the dedicated edit page
    navigate(`/professor/edit-quiz/${quiz.id}`);
  };

  const handleDeleteQuiz = (quiz: Quiz) => {
    setQuizToDelete(quiz);
    setShowDeleteDialog(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;

    try {
      await api.deleteQuiz(quizToDelete.id);
      toast.success('Quiz deleted successfully');
      fetchMyQuizzes();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    } finally {
      setShowDeleteDialog(false);
      setQuizToDelete(null);
    }
  };

  const getStatusBadge = (isApproved: boolean, isActive: boolean) => {
    if (!isApproved) {
      return <Badge variant="secondary">Pending Approval</Badge>;
    }
    if (isActive) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="destructive">Inactive</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading your quizzes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Quizzes</h1>
          <p className="text-gray-600 mt-2">Manage and edit your created quizzes</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button 
            onClick={fetchMyQuizzes} 
            variant="outline" 
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => navigate('/professor/quiz')} 
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Create New Quiz
          </Button>
        </div>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-500 text-lg mb-4">No quizzes found</div>
            <Button onClick={() => navigate('/professor/quiz')}>
              Create Your First Quiz
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Quizzes ({quizzes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Time Limit</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quizzes.map((quiz) => (
                  <TableRow key={quiz.id}>
                    <TableCell className="font-medium">{quiz.title}</TableCell>
                    <TableCell>{quiz.courseTitle}</TableCell>
                    <TableCell>{getStatusBadge(quiz.isApproved, quiz.isActive)}</TableCell>
                    <TableCell>{quiz.questions?.length || 0}</TableCell>
                    <TableCell>{quiz.timeLimit} min</TableCell>
                    <TableCell>{formatDate(quiz.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewQuiz(quiz)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditQuiz(quiz)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuiz(quiz)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* View Quiz Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quiz Details</DialogTitle>
            <DialogDescription>
              View the complete quiz information and questions
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuiz && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Quiz Information</h3>
                  <div className="mt-2 space-y-2 text-sm">
                    <div><span className="font-medium">Title:</span> {selectedQuiz.title}</div>
                    <div><span className="font-medium">Course:</span> {selectedQuiz.courseTitle}</div>
                    <div><span className="font-medium">Time Limit:</span> {selectedQuiz.timeLimit} minutes</div>
                    <div><span className="font-medium">Passing Score:</span> {selectedQuiz.passingScore}%</div>
                    <div><span className="font-medium">Max Attempts:</span> {selectedQuiz.maxAttempts}</div>
                    <div><span className="font-medium">Status:</span> {getStatusBadge(selectedQuiz.isApproved, selectedQuiz.isActive)}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Description</h3>
                  <p className="mt-2 text-sm text-gray-600">{selectedQuiz.description}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Questions ({selectedQuiz.questions?.length || 0})</h3>
                <div className="space-y-4">
                  {selectedQuiz.questions?.map((question, index) => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                          Q{index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium mb-2">{question.question}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Type: {question.type}</span>
                            <span>Points: {question.points}</span>
                          </div>
                                                     {question.options && question.options.length > 0 && (
                             <div className="mt-3">
                               <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
                               <ul className="space-y-1">
                                 {question.options.map((option, optIndex) => (
                                   <li 
                                     key={optIndex} 
                                     className={`text-sm ${
                                       question.correctAnswer === option 
                                         ? 'text-green-600 font-semibold' 
                                         : 'text-gray-600'
                                     }`}
                                   >
                                     {String.fromCharCode(65 + optIndex)}. {option}
                                     {question.correctAnswer === option && (
                                       <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                         ✓ Correct Answer
                                       </span>
                                     )}
                                   </li>
                                 ))}
                               </ul>
                             </div>
                           )}
                           {question.correctAnswer && !question.options && (
                             <div className="mt-3">
                               <p className="text-sm font-medium text-gray-700 mb-2">Correct Answer:</p>
                               <p className="text-sm text-green-600 font-semibold bg-green-50 p-2 rounded">
                                 {question.correctAnswer}
                               </p>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{quizToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteQuiz} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 
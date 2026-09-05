import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Users, CheckCircle, XCircle, BarChart3, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

interface QuizAttempt {
  id: string;
  studentName: string;
  studentEmail: string;
  score: number;
  totalPoints: number;
  passed: boolean;
  startedAt: string;
  completedAt: string;
}

interface QuizResult {
  id: string;
  title: string;
  courseTitle: string;
  status: string;
  totalAttempts: number;
  averageScore: number;
  passedAttempts: number;
  attempts: QuizAttempt[];
}

const QuizResults: React.FC = () => {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizResult | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const data = await api.getProfessorQuizResults();
      console.log('Professor results data:', data);
      setResults(data);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load quiz results');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (passed: boolean) => {
    return (
      <Badge variant={passed ? 'default' : 'destructive'}>
        {passed ? 'Passed' : 'Failed'}
      </Badge>
    );
  };

  const getQuizStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      under_review: 'bg-blue-100 text-blue-800',
      needs_revision: 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
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

  const calculatePassRate = (passed: number, total: number) => {
    if (!passed || !total || total === 0) return 0;
    const rate = (passed / total) * 100;
    return isNaN(rate) ? 0 : rate;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading quiz results...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Quiz Results</h1>
          <p className="text-gray-600">View performance of your quizzes</p>
        </div>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No quiz results available yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {results.map((quiz) => (
            <Card key={quiz.id}>
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="truncate">{quiz.title}</span>
                      {getQuizStatusBadge(quiz.status)}
                    </CardTitle>
                    <CardDescription className="truncate">{quiz.courseTitle}</CardDescription>
                  </div>
                  <div className="grid grid-cols-3 gap-4 lg:flex lg:items-center lg:gap-6">
                    <div className="text-center">
                      <div className="text-xl lg:text-2xl font-bold">{quiz.totalAttempts}</div>
                      <div className="text-xs lg:text-sm text-gray-600">Attempts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl lg:text-2xl font-bold">
                        {typeof quiz.averageScore === 'number' && !isNaN(quiz.averageScore) ? quiz.averageScore.toFixed(1) : '0.0'}%
                      </div>
                      <div className="text-xs lg:text-sm text-gray-600">Avg Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl lg:text-2xl font-bold">
                        {(() => {
                          const rate = calculatePassRate(quiz.passedAttempts, quiz.totalAttempts);
                          return isNaN(rate) ? '0.0' : rate.toFixed(1);
                        })()}%
                      </div>
                      <div className="text-xs lg:text-sm text-gray-600">Pass Rate</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">Student Performance</span>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto w-[95vw] sm:w-auto">
                        <DialogHeader>
                          <DialogTitle className="text-lg sm:text-xl">{quiz.title} - Student Results</DialogTitle>
                          <DialogDescription>
                            Detailed performance for {quiz.courseTitle}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{quiz.totalAttempts}</div>
                              <div className="text-sm text-gray-600">Total Attempts</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{quiz.passedAttempts}</div>
                              <div className="text-sm text-gray-600">Passed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-600">
                                {(() => {
                                  const failed = quiz.totalAttempts - quiz.passedAttempts;
                                  return isNaN(failed) ? 0 : failed;
                                })()}
                              </div>
                              <div className="text-sm text-gray-600">Failed</div>
                            </div>
                          </div>
                          
                          <div className="overflow-x-auto">
                            <Table>
                                                          <TableHeader>
                                <TableRow>
                                  <TableHead className="whitespace-nowrap">Student</TableHead>
                                  <TableHead className="whitespace-nowrap">Email</TableHead>
                                  <TableHead className="whitespace-nowrap">Score</TableHead>
                                  <TableHead className="whitespace-nowrap">Status</TableHead>
                                  <TableHead className="whitespace-nowrap">Completed</TableHead>
                                </TableRow>
                              </TableHeader>
                            <TableBody>
                              {quiz.attempts.map((attempt) => (
                                <TableRow key={attempt.id}>
                                  <TableCell className="font-medium whitespace-nowrap">{attempt.studentName}</TableCell>
                                  <TableCell className="whitespace-nowrap">{attempt.studentEmail}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                                                              <span className="font-medium whitespace-nowrap">
                                        {(() => {
                                          if (typeof attempt.score === 'number' && !isNaN(attempt.score)) {
                                            return attempt.score.toFixed(1);
                                          }
                                          return '0.0';
                                        })()}%
                                      </span>
                                      <Progress 
                                        value={(() => {
                                          if (typeof attempt.score === 'number' && !isNaN(attempt.score)) {
                                            return attempt.score;
                                          }
                                          return 0;
                                        })()} 
                                        className="w-16 sm:w-20" 
                                      />
                                    </div>
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">{getStatusBadge(attempt.passed)}</TableCell>
                                  <TableCell className="whitespace-nowrap">{formatDate(attempt.completedAt)}</TableCell>
                                </TableRow>
                              ))}
                                                          </TableBody>
                            </Table>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {quiz.attempts.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Pass Rate</span>
                        <span>
                          {(() => {
                            const rate = calculatePassRate(quiz.passedAttempts, quiz.totalAttempts);
                            return isNaN(rate) ? '0.0' : rate.toFixed(1);
                          })()}%
                        </span>
                      </div>
                      <Progress 
                        value={(() => {
                          const rate = calculatePassRate(quiz.passedAttempts, quiz.totalAttempts);
                          return isNaN(rate) ? 0 : rate;
                        })()} 
                        className="w-full" 
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizResults; 
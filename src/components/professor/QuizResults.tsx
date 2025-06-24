
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { Eye, Users, Clock, Award, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { QuizResults as QuizResultsType, QuizAttempt } from '@/types';

interface QuizResultsProps {
  professorId: string;
}

const QuizResults = ({ professorId }: QuizResultsProps) => {
  const [quizResults, setQuizResults] = useState<QuizResultsType[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizResultsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const results = await api.getQuizResults(professorId);
        setQuizResults(results);
        if (results.length > 0) {
          setSelectedQuiz(results[0]);
        }
      } catch (error) {
        console.error('Error fetching quiz results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [professorId]);

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading quiz results...</div>;
  }

  if (quizResults.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2">No Quiz Results Yet</h3>
          <p className="text-gray-600">Students haven't taken any of your quizzes yet.</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = quizResults.map(result => ({
    name: result.quiz.title.length > 20 ? result.quiz.title.substring(0, 20) + '...' : result.quiz.title,
    attempts: result.totalAttempts,
    averageScore: Math.round(result.averageScore),
    passRate: Math.round(result.passRate)
  }));

  const pieData = selectedQuiz ? [
    { name: 'Passed', value: selectedQuiz.attempts.filter(a => a.passed).length, color: '#10b981' },
    { name: 'Failed', value: selectedQuiz.attempts.filter(a => !a.passed).length, color: '#ef4444' }
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Quiz Results</h2>
        <p className="text-gray-600">View detailed analytics for your quiz performance</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Quizzes</p>
                <p className="text-2xl font-bold">{quizResults.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Attempts</p>
                <p className="text-2xl font-bold">
                  {quizResults.reduce((sum, result) => sum + result.totalAttempts, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    quizResults.reduce((sum, result) => sum + result.averageScore, 0) / quizResults.length
                  )}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Time</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    quizResults.reduce((sum, result) => sum + result.averageTimeSpent, 0) / quizResults.length
                  )}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedQuiz?.quiz.id || ''} onValueChange={(value) => {
        const quiz = quizResults.find(q => q.quiz.id === value);
        if (quiz) setSelectedQuiz(quiz);
      }}>
        <div className="flex flex-wrap gap-2 mb-4">
          {quizResults.map((result) => (
            <Button
              key={result.quiz.id}
              variant={selectedQuiz?.quiz.id === result.quiz.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedQuiz(result)}
            >
              {result.quiz.title}
              <Badge variant="secondary" className="ml-2">
                {result.totalAttempts}
              </Badge>
            </Button>
          ))}
        </div>

        {selectedQuiz && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {selectedQuiz.quiz.title}
                </CardTitle>
                <CardDescription>{selectedQuiz.quiz.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedQuiz.totalAttempts}</p>
                    <p className="text-sm text-gray-600">Total Attempts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{Math.round(selectedQuiz.averageScore)}%</p>
                    <p className="text-sm text-gray-600">Average Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{Math.round(selectedQuiz.passRate)}%</p>
                    <p className="text-sm text-gray-600">Pass Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{Math.round(selectedQuiz.averageTimeSpent)}m</p>
                    <p className="text-sm text-gray-600">Avg Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pass/Fail Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Pass/Fail Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm">Passed ({pieData[0]?.value || 0})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-sm">Failed ({pieData[1]?.value || 0})</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Score Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[
                      { range: '0-20%', count: selectedQuiz.attempts.filter(a => a.score < 20).length },
                      { range: '21-40%', count: selectedQuiz.attempts.filter(a => a.score >= 20 && a.score < 40).length },
                      { range: '41-60%', count: selectedQuiz.attempts.filter(a => a.score >= 40 && a.score < 60).length },
                      { range: '61-80%', count: selectedQuiz.attempts.filter(a => a.score >= 60 && a.score < 80).length },
                      { range: '81-100%', count: selectedQuiz.attempts.filter(a => a.score >= 80).length },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Attempts Table */}
            <Card>
              <CardHeader>
                <CardTitle>Individual Attempts</CardTitle>
                <CardDescription>Detailed view of all student attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time Spent</TableHead>
                      <TableHead>Completed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedQuiz.attempts
                      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                      .map((attempt) => (
                        <TableRow key={attempt.id}>
                          <TableCell className="font-medium">{attempt.studentName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                                {attempt.score}%
                              </span>
                              <span className="text-sm text-gray-500">
                                ({Math.round((attempt.score / 100) * attempt.totalPoints)}/{attempt.totalPoints} pts)
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={attempt.passed ? 'default' : 'destructive'}>
                              {attempt.passed ? 'Passed' : 'Failed'}
                            </Badge>
                          </TableCell>
                          <TableCell>{attempt.timeSpent}m</TableCell>
                          <TableCell>{format(new Date(attempt.completedAt), 'MMM d, yyyy HH:mm')}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </Tabs>

      {/* Overall Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Performance Overview</CardTitle>
          <CardDescription>Compare performance across all your quizzes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="attempts" fill="#3b82f6" name="Attempts" />
              <Bar dataKey="averageScore" fill="#10b981" name="Avg Score %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizResults;

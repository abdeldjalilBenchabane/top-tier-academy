import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, XCircle, ArrowLeft, ArrowRight, HelpCircle, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  points: number;
  explanation?: string;
  options?: string[];
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  timeLimit?: number;
  passingScore: number;
  questions: QuizQuestion[];
}

const QuizTaking: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        // Get the course ID from the URL or localStorage
        const courseId = localStorage.getItem('currentCourseId') || '13'; // Fallback to course 13
        console.log('Fetching quizzes for course:', courseId);
        
        const courseQuizzes = await api.getCourseQuizzes(courseId);
        console.log('Found quizzes:', courseQuizzes);
        
        const foundQuiz = courseQuizzes.find(q => q.id === quizId);
        console.log('Looking for quiz ID:', quizId, 'Found:', foundQuiz);
        console.log('Quiz questions:', foundQuiz?.questions);
        if (foundQuiz?.questions) {
          foundQuiz.questions.forEach((q, index) => {
            console.log(`Question ${index + 1}:`, q);
            console.log(`Question ${index + 1} options:`, q.options);
          });
        }
        
        if (foundQuiz) {
          setQuiz(foundQuiz as Quiz);
          if (foundQuiz.timeLimit) {
            setTimeLeft(foundQuiz.timeLimit * 60); // Convert to seconds
          }
        } else {
          toast.error('Quiz not found');
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast.error('Failed to load quiz');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (timeLeft > 0 && !showResults) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, showResults]);

  const startQuiz = async () => {
    try {
      console.log('Starting quiz with ID:', quizId);
      const { attemptId: newAttemptId } = await api.startQuizAttempt(quizId!);
      setAttemptId(newAttemptId);
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast.error('Failed to start quiz');
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!attemptId) return;

    setIsSubmitting(true);
    try {
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer
      }));

      const results = await api.submitQuizAnswers(attemptId, answersArray);
      setResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestion = (question: QuizQuestion) => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <RadioGroup
            value={answers[question.id] || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            {question.options && question.options.length > 0 ? (
              question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg">
                  <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                  <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer flex-1">
                    {option}
                  </Label>
                </div>
              ))
            ) : (
              <div className="text-red-500">No options available for this question</div>
            )}
          </RadioGroup>
        );

      case 'true-false':
        return (
          <RadioGroup
            value={answers[question.id] || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${question.id}-true`} />
              <Label htmlFor={`${question.id}-true`}>True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${question.id}-false`} />
              <Label htmlFor={`${question.id}-false`}>False</Label>
            </div>
          </RadioGroup>
        );

      case 'short-answer':
        return (
          <Textarea
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[100px]"
          />
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading quiz...</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Quiz not found</div>
      </div>
    );
  }

  if (!attemptId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="mb-4"
              >
                ← Back to Course
              </Button>
            </div>
            
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <HelpCircle className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">{quiz.title}</CardTitle>
                <CardDescription className="text-lg text-gray-600 mt-2">{quiz.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{quiz.questions.length}</div>
                    <div className="text-gray-600">Questions</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{quiz.timeLimit ? `${quiz.timeLimit}m` : '∞'}</div>
                    <div className="text-gray-600">Time Limit</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">{quiz.passingScore}%</div>
                    <div className="text-gray-600">Passing Score</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{quiz.questions.reduce((sum, q) => sum + q.points, 0)}</div>
                    <div className="text-gray-600">Total Points</div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-800 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-semibold">Important Notes:</span>
                  </div>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• You can retake this quiz if needed</li>
                    <li>• Make sure you have enough time to complete all questions</li>
                    <li>• Your answers will be automatically saved</li>
                    <li>• You need {quiz.passingScore}% to pass</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={startQuiz} 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg font-semibold"
                >
                  Start Quiz Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="mb-4"
              >
                ← Back to Course
              </Button>
            </div>
            
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                  results.passed 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                    : 'bg-gradient-to-r from-red-500 to-pink-600'
                }`}>
                  {results.passed ? (
                    <CheckCircle className="h-10 w-10 text-white" />
                  ) : (
                    <XCircle className="h-10 w-10 text-white" />
                  )}
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">
                  {results.score.toFixed(1)}%
                </CardTitle>
                <CardDescription className={`text-xl font-semibold ${
                  results.passed ? 'text-green-600' : 'text-red-600'
                }`}>
                  {results.passed ? 'Congratulations! You Passed!' : 'Keep Trying! You Can Do Better!'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{results.correctAnswers}</div>
                    <div className="text-gray-600">Correct</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">{results.totalQuestions - results.correctAnswers}</div>
                    <div className="text-gray-600">Incorrect</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{results.totalPoints}</div>
                    <div className="text-gray-600">Total Points</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{quiz.passingScore}%</div>
                    <div className="text-gray-600">Required</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Performance Summary</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>• You answered {results.correctAnswers} out of {results.totalQuestions} questions correctly</div>
                    <div>• Your score: {results.score.toFixed(1)}%</div>
                    <div>• Passing requirement: {quiz.passingScore}%</div>
                    <div>• Status: <span className={results.passed ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {results.passed ? 'PASSED' : 'FAILED'}
                    </span></div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => navigate(-1)} 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg font-semibold"
                >
                  Back to Course
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with back button and timer */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Course
            </Button>
            
            {timeLeft > 0 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                <Clock className="h-4 w-4 text-red-600" />
                <span className="font-mono text-red-600 font-semibold">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">{quiz.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    Question {currentQuestionIndex + 1} of {quiz.questions.length}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {currentQuestion.type}
                  </Badge>
                  <Badge variant="secondary" className="bg-green-50 text-green-700">
                    {currentQuestion.points} points
                  </Badge>
                </div>
              </div>
              <Progress value={progress} className="w-full h-2" />
            </CardHeader>
            
            <CardContent className="space-y-8">
              {/* Question */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentQuestion.question}</h3>
                  {renderQuestion(currentQuestion)}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>

                {/* Question numbers */}
                <div className="flex gap-2 flex-wrap justify-center">
                  {quiz.questions.map((_, index) => (
                    <Button
                      key={index}
                      variant={index === currentQuestionIndex ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentQuestionIndex(index)}
                      className="w-10 h-10 p-0"
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>

                {currentQuestionIndex === quiz.questions.length - 1 ? (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleNextQuestion}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuizTaking; 
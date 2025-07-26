import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Save, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { QuizQuestion } from '@/types';
import { toast } from '@/lib/toast';

const EditQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    course_id: 0,
    timeLimit: '',
    passingScore: 70,
    maxAttempts: ''
  });

  const [questions, setQuestions] = useState<Omit<QuizQuestion, 'id'>[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<{ id: number; title: string; path: string }[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Fetch quiz data and professor's courses on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch courses
        const coursesData = await api.getProfessorCourses();
        console.log('Fetched courses for quiz editing:', coursesData);
        setCourses(coursesData);
        setLoadingCourses(false);
        
        // Fetch quiz data
        if (id) {
          const quizData = await api.getMyQuizzes();
          const quiz = quizData.find(q => q.id === id);
          
          if (quiz) {
            // Find course_id by matching course title
            const matchingCourse = coursesData.find(c => c.title === quiz.courseTitle);
            const courseId = matchingCourse ? matchingCourse.id : 0;
            
            console.log('Matching course for title:', quiz.courseTitle, 'found:', matchingCourse);
            
            setQuizData({
              title: quiz.title || '',
              description: quiz.description || '',
              course_id: courseId,
              timeLimit: quiz.time_limit ? quiz.time_limit.toString() : (quiz.timeLimit ? quiz.timeLimit.toString() : ''),
              passingScore: quiz.passing_score || quiz.passingScore || 70,
              maxAttempts: quiz.max_attempts ? quiz.max_attempts.toString() : (quiz.maxAttempts ? quiz.maxAttempts.toString() : '')
            });
            console.log('Full quiz data:', quiz);
            console.log('Quiz fields:', Object.keys(quiz));
            console.log('Set quiz data with course_id:', quiz.course_id, 'type:', typeof quiz.course_id);
            console.log('Available courses:', coursesData.map(c => ({ id: c.id, title: c.title, type: typeof c.id })));
            console.log('Quiz course_id matches available course:', coursesData.some(c => c.id === parseInt(quiz.course_id)));
            console.log('Questions loaded:', quiz.questions?.length || 0);
            console.log('All questions:', quiz.questions);
            
            const mappedQuestions = quiz.questions?.map(q => {
              console.log('Mapping question:', q);
              
              // Set default options for true/false questions
              let options = q.options || [];
              if (q.type === 'true-false' && (!options || options.length === 0)) {
                options = ['True', 'False'];
              }
              
              return {
                question: q.question || '',
                type: q.type,
                options: options,
                correctAnswer: q.type === 'true-false' ? (q.correctAnswer === true ? true : false) : q.correctAnswer,
                points: q.points || 1,
                explanation: q.explanation || ''
              };
            }) || [];
            console.log('Mapped questions:', mappedQuestions);
            setQuestions(mappedQuestions);
          } else {
            toast.error('Quiz not found');
            navigate('/professor/my-quizzes');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load quiz data');
        navigate('/professor/my-quizzes');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, navigate]);

  const addQuestion = () => {
    setQuestions([...questions, {
      question: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 1,
      explanation: ''
    }]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options![optionIndex] = value;
      setQuestions(updated);
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    console.log('Validation check:', {
      title: quizData.title,
      description: quizData.description,
      course_id: quizData.course_id,
      questionsLength: questions.length
    });
    console.log('Questions array:', questions);
    
    if (!quizData.title || !quizData.description || !quizData.course_id || questions.length === 0) {
      toast.error('Please fill in all required fields, select a course, and add at least one question');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.question.trim()) {
        toast.error(`Question ${i + 1} is empty`);
        return;
      }
      if (question.type === 'multiple-choice' && (!question.options || question.options.some(opt => !opt.trim()))) {
        toast.error(`Question ${i + 1} has empty options`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const updateData = {
        title: quizData.title,
        description: quizData.description,
        course_id: quizData.course_id,
        questions: questions.map((q, index) => ({
          ...q,
          id: `q-${Date.now()}-${index}`
        })),
        timeLimit: quizData.timeLimit ? parseInt(quizData.timeLimit) : undefined,
        passingScore: quizData.passingScore,
        maxAttempts: quizData.maxAttempts ? parseInt(quizData.maxAttempts) : undefined
      };
      
      console.log('Sending update data to backend:', updateData);
      
      await api.updateQuiz(id!, updateData);

      toast.success('Quiz updated successfully');
      navigate('/professor/my-quizzes');
    } catch (error) {
      console.error('Error updating quiz:', error);
      toast.error('Failed to update quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading quiz data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/professor/my-quizzes')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Quizzes
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Edit Quiz</h2>
          <p className="text-gray-600">Modify your existing quiz</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Information</CardTitle>
          <CardDescription>Basic information about your quiz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Quiz Title *</Label>
            <Input
              id="title"
              value={quizData.title}
              onChange={(e) => setQuizData({...quizData, title: e.target.value})}
              placeholder="Enter quiz title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={quizData.description}
              onChange={(e) => setQuizData({...quizData, description: e.target.value})}
              placeholder="Describe what this quiz covers"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="course">Select Course *</Label>
            {loadingCourses ? (
              <div className="text-sm text-gray-500">Loading courses...</div>
            ) : courses.length === 0 ? (
              <div className="text-sm text-red-500">No approved courses found. Please create and get approval for a course first.</div>
            ) : (
              <Select
                value={quizData.course_id ? quizData.course_id.toString() : ''}
                onValueChange={(value) => {
                  console.log('Course selected:', value);
                  setQuizData({...quizData, course_id: parseInt(value)});
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course">
                    {quizData.course_id && courses.find(c => c.id === quizData.course_id)?.title}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{course.title}</span>
                        {course.path && (
                          <span className="text-xs text-gray-500">{course.path}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
              <Input
                id="timeLimit"
                type="number"
                value={quizData.timeLimit}
                onChange={(e) => setQuizData({...quizData, timeLimit: e.target.value})}
                placeholder="No limit"
              />
            </div>

            <div>
              <Label htmlFor="passingScore">Passing Score (%)</Label>
              <Input
                id="passingScore"
                type="number"
                min="0"
                max="100"
                value={quizData.passingScore}
                onChange={(e) => setQuizData({...quizData, passingScore: parseInt(e.target.value)})}
              />
            </div>

            <div>
              <Label htmlFor="maxAttempts">Max Attempts</Label>
              <Input
                id="maxAttempts"
                type="number"
                value={quizData.maxAttempts}
                onChange={(e) => setQuizData({...quizData, maxAttempts: e.target.value})}
                placeholder="Unlimited"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Questions</CardTitle>
              <CardDescription>Add questions to your quiz</CardDescription>
            </div>
            <Button onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">❓</div>
              <p>No questions added yet. Click "Add Question" to get started.</p>
            </div>
          ) : (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {questions.map((question, questionIndex) => (
                <Card key={questionIndex} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Question {questionIndex + 1}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeQuestion(questionIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Question *</Label>
                      <Textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                        placeholder="Enter your question"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Question Type</Label>
                        <Select
                          value={question.type}
                          onValueChange={(value) => updateQuestion(questionIndex, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                            <SelectItem value="true-false">True/False</SelectItem>
                            <SelectItem value="short-answer">Short Answer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Points</Label>
                        <Input
                          type="number"
                          min="1"
                          value={question.points}
                          onChange={(e) => updateQuestion(questionIndex, 'points', parseInt(e.target.value))}
                        />
                      </div>
                    </div>

                    {question.type === 'multiple-choice' && (
                      <div>
                        <Label>Answer Options</Label>
                        <div className="space-y-2">
                          {question.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                              <Input
                                value={option}
                                onChange={(e) => updateQuestionOption(questionIndex, optionIndex, e.target.value)}
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                              <Button
                                variant={String(question.correctAnswer) === String(optionIndex) ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateQuestion(questionIndex, 'correctAnswer', optionIndex)}
                              >
                                {String(question.correctAnswer) === String(optionIndex) ? '✓ Correct' : 'Mark Correct'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {question.type === 'true-false' && (
                      <div>
                        <Label>Correct Answer</Label>
                        <Select
                          value={typeof question.correctAnswer === 'boolean' ? (question.correctAnswer ? 'true' : 'false') : String(question.correctAnswer)}
                          onValueChange={(value) => updateQuestion(questionIndex, 'correctAnswer', value === 'true')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select correct answer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {question.type === 'short-answer' && (
                      <div>
                        <Label>Sample Correct Answer</Label>
                        <Input
                          value={question.correctAnswer as string}
                          onChange={(e) => updateQuestion(questionIndex, 'correctAnswer', e.target.value)}
                          placeholder="Enter a sample correct answer"
                        />
                      </div>
                    )}

                    <div>
                      <Label>Explanation (Optional)</Label>
                      <Textarea
                        value={question.explanation}
                        onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                        placeholder="Explain the correct answer"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/professor/my-quizzes')}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || questions.length === 0}
          className="min-w-32"
        >
          {isSubmitting ? (
            "Updating..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Update Quiz
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default EditQuiz; 
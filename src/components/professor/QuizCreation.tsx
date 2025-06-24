
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { QuizQuestion } from '@/types';
import { toast } from '@/lib/toast';

const QuizCreation = () => {
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    timeLimit: '',
    passingScore: 70,
    maxAttempts: ''
  });

  const [questions, setQuestions] = useState<Omit<QuizQuestion, 'id'>[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!quizData.title || !quizData.description || questions.length === 0) {
      toast.error('Please fill in all required fields and add at least one question');
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
      await api.submitQuiz({
        title: quizData.title,
        description: quizData.description,
        questions: questions.map((q, index) => ({
          ...q,
          id: `q-${Date.now()}-${index}`
        })),
        timeLimit: quizData.timeLimit ? parseInt(quizData.timeLimit) : undefined,
        passingScore: quizData.passingScore,
        maxAttempts: quizData.maxAttempts ? parseInt(quizData.maxAttempts) : undefined,
        createdBy: '1' // This should be the current user's ID
      });

      toast.success('Quiz submitted for approval');
      
      // Reset form
      setQuizData({
        title: '',
        description: '',
        timeLimit: '',
        passingScore: 70,
        maxAttempts: ''
      });
      setQuestions([]);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Create Quiz</h2>
        <p className="text-gray-600">Create engaging quizzes for your students</p>
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
            <div className="space-y-6">
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
                                variant={question.correctAnswer === optionIndex ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateQuestion(questionIndex, 'correctAnswer', optionIndex)}
                              >
                                {question.correctAnswer === optionIndex ? '✓ Correct' : 'Mark Correct'}
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
                          value={question.correctAnswer as string}
                          onValueChange={(value) => updateQuestion(questionIndex, 'correctAnswer', value === 'true')}
                        >
                          <SelectTrigger>
                            <SelectValue />
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

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || questions.length === 0}
          className="min-w-32"
        >
          {isSubmitting ? (
            "Submitting..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Submit Quiz
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default QuizCreation;

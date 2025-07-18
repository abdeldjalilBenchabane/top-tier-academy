import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  MessageSquare, 
  Search, 
  Calendar,
  BookOpen,
  Heart,
  Reply,
  Edit3,
  Trash2,
  Pin
} from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

const CommentsSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const comments = [
    {
      id: 1,
      courseTitle: 'تطوير تطبيقات الويب بـ React',
      lessonTitle: 'React Hooks - useState و useEffect',
      content: 'شكراً للشرح الرائع! سؤال: كيف يمكنني استخدام useEffect لجلب البيانات من API؟',
      date: '2024-03-20T14:30:00',
      isPinned: true,
      likes: 5,
      replies: 2,
      tags: ['سؤال', 'useEffect', 'API'],
      instructorReply: {
        content: 'يمكنك استخدام useEffect مع async/await كما هو موضح في الدرس القادم',
        date: '2024-03-20T16:15:00'
      }
    },
    {
      id: 2,
      courseTitle: 'أساسيات قواعد البيانات MySQL',
      lessonTitle: 'الاستعلامات المتقدمة - JOIN',
      content: 'هذا الدرس كان معقد قليلاً، هل يمكن توضيح الفرق بين INNER JOIN و LEFT JOIN أكثر؟',
      date: '2024-03-18T10:20:00',
      isPinned: false,
      likes: 3,
      replies: 1,
      tags: ['استفسار', 'JOIN', 'SQL']
    },
    {
      id: 3,
      courseTitle: 'البرمجة بـ JavaScript من الصفر',
      lessonTitle: 'المصفوفات والكائنات',
      content: 'مثال رائع على استخدام map() و filter()! حفظت هذا التعليق للمراجعة لاحقاً.',
      date: '2024-03-15T19:45:00',
      isPinned: true,
      likes: 8,
      replies: 0,
      tags: ['ملاحظة', 'مصفوفات', 'JavaScript']
    },
    {
      id: 4,
      courseTitle: 'تطوير تطبيقات الويب بـ React',
      lessonTitle: 'إدارة الحالة مع Redux',
      content: 'لم أفهم جزئية الـ Actions و Reducers بشكل جيد، هل يمكن إعادة شرحها في جلسة مباشرة؟',
      date: '2024-03-14T16:00:00',
      isPinned: false,
      likes: 2,
      replies: 3,
      tags: ['طلب', 'Redux', 'جلسة مباشرة']
    }
  ];

  const getFilteredComments = () => {
    let filtered = comments;

    if (searchQuery) {
      filtered = filtered.filter(comment => 
        comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comment.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comment.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comment.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedFilter !== 'all') {
      switch (selectedFilter) {
        case 'pinned':
          filtered = filtered.filter(comment => comment.isPinned);
          break;
        case 'questions':
          filtered = filtered.filter(comment => 
            comment.tags.includes('سؤال') || comment.tags.includes('استفسار')
          );
          break;
        case 'notes':
          filtered = filtered.filter(comment => 
            comment.tags.includes('ملاحظة') || comment.tags.includes('تذكير')
          );
          break;
      }
    }

    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  };

  const filteredComments = getFilteredComments();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">تعليقاتي وملاحظاتي</h2>
        <div className="text-sm text-gray-600">
          {comments.length} تعليق
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="ابحث في تعليقاتك..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'pinned', label: 'مثبت' },
                { id: 'questions', label: 'أسئلة' },
                { id: 'notes', label: 'ملاحظات' }
              ].map((filter) => (
                <Button
                  key={filter.id}
                  variant={selectedFilter === filter.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(filter.id)}
                  className={selectedFilter === filter.id ? 'bg-education-blue' : ''}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {filteredComments.map((comment) => (
          <Card key={comment.id} className={`${comment.isPinned ? 'ring-2 ring-education-yellow/20 bg-yellow-50/30' : ''} hover:shadow-md transition-shadow`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-education-blue" />
                    <span className="font-medium text-sm">{comment.courseTitle}</span>
                    {comment.isPinned && (
                      <Pin className="w-4 h-4 text-education-yellow fill-current" />
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{comment.lessonTitle}</h4>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(comment.date), 'dd MMM yyyy - HH:mm', { locale: enUS })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      <span>{comment.likes}</span>
                    </div>
                    {comment.replies > 0 && (
                      <div className="flex items-center gap-1">
                        <Reply className="w-3 h-3" />
                        <span>{comment.replies} رد</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed">{comment.content}</p>
              </div>

              {/* Tags */}
              <div className="flex gap-2 flex-wrap">
                {comment.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Instructor Reply */}
              {comment.instructorReply && (
                <div className="bg-blue-50 border-r-4 border-education-blue p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-education-blue text-white text-xs">
                        م
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-education-blue">رد المدرس</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(comment.instructorReply.date), 'dd MMM - HH:mm', { locale: enUS })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.instructorReply.content}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm">
                  <Edit3 className="w-4 h-4 ml-2" />
                  تعديل
                </Button>
                <Button variant="outline" size="sm">
                  <Pin className="w-4 h-4 ml-2" />
                  {comment.isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredComments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد تعليقات
              </h3>
              <p className="text-gray-600">
                {searchQuery ? 'لم يتم العثور على تعليقات تطابق بحثك' : 'لم تضف أي تعليقات بعد'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="text-center p-4">
            <MessageSquare className="w-8 h-8 mx-auto text-education-blue mb-2" />
            <div className="text-2xl font-bold text-gray-900">{comments.length}</div>
            <div className="text-sm text-gray-600">إجمالي التعليقات</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center p-4">
            <Pin className="w-8 h-8 mx-auto text-education-yellow mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {comments.filter(c => c.isPinned).length}
            </div>
            <div className="text-sm text-gray-600">مثبتة</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center p-4">
            <Heart className="w-8 h-8 mx-auto text-red-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {comments.reduce((sum, c) => sum + c.likes, 0)}
            </div>
            <div className="text-sm text-gray-600">إعجابات</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center p-4">
            <Reply className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {comments.reduce((sum, c) => sum + c.replies, 0)}
            </div>
            <div className="text-sm text-gray-600">ردود</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommentsSection;
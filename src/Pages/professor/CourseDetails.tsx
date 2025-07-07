 import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit } from 'lucide-react';
import PathSelector from '@/components/admin/PathSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Book, Layers, Calendar, FileText, Video, Image as ImageIcon, BookOpen, Download } from 'lucide-react';

const ProfessorCourseDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Add state for path selector dialog
  const [showPathSelector, setShowPathSelector] = useState(false);
  // Add reloadCourse function to refetch course data
  const reloadCourse = () => {
    // Call the same logic as in useEffect to reload course data
    // For now, just call the effect's fetch function
    // (You may want to refactor the effect to expose the fetch function)
    // For now, set a state to trigger useEffect
    setReloadFlag(flag => !flag);
  };
  // Add a reloadFlag state to trigger useEffect
  const [reloadFlag, setReloadFlag] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/courses/${id}`);
        if (!res.ok) throw new Error('Failed to fetch course');
        const data = await res.json();
        setCourse(data);
        setTitle(data.title);
        setDescription(data.description);
      } catch (err) {
        setError('Failed to load course');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id, reloadFlag]);

  const handleDeleteCourse = async () => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to delete course');
      navigate('/professor/courses');
    } catch (err) {
      setError('Failed to delete course');
    }
  };

  const handleEditCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title, description })
      });
      if (!res.ok) throw new Error('Failed to update course');
      setEditMode(false);
      // Optionally refetch course
    } catch (err) {
      setError('Failed to update course');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!course) return <div className="p-8 text-center">Course not found</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editMode ? (
            <>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Course Title" />
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Course Description" />
              <Button onClick={handleEditCourse}>Save</Button>
              <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold">{course.title}</h2>
              <p className="text-gray-600">{course.description}</p>
              <Button variant="outline" onClick={() => setEditMode(true)}><Edit className="h-4 w-4 mr-1" /> Edit</Button>
            </>
          )}
          {course.cover_url && (
            <img src={course.cover_url} alt="Course Cover" className="w-full max-w-xs rounded" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sections</CardTitle>
        </CardHeader>
        <CardContent>
          {course.sections && course.sections.length > 0 ? (
            course.sections.map(section => (
              <div key={section.id} className="mb-6 border-b pb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{section.title}</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline"><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                {section.blocks && section.blocks.length > 0 ? (
                  section.blocks.map(block => (
                    <div key={block.id} className="ml-4 mb-2 p-2 border rounded">
                      <div className="flex justify-between items-center">
                        <span className="capitalize font-medium">{block.type}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline"><Edit className="h-4 w-4" /></Button>
                          <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <div className="mt-1">
                        {block.type === 'text' ? (
                          <div>{block.content}</div>
                        ) : block.type === 'image' ? (
                          <img src={block.files && block.files[0]?.file_path} alt="Block" className="max-w-xs rounded" />
                        ) : block.type === 'pdf' ? (
                          <a href={block.files && block.files[0]?.file_path} target="_blank" rel="noopener noreferrer">View PDF</a>
                        ) : block.type === 'video' ? (
                          <video src={block.files && block.files[0]?.file_path} controls className="max-w-xs" />
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : <div className="text-gray-500">No content blocks</div>}
                <Button size="sm" className="mt-2"><Plus className="h-4 w-4 mr-1" /> Add Block</Button>
              </div>
            ))
          ) : <div className="text-gray-500">No sections</div>}
          <Button className="mt-4"><Plus className="h-4 w-4 mr-1" /> Add Section</Button>
        </CardContent>
      </Card>

      <Card>
        <CardFooter className="flex justify-end">
          <Button variant="destructive" onClick={handleDeleteCourse}><Trash2 className="h-4 w-4 mr-1" /> Delete Course</Button>
        </CardFooter>
      </Card>

      {/* Add PathSelector dialog */}
      <Dialog open={showPathSelector} onOpenChange={setShowPathSelector}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Course Path</DialogTitle>
          </DialogHeader>
          <PathSelector
            pendingCourse={course}
            onSuccess={() => { setShowPathSelector(false); reloadCourse(); }}
            onCancel={() => setShowPathSelector(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessorCourseDetails; 
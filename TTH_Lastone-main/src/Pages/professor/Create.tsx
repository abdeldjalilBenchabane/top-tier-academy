
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import CourseForm from '@/components/forms/CourseForm';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/lib/toast';

const CreateCoursePage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/professor/courses');
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Create New Course" 
        description="Create a course and submit it for admin approval"
      />
      
      <Card>
        <CardContent className="pt-6">
          <CourseForm 
            onSuccess={handleSuccess}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCoursePage;

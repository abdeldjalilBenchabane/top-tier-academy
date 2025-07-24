import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import LiveSessionForm from '@/components/forms/LiveSessionForm';
import { Card, CardContent } from '@/components/ui/card';

const CreateLiveSessionPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/professor/live-sessions');
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="إنشاء بث مباشر جديد" 
        description="أنشئ بث مباشر جديد وقدمه للموافقة من الإدارة"
      />
      
      <Card>
        <CardContent className="pt-6">
          <LiveSessionForm 
            onSuccess={handleSuccess}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateLiveSessionPage; 
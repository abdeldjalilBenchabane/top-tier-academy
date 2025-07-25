import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import LiveSectionForm from '@/components/forms/LiveSectionForm';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/lib/toast';

const CreateLiveSectionPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/professor/live-sessions');
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Create Live Sections" 
        description="Create live sections and submit them for admin approval"
      />
      
      <Card>
        <CardContent className="pt-6">
          <LiveSectionForm 
            onSuccess={handleSuccess}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateLiveSectionPage; 
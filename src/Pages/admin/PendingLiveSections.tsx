import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/lib/toast';
import { CheckCircle, XCircle, Clock, Video, Calendar, User, BookOpen, Globe } from 'lucide-react';

interface LiveSection {
  id: number;
  title: string;
  description: string;
  price: number;
  cover_image_url?: string;
  status: string;
  created_at: string;
  professor_name: string;
  professor_email: string;
  live_sessions_count: number;
  root_type: 'education' | 'language';
  level_name?: string;
  year_name?: string;
  speciality_name?: string;
  material_name?: string;
  language_name?: string;
  language_level_name?: string;
}

const PendingLiveSections = () => {
  const [liveSections, setLiveSections] = useState<LiveSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<LiveSection | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchPendingLiveSections = async () => {
    try {
      const response = await fetch('/api/admin/live-sections/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending live sections');
      }

      const data = await response.json();
      setLiveSections(data);
    } catch (error) {
      console.error('Error fetching pending live sections:', error);
      toast.error('Failed to fetch pending live sections');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingLiveSections();
  }, []);

  const handleApprove = async (sectionId: number) => {
    try {
      const response = await fetch(`/api/admin/live-sections/${sectionId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to approve live section');
      }

      toast.success('Live section approved successfully!');
      fetchPendingLiveSections(); // Refresh the list
    } catch (error) {
      console.error('Error approving live section:', error);
      toast.error('Failed to approve live section');
    }
  };

  const handleReject = async () => {
    if (!selectedSection || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      const response = await fetch(`/api/admin/live-sections/${selectedSection.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason })
      });

      if (!response.ok) {
        throw new Error('Failed to reject live section');
      }

      toast.success('Live section rejected successfully!');
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedSection(null);
      fetchPendingLiveSections(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting live section:', error);
      toast.error('Failed to reject live section');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPathDisplay = (section: LiveSection) => {
    if (section.root_type === 'education') {
      return `${section.level_name} > ${section.year_name} > ${section.speciality_name} > ${section.material_name}`;
    } else {
      return `${section.language_name} > ${section.language_level_name}`;
    }
  };

  const getPathIcon = (rootType: string) => {
    return rootType === 'education' ? <BookOpen className="h-4 w-4" /> : <Globe className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Pending الدورات</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pending الدورات</h1>
        <Badge variant="outline" className="bg-yellow-50">
          <Clock className="h-3 w-3 mr-1 text-yellow-500" />
          <span className="text-yellow-700">{liveSections.length} Pending</span>
        </Badge>
      </div>

      {liveSections.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد دورات قيد المراجعة</h3>
            <p className="text-gray-600">All live sections have been reviewed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {liveSections.map((section) => (
            <Card key={section.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                {section.cover_image_url && (
                  <img
                    src={section.cover_image_url}
                    alt="الدورة Cover"
                    className="w-full h-28 object-cover rounded-t-md mb-2 border"
                    style={{ minHeight: '7rem', background: '#f3f4f6' }}
                  />
                )}
                {!section.cover_image_url && (
                  <div className="w-full h-28 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-md mb-2 flex items-center justify-center">
                    <Video className="h-8 w-8 text-white" />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg line-clamp-2" title={section.title}>
                    {section.title}
                  </CardTitle>
                  <Badge variant="outline" className="bg-yellow-50">
                    <Clock className="h-3 w-3 mr-1 text-yellow-500" />
                    <span className="text-yellow-700">Pending</span>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pb-2">
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {section.description}
                </p>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center text-xs text-gray-500">
                    <User className="h-3.5 w-3.5 mr-1" />
                    <span>{section.professor_name}</span>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    <span>Submitted: {formatDate(section.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <Video className="h-3.5 w-3.5 mr-1" />
                    <span>{section.live_sessions_count} sessions</span>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    {getPathIcon(section.root_type)}
                    <span className="ml-1 line-clamp-1">{getPathDisplay(section)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-green-600">
                    {section.price} دج
                  </div>
                </div>
              </CardContent>
              
              <div className="px-6 pb-4 flex gap-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleApprove(section.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedSection(section);
                    setShowRejectDialog(true);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض الدورة</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting "{selectedSection?.title}".
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
            
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason('');
                  setSelectedSection(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={!rejectReason.trim()}
              >
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingLiveSections; 
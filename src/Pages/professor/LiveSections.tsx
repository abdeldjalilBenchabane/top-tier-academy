import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Video, Calendar, FileText, Plus, Layers, ArrowLeft } from 'lucide-react';
import { toast as toastLib } from '@/lib/toast';
import LiveSectionForm from '@/components/forms/LiveSectionForm';
import PathSelector from '@/components/admin/PathSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface LiveSection {
  id: string;
  title: string;
  description: string;
  price: number;
  cover_url?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  live_sessions_count: number;
}

const ProfessorLiveSections = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liveSections, setLiveSections] = useState<LiveSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('drafts');
  const [showForm, setShowForm] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [showPathSelector, setShowPathSelector] = useState(false);
  const [selectedDraftSection, setSelectedDraftSection] = useState<LiveSection | null>(null);

  const fetchLiveSections = async () => {
    setIsLoading(true);
    try {
      console.log('[ProfessorLiveSections] user:', user);
      if (!user) return;
      
      // For now, we'll start with empty data
      // In the future, this would be: const res = await fetch(`/api/live-sections?created_by=${user.id}`);
      const mockData: LiveSection[] = [];
      
      setLiveSections(mockData);
      console.log('[ProfessorLiveSections] setLiveSections:', mockData);
    } catch (error) {
      console.error('Failed to fetch live sections:', error);
      toastLib.error('Failed to load live section data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveSections();
  }, [user]);

  // Set initial active tab based on live section counts
  useEffect(() => {
    if (liveSections.length > 0) {
      const draftCount = liveSections.filter(s => s.status === 'draft').length;
      const pendingCount = liveSections.filter(s => s.status === 'pending').length;
      
      if (draftCount > 0) {
        setActiveTab('drafts');
      } else if (pendingCount > 0) {
        setActiveTab('pending');
      } else if (liveSections.filter(s => s.status === 'rejected').length > 0) {
        setActiveTab('rejected');
      } else if (liveSections.filter(s => s.status === 'approved').length > 0) {
        setActiveTab('approved');
      }
    }
  }, [liveSections]);

  // Update active tab when live section status changes
  useEffect(() => {
    const draftCount = liveSections.filter(s => s.status === 'draft').length;
    const pendingCount = liveSections.filter(s => s.status === 'pending').length;
    
    if (activeTab === 'drafts' && draftCount === 0 && pendingCount > 0) {
      setActiveTab('pending');
    }
  }, [liveSections, activeTab]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCreateNew = () => {
    setEditingSectionId(null);
    setShowForm(true);
  };

  const handleEditSection = (sectionId: string) => {
    setEditingSectionId(sectionId);
    setShowForm(true);
  };

  const handleFormSuccess = (sectionData?: any) => {
    setShowForm(false);
    setEditingSectionId(null);
    
    if (sectionData) {
      // Add the newly created section to the mock data
      const newSection: LiveSection = {
        id: sectionData.id,
        title: sectionData.title,
        description: sectionData.description,
        price: sectionData.price,
        status: sectionData.status,
        createdAt: sectionData.createdAt,
        updatedAt: sectionData.updatedAt,
        live_sessions_count: sectionData.live_sessions_count,
        cover_url: sectionData.cover_url
      };
      
      setLiveSections(prev => [newSection, ...prev]);
    }
    
    toastLib.success('Live section saved successfully!');
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingSectionId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700">Draft</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-700">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-700">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  const pendingCount = liveSections.filter(s => s.status === 'pending').length;
  const rejectedCount = liveSections.filter(s => s.status === 'rejected').length;
  const draftCount = liveSections.filter(s => s.status === 'draft').length;
  const approvedCount = liveSections.filter(s => s.status === 'approved').length;

  // Add a fallback image URL for live sections without a cover
  const fallbackCover = '/default-live-section-cover.png'; // Place a default image in public folder

  // Show form view
  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleFormCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Live Sections
          </Button>
        </div>
        
        <PageHeader 
          title={editingSectionId ? "Edit Live Section" : "Create Live Section"} 
          description={editingSectionId ? "Edit your live section and its sessions" : "Create a new live section with multiple sessions"}
        />
        
        <Card>
          <CardContent className="pt-6">
            <LiveSectionForm 
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show cards view
  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Live Sections" 
        description="View and manage your live section submissions"
        action={
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create Live Section
          </Button>
        }
      />
      
      {liveSections.length === 0 ? (
        <EmptyState
          title="No Live Sections Yet"
          description="You haven't created any live sections yet. Get started by creating your first live section."
          icon={<Video className="h-12 w-12 text-gray-400" />}
          action={{
            label: "Create First Live Section",
            onClick: handleCreateNew
          }}
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="drafts">
              Drafts
              {draftCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {draftCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected
              {rejectedCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {rejectedCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              {approvedCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {approvedCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="drafts" className="mt-0">
            {draftCount > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {liveSections
                  .filter(section => section.status === 'draft')
                  .map(section => (
                    <Card key={section.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleEditSection(section.id)}>
                      <CardHeader className="pb-2">
                        {section.cover_url && (
                          <img
                            src={section.cover_url}
                            alt="Live Section Cover"
                            className="w-full h-28 object-cover rounded-t-md mb-2 border"
                            style={{ minHeight: '7rem', background: '#f3f4f6' }}
                            onError={e => { (e.target as HTMLImageElement).src = fallbackCover; }}
                          />
                        )}
                        {!section.cover_url && (
                          <img
                            src={fallbackCover}
                            alt="Default Live Section Cover"
                            className="w-full h-28 object-cover rounded-t-md mb-2 border"
                            style={{ minHeight: '7rem', background: '#f3f4f6' }}
                          />
                        )}
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg line-clamp-2" title={section.title}>{section.title}</CardTitle>
                          {getStatusBadge(section.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {section.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            <span>Created: {formatDate(section.createdAt)}</span>
                          </div>
                          <div className="flex items-center">
                            <Video className="h-3.5 w-3.5 mr-1" />
                            <span>{section.live_sessions_count} sessions</span>
                          </div>
                        </div>
                        <div className="flex items-center text-sm font-medium text-green-600">
                          <span>{section.price} دج</span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2 flex flex-col gap-2">
                        <Button variant="outline" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); handleEditSection(section.id); }}>
                          Edit Live Section
                        </Button>
                        <Button variant="default" size="sm" className="w-full flex items-center justify-center" onClick={(e) => { e.stopPropagation(); setSelectedDraftSection(section); setShowPathSelector(true); }}>
                          <Layers className="h-4 w-4 mr-2" />
                          Choose Path
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            ) : (
              <EmptyState
                title="No Draft Live Sections"
                description="You don't have any draft live sections."
                icon={<FileText className="h-12 w-12 text-gray-400" />}
              />
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-0">
            {pendingCount > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {liveSections
                  .filter(section => section.status === 'pending')
                  .map(section => (
                    <Card key={section.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleEditSection(section.id)}>
                      <CardHeader className="pb-2">
                        {section.cover_url && (
                          <img
                            src={section.cover_url}
                            alt="Live Section Cover"
                            className="w-full h-28 object-cover rounded-t-md mb-2 border"
                            style={{ minHeight: '7rem', background: '#f3f4f6' }}
                            onError={e => { (e.target as HTMLImageElement).src = fallbackCover; }}
                          />
                        )}
                        {!section.cover_url && (
                          <img
                            src={fallbackCover}
                            alt="Default Live Section Cover"
                            className="w-full h-28 object-cover rounded-t-md mb-2 border"
                            style={{ minHeight: '7rem', background: '#f3f4f6' }}
                          />
                        )}
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg line-clamp-2" title={section.title}>{section.title}</CardTitle>
                          {getStatusBadge(section.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {section.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            <span>Created: {formatDate(section.createdAt)}</span>
                          </div>
                          <div className="flex items-center">
                            <Video className="h-3.5 w-3.5 mr-1" />
                            <span>{section.live_sessions_count} sessions</span>
                          </div>
                        </div>
                        <div className="flex items-center text-sm font-medium text-green-600">
                          <span>{section.price} دج</span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            ) : (
              <EmptyState
                title="No Pending Live Sections"
                description="You don't have any pending live sections."
                icon={<Clock className="h-12 w-12 text-gray-400" />}
              />
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-0">
            {rejectedCount > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {liveSections
                  .filter(section => section.status === 'rejected')
                  .map(section => (
                    <Card key={section.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleEditSection(section.id)}>
                      <CardHeader className="pb-2">
                        {section.cover_url && (
                          <img
                            src={section.cover_url}
                            alt="Live Section Cover"
                            className="w-full h-28 object-cover rounded-t-md mb-2 border"
                            style={{ minHeight: '7rem', background: '#f3f4f6' }}
                            onError={e => { (e.target as HTMLImageElement).src = fallbackCover; }}
                          />
                        )}
                        {!section.cover_url && (
                          <img
                            src={fallbackCover}
                            alt="Default Live Section Cover"
                            className="w-full h-28 object-cover rounded-t-md mb-2 border"
                            style={{ minHeight: '7rem', background: '#f3f4f6' }}
                          />
                        )}
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg line-clamp-2" title={section.title}>{section.title}</CardTitle>
                          {getStatusBadge(section.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {section.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            <span>Created: {formatDate(section.createdAt)}</span>
                          </div>
                          <div className="flex items-center">
                            <Video className="h-3.5 w-3.5 mr-1" />
                            <span>{section.live_sessions_count} sessions</span>
                          </div>
                        </div>
                        <div className="flex items-center text-sm font-medium text-green-600">
                          <span>{section.price} دج</span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button variant="outline" size="sm" className="w-full">
                          Edit & Resubmit
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            ) : (
              <EmptyState
                title="No Rejected Live Sections"
                description="You don't have any rejected live sections."
                icon={<XCircle className="h-12 w-12 text-gray-400" />}
              />
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-0">
            {approvedCount > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {liveSections
                  .filter(section => section.status === 'approved')
                  .map(section => (
                    <Card key={section.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleEditSection(section.id)}>
                      <CardHeader className="pb-2">
                        {section.cover_url && (
                          <img
                            src={section.cover_url}
                            alt="Live Section Cover"
                            className="w-full h-28 object-cover rounded-t-md mb-2 border"
                            style={{ minHeight: '7rem', background: '#f3f4f6' }}
                            onError={e => { (e.target as HTMLImageElement).src = fallbackCover; }}
                          />
                        )}
                        {!section.cover_url && (
                          <img
                            src={fallbackCover}
                            alt="Default Live Section Cover"
                            className="w-full h-28 object-cover rounded-t-md mb-2 border"
                            style={{ minHeight: '7rem', background: '#f3f4f6' }}
                          />
                        )}
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg line-clamp-2" title={section.title}>{section.title}</CardTitle>
                          {getStatusBadge(section.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {section.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            <span>Created: {formatDate(section.createdAt)}</span>
                          </div>
                          <div className="flex items-center">
                            <Video className="h-3.5 w-3.5 mr-1" />
                            <span>{section.live_sessions_count} sessions</span>
                          </div>
                        </div>
                        <div className="flex items-center text-sm font-medium text-green-600">
                          <span>{section.price} دج</span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            ) : (
              <EmptyState
                title="No Approved Live Sections"
                description="You don't have any approved live sections."
                icon={<CheckCircle className="h-12 w-12 text-gray-400" />}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* PathSelector Dialog for Drafts */}
      <Dialog open={showPathSelector} onOpenChange={setShowPathSelector}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Live Section Path</DialogTitle>
            <DialogDescription>
              Select the educational structure or language path for this live section. This helps students find your live section in the right place.
            </DialogDescription>
          </DialogHeader>
          {selectedDraftSection && (
            <PathSelector
              pendingCourse={selectedDraftSection}
              onSuccess={() => { 
                setShowPathSelector(false); 
                setSelectedDraftSection(null); 
                fetchLiveSections(); 
                setActiveTab('pending');
                toastLib.success('Live section path assigned successfully! Live section is now pending admin approval.');
              }}
              onCancel={() => { setShowPathSelector(false); setSelectedDraftSection(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessorLiveSections; 
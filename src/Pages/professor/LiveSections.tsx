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
import { Clock, CheckCircle, XCircle, Video, Calendar, FileText, Plus, Layers, ArrowLeft, PlusCircle, Trash2, Edit, Loader2, Image as ImageIcon, BookOpen } from 'lucide-react';
import { toast as toastLib } from '@/lib/toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import LiveSectionForm from '@/components/forms/LiveSectionForm';
import LiveSectionPathSelector from '@/components/admin/LiveSectionPathSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface LiveSection {
  id: string;
  title: string;
  description: string;
  price: number;
  cover_image_url?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  scheduled_date?: string;
  scheduled_time?: string;
  duration_minutes?: number;
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
  const [editingSectionData, setEditingSectionData] = useState<any>(null);
  const [showPathSelector, setShowPathSelector] = useState(false);
  const [selectedDraftSection, setSelectedDraftSection] = useState<LiveSection | null>(null);

  // Deletion is a request, not an action. Track what has already been asked so
  // the button shows the state instead of offering to ask twice.
  const [deletionRequests, setDeletionRequests] = useState<Record<string, any>>({});
  const [requestingDelete, setRequestingDelete] = useState<LiveSection | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);


  const fetchLiveSections = async () => {
    setIsLoading(true);
    try {
      console.log('[ProfessorLiveSections] user:', user);
      if (!user) return;
      
      const response = await fetch(`/api/professors/${user.id}/live-sections`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch live sections');
      }
      
      const data = await response.json();
      setLiveSections(data);
      console.log('[ProfessorLiveSections] setLiveSections:', data);
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

  const loadDeletionRequests = async () => {
    try {
      const list = await api('/live-sections/my-deletion-requests');
      const bySection: Record<string, any> = {};
      for (const r of list || []) {
        // newest first from the API, so only the first row per دورة is current
        if (r.live_section_id && !bySection[String(r.live_section_id)]) {
          bySection[String(r.live_section_id)] = r;
        }
      }
      setDeletionRequests(bySection);
    } catch { /* the page is still usable without this */ }
  };
  useEffect(() => { loadDeletionRequests(); }, []);

  const submitDeletionRequest = async () => {
    if (!requestingDelete) return;
    setSendingRequest(true);
    try {
      await api(`/live-sections/${requestingDelete.id}/deletion-request`, {
        method: 'POST',
        body: JSON.stringify({ reason: deleteReason.trim() || undefined }),
      });
      toastLib.success('أُرسل طلب الحذف إلى الإدارة. ستصلك النتيجة كإشعار.');
      setRequestingDelete(null); setDeleteReason('');
      loadDeletionRequests();
    } catch (e: any) {
      toastLib.error(e?.message || 'تعذر إرسال الطلب');
    } finally { setSendingRequest(false); }
  };

  // View Details now works the same as Edit Section
  const handleViewDetails = async (liveSectionId: string) => {
    await handleEditSection(liveSectionId);
  };

  const handleCreateNew = () => {
    setEditingSectionId(null);
    setShowForm(true);
  };

  const handleEditSection = async (sectionId: string) => {
    try {
      // Fetch the live section details including live sessions
      const response = await fetch(`/api/live-sections/${sectionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch live section details');
      }
      
      const sectionData = await response.json();
      
      // Fetch live sessions for this section
      const sessionsResponse = await fetch(`/api/live-sections/${sectionId}/sessions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      let liveSessions = [];
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        liveSessions = sessionsData;
      }
      
      const editingSection = {
        ...sectionData,
        live_sessions: liveSessions
      };
      
      setEditingSectionId(sectionId);
      setShowForm(true);
      // Pass the editing section data to the form
      setEditingSectionData(editingSection);
    } catch (error) {
      console.error('Error fetching live section details:', error);
      toastLib.error('Failed to load live section details');
    }
  };

  const handleFormSuccess = (sectionData?: any) => {
    setShowForm(false);
    setEditingSectionId(null);
    
    if (sectionData) {
      // Check if we're editing an existing section or creating a new one
      const existingSectionIndex = liveSections.findIndex(section => section.id === sectionData.id);
      
      const updatedSection: LiveSection = {
        id: sectionData.id,
        title: sectionData.title,
        description: sectionData.description,
        price: sectionData.price,
        status: sectionData.status,
        createdAt: sectionData.createdAt,
        updatedAt: sectionData.updatedAt,
        live_sessions_count: sectionData.live_sessions_count,
        cover_image_url: sectionData.cover_image_url
      };
      
      if (existingSectionIndex !== -1) {
        // Update existing section
        setLiveSections(prev => prev.map((section, index) => 
          index === existingSectionIndex ? updatedSection : section
        ));
        toastLib.success('Live section updated successfully!');
      } else {
        // Add new section
        setLiveSections(prev => [updatedSection, ...prev]);
        toastLib.success('Live section created successfully!');
      }
    }
    
    // Refresh the data to ensure we have the latest information
    fetchLiveSections();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingSectionId(null);
    setEditingSectionData(null);
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
            Back to الدورات
          </Button>
        </div>
        
        <PageHeader 
          title={editingSectionId ? "Edit الدورة" : "Create الدورة"} 
          description={editingSectionId ? "Edit your live section and its sessions" : "Create a new live section with multiple sessions"}
        />
        
        <Card>
          <CardContent className="pt-6">
            <LiveSectionForm 
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              editingSection={editingSectionData}
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
        title="My الدورات" 
        description="View and manage your live section submissions"
        action={
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create الدورة
          </Button>
        }
      />
      
      {liveSections.length === 0 ? (
        <EmptyState
          title="No الدورات Yet"
          description="You haven't created any live sections yet. Get started by creating your first live section."
          icon={<Video className="h-12 w-12 text-gray-400" />}
          action={{
            label: "Create First الدورة",
            onClick: handleCreateNew
          }}
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="mb-4 overflow-x-auto">
            <TabsList className="inline-flex min-w-full sm:min-w-0">
              <TabsTrigger value="drafts" className="whitespace-nowrap">
                Drafts
                {draftCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {draftCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" className="whitespace-nowrap">
                Pending
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="rejected" className="whitespace-nowrap">
                Rejected
                {rejectedCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {rejectedCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="whitespace-nowrap">
                Approved
                {approvedCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {approvedCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="drafts" className="mt-0">
            {draftCount > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {liveSections
                  .filter(section => section.status === 'draft')
                  .map(section => (
                    <Card key={`draft-${section.id}`} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleEditSection(section.id)}>
                      <CardHeader className="pb-2">
                        {section.cover_image_url && (
                          <img
                            src={section.cover_image_url}
                            alt="الدورة Cover"
                            className="w-full h-28 object-cover rounded-t-md mb-2 border"
                            style={{ minHeight: '7rem', background: '#f3f4f6' }}
                            onError={e => { (e.target as HTMLImageElement).src = fallbackCover; }}
                          />
                        )}
                        {!section.cover_image_url && (
                          <img
                            src={fallbackCover}
                            alt="Default الدورة Cover"
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
                        
                        {/* Live Session Info */}
                        {section.scheduled_date && (
                          <div className="space-y-1 mb-2">
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              <span>التاريخ: {new Date(section.scheduled_date).toLocaleDateString('ar-SA')}</span>
                            </div>
                            {section.scheduled_time && (
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                <span>الوقت: {section.scheduled_time}</span>
                              </div>
                            )}
                            {section.duration_minutes && (
                              <div className="flex items-center text-xs text-gray-500">
                                <Video className="h-3.5 w-3.5 mr-1" />
                                <span>المدة: {section.duration_minutes} دقيقة</span>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="pt-2 flex flex-col gap-2">
                        <Button variant="outline" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); handleEditSection(section.id); }}>
                          Edit الدورة
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
                title="No Draft الدورات"
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
                    <Card key={`pending-${section.id}`} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleEditSection(section.id)}>
                      <CardHeader className="pb-2">
                        {section.cover_image_url && (
                          <img
                            src={section.cover_image_url}
                            alt="الدورة Cover"
                            className="w-full h-28 object-cover rounded-t-md mb-2 border"
                            style={{ minHeight: '7rem', background: '#f3f4f6' }}
                            onError={e => { (e.target as HTMLImageElement).src = fallbackCover; }}
                          />
                        )}
                        {!section.cover_image_url && (
                          <img
                            src={fallbackCover}
                            alt="Default الدورة Cover"
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
                        
                        {/* Live Session Info */}
                        {section.scheduled_date && (
                          <div className="space-y-1 mb-2">
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              <span>التاريخ: {new Date(section.scheduled_date).toLocaleDateString('ar-SA')}</span>
                            </div>
                            {section.scheduled_time && (
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                <span>الوقت: {section.scheduled_time}</span>
                              </div>
                            )}
                            {section.duration_minutes && (
                              <div className="flex items-center text-xs text-gray-500">
                                <Video className="h-3.5 w-3.5 mr-1" />
                                <span>المدة: {section.duration_minutes} دقيقة</span>
                              </div>
                            )}
                          </div>
                        )}
                        
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
                title="لا توجد دورات قيد المراجعة"
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
                    <Card key={`rejected-${section.id}`} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleEditSection(section.id)}>
                      <CardHeader className="pb-2">
                        {section.cover_image_url && (
                          <img
                            src={section.cover_image_url}
                            alt="الدورة Cover"
                            className="w-full h-28 object-cover rounded-t-md mb-2 border"
                            style={{ minHeight: '7rem', background: '#f3f4f6' }}
                            onError={e => { (e.target as HTMLImageElement).src = fallbackCover; }}
                          />
                        )}
                        {!section.cover_image_url && (
                          <img
                            src={fallbackCover}
                            alt="Default الدورة Cover"
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
                title="لا توجد دورات مرفوضة"
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
                    <Card key={`approved-${section.id}`} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleEditSection(section.id)}>
                      <CardHeader className="pb-2">
                        {section.cover_image_url && (
                          <img
                            src={section.cover_image_url}
                            alt="الدورة Cover"
                            className="w-full h-28 object-cover rounded-t-md mb-2 border"
                            style={{ minHeight: '7rem', background: '#f3f4f6' }}
                            onError={e => { (e.target as HTMLImageElement).src = fallbackCover; }}
                          />
                        )}
                        {!section.cover_image_url && (
                          <img
                            src={fallbackCover}
                            alt="Default الدورة Cover"
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
                      </CardContent>
                      <CardFooter className="pt-2 flex flex-col gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleViewDetails(section.id)}
                        >
                          View Details
                        </Button>
                        {deletionRequests[String(section.id)]?.status === 'pending' ? (
                          <div className="w-full rounded-md bg-orange-50 px-2 py-1.5 text-center text-xs text-orange-700">
                            طلب الحذف قيد مراجعة الإدارة
                          </div>
                        ) : deletionRequests[String(section.id)]?.status === 'rejected' ? (
                          <div className="w-full rounded-md bg-gray-50 px-2 py-1.5 text-center text-xs text-gray-600">
                            رُفض طلب الحذف
                            {deletionRequests[String(section.id)]?.admin_note
                              ? `: ${deletionRequests[String(section.id)].admin_note}` : ''}
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => { setRequestingDelete(section); setDeleteReason(''); }}
                          >
                            <Trash2 className="mr-1 h-4 w-4" /> طلب حذف الدورة
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            ) : (
              <EmptyState
                title="No Approved الدورات"
                description="You don't have any approved live sections."
                icon={<CheckCircle className="h-12 w-12 text-gray-400" />}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* PathSelector Dialog for Drafts */}

      {/* Deleting a دورة is the admin's call: students have paid points for it,
          and only they can decide whether those points come back. */}
      <Dialog open={!!requestingDelete}
        onOpenChange={(v) => { if (!sendingRequest && !v) { setRequestingDelete(null); setDeleteReason(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">طلب حذف «{requestingDelete?.title}»</DialogTitle>
            <DialogDescription className="text-right">
              لا يمكنك حذف الدورة بنفسك، لأن طلاباً دفعوا نقاطاً مقابلها والإدارة هي من
              تقرر إن كانت النقاط تُرجع أم لا. اكتب سبب الطلب وسيصل إلى الإدارة.
            </DialogDescription>
          </DialogHeader>

          <textarea
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            rows={4}
            placeholder="لماذا تريد حذف هذه الدورة؟ (مثال: أُنشئت بالخطأ / انتهت السنة / محتوى مكرر)"
            className="w-full rounded-md border border-gray-300 p-2 text-sm"
          />
          <p className="text-xs text-gray-500">
            كلما كان السبب أوضح، كان قرار الإدارة أسرع وأدق.
          </p>

          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={sendingRequest}
              onClick={() => { setRequestingDelete(null); setDeleteReason(''); }}>إلغاء</Button>
            <Button variant="destructive" disabled={sendingRequest} onClick={submitDeletionRequest}>
              {sendingRequest && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              إرسال الطلب للإدارة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPathSelector} onOpenChange={setShowPathSelector}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إسناد الدورة Path</DialogTitle>
            <DialogDescription>
              Select the educational structure or language path for this live section. This helps students find your live section in the right place.
            </DialogDescription>
          </DialogHeader>
          {selectedDraftSection && (
            <LiveSectionPathSelector
              pendingSection={selectedDraftSection}
              onSuccess={() => { 
                setShowPathSelector(false);
                setSelectedDraftSection(null);
                fetchLiveSections(); // Refresh the list
                toastLib.success('Path assigned successfully!');
              }}
              onCancel={() => {
                setShowPathSelector(false);
                setSelectedDraftSection(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessorLiveSections; 
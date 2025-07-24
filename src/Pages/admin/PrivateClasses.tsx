import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';

interface PrivateClassRequest {
  id: number;
  student_id: number;
  student_email: string;
  student_name: string;
  teacher_name: string;
  subject: string;
  grade: string;
  date: string;
  time: string;
  status: string;
  payment_status: string;
  payment_date: string;
  points_used: number;
  price_per_session: number;
  created_at: string;
  updated_at: string;
  hierarchy_path: string;
}

const PrivateClasses = () => {
  const [requests, setRequests] = useState<PrivateClassRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/private-class-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else {
        console.error('Failed to fetch private class requests');
      }
    } catch (error) {
      console.error('Error fetching private class requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.student_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.subject?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || request.payment_status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'في الانتظار':
        return <Badge variant="default" className="bg-red-500 text-center min-w-[120px]">Not Confirmed</Badge>;
      case 'مؤكد':
        return <Badge variant="default" className="bg-green-500 text-center min-w-[120px]">Confirmed</Badge>;
      case 'مرفوض':
        return <Badge variant="destructive" className="bg-red-500 text-center min-w-[120px]">Rejected</Badge>;
      default:
        return <Badge variant="default" className="bg-red-500 text-center min-w-[120px]">Not Confirmed</Badge>;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'pending':
        return <Badge variant="default" className="bg-yellow-500 text-white text-center min-w-[120px] hover:bg-yellow-600">Pending Payment</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-500 text-center min-w-[120px] hover:bg-green-600">Paid</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="text-center min-w-[120px]">Cancelled</Badge>;
      default:
        return <Badge variant="default" className="bg-yellow-500 text-white text-center min-w-[120px] hover:bg-yellow-600">Not Set</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString || timeString === 'سيحدد الأستاذ التوقيت') return 'Time not set';
    return timeString;
  };

  const getConfirmationStatus = (request: PrivateClassRequest) => {
    if (request.status === 'مؤكد' && request.payment_status === 'paid') {
      return <Badge variant="default" className="bg-blue-500 text-center min-w-[120px] hover:bg-blue-600">Confirmed & Paid</Badge>;
    } else if (request.status === 'مؤكد' && request.payment_status === 'pending') {
      return <Badge variant="default" className="bg-yellow-500 text-white text-center min-w-[120px] hover:bg-yellow-600">Confirmed - Pending Payment</Badge>;
    } else if (request.status === 'في الانتظار') {
      return <Badge variant="default" className="bg-yellow-500 text-white text-center min-w-[120px] hover:bg-yellow-600">Waiting for Approval</Badge>;
    } else {
      return <Badge variant="default" className="bg-yellow-500 text-white text-center min-w-[120px] hover:bg-yellow-600">Not Set</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Private Classes"
          description="Manage and monitor private class requests"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading private class requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Private Classes"
        description="Manage and monitor private class requests"
      />

      {/* Summary Cards at the top */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{filteredRequests.length}</div>
            <div className="text-sm text-gray-500">Total Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {filteredRequests.filter(r => r.status === 'مؤكد').length}
            </div>
            <div className="text-sm text-gray-500">Confirmed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {filteredRequests.filter(r => r.payment_status === 'paid').length}
            </div>
            <div className="text-sm text-gray-500">Paid</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {filteredRequests.filter(r => r.payment_status === 'pending').length}
            </div>
            <div className="text-sm text-gray-500">Pending Payment</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <CardTitle className="text-xl">Private Class Requests</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by student email, name, teacher, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="في الانتظار">Pending</SelectItem>
                <SelectItem value="مؤكد">Confirmed</SelectItem>
                <SelectItem value="مرفوض">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending Payment</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Email</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Confirmed</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No private class requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  currentRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.student_email}</div>
                          <div className="text-sm text-gray-500">{request.student_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{request.teacher_name}</div>
                        <div className="text-sm text-gray-500">ID: {request.id}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.subject}</div>
                          <div className="text-sm text-gray-500">{request.hierarchy_path}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <div>
                          {getPaymentStatusBadge(request.payment_status)}
                          {request.payment_status === 'paid' && (
                            <div className="text-xs text-gray-500 mt-1">
                              {request.points_used} points
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatTime(request.time)}</div>
                          {request.date && (
                            <div className="text-gray-500">{request.date}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getConfirmationStatus(request)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(request.created_at)}</div>
                          {request.payment_date && (
                            <div className="text-gray-500">
                              Paid: {formatDate(request.payment_date)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default PrivateClasses; 
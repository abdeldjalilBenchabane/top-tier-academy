import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Coins, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  User,
  Package,
  CreditCard,
  Hash
} from 'lucide-react';
import { toast } from '@/lib/toast';

interface PointTransaction {
  id: number;
  user_id: number;
  package_id?: number;
  transaction_type: 'purchase' | 'spend' | 'refund' | 'bonus';
  points: number;
  amount?: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_reference?: string;
  metadata?: any;
  created_at: string;
  package_name?: string;
  user_name?: string;
  user_email?: string;
}

const AdminPointTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<PointTransaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isBuyPointsDialogOpen, setIsBuyPointsDialogOpen] = useState(false);
  const [buyPointsData, setBuyPointsData] = useState({
    userId: 0,
    points: 0,
    amount: 0,
    currency: 'DZD',
    packageName: '',
    requestId: 0 // Added requestId
  });
  const [students, setStudents] = useState([]);
  const [packages, setPackages] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [packageSearch, setPackageSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showPackageDropdown, setShowPackageDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Analytics data
  const [analytics, setAnalytics] = useState({
    totalTransactions: 0,
    completedTransactions: 0,
    totalPoints: 0,
    totalRevenue: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchPackages();
  }, []);

  useEffect(() => {
    // Calculate analytics with better logic
    const totalTransactions = transactions.length;
    const completedTransactions = transactions.filter(t => t.status === 'completed').length;
    const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
    const failedTransactions = transactions.filter(t => t.status === 'failed').length;
    const cancelledTransactions = transactions.filter(t => t.status === 'cancelled').length;
    
    // Calculate total points (only from completed transactions)
    const totalPoints = transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.points, 0);
    
    // Calculate total revenue (only from completed purchase transactions with amount)
    const totalRevenue = transactions
      .filter(t => t.status === 'completed' && t.transaction_type === 'purchase' && t.amount)
      .reduce((sum, t) => {
        // Ensure amount is a number and add it properly
        const amount = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;
        return sum + amount;
      }, 0);
    
    setAnalytics({
      totalTransactions,
      completedTransactions,
      totalPoints,
      totalRevenue,
      pendingTransactions,
      failedTransactions,
    });
  }, [transactions]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/points/transactions/admin', {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (e) {
      setError('Failed to load transactions');
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/points/admin/students', {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      setStudents(data.students || []);
    } catch (e) {
      console.error('Failed to load students:', e);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/points/packages/all', {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      setPackages(data.packages || []);
    } catch (e) {
      console.error('Failed to load packages:', e);
    }
  };

  const handleChange = (idx: number, field: keyof PointTransaction, value: any) => {
    setTransactions(trans => trans.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const handleSave = async (idx: number) => {
    setSaving(true);
    setError(null);
    const transaction = transactions[idx];
    try {
      const res = await fetch(`/api/points/transactions/${transaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(transaction),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error saving');
      toast.success('Transaction saved successfully');
      fetchTransactions();
    } catch (e: any) {
      setError(e.message || 'Error saving');
      toast.error(e.message || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/points/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error deleting');
      toast.success('Transaction deleted successfully');
      fetchTransactions();
    } catch (e: any) {
      setError(e.message || 'Error deleting');
      toast.error(e.message || 'Error deleting');
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (transaction: PointTransaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingTransaction) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/points/transactions/${editingTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(editingTransaction),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error saving');
      toast.success('Transaction saved successfully');
      setEditingTransaction(null);
      setIsDialogOpen(false);
      fetchTransactions();
    } catch (e: any) {
      setError(e.message || 'Error saving');
      toast.error(e.message || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const handleBuyPointsForStudent = async () => {
    if (!buyPointsData.userId || !buyPointsData.points || !buyPointsData.amount) {
      toast.error('Please fill all required fields');
      return;
    }
    
    // Prevent double submission
    if (saving || isSubmitting) {
      console.log('Preventing double submission - already saving:', saving, 'isSubmitting:', isSubmitting);
      return;
    }
    
    const requestId = Date.now() + Math.random();
    console.log('=== STARTING POINTS ADDITION ===');
    console.log('Request ID:', requestId);
    console.log('Current buyPointsData:', buyPointsData);
    console.log('Current saving state:', saving);
    console.log('Current isSubmitting state:', isSubmitting);
    
    // Set both flags immediately to prevent any other submissions
    setIsSubmitting(true);
    setSaving(true);
    setError(null);
    
    try {
      const requestData = {
        userId: buyPointsData.userId,
        points: buyPointsData.points,
        amount: buyPointsData.amount,
        currency: buyPointsData.currency,
        packageName: buyPointsData.packageName,
        requestId: requestId
      };
      
      console.log('Sending request with data:', requestData);
      console.log('Request timestamp:', new Date().toISOString());
      
      const res = await fetch('/api/points/admin/buy-for-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(requestData),
      });
      
      const data = await res.json();
      console.log('Response from server:', data);
      console.log('Request ID in response:', requestId);
      console.log('Response timestamp:', new Date().toISOString());
      
      if (!data.success) throw new Error(data.error || 'Error adding points');
      
      toast.success('Points added successfully for student');
      
      // Reset form immediately
      setBuyPointsData({
        userId: 0,
        points: 0,
        amount: 0,
        currency: 'DZD',
        packageName: '',
        requestId: 0 // Reset requestId
      });
      setStudentSearch('');
      setPackageSearch('');
      setIsBuyPointsDialogOpen(false);
      
      // Trigger refresh of studentsbalance if they're currently logged in
      if (window.refreshUserPoints) {
        console.log('Triggering student balance refresh');
        window.refreshUserPoints();
      }
      
      // Refresh transactions after a short delay
      setTimeout(() => {
        fetchTransactions();
      }, 500);
    } catch (e: any) {
      console.error('Error adding points:', e);
      setError(e.message || 'Error adding points');
      toast.error(e.message || 'Error adding points');
    } finally {
      console.log('=== FINISHING POINTS ADDITION ===');
      console.log('Request ID completed:', requestId);
      setSaving(false);
      setIsSubmitting(false);
    }
  };

  const handlePackageSelect = (packageId: number) => {
    const selectedPackage = packages.find(p => p.id === packageId);
    if (selectedPackage) {
      console.log('Selected package:', selectedPackage);
      setBuyPointsData({
        ...buyPointsData,
        points: selectedPackage.points,
        amount: selectedPackage.price,
        currency: selectedPackage.currency,
        packageName: selectedPackage.name
      });
      // Clear the package search to show the selected package name
      setPackageSearch(selectedPackage.name);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.email?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredPackages = packages.filter(pkg =>
    pkg.name?.toLowerCase().includes(packageSearch.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock, text: 'Pending' },
      completed: { variant: 'default' as const, icon: CheckCircle, text: 'Completed' },
      failed: { variant: 'destructive' as const, icon: XCircle, text: 'Failed' },
      cancelled: { variant: 'outline' as const, icon: AlertCircle, text: 'Cancelled' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      purchase: { variant: 'default' as const, text: 'Purchase' },
      spend: { variant: 'secondary' as const, text: 'Spend' },
      refund: { variant: 'outline' as const, text: 'Refund' },
      bonus: { variant: 'default' as const, text: 'Bonus' },
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.purchase;
    
    return (
      <Badge variant={config.variant}>
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'DZD') => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      style: 'decimal'
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.package_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.transaction_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Point Transactions Management</h2>
          <p className="text-gray-600">Manage all point transactions in the system</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTransactions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsBuyPointsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Buy Points for Student
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="space-y-4">
        {/* First row - 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold">{analytics.totalTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Points</p>
                  <p className="text-2xl font-bold">{analytics.totalPoints.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(analytics.totalRevenue)} DZD
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Second row - 4 status cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{analytics.completedTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">{analytics.pendingTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold">{analytics.failedTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Cancelled</p>
                  <p className="text-2xl font-bold">
                    {transactions.filter(t => t.status === 'cancelled').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by user, package, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="spend">Spend</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Point Transactions</CardTitle>
          <CardDescription>Manage all point transactions in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchTransactions} variant="outline">
                Retry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction, idx) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transaction.user_name || `User ${transaction.user_id}`}</div>
                        <div className="text-sm text-gray-500">{transaction.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(transaction.transaction_type)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{transaction.points.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      {transaction.amount ? (
                        <span className="font-medium">
                          {formatCurrency(transaction.amount)} {transaction.currency}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {transaction.package_name || '-'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(transaction.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(transaction)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSave(idx)}
                          disabled={saving}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(transaction.id)}
                          disabled={saving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              View and edit transaction details
            </DialogDescription>
          </DialogHeader>
          {editingTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>User</Label>
                  <Input value={editingTransaction.user_name || `User ${editingTransaction.user_id}`} disabled />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={editingTransaction.user_email || '-'} disabled />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select 
                    value={editingTransaction.transaction_type} 
                    onValueChange={(value) => setEditingTransaction({...editingTransaction, transaction_type: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="spend">Spend</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select 
                    value={editingTransaction.status} 
                    onValueChange={(value) => setEditingTransaction({...editingTransaction, status: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Points</Label>
                  <Input 
                    type="number"
                    value={editingTransaction.points}
                    onChange={(e) => setEditingTransaction({...editingTransaction, points: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input 
                    type="number"
                    value={editingTransaction.amount || ''}
                    onChange={(e) => setEditingTransaction({...editingTransaction, amount: parseFloat(e.target.value) || undefined})}
                  />
                </div>
              </div>
              <div>
                <Label>Payment Reference</Label>
                <Input 
                  value={editingTransaction.payment_reference || ''}
                  onChange={(e) => setEditingTransaction({...editingTransaction, payment_reference: e.target.value})}
                />
              </div>
              <div>
                <Label>Additional Data</Label>
                <Input 
                  value={JSON.stringify(editingTransaction.metadata || {})}
                  onChange={(e) => {
                    try {
                      const metadata = JSON.parse(e.target.value);
                      setEditingTransaction({...editingTransaction, metadata});
                    } catch (err) {
                      // Invalid JSON, keep as string
                    }
                  }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Buy Points for Student Dialog */}
      <Dialog open={isBuyPointsDialogOpen} onOpenChange={setIsBuyPointsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-blue-600" />
              Buy Points for Student
            </DialogTitle>
            <DialogDescription>
              Add points to a student's account (for in-person payments)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label htmlFor="student" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 text-blue-600" />
                Student
              </Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setShowStudentDropdown(true);
                    }}
                    onFocus={() => setShowStudentDropdown(true)}
                    onBlur={() => {
                      // Delay hiding to allow clicking on dropdown items
                      setTimeout(() => setShowStudentDropdown(false), 200);
                    }}
                    className="pl-10 pr-4 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg transition-all duration-200 bg-white"
                  />
                </div>
                {showStudentDropdown && students.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className={`p-3 cursor-pointer transition-colors duration-150 ${
                          buyPointsData.userId === student.id 
                            ? 'bg-blue-50 border-l-4 border-blue-500' 
                            : 'hover:bg-gray-50 border-l-4 border-transparent'
                        }`}
                        onClick={() => {
                          setBuyPointsData({...buyPointsData, userId: student.id});
                          setStudentSearch(student.name);
                          setShowStudentDropdown(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.avatar_url} alt={student.name} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-medium">
                                {student.name?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{student.name}</div>
                            <div className="text-sm text-gray-500 truncate">{student.email}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="package" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Package className="h-4 w-4 text-purple-600" />
                Package
              </Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search packages..."
                    value={packageSearch}
                    onChange={(e) => {
                      setPackageSearch(e.target.value);
                      setShowPackageDropdown(true);
                    }}
                    onFocus={() => setShowPackageDropdown(true)}
                    onBlur={() => {
                      // Delay hiding to allow clicking on dropdown items
                      setTimeout(() => setShowPackageDropdown(false), 200);
                    }}
                    className="pl-10 pr-4 py-3 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg transition-all duration-200 bg-white"
                  />
                </div>
                {showPackageDropdown && filteredPackages.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredPackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`p-3 cursor-pointer transition-colors duration-150 ${
                          buyPointsData.packageName === pkg.name 
                            ? 'bg-purple-50 border-l-4 border-purple-500' 
                            : 'hover:bg-gray-50 border-l-4 border-transparent'
                        }`}
                        onClick={() => {
                          handlePackageSelect(pkg.id);
                          setPackageSearch(pkg.name);
                          setShowPackageDropdown(false);
                        }}
                      >
                        <div className="font-medium text-gray-900">{pkg.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Coins className="h-3 w-3 text-yellow-500" />
                          {pkg.points} points
                          <span className="text-gray-400">•</span>
                          <CreditCard className="h-3 w-3 text-green-500" />
                          {pkg.price} {pkg.currency}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="points" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Hash className="h-4 w-4 text-green-600" />
                  Points
                </Label>
                <Input
                  id="points"
                  type="number"
                  value={buyPointsData.points || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setBuyPointsData({...buyPointsData, points: value});
                  }}
                  placeholder="Number of points"
                  className="py-3 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg transition-all duration-200 bg-white"
                />
              </div>
              <div>
                <Label htmlFor="amount" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Amount Paid
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={buyPointsData.amount || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setBuyPointsData({...buyPointsData, amount: value});
                  }}
                  placeholder="Amount"
                  className="py-3 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg transition-all duration-200 bg-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsBuyPointsDialogOpen(false)}
              className="px-6 py-2 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBuyPointsForStudent}
              disabled={saving || isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving || isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding Points...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Points
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPointTransactions; 
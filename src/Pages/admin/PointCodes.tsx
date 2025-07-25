import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Coins, TrendingUp, CheckCircle, XCircle, DollarSign, Download } from 'lucide-react';
import { toast } from '@/lib/toast';

interface PointCode {
  id: number;
  code: string;
  points: number;
  is_used: boolean;
  used_by?: number;
  used_by_name?: string;
  used_by_email?: string;
  used_at?: string;
  created_at: string;
  package_id?: number;
  package_name?: string;
}

interface PointPackage {
  id: number;
  name: string;
  points: number;
  price: number;
  currency: string;
}

const AdminPointCodes: React.FC = () => {
  const [codes, setCodes] = useState<PointCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [packages, setPackages] = useState<PointPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  // Add filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [packageFilter, setPackageFilter] = useState<'all' | number>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<number[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<number>(0);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/points/codes', {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      setCodes(data.codes || []);
    } catch (e) {
      toast.error('Failed to load codes');
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/points/packages', {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      setPackages(data.packages || []);
    } catch (e) {
      toast.error('Failed to load packages');
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/points/transactions/admin', {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      setTransactions(data.transactions || []);
      // Calculate total revenue from completed purchase transactions
      const totalRevenue = (data.transactions || [])
        .filter((t: any) => t.status === 'completed' && t.transaction_type === 'purchase' && t.amount)
        .reduce((sum: number, t: any) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0), 0);
      setRevenue(totalRevenue);
    } catch (e) {
      setTransactions([]);
      setRevenue(0);
    }
  };

  useEffect(() => {
    fetchCodes();
    fetchPackages();
    fetchTransactions();
  }, []);

  const handleGenerateCodes = async () => {
    if (!selectedPackageId || !quantity) {
      toast.error('Please select a package and enter quantity');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/points/codes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          package_id: selectedPackageId,
          quantity: quantity
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`Generated ${quantity} codes successfully`);
      setIsDialogOpen(false);
      fetchCodes();
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate codes');
    } finally {
      setGenerating(false);
    }
  };

  // Download unused codes logic
  const handleDownloadCodes = (mode: 'all' | 'date' | 'selected') => {
    let codesToDownload: PointCode[] = [];
    if (mode === 'all') {
      codesToDownload = codes.filter(c => !c.is_used);
    } else if (mode === 'date') {
      codesToDownload = codes.filter(c => !c.is_used && c.created_at.startsWith(dateFilter));
    } else if (mode === 'selected') {
      codesToDownload = codes.filter(c => selectedCodes.includes(c.id));
    }
    
    // Create CSV with proper UTF-8 encoding and BOM
    const csvContent = [
      ['Code', 'Points', 'Package', 'Generated At'],
      ...codesToDownload.map(code => [
        code.code,
        code.points,
        code.package_name || '',
        new Date(code.created_at).toLocaleString()
      ])
    ].map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
    
    // Add UTF-8 BOM for proper encoding
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;
    
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `point-codes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Download JSON format (better for Arabic text)
  const handleDownloadJSON = (mode: 'all' | 'date' | 'selected') => {
    let codesToDownload: PointCode[] = [];
    if (mode === 'all') {
      codesToDownload = codes.filter(c => !c.is_used);
    } else if (mode === 'date') {
      codesToDownload = codes.filter(c => !c.is_used && c.created_at.startsWith(dateFilter));
    } else if (mode === 'selected') {
      codesToDownload = codes.filter(c => selectedCodes.includes(c.id));
    }
    
    const jsonData = codesToDownload.map(code => ({
      code: code.code,
      points: code.points,
      package: code.package_name || '',
      generatedAt: new Date(code.created_at).toISOString(),
      status: 'unused'
    }));
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `point-codes-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filtered codes
  const filteredCodes = codes.filter(code => {
    if (statusFilter === 'used' && !code.is_used) return false;
    if (statusFilter === 'unused' && code.is_used) return false;
    if (packageFilter !== 'all' && code.package_id !== packageFilter) return false;
    if (dateFilter && !code.created_at.startsWith(dateFilter)) return false;
    if (searchName && !(code.used_by_name || '').toLowerCase().includes(searchName.toLowerCase())) return false;
    if (searchEmail && !(code.used_by_email || '').toLowerCase().includes(searchEmail.toLowerCase())) return false;
    return true;
  });

  // Statistics
  const totalCodes = codes.length;
  const usedCodes = codes.filter(c => c.is_used).length;
  const unusedCodes = codes.filter(c => !c.is_used).length;
  const today = new Date().toISOString().split('T')[0];
  const todayCodes = codes.filter(c => c.created_at.startsWith(today)).length;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Codes</p>
                <p className="text-2xl font-bold">{totalCodes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Unused Codes</p>
                <p className="text-2xl font-bold">{unusedCodes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-700" />
              <div>
                <p className="text-sm text-gray-600">Used Codes</p>
                <p className="text-2xl font-bold">{usedCodes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-600">Created Today</p>
                <p className="text-2xl font-bold">{todayCodes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
        <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{revenue.toLocaleString()} DZD</p>
        </div>
        </div>
          </CardContent>
        </Card>
      </div>
      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="searchName">Search Name</Label>
              <input id="searchName" type="text" placeholder="Search Name" value={searchName} onChange={e => setSearchName(e.target.value)} className="border rounded px-2 py-1 w-full" />
            </div>
            <div>
              <Label htmlFor="searchEmail">Search Email</Label>
              <input id="searchEmail" type="text" placeholder="Search Email" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} className="border rounded px-2 py-1 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Download Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Download CSV Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={val => setStatusFilter(val as any)}>
                <SelectTrigger id="status"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unused">Unused</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="package">Package</Label>
              <Select value={packageFilter === 'all' ? 'all' : String(packageFilter)} onValueChange={val => setPackageFilter(val === 'all' ? 'all' : Number(val))}>
                <SelectTrigger id="package"><SelectValue placeholder="Package" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Packages</SelectItem>
                  {packages.map(pkg => (
                    <SelectItem key={pkg.id} value={String(pkg.id)}>{pkg.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <input id="date" type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="border rounded px-2 py-1 w-full" />
            </div>
            <div className="flex gap-2 items-end">
              <Button variant="outline" className="w-full" onClick={() => handleDownloadCodes('all')}><Download className="h-4 w-4 mr-2" />Download All Unused (CSV)</Button>
              <Button variant="outline" className="w-full" onClick={() => handleDownloadCodes('date')} disabled={!dateFilter}><Download className="h-4 w-4 mr-2" />Download Unused by Date (CSV)</Button>
              <Button variant="outline" className="w-full" onClick={() => handleDownloadCodes('selected')} disabled={selectedCodes.length === 0}><Download className="h-4 w-4 mr-2" />Download Selected (CSV)</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Point Codes</CardTitle>
              <CardDescription>View all generated point codes and their status</CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Generate Codes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <input type="checkbox" checked={selectedCodes.length === filteredCodes.length && filteredCodes.length > 0} onChange={e => setSelectedCodes(e.target.checked ? filteredCodes.map(c => c.id) : [])} />
                  </TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Used By</TableHead>
                  <TableHead>Used At</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <input type="checkbox" checked={selectedCodes.includes(code.id)} onChange={e => setSelectedCodes(e.target.checked ? [...selectedCodes, code.id] : selectedCodes.filter(id => id !== code.id))} />
                    </TableCell>
                    <TableCell className="font-mono">{code.code}</TableCell>
                    <TableCell>{code.points}</TableCell>
                    <TableCell>{code.package_name || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        code.is_used ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {code.is_used ? 'Used' : 'Available'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {code.is_used
                        ? <span>{code.used_by_name || '-'}<br/>{code.used_by_email || '-'}</span>
                        : '-'}
                    </TableCell>
                    <TableCell>{code.used_at ? new Date(code.used_at).toLocaleString() : '-'}</TableCell>
                    <TableCell>{new Date(code.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Point Codes</DialogTitle>
            <DialogDescription>
              Generate new point redemption codes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="package">Select Package</Label>
              <Select
                value={selectedPackageId ? String(selectedPackageId) : ''}
                onValueChange={val => setSelectedPackageId(Number(val))}
              >
                <SelectTrigger id="package">
                  <SelectValue placeholder="Choose a package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map(pkg => (
                    <SelectItem key={pkg.id} value={String(pkg.id)}>
                      {pkg.name} ({pkg.points} points, {pkg.price} {pkg.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantity">Number of Codes</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                placeholder="1"
                min="1"
                max="100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateCodes} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPointCodes;
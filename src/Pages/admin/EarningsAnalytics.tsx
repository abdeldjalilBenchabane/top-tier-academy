import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, Users, DollarSign, Coins, CalendarDays, ArrowRight, Eye } from 'lucide-react';
import { toast } from '@/lib/toast';

interface MonthlyRevenue {
  month: string;
  pointCodesRevenue: number;
  pointTransactionsRevenue: number;
  totalRevenue: number;
}

interface ProfessorEarnings {
  professorId: number;
  professorName: string;
  professorEmail: string;
  totalEarnings: number;
  coursesEarnings: number;
  liveSectionsEarnings: number;
  liveSessionsEarnings: number;
  privateClassesEarnings: number;
  languageCoursesEarnings: number;
  studentsCount: number;
  coursesCount: number;
  liveSectionsCount: number;
  liveSessionsCount: number;
  privateClassesCount: number;
  languageCoursesCount: number;
}

interface ProfessorDetail {
  professorId: number;
  professorName: string;
  month: string;
  courses: Array<{
    id: number;
    title: string;
    price: number;
    studentsCount: number;
    earnings: number;
    type: 'education' | 'language';
  }>;
  liveSessions: Array<{
    id: number;
    title: string;
    price: number;
    studentsCount: number;
    earnings: number;
    type: 'education' | 'language';
  }>;
  privateClasses: Array<{
    id: number;
    title: string;
    price: number;
    studentsCount: number;
    earnings: number;
  }>;
}

const EarningsAnalytics: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue | null>(null);
  const [professorEarnings, setProfessorEarnings] = useState<ProfessorEarnings[]>([]);
  const [selectedProfessor, setSelectedProfessor] = useState<ProfessorDetail | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchMonthlyRevenue = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/earnings/monthly-revenue?month=${selectedMonth}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setMonthlyRevenue(data);
    } catch (error) {
      toast.error('Failed to load monthly revenue');
      console.error('Error fetching monthly revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessorEarnings = async () => {
    try {
      const res = await fetch(`/api/admin/earnings/professor-earnings?month=${selectedMonth}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setProfessorEarnings(data.professors || []);
    } catch (error) {
      toast.error('Failed to load professor earnings');
      console.error('Error fetching professor earnings:', error);
    }
  };

  const fetchProfessorDetails = async (professorId: number) => {
    try {
      const res = await fetch(`/api/admin/earnings/professor-details?professorId=${professorId}&month=${selectedMonth}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setSelectedProfessor(data);
      setIsDetailDialogOpen(true);
    } catch (error) {
      toast.error('Failed to load professor details');
      console.error('Error fetching professor details:', error);
    }
  };

  useEffect(() => {
    fetchMonthlyRevenue();
    fetchProfessorEarnings();
  }, [selectedMonth]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount) + ' DZD';
  };

  const getMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      months.push({ value, label });
    }
    return months;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Earnings Analytics</h1>
          <p className="text-gray-600">Track revenue and professor earnings by month</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-gray-500" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getMonthOptions().map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Point Codes Revenue</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? 'Loading...' : formatCurrency(monthlyRevenue?.pointCodesRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From redeemed point codes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Point Transactions Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? 'Loading...' : formatCurrency(monthlyRevenue?.pointTransactionsRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From direct point purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? 'Loading...' : formatCurrency(monthlyRevenue?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined monthly revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Professor Earnings */}
      <Card>
        <CardHeader>
          <CardTitle>Professor Earnings</CardTitle>
          <CardDescription>
            Earnings breakdown for all professors in {new Date(selectedMonth).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading professor earnings...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Professor</TableHead>
                  <TableHead>Total Earnings</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead>Live Sections</TableHead>
                  <TableHead>Live Sessions</TableHead>
                  <TableHead>Private Classes</TableHead>
                  <TableHead>Language Courses</TableHead>

                  <TableHead>Students</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professorEarnings.map((professor) => (
                  <TableRow key={professor.professorId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{professor.professorName}</div>
                        <div className="text-sm text-gray-500">{professor.professorEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-green-600">
                        {formatCurrency(professor.totalEarnings)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatCurrency(professor.coursesEarnings)}</div>
                        <Badge variant="secondary">{professor.coursesCount} courses</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatCurrency(professor.liveSectionsEarnings)}</div>
                        <Badge variant="secondary">{professor.liveSectionsCount} sections</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatCurrency(professor.liveSessionsEarnings)}</div>
                        <Badge variant="secondary">{professor.liveSessionsCount} sessions</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatCurrency(professor.privateClassesEarnings)}</div>
                        <Badge variant="secondary">{professor.privateClassesCount} classes</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatCurrency(professor.languageCoursesEarnings)}</div>
                        <Badge variant="secondary">{professor.languageCoursesCount} courses</Badge>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {professor.studentsCount}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchProfessorDetails(professor.professorId)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Professor Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProfessor?.professorName} - {new Date(selectedMonth).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </DialogTitle>
            <DialogDescription>
              Detailed earnings breakdown for all courses and sessions
            </DialogDescription>
          </DialogHeader>

          {selectedProfessor && (
            <div className="space-y-6">
              {/* Education Courses */}
              {selectedProfessor.courses.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Education Courses</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Earnings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProfessor.courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell>{formatCurrency(course.price)}</TableCell>
                          <TableCell>{course.studentsCount}</TableCell>
                          <TableCell className="font-bold text-green-600">
                            {formatCurrency(course.earnings)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Live Sessions */}
              {selectedProfessor.liveSessions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Live Sessions</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Earnings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProfessor.liveSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">{session.title}</TableCell>
                          <TableCell>
                            <Badge variant={session.type === 'education' ? 'default' : 'secondary'}>
                              {session.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(session.price)}</TableCell>
                          <TableCell>{session.studentsCount}</TableCell>
                          <TableCell className="font-bold text-green-600">
                            {formatCurrency(session.earnings)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Private Classes */}
              {selectedProfessor.privateClasses.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Private Classes</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Earnings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProfessor.privateClasses.map((privateClass) => (
                        <TableRow key={privateClass.id}>
                          <TableCell className="font-medium">{privateClass.title}</TableCell>
                          <TableCell>{formatCurrency(privateClass.price)}</TableCell>
                          <TableCell>{privateClass.studentsCount}</TableCell>
                          <TableCell className="font-bold text-green-600">
                            {formatCurrency(privateClass.earnings)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EarningsAnalytics; 
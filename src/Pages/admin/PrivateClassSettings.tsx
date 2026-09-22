import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, DollarSign, Save, Loader2, History, Settings } from 'lucide-react';
import { toast } from '@/lib/toast';
import { serverDate } from '@/lib/utils';

interface PrivateClassSettings {
  id: number;
  price_per_session: number;
  session_duration: number;
  available_start_time: string;
  available_end_time: string;
  created_at: string;
  updated_at: string;
}

const AdminPrivateClassSettings: React.FC = () => {
  const [settings, setSettings] = useState<PrivateClassSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<PrivateClassSettings[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [formData, setFormData] = useState({
    price_per_session: 0,
    session_duration: 60,
    available_start_time: '08:00',
    available_end_time: '23:00'
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/private-class-settings/admin', {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        setFormData({
          price_per_session: data.settings.price_per_session,
          session_duration: data.settings.session_duration,
          available_start_time: data.settings.available_start_time.substring(0, 5),
          available_end_time: data.settings.available_end_time.substring(0, 5)
        });
      }
    } catch (e) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/private-class-settings/admin/history', {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      setHistory(data.settings || []);
    } catch (e) {
      toast.error('Failed to load history');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!formData.price_per_session || formData.price_per_session < 0) {
      toast.error('Please enter a valid price per session');
      return;
    }

    if (!formData.session_duration || formData.session_duration < 15 || formData.session_duration > 480) {
      toast.error('Session duration must be between 15 and 480 minutes');
      return;
    }

    if (!formData.available_start_time || !formData.available_end_time) {
      toast.error('Please set both start and end times');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/private-class-settings/admin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          price_per_session: parseFloat(formData.price_per_session.toString()),
          session_duration: parseInt(formData.session_duration.toString()),
          available_start_time: formData.available_start_time + ':00',
          available_end_time: formData.available_end_time + ':00'
        }),
      });
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        toast.success(data.message || 'Settings saved successfully');
        fetchSettings();
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Private Class Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure pricing and duration for private class sessions
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setShowHistory(!showHistory);
            if (!showHistory) {
              fetchHistory();
            }
          }}
        >
          <History className="h-4 w-4 mr-2" />
          {showHistory ? 'Hide History' : 'View History'}
        </Button>
      </div>

      {/* Current Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Current Settings
          </CardTitle>
          <CardDescription>
            Configure the price per session and session duration for private classes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="price">Price per Session (DZD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price_per_session}
                  onChange={(e) => setFormData({ ...formData, price_per_session: parseFloat(e.target.value) || 0 })}
                  className="pl-10"
                  placeholder="1000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Session Duration (minutes)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="480"
                  value={formData.session_duration}
                  onChange={(e) => setFormData({ ...formData, session_duration: parseInt(e.target.value) || 60 })}
                  className="pl-10"
                  placeholder="60"
                />
              </div>
              <p className="text-sm text-gray-500">
                Duration: {formatDuration(formData.session_duration)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-time">Available Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={formData.available_start_time}
                onChange={(e) => setFormData({ ...formData, available_start_time: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">Available End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={formData.available_end_time}
                onChange={(e) => setFormData({ ...formData, available_end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Price per session: {formData.price_per_session.toLocaleString()} DZD</p>
              <p>• Session duration: {formatDuration(formData.session_duration)}</p>
              <p>• Available hours: {formData.available_start_time} - {formData.available_end_time}</p>
              <p>• Teachers will choose specific times within this range</p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Settings History */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Settings History
            </CardTitle>
            <CardDescription>
              View previous settings configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Price (DZD)</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Available Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell>
                      {serverDate(setting.created_at).toLocaleDateString()}
                      <br />
                      <span className="text-sm text-gray-500">
                        {serverDate(setting.created_at).toLocaleTimeString()}
                      </span>
                    </TableCell>
                    <TableCell>{setting.price_per_session.toLocaleString()}</TableCell>
                    <TableCell>{formatDuration(setting.session_duration)}</TableCell>
                    <TableCell>
                      {formatTime(setting.available_start_time)} - {formatTime(setting.available_end_time)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminPrivateClassSettings; 
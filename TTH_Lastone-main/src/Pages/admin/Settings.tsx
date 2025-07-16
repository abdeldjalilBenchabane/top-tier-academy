import React from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Settings as SettingsIcon } from 'lucide-react';
import { toast } from '@/lib/toast';

const SettingsPage = () => {
  const handleSaveSettings = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Settings" 
        description="Manage your application settings"
      />
      
      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general application settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="school-name">School Name</Label>
                  <Input id="school-name" defaultValue="SchoolHouse Academy" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input id="admin-email" defaultValue="admin@school.edu" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="public-courses">Public Courses</Label>
                    <p className="text-sm text-gray-500">
                      Allow non-logged in users to view courses
                    </p>
                  </div>
                  <Switch id="public-courses" />
                </div>
              </div>
              
              <Button onClick={handleSaveSettings}>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="course-submissions">Course Submissions</Label>
                    <p className="text-sm text-gray-500">
                      Get notified when professors submit new courses
                    </p>
                  </div>
                  <Switch id="course-submissions" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="course-approvals">Course Approvals</Label>
                    <p className="text-sm text-gray-500">
                      Get notified when courses are approved
                    </p>
                  </div>
                  <Switch id="course-approvals" defaultChecked />
                </div>
              </div>
              
              <Button onClick={handleSaveSettings}>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Advanced system configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storage-path">File Storage Path</Label>
                  <Input id="storage-path" defaultValue="./uploads" />
                  <p className="text-xs text-gray-500 mt-1">
                    Path where course files are stored locally
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="debug-mode">Debug Mode</Label>
                    <p className="text-sm text-gray-500">
                      Enable detailed logging for troubleshooting
                    </p>
                  </div>
                  <Switch id="debug-mode" />
                </div>
              </div>
              
              <Button onClick={handleSaveSettings}>Save Settings</Button>
            </CardContent>
          </Card>
          
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Destructive actions that cannot be undone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                onClick={() => {
                  toast.error('This action is disabled in the demo');
                }}
              >
                Reset Application Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;

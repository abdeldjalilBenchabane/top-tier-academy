import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FolderOpen, 
  FileImage, 
  FileText, 
  FileVideo, 
  FileArchive,
  Download,
  Trash2,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { coursesAPI } from '@/services/api';
import { toast } from '@/lib/toast';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size: number | null;
  modified: string;
}

interface FileScanResult {
  covers: FileItem[];
  content: FileItem[];
  totalCovers: number;
  totalContentFiles: number;
  totalSize: number;
}

const CourseFilesPage = () => {
  const [fileData, setFileData] = useState<FileScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFileData = async () => {
    try {
      setLoading(true);
      const data = await coursesAPI.scanFiles();
      setFileData(data);
    } catch (error) {
      console.error('Error loading file data:', error);
      toast.error('Failed to load file data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      await loadFileData();
      toast.success('File data refreshed');
    } catch (error) {
      toast.error('Failed to refresh file data');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFileData();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <FileImage className="h-4 w-4 text-blue-500" />;
    } else if (['mp4', 'webm', 'mov', 'avi', 'm4v', '3gp'].includes(ext || '')) {
      return <FileVideo className="h-4 w-4 text-red-500" />;
    } else if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
      return <FileText className="h-4 w-4 text-green-500" />;
    } else if (['zip', 'rar', '7z'].includes(ext || '')) {
      return <FileArchive className="h-4 w-4 text-orange-500" />;
    } else {
      return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderFileList = (files: FileItem[], title: string, type: 'covers' | 'content') => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {type === 'covers' ? <FileImage className="h-5 w-5" /> : <FolderOpen className="h-5 w-5" />}
          {title}
          <Badge variant="secondary">
            {files.filter(f => f.type === 'file').length} files
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No files found</p>
        ) : (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  {file.type === 'directory' ? (
                    <FolderOpen className="h-4 w-4 text-yellow-500" />
                  ) : (
                    getFileIcon(file.name)
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {file.type === 'file' && file.size && formatFileSize(file.size)}
                      {file.type === 'file' && file.size && ' • '}
                      Modified: {formatDate(file.modified)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {file.type === 'file' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // In a real app, you would implement file download
                          toast.info('Download functionality would be implemented here');
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          // In a real app, you would implement file deletion
                          toast.info('Delete functionality would be implemented here');
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading file data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Course Files Management</h1>
          <p className="text-gray-600">Manage course covers and content files</p>
        </div>
        
        <Button
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {fileData && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileImage className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Covers</p>
                    <p className="text-2xl font-bold">{fileData.totalCovers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Content Files</p>
                    <p className="text-2xl font-bold">{fileData.totalContentFiles}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Size</p>
                    <p className="text-2xl font-bold">{formatFileSize(fileData.totalSize)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* File Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderFileList(fileData.covers, 'Course Covers', 'covers')}
            {renderFileList(fileData.content, 'Course Content Files', 'content')}
          </div>
        </>
      )}
    </div>
  );
};

export default CourseFilesPage; 
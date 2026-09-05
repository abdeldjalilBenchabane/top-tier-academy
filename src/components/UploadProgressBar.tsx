import React, { useState, useEffect } from 'react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { X, CheckCircle, AlertCircle, Upload } from 'lucide-react';

interface UploadProgress {
  id: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  uploadedSize: number;
  totalSize: number;
  estimatedTimeRemaining: number | null;
  error?: string;
}

interface UploadProgressBarProps {
  uploadId: string;
  filename: string;
  totalSize: number;
  onComplete?: (success: boolean) => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
  uploadId,
  filename,
  totalSize,
  onComplete,
  onCancel,
  showCancel = true
}) => {
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format time remaining
  const formatTimeRemaining = (ms: number): string => {
    if (!ms || ms < 0) return 'Calculating...';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s remaining`;
    } else {
      return `${seconds}s remaining`;
    }
  };

  // Poll for progress updates
  useEffect(() => {
    if (!isPolling) return;

    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/upload-progress/${uploadId}`);
        if (response.ok) {
          const data = await response.json();
          setProgress(data);
          
          // Stop polling if upload is complete
          if (data.status === 'completed' || data.status === 'failed') {
            setIsPolling(false);
            onComplete?.(data.status === 'completed');
          }
        }
      } catch (error) {
        console.error('Error polling upload progress:', error);
      }
    };

    // Poll immediately, then every 2 seconds
    pollProgress();
    const interval = setInterval(pollProgress, 2000);

    return () => clearInterval(interval);
  }, [uploadId, isPolling, onComplete]);

  if (!progress) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
        <Upload className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm text-blue-600">Initializing upload...</span>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {progress.status === 'uploading' && (
            <Upload className="h-4 w-4 animate-spin text-blue-600" />
          )}
          {progress.status === 'completed' && (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          {progress.status === 'failed' && (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <span className="text-sm font-medium text-gray-700 truncate">
            {filename}
          </span>
        </div>
        {showCancel && progress.status === 'uploading' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatFileSize(progress.uploadedSize)} / {formatFileSize(progress.totalSize)}</span>
          <span>{progress.progress}%</span>
        </div>
        
        <Progress value={progress.progress} className="h-2" />
        
        {progress.status === 'uploading' && progress.estimatedTimeRemaining && (
          <div className="text-xs text-gray-500">
            {formatTimeRemaining(progress.estimatedTimeRemaining)}
          </div>
        )}
        
        {progress.status === 'failed' && progress.error && (
          <div className="text-xs text-red-600 mt-1">
            Error: {progress.error}
          </div>
        )}
        
        {progress.status === 'completed' && (
          <div className="text-xs text-green-600 mt-1">
            Upload completed successfully!
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadProgressBar; 
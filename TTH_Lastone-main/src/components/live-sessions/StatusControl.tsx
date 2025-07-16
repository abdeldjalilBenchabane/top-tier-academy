import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LiveSession } from '@/types';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Play, Pause, Square, RotateCw, Ban, Archive } from 'lucide-react';
import PathSelectorForSession from './PathSelectorForSession';

interface StatusControlProps {
  session: LiveSession;
  onStatusUpdate: () => void;
  userRole: 'admin' | 'professor';
  isOwner?: boolean;
}

const StatusControl = ({ session, onStatusUpdate, userRole, isOwner = false }: StatusControlProps) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState<LiveSession['status']>(session.status || 'scheduled');
  const [showPathSelector, setShowPathSelector] = React.useState(false);

  const handleStatusChange = async (newStatus: LiveSession['status']) => {
    try {
      await api.updateLiveSessionStatus(session.id, newStatus);
      toast.success(`Session status updated to ${newStatus}`);
      onStatusUpdate();
    } catch (error) {
      console.error('Failed to update session status:', error);
      toast.error('Failed to update session status');
    }
  };

  const handleSaveToLibrary = () => {
    setShowPathSelector(true);
  };

  const handlePathSelectionSuccess = () => {
    setIsDialogOpen(false);
    setShowPathSelector(false);
    onStatusUpdate();
  };

  const handlePathSelectionCancel = () => {
    setShowPathSelector(false);
  };

  const getStatusIcon = (status: LiveSession['status']) => {
    switch (status) {
      case 'live': return <Play className="h-3 w-3" />;
      case 'paused': return <Pause className="h-3 w-3" />;
      case 'ended': return <Square className="h-3 w-3" />;
      case 'starting': return <RotateCw className="h-3 w-3" />;
      case 'cancelled': return <Ban className="h-3 w-3" />;
      default: return null;
    }
  };

  const canChangeStatus = userRole === 'admin' || isOwner;
  const canSaveToLibrary = userRole === 'admin' && (session.status === 'ended' || session.status === 'live');

  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled', disabled: false },
    { value: 'starting', label: 'Starting', disabled: false },
    { value: 'live', label: 'Live', disabled: false },
    { value: 'paused', label: 'Paused', disabled: session.status !== 'live' },
    { value: 'ended', label: 'Ended', disabled: false },
    { value: 'cancelled', label: 'Cancelled', disabled: false },
    { value: 'technical_issues', label: 'Technical Issues', disabled: false },
  ] as const;

  if (!canChangeStatus && !canSaveToLibrary) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {canChangeStatus && (
        <Select
          value={selectedStatus}
          onValueChange={(value: LiveSession['status']) => {
            setSelectedStatus(value);
            handleStatusChange(value);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue>
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedStatus)}
                <span className="capitalize">{selectedStatus ? selectedStatus.replace('_', ' ') : 'Unknown'}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(option.value)}
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {canSaveToLibrary && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Archive className="h-4 w-4 mr-2" />
              Save to Library
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Save Session to Library</DialogTitle>
              <DialogDescription>
                Choose where to place "{session.title}" in the educational structure.
              </DialogDescription>
            </DialogHeader>

            {showPathSelector ? (
              <PathSelectorForSession
                session={session}
                onSuccess={handlePathSelectionSuccess}
                onCancel={handlePathSelectionCancel}
              />
            ) : (
              <>
                <div className="py-4">
                  <p className="text-sm text-gray-600">
                    This will save the live session to the course library, making it available as a recorded session for students. You'll need to select the appropriate educational path for this session.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveToLibrary}>
                    Continue
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default StatusControl;

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface GenerateCodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packages: any[];
  selectedPackage: string;
  onPackageChange: (value: string) => void;
  quantity: number;
  onQuantityChange: (value: number) => void;
  onGenerate: () => void;
  loading: boolean;
}

const GenerateCodesDialog: React.FC<GenerateCodesDialogProps> = ({
  open,
  onOpenChange,
  packages,
  selectedPackage,
  onPackageChange,
  quantity,
  onQuantityChange,
  onGenerate,
  loading
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Point Codes</DialogTitle>
          <DialogDescription>
            Select a package and specify the number of codes to generate
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Package</Label>
            <Select value={selectedPackage} onValueChange={onPackageChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a package" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name} - {pkg.points} points
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Number of Codes</Label>
            <Input
              type="number"
              min="1"
              max="100"
              value={quantity}
              onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onGenerate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Codes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateCodesDialog;
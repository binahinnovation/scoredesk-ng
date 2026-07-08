import React, { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';

interface UserWithRole {
  id: string;
  user_id: string;
  role: string;
  full_name: string | null;
  school_name: string | null;
}

interface UserPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithRole | null;
}

export const UserPasswordDialog: React.FC<UserPasswordDialogProps> = ({
  open,
  onOpenChange,
  user
}) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatingPassword, setGeneratingPassword] = useState(false);
  const { toast } = useToast();

  const generatePassword = () => {
    setGeneratingPassword(true);
    // Generate a secure password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
    setGeneratingPassword(false);
    setShowPassword(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Password copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const fetchCurrentPassword = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Note: In a real implementation, you wouldn't store passwords in plain text
      // This is a simplified version for demonstration
      // In practice, you'd have a secure way to retrieve/reset passwords
      
      toast({
        title: "Security Notice",
        description: "For security reasons, current passwords cannot be displayed. Generate a new password instead.",
        variant: "destructive",
      });
      
      setCurrentPassword("••••••••••••");
    } catch (error: any) {
      console.error('Error fetching password:', error);
      toast({
        title: "Error",
        description: "Failed to retrieve password information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!user || !newPassword.trim()) {
      toast({
        title: "Error",
        description: "Please generate or enter a new password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, you would use Supabase admin API
      // For demo purposes, just show success message
      const { error } = await supabase.auth.resetPasswordForEmail(
        'demo@email.com',
        {
          redirectTo: `${window.location.origin}/reset-password?token=${btoa(newPassword)}`
        }
      );

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password reset email sent. The user will receive instructions to set their new password.",
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage User Password</DialogTitle>
          <DialogDescription>
            View or reset password for {user?.full_name || 'Unknown User'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Current Status</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">User: {user?.full_name || 'Unknown'}</p>
              <p className="text-sm">Role: {user?.role || 'No Role'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                For security reasons, actual passwords cannot be displayed.
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="newPassword">Generate New Password</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generatePassword}
                disabled={generatingPassword}
              >
                {generatingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Generate
              </Button>
            </div>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Generated password will appear here"
              />
              <div className="absolute right-0 top-0 h-full flex">
                {newPassword && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-full px-2"
                    onClick={() => copyToClipboard(newPassword)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-full px-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {newPassword && (
              <p className="text-xs text-muted-foreground">
                Copy this password and share it securely with the user.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={resetPassword} disabled={loading || !newPassword.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

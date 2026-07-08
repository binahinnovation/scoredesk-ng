import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { logEdit, getCurrentUserSchoolId } from '@/utils/auditLogger';
import { useAuth } from '@/hooks/use-auth';

interface UserWithRole {
  id: string;
  user_id: string;
  role: string;
  full_name: string | null;
  school_name: string | null;
}

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithRole | null;
  onUserUpdated: () => void;
}

const ROLES = [
  "Principal",
  "Exam Officer", 
  "Form Teacher",
  "Subject Teacher"
];

export const UserEditDialog: React.FC<UserEditDialogProps> = ({
  open,
  onOpenChange,
  user,
  onUserUpdated
}) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [generatingPassword, setGeneratingPassword] = useState(false);
  const [userSchoolId, setUserSchoolId] = useState<string | null>(null);
  const [editReason, setEditReason] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    school_name: '',
    role: ''
  });
  const { toast } = useToast();

  // Fetch current user's school ID for audit logging
  useEffect(() => {
    const fetchSchoolId = async () => {
      if (currentUser) {
        const schoolId = await getCurrentUserSchoolId();
        setUserSchoolId(schoolId);
      }
    };
    fetchSchoolId();
  }, [currentUser]);

  useEffect(() => {
    if (user && open) {
      setFormData({
        full_name: user.full_name || '',
        school_name: user.school_name || '',
        role: user.role || 'Subject Teacher'
      });
      setNewPassword('');
      setShowPassword(false);
      setEditReason('');
    }
  }, [user, open]);

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

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch old profile data for audit logging
      const { data: oldProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user_id)
        .single();

      // Fetch old role data for audit logging
      const { data: oldRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.user_id)
        .single();

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          school_name: formData.school_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.user_id);

      if (profileError) throw profileError;

      // Fetch updated profile for audit logging
      const { data: newProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user_id)
        .single();

      // Update role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({
          role: formData.role as any
        })
        .eq('user_id', user.user_id);

      if (roleError) throw roleError;

      // Update password if provided
      if (newPassword.trim()) {
        // For now, we'll skip password updates via admin API due to permission issues
        // The user will need to reset their password manually or through the auth flow
        toast({
          title: "Password Update Skipped",
          description: "Profile and role updated successfully. Password updates require manual reset through the login page.",
          variant: "default",
        });
      }

      // Fetch updated role for audit logging
      const { data: newRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.user_id)
        .single();

      // Log profile update
      if (currentUser && userSchoolId && oldProfile && newProfile) {
        await logEdit({
          schoolId: userSchoolId,
          actorId: currentUser.id,
          actionType: 'update',
          tableName: 'profiles',
          recordId: user.user_id,
          oldValue: oldProfile,
          newValue: newProfile,
          reason: editReason || 'Profile update',
        });
      }

      // Log role update
      if (currentUser && userSchoolId && newRole) {
        await logEdit({
          schoolId: userSchoolId,
          actorId: currentUser.id,
          actionType: oldRole ? 'update' : 'insert',
          tableName: 'user_roles',
          recordId: newRole.id,
          oldValue: oldRole,
          newValue: newRole,
          reason: editReason || 'Role assignment',
        });
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      onUserUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information, role, and optionally reset password.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Enter full name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="school_name">School Name</Label>
            <Input
              id="school_name"
              value={formData.school_name}
              onChange={(e) => setFormData(prev => ({ ...prev, school_name: e.target.value }))}
              placeholder="Enter school name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">New Password (Optional)</Label>
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
                id="password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave empty to keep current password"
              />
              {newPassword && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              )}
            </div>
            {newPassword && (
              <p className="text-xs text-muted-foreground">
                Make sure to share this password with the user securely.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="editReason">Reason for changes (Optional)</Label>
            <Textarea
              id="editReason"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="e.g., Corrected user information, role change requested, password reset"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

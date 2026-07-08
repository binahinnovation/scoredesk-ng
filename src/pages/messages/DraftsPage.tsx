import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Calendar, Edit, Trash2, Send } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

interface DraftMessage {
  id: string;
  subject: string;
  body: string;
  created_at: string;
  has_attachments: boolean;
}

export default function DraftsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch draft messages
  const { data: messages, loading, refetch } = useSupabaseQuery<DraftMessage[]>(
    async () => {
      if (!user) return { data: [], error: null };
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          subject,
          body,
          created_at,
          has_attachments
        `)
        .eq('sender_id', user.id)
        .eq('is_draft', true)
        .order('created_at', { ascending: false });
      
      return { data, error };
    },
    [user]
  );

  const handleEditDraft = (messageId: string) => {
    navigate(`/messages/compose?draft=${messageId}`);
  };

  const handleDeleteDraft = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Draft message deleted successfully.",
      });

      refetch();
    } catch (error: any) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete draft message.",
        variant: "destructive",
      });
    }
  };

  const handleSendDraft = (messageId: string) => {
    navigate(`/messages/compose?draft=${messageId}&send=true`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Draft Messages</h1>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Draft Messages</h1>
        <Badge variant="secondary">{messages?.length || 0} drafts</Badge>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Draft Messages</CardTitle>
          <CardDescription>
            View and manage your draft messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!messages || messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No draft messages</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-20">Attachments</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <TableRow key={message.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium">{message.subject || 'No Subject'}</div>
                      <div className="text-sm text-gray-500 truncate max-w-md">
                        {message.body ? message.body.substring(0, 100) + '...' : 'No content'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(message.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {message.has_attachments && (
                        <FileText className="h-4 w-4 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditDraft(message.id)}
                          title="Edit draft"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSendDraft(message.id)}
                          title="Send message"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteDraft(message.id)}
                          title="Delete draft"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

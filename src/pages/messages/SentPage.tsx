import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Send, Calendar, User, FileText, Eye, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface SentMessage {
  id: string;
  subject: string;
  body: string;
  created_at: string;
  has_attachments: boolean;
  is_draft: boolean;
  message_recipients: {
    recipient_id: string;
    read_at: string | null;
  }[];
}

interface Profile {
  id: string;
  full_name: string;
}

export default function SentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch sent messages
  const { data: messages, loading } = useSupabaseQuery<SentMessage[]>(
    async () => {
      if (!user) return { data: [], error: null };
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          subject,
          body,
          created_at,
          has_attachments,
          is_draft,
          message_recipients(
            read_at,
            recipient_id
          )
        `)
        .eq('sender_id', user.id)
        .eq('is_draft', false)
        .order('created_at', { ascending: false });
      
      return { data, error };
    },
    [user]
  );

  // Fetch profiles for recipient names
  const { data: profiles } = useSupabaseQuery<Profile[]>(
    async () => {
      if (!messages || messages.length === 0) return { data: [], error: null };
      
      const recipientIds = [...new Set(messages.flatMap(m => m.message_recipients.map(r => r.recipient_id)))];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', recipientIds);
      
      return { data, error };
    },
    [messages]
  );

  const handleViewMessage = (messageId: string) => {
    navigate(`/messages/view/${messageId}`);
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

  const getRecipientName = (recipientId: string) => {
    const profile = profiles?.find(p => p.id === recipientId);
    return profile?.full_name || 'Unknown';
  };

  const getRecipientNames = (recipients: SentMessage['message_recipients']) => {
    return recipients.map(r => getRecipientName(r.recipient_id)).join(', ');
  };

  const getReadStatus = (recipients: SentMessage['message_recipients']) => {
    const readCount = recipients.filter(r => r.read_at !== null).length;
    const totalCount = recipients.length;
    return { readCount, totalCount };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Send className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Sent Messages</h1>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Send className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Sent Messages</h1>
        <Badge variant="secondary">{messages?.length || 0} messages</Badge>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Sent Messages</CardTitle>
          <CardDescription>
            View messages you have sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!messages || messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Send className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No sent messages</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>To</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Read Status</TableHead>
                  <TableHead className="w-20">Attachments</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => {
                  const { readCount, totalCount } = getReadStatus(message.message_recipients);
                  return (
                    <TableRow 
                      key={message.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleViewMessage(message.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="truncate max-w-48">
                            {getRecipientNames(message.message_recipients)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{message.subject}</div>
                        <div className="text-sm text-gray-500 truncate max-w-md">
                          {message.body.substring(0, 100)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {formatDate(message.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={readCount === totalCount ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {readCount}/{totalCount} read
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {message.has_attachments && (
                          <FileText className="h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewMessage(message.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

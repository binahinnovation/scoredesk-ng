import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Inbox, Mail, MailOpen, Calendar, User, FileText, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Message {
  id: string;
  subject: string;
  body: string;
  created_at: string;
  has_attachments: boolean;
  sender_id: string;
  message_recipients: {
    read_at: string | null;
  }[];
}

interface Profile {
  id: string;
  full_name: string;
}

export default function InboxPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch received messages
  const { data: messages, loading, refetch } = useSupabaseQuery<Message[]>(
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
          sender_id,
          message_recipients!inner(read_at)
        `)
        .eq('message_recipients.recipient_id', user.id)
        .eq('is_draft', false)
        .order('created_at', { ascending: false });
      
      return { data, error };
    },
    [user]
  );

  // Fetch profiles for sender names
  const { data: profiles } = useSupabaseQuery<Profile[]>(
    async () => {
      if (!messages || messages.length === 0) return { data: [], error: null };
      
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', senderIds);
      
      return { data, error };
    },
    [messages]
  );

  const getSenderName = (senderId: string) => {
    const profile = profiles?.find(p => p.id === senderId);
    return profile?.full_name || 'Unknown Sender';
  };

  const handleViewMessage = (messageId: string) => {
    navigate(`/messages/view/${messageId}`);
  };

  const markAsRead = async (messageId: string) => {
    if (!user) return;
    
    await supabase
      .from('message_recipients')
      .update({ read_at: new Date().toISOString() })
      .eq('message_id', messageId)
      .eq('recipient_id', user.id);
    
    refetch();
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
          <Inbox className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Inbox className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
        <Badge variant="secondary">{messages?.length || 0} messages</Badge>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Received Messages</CardTitle>
          <CardDescription>
            View and manage your received messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!messages || messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Inbox className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No messages in your inbox</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-20">Attachments</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => {
                  const isRead = message.message_recipients[0]?.read_at !== null;
                  return (
                    <TableRow 
                      key={message.id} 
                      className={`cursor-pointer hover:bg-gray-50 ${!isRead ? 'bg-blue-50' : ''}`}
                      onClick={() => handleViewMessage(message.id)}
                    >
                      <TableCell>
                        {isRead ? (
                          <MailOpen className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Mail className="h-4 w-4 text-blue-600" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {getSenderName(message.sender_id)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`${!isRead ? 'font-semibold' : ''}`}>
                          {message.subject}
                        </div>
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
                        {message.has_attachments && (
                          <FileText className="h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
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
                          {!isRead && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(message.id);
                              }}
                            >
                              <MailOpen className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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

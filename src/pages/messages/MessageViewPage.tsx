import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mail, ArrowLeft, Calendar, User, Users, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface MessageDetails {
  id: string;
  subject: string;
  body: string;
  created_at: string;
  has_attachments: boolean;
  sender_id: string;
  message_recipients: {
    recipient_id: string;
    read_at: string | null;
  }[];
}

interface Profile {
  id: string;
  full_name: string;
}

export default function MessageViewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { messageId } = useParams<{ messageId: string }>();

  // Fetch message details
  const { data: message, loading, refetch } = useSupabaseQuery<MessageDetails>(
    async () => {
      if (!user || !messageId) return { data: null, error: null };
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          subject,
          body,
          created_at,
          has_attachments,
          sender_id,
          message_recipients(
            read_at,
            recipient_id
          )
        `)
        .eq('id', messageId)
        .single();
      
      return { data, error };
    },
    [user, messageId]
  );

  // Fetch profiles for sender and recipient names
  const { data: profiles } = useSupabaseQuery<Profile[]>(
    async () => {
      if (!message) return { data: [], error: null };
      
      const userIds = [message.sender_id, ...message.message_recipients.map(r => r.recipient_id)];
      const uniqueUserIds = [...new Set(userIds)];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', uniqueUserIds);
      
      return { data, error };
    },
    [message]
  );

  // Mark message as read if user is a recipient
  useEffect(() => {
    const markAsRead = async () => {
      if (!user || !messageId || !message) return;
      
      const isRecipient = message.message_recipients.some(
        r => r.recipient_id === user.id
      );
      
      if (isRecipient) {
        await supabase
          .from('message_recipients')
          .update({ read_at: new Date().toISOString() })
          .eq('message_id', messageId)
          .eq('recipient_id', user.id)
          .is('read_at', null);
      }
    };

    markAsRead();
  }, [user, messageId, message]);

  const getUserName = (userId: string) => {
    const profile = profiles?.find(p => p.id === userId);
    return profile?.full_name || 'Unknown User';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Mail className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Message Details</h1>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (!message) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Mail className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Message Not Found</h1>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Message not found or you don't have permission to view it.</p>
            <Button onClick={handleGoBack} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Message Details</h1>
        </div>
        <Button variant="outline" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{message.subject}</CardTitle>
              <CardDescription className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  From: {getUserName(message.sender_id)}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(message.created_at)}
                </span>
              </CardDescription>
            </div>
            {message.has_attachments && (
              <Badge variant="secondary">
                <FileText className="h-4 w-4 mr-1" />
                Has Attachments
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {message.message_recipients.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Recipients ({message.message_recipients.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {message.message_recipients.map((recipient, index) => (
                  <Badge 
                    key={index} 
                    variant={recipient.read_at ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {getUserName(recipient.recipient_id)}
                    {recipient.read_at && " ✓"}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <Separator />
          
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-900">
              {message.body}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PenTool, Send, Save, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';

interface Profile {
  id: string;
  full_name: string;
}

export default function ComposeMessagePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [recipientId, setRecipientId] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState<boolean>(false);

  // Fetch all profiles to use as recipients
  const { data: allProfiles, loading: profilesLoading } = useSupabaseQuery<Profile[]>(
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .neq('id', user?.id); // Exclude current user from recipients
      return { data, error };
    },
    [user]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setAttachments(Array.from(event.target.files));
    }
  };

  const handleSendMessage = async (isDraft: boolean) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to send messages.",
        variant: "destructive",
      });
      return;
    }

    if (!isDraft && (!recipientId || !subject.trim() || !body.trim())) {
      toast({
        title: "Missing Information",
        description: "Please fill in recipient, subject, and message body.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      // Get user's school_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .single();

      // Check if user has a school_id
      if (!profile?.school_id) {
        toast({
          title: "Error",
          description: "Your profile is not associated with a school. Please contact your administrator.",
          variant: "destructive",
        });
        return;
      }

      // 1. Insert message into 'messages' table
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          school_id: profile.school_id,
          sender_id: user.id,
          subject: subject.trim(),
          body: body.trim(),
          has_attachments: attachments.length > 0,
          is_draft: isDraft,
        })
        .select()
        .single();

      if (messageError) {
        console.error("Message insert error:", messageError);
        throw new Error(`Failed to create message: ${messageError.message}`);
      }

      const messageId = messageData.id;

      // 2. Insert recipient into 'message_recipients' table (if not a draft)
      if (!isDraft && recipientId) {
        const { error: recipientError } = await supabase
          .from('message_recipients')
          .insert({
            message_id: messageId,
            recipient_id: recipientId,
          });
        if (recipientError) {
          console.error("Recipient insert error:", recipientError);
          throw new Error(`Failed to add recipient: ${recipientError.message}`);
        }
      }

      // 3. Upload attachments to storage (if any)
      if (attachments.length > 0) {
        for (const file of attachments) {
          const filePath = `${messageId}/${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('message_attachments')
            .upload(filePath, file);
          
          if (uploadError) {
            console.error("Error uploading attachment:", uploadError);
          } else {
            // Record attachment in database
            await supabase
              .from('message_attachments')
              .insert({
                message_id: messageId,
                file_path: filePath,
              });
          }
        }
      }

      toast({
        title: "Success",
        description: isDraft ? "Message saved as draft!" : "Message sent successfully!",
      });

      // Clear form
      setRecipientId('');
      setSubject('');
      setBody('');
      setAttachments([]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <PenTool className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Compose Message</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>New Message</CardTitle>
          <CardDescription>
            Compose and send a new message
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="recipient">To</Label>
            <Select value={recipientId} onValueChange={setRecipientId} disabled={profilesLoading || sending}>
              <SelectTrigger id="recipient">
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {profilesLoading ? (
                  <SelectItem value="loading" disabled>Loading recipients...</SelectItem>
                ) : (
                  allProfiles?.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name || 'Unknown User'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject"
              disabled={sending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Compose your message here..."
              disabled={sending}
              className="min-h-[200px] resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachments">Attachments</Label>
            <Input
              id="attachments"
              type="file"
              multiple
              onChange={handleFileChange}
              disabled={sending}
            />
            {attachments.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Selected files: {attachments.map(file => file.name).join(', ')}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleSendMessage(true)}
              disabled={sending || !subject.trim() && !body.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {sending ? "Saving Draft..." : "Save as Draft"}
            </Button>
            <Button
              onClick={() => handleSendMessage(false)}
              disabled={sending || !recipientId || !subject.trim() || !body.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

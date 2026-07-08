import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { useSchoolId } from '@/hooks/use-school-id';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Cloud, Upload, Download, Trash2, FileText, Loader2, HardDrive, File as FileIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CloudStorage() {
  const { user } = useAuth();
  const { schoolId, loading: schoolIdLoading } = useSchoolId();

  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (schoolId) fetchData();
  }, [schoolId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('school_documents')
        .select(`*, profiles(first_name, last_name)`)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !schoolId || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${schoolId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('school_documents')
        .upload(filePath, file);

      if (uploadError) throw new Error(uploadError.message || "Failed to upload file.");

      const { error: dbError } = await supabase
        .from('school_documents')
        .insert({
          school_id: schoolId,
          file_name: file.name,
          file_size: file.size,
          content_type: file.type,
          storage_path: filePath,
          uploaded_by: user.id,
        });

      if (dbError) throw dbError;

      toast({ title: "Success", description: "Document uploaded successfully." });
      fetchData();
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('school_documents')
        .download(doc.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (error: any) {
      toast({ title: "Download Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (doc: any) => {
    if (!window.confirm(`Are you sure you want to delete ${doc.file_name}?`)) return;

    try {
      // Delete database record first to prevent orphan metadata
      const { error: dbError } = await supabase
        .from('school_documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      // Then delete the actual file from storage
      const { error: storageError } = await supabase.storage
        .from('school_documents')
        .remove([doc.storage_path]);

      if (storageError) {
        console.warn('File removed from DB but storage cleanup failed:', storageError.message);
      }

      toast({ title: "Deleted", description: "Document has been removed." });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIconColor = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'text-red-500 bg-red-50';
      case 'doc':
      case 'docx': return 'text-blue-500 bg-blue-50';
      case 'xls':
      case 'xlsx':
      case 'csv': return 'text-green-500 bg-green-50';
      case 'jpg':
      case 'png':
      case 'jpeg': return 'text-emerald-500 bg-emerald-50';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  if (schoolIdLoading) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50/50 rounded-xl p-6 border border-indigo-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-lg shadow-sm border border-indigo-100">
            <Cloud className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Secure Cloud Storage</h1>
            <p className="text-gray-600 mt-1">Upload, share, and manage school documents securely.</p>
          </div>
        </div>
        
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4 mr-2" /> Upload File</>}
          </Button>
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50 border-b border-gray-100">
              <TableRow>
                <TableHead className="py-4 pl-6 font-semibold text-gray-700">File Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Size</TableHead>
                <TableHead className="font-semibold text-gray-700">Uploaded By</TableHead>
                <TableHead className="font-semibold text-gray-700">Date</TableHead>
                <TableHead className="text-right pr-6 font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" /></TableCell></TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <HardDrive className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900">Storage is empty</p>
                    <p className="text-sm text-gray-500 mt-1 mb-4">Click the upload button to add your first document.</p>
                    <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" /> Upload File
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map(doc => (
                  <TableRow key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${getFileIconColor(doc.file_name)}`}>
                          <FileIcon className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-gray-900 truncate max-w-[200px] md:max-w-md">{doc.file_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 font-medium">
                      {formatBytes(doc.file_size)}
                    </TableCell>
                    <TableCell>
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded text-xs font-medium border border-gray-200">
                        {doc.profiles?.first_name} {doc.profiles?.last_name}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50" onClick={() => handleDownload(doc)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(doc)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

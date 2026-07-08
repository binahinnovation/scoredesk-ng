import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Eye, FileDown, Check, X, Clock, Filter, Search, RefreshCw, FileText, Users, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-user-role";
import { useSchoolId } from "@/hooks/use-school-id";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";
import jsPDF from 'jspdf';

interface QuestionPaper {
  id: string;
  title: string;
  subject_id: string;
  class_id: string;
  term_id: string;
  teacher_id: string;
  submission_mode: string;
  content: any;
  file_url: string | null;
  pdf_url: string | null;
  status: string;
  created_at: string;
  submitted_at: string;
  approved_at: string | null;
  approved_by: string | null;
  subjects: { name: string; code: string } | null;
  classes: { name: string } | null;
  terms: { name: string; academic_year: string } | null;
  profiles: { full_name: string | null } | null;
}

export default function QuestionPaperManagement() {
  const { user } = useAuth();
  const { hasPermission } = useUserRole();
  const { schoolId, loading: schoolIdLoading } = useSchoolId();
  const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if ((hasPermission("Result Approval") || hasPermission("Manage Users")) && schoolId && !schoolIdLoading) {
      fetchData();
    }
  }, [hasPermission, schoolId, schoolIdLoading]);

  const fetchData = async () => {
    if (!schoolId) return;
    
    try {
      // Fetch basic data first
      const [subjectsRes, classesRes, termsRes] = await Promise.all([
        supabase.from("subjects").select("*").eq("school_id", schoolId),
        supabase.from("classes").select("*").eq("school_id", schoolId),
        supabase.from("terms").select("*").eq("school_id", schoolId).order("is_current", { ascending: false })
      ]);

      setSubjects(subjectsRes.data || []);
      setClasses(classesRes.data || []);
      setTerms(termsRes.data || []);

      // Fetch question papers separately to avoid complex join issues
      const { data: papersData, error: papersError } = await supabase
        .from("question_papers")
        .select("*")
        .eq("school_id", schoolId)
        .order('created_at', { ascending: false });

      if (papersError) {
        console.error("Error fetching question papers:", papersError);
        
        // Try a simpler query as fallback
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("question_papers")
          .select("*")
          .eq("school_id", schoolId);
          
        if (fallbackError) {
          console.error("Fallback query also failed:", fallbackError);
          throw fallbackError;
        }
        
        // Use fallback data
        const enrichedPapers = (fallbackData || []).map(paper => ({
          ...paper,
          subjects: subjectsRes.data?.find(s => s.id === paper.subject_id) || null,
          classes: classesRes.data?.find(c => c.id === paper.class_id) || null,
          terms: termsRes.data?.find(t => t.id === paper.term_id) || null,
          profiles: { full_name: null }
        }));
        
        setQuestionPapers(enrichedPapers);
        return;
      }

      // Manually join the data
      const enrichedPapers = (papersData || []).map(paper => ({
        ...paper,
        subjects: subjectsRes.data?.find(s => s.id === paper.subject_id) || null,
        classes: classesRes.data?.find(c => c.id === paper.class_id) || null,
        terms: termsRes.data?.find(t => t.id === paper.term_id) || null,
        profiles: { full_name: null } // We'll fetch this separately if needed
      }));

      setQuestionPapers(enrichedPapers);
      
      console.log("Loaded question papers:", enrichedPapers.length);

      // Set current term as default
      const currentTerm = termsRes.data?.find(term => term.is_current);
      if (currentTerm) {
        setSelectedTerm(currentTerm.id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (paperId: string, newStatus: 'Approved' | 'Rejected') => {
    try {
      const { error } = await supabase
        .from('question_papers')
        .update({
          status: newStatus,
          approved_by: newStatus === 'Approved' ? user?.id : null,
          approved_at: newStatus === 'Approved' ? new Date().toISOString() : null
        })
        .eq('id', paperId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Question paper ${newStatus.toLowerCase()} successfully`,
      });

      await fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };


  const bulkDownloadPDFs = async () => {
    const approvedPapers = filteredPapers.filter(paper => 
      paper.status === 'Approved' && paper.pdf_url
    );

    if (approvedPapers.length === 0) {
      toast({
        title: "No PDFs Available",
        description: "No approved question papers with PDFs found",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create a combined PDF
      const combinedPdf = new jsPDF();
      let isFirstPage = true;

      for (const paper of approvedPapers) {
        if (!isFirstPage) {
          combinedPdf.addPage();
        }
        
        // Add cover page for each paper
        combinedPdf.setFontSize(16);
        combinedPdf.text(paper.title, 20, 30);
        combinedPdf.setFontSize(12);
        combinedPdf.text(`Subject: ${paper.subjects?.name}`, 20, 50);
        combinedPdf.text(`Class: ${paper.classes?.name}`, 20, 65);
        combinedPdf.text(`Teacher: ${paper.profiles?.full_name}`, 20, 80);
        combinedPdf.text(`Submitted: ${new Date(paper.submitted_at).toLocaleDateString()}`, 20, 95);
        
        combinedPdf.addPage();
        isFirstPage = false;
      }

      // Download the combined PDF
      combinedPdf.save(`question-papers-${selectedTerm === 'all' ? 'all-terms' : terms.find(t => t.id === selectedTerm)?.name}-${Date.now()}.pdf`);

      toast({
        title: "Success",
        description: `Downloaded ${approvedPapers.length} question papers`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate bulk download",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPapers = questionPapers.filter(paper => {
    if (selectedSubject !== 'all' && paper.subject_id !== selectedSubject) return false;
    if (selectedClass !== 'all' && paper.class_id !== selectedClass) return false;
    if (selectedTerm !== 'all' && paper.term_id !== selectedTerm) return false;
    if (statusFilter !== 'all' && paper.status !== statusFilter) return false;
    return true;
  });

  if (!hasPermission("Result Approval") && !hasPermission("Manage Users")) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-900">Question Paper Management</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 gap-4">
            <Clock className="h-16 w-16 text-orange-500" />
            <h2 className="text-xl font-semibold">Access Restricted</h2>
            <p className="text-center text-muted-foreground">
              Only Exam Officers and Principals can manage question papers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Permission check
  if (!hasPermission("Result Approval") && !hasPermission("Manage Users")) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-900">Question Paper Management</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 gap-4">
            <AlertCircle className="h-16 w-16 text-orange-500" />
            <h2 className="text-xl font-semibold">Access Restricted</h2>
            <p className="text-center text-muted-foreground">
              Only Principals and Exam Officers can manage question papers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (schoolIdLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-900">Question Paper Management</h1>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
              <div>
                <p className="text-blue-800 font-medium">Loading School Information</p>
                <p className="text-blue-700 text-sm">
                  Please wait while we load your school details...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-900">Question Paper Management</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 gap-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
            <h2 className="text-xl font-semibold">School Not Assigned</h2>
            <p className="text-center text-muted-foreground">
              Your account is not assigned to a school. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingCount = filteredPapers.filter(p => p.status === 'Submitted').length;
  const approvedCount = filteredPapers.filter(p => p.status === 'Approved').length;
  const rejectedCount = filteredPapers.filter(p => p.status === 'Rejected').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Question Paper Management</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={bulkDownloadPDFs}
            disabled={loading || filteredPapers.filter(p => p.status === 'Approved' && p.pdf_url).length === 0}
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            Bulk Download ({filteredPapers.filter(p => p.status === 'Approved' && p.pdf_url).length})
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all-papers" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all-papers" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            All Papers ({filteredPapers.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Approved ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* All Papers Tab */}
        <TabsContent value="all-papers" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Terms</SelectItem>
                      {terms.map((term) => (
                        <SelectItem key={term.id} value={term.id}>
                          {term.name} ({term.academic_year})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Submitted">Submitted</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Papers List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredPapers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-10 gap-4">
                  <FileText className="h-16 w-16 text-gray-400" />
                  <h2 className="text-xl font-semibold">No Question Papers Found</h2>
                  <p className="text-center text-muted-foreground">
                    No question papers match your current filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredPapers.map((paper) => (
                <Card key={paper.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-4">
                          <h3 className="text-lg font-semibold">{paper.title}</h3>
                          <Badge variant={
                            paper.status === 'Approved' ? 'default' :
                            paper.status === 'Submitted' ? 'secondary' : 
                            paper.status === 'Rejected' ? 'destructive' : 'outline'
                          }>
                            {paper.status}
                          </Badge>
                          <Badge variant="outline">
                            {paper.submission_mode === 'manual' ? 'Manual' : 'Scanned'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <strong>Subject:</strong> {paper.subjects?.name}
                          </div>
                          <div>
                            <strong>Class:</strong> {paper.classes?.name}
                          </div>
                          <div>
                            <strong>Teacher:</strong> {paper.profiles?.full_name}
                          </div>
                          <div>
                            <strong>Submitted:</strong> {new Date(paper.submitted_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        
                        {paper.approved_at && (
                          <div className="text-sm text-muted-foreground">
                            <strong>Approved:</strong> {new Date(paper.approved_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        {paper.pdf_url && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const { data } = await supabase.storage
                                    .from('documents')
                                    .download(paper.pdf_url!);
                                  
                                  if (data) {
                                    const url = URL.createObjectURL(data);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${paper.title}.pdf`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }
                                } catch (error) {
                                  toast({
                                    title: "Download Error",
                                    description: "Failed to download PDF",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const { data } = await supabase.storage
                                    .from('documents')
                                    .download(paper.pdf_url!);
                                  
                                  if (data) {
                                    const url = URL.createObjectURL(data);
                                    window.open(url, '_blank');
                                  }
                                } catch (error) {
                                  toast({
                                    title: "Preview Error",
                                    description: "Failed to preview PDF",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {paper.status === 'Submitted' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleStatusUpdate(paper.id, 'Approved')}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStatusUpdate(paper.id, 'Rejected')}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Pending Papers Tab */}
        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Approval ({pendingCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingCount === 0 ? (
                <div className="text-center py-12">
                  <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                  <p className="text-gray-600">No question papers are pending approval.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPapers.filter(p => p.status === 'Submitted').map((paper) => (
                    <Card key={paper.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-4">
                              <h3 className="text-lg font-semibold">{paper.title}</h3>
                              <Badge variant="secondary">Pending Review</Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                              <div>
                                <strong>Subject:</strong> {paper.subjects?.name}
                              </div>
                              <div>
                                <strong>Class:</strong> {paper.classes?.name}
                              </div>
                              <div>
                                <strong>Teacher:</strong> {paper.profiles?.full_name}
                              </div>
                              <div>
                                <strong>Submitted:</strong> {new Date(paper.submitted_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 ml-4">
                            {paper.pdf_url && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      const { data } = await supabase.storage
                                        .from('documents')
                                        .download(paper.pdf_url!);
                                      
                                      if (data) {
                                        const url = URL.createObjectURL(data);
                                        window.open(url, '_blank');
                                      }
                                    } catch (error) {
                                      toast({
                                        title: "Preview Error",
                                        description: "Failed to preview PDF",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Review
                                </Button>
                              </>
                            )}

                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleStatusUpdate(paper.id, 'Approved')}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStatusUpdate(paper.id, 'Rejected')}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approved Papers Tab */}
        <TabsContent value="approved" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                Approved Papers ({approvedCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvedCount === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Approved Papers</h3>
                  <p className="text-gray-600">No question papers have been approved yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPapers.filter(p => p.status === 'Approved').map((paper) => (
                    <Card key={paper.id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-4">
                              <h3 className="text-lg font-semibold">{paper.title}</h3>
                              <Badge variant="default">Approved</Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                              <div>
                                <strong>Subject:</strong> {paper.subjects?.name}
                              </div>
                              <div>
                                <strong>Class:</strong> {paper.classes?.name}
                              </div>
                              <div>
                                <strong>Teacher:</strong> {paper.profiles?.full_name}
                              </div>
                              <div>
                                <strong>Approved:</strong> {new Date(paper.approved_at!).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 ml-4">
                            {paper.pdf_url && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      const { data } = await supabase.storage
                                        .from('documents')
                                        .download(paper.pdf_url!);
                                      
                                      if (data) {
                                        const url = URL.createObjectURL(data);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `${paper.title}.pdf`;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                      }
                                    } catch (error) {
                                      toast({
                                        title: "Download Error",
                                        description: "Failed to download PDF",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      const { data } = await supabase.storage
                                        .from('documents')
                                        .download(paper.pdf_url!);
                                      
                                      if (data) {
                                        const url = URL.createObjectURL(data);
                                        window.open(url, '_blank');
                                      }
                                    } catch (error) {
                                      toast({
                                        title: "Preview Error",
                                        description: "Failed to preview PDF",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Papers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredPapers.length}</div>
                <p className="text-xs text-muted-foreground">All question papers</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
                <p className="text-xs text-muted-foreground">Ready for use</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Submission Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-4">By Submission Mode</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Manual Entry</span>
                      <Badge variant="outline">
                        {filteredPapers.filter(p => p.submission_mode === 'manual').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Scanned/Upload</span>
                      <Badge variant="outline">
                        {filteredPapers.filter(p => p.submission_mode === 'scan').length}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-4">By Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Submitted</span>
                      <Badge variant="secondary">{pendingCount}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Approved</span>
                      <Badge variant="default">{approvedCount}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Rejected</span>
                      <Badge variant="destructive">{rejectedCount}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

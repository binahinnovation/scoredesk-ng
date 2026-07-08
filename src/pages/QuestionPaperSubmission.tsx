import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, Scan, Download, Eye, Plus, Trash2, FileDown, Edit3, Printer, FileImage, Save, RefreshCw, Clock, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-user-role";
import { useSchoolId } from "@/hooks/use-school-id";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";
import { Editor } from '@tinymce/tinymce-react';
import { useReactToPrint } from 'react-to-print';
import { RichQuestionEditor } from '@/components/RichQuestionEditor';
import { EditablePreview } from '@/components/EditablePreview';
import jsPDF from 'jspdf';

interface QuestionPaper {
  id: string;
  title: string;
  subject_id: string;
  class_id: string;
  term_id: string;
  submission_mode: string;
  content: any;
  file_url: string | null;
  pdf_url: string | null;
  status: string;
  created_at: string;
  subjects: { name: string; code: string } | null;
  classes: { name: string } | null;
  terms: { name: string; academic_year: string } | null;
}

interface Question {
  [key: string]: any;
  id: string;
  question_text: string;
  marks: number;
  question_type: 'objective' | 'theory' | 'practical' | 'multiple_choice';
  options?: string[];
  correct_answer?: string;
}

export default function QuestionPaperSubmission() {
  const { user } = useAuth();
  const { hasPermission } = useUserRole();
  const { schoolId, loading: schoolIdLoading } = useSchoolId();
  const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<'scan' | 'manual'>('manual');
  const [isMaximized, setIsMaximized] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewPdf, setPreviewPdf] = useState<string | null>(null);
  
  // Auto-save state
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (hasPermission("Result Upload") && schoolId && !schoolIdLoading) {
      fetchData();
    }
  }, [hasPermission, schoolId, schoolIdLoading]);

  // Auto-save functionality
  const autoSaveDraft = useCallback(async () => {
    if (!schoolId || !user?.id || !hasUnsavedChanges) return;
    
    // Only auto-save if we have at least a title
    if (!title && questions.length === 0 && !uploadedFile) return;

    setIsAutoSaving(true);
    try {
      const draftData = {
        title,
        selectedSubject,
        selectedClass,
        selectedTerm,
        questions,
        submissionMode,
        uploadedFile: uploadedFile ? {
          name: uploadedFile.name,
          size: uploadedFile.size,
          type: uploadedFile.type
        } : null,
        lastModified: new Date().toISOString()
      };

      if (currentDraftId) {
        // Update existing draft
        const { error } = await supabase
          .from('question_papers')
          .update({
            title: title || 'Draft Question Paper',
            subject_id: selectedSubject || null,
            class_id: selectedClass || null,
            term_id: selectedTerm || null,
            content: submissionMode === 'manual' ? JSON.stringify(draftData) : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentDraftId);

        if (error) throw error;
      } else {
        // Create new draft - only if we have meaningful content
        if (title || questions.length > 0 || uploadedFile) {
          const { data, error } = await supabase
            .from('question_papers')
            .insert({
              school_id: schoolId,
              teacher_id: user.id,
              subject_id: selectedSubject || null,
              class_id: selectedClass || null,
              term_id: selectedTerm || null,
              title: title || 'Draft Question Paper',
              submission_mode: submissionMode,
              status: 'Draft',
              content: submissionMode === 'manual' ? JSON.stringify(draftData) : null
            })
            .select()
            .single();

          if (error) throw error;
          setCurrentDraftId(data.id);
        }
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [schoolId, user?.id, title, selectedSubject, selectedClass, selectedTerm, questions, submissionMode, uploadedFile, hasUnsavedChanges, currentDraftId]);

  // Auto-save timer
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      autoSaveDraft();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, autoSaveDraft]);

  // Track changes for auto-save - only when there's meaningful content
  useEffect(() => {
    if (title || questions.length > 0 || uploadedFile) {
      setHasUnsavedChanges(true);
    }
  }, [title, questions, uploadedFile]);

  const fetchData = async () => {
    if (!schoolId) return;
    
    try {
      const [subjectsRes, classesRes, termsRes, papersRes] = await Promise.all([
        supabase.from("subjects").select("*").eq("school_id", schoolId),
        supabase.from("classes").select("*").eq("school_id", schoolId),
        supabase.from("terms").select("*").eq("school_id", schoolId).order("is_current", { ascending: false }),
        supabase.from("question_papers").select(`
          *,
          subjects:subject_id (name, code),
          classes:class_id (name),
          terms:term_id (name, academic_year)
        `).eq("teacher_id", user?.id).eq("school_id", schoolId).order('created_at', { ascending: false })
      ]);

      setSubjects(subjectsRes.data || []);
      setClasses(classesRes.data || []);
      setTerms(termsRes.data || []);
      setQuestionPapers(papersRes.data || []);

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

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question_text: '',
      marks: 1,
      question_type: 'theory'
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  // Helper function to strip HTML tags
  const stripHtmlTags = (html: string): string => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const generatePDF = async (questions: Question[], paperTitle: string): Promise<Blob> => {
    // A4 dimensions: 210mm x 297mm
    const pdf = new jsPDF('p', 'mm', 'a4');
    let yPos = 25; // Top margin
    
    // Header with A4 margins (20mm sides, 25mm top)
    pdf.setFontSize(16);
    pdf.text(paperTitle, 105, yPos, { align: 'center' }); // Center title
    yPos += 15;
    
    pdf.setFontSize(12);
    pdf.text(`Subject: ${subjects.find(s => s.id === selectedSubject)?.name || 'Unknown'}`, 20, yPos);
    yPos += 8;
    pdf.text(`Class: ${classes.find(c => c.id === selectedClass)?.name || 'Unknown'}`, 20, yPos);
    yPos += 8;
    pdf.text(`Term: ${terms.find(t => t.id === selectedTerm)?.name || 'Unknown'}`, 20, yPos);
    yPos += 15;
    
    // Instructions
    pdf.setFontSize(11);
    pdf.text('Instructions:', 20, yPos);
    yPos += 8;
    pdf.text('• Answer all questions', 25, yPos);
    yPos += 6;
    pdf.text('• Write clearly and legibly', 25, yPos);
    yPos += 6;
    pdf.text('• Show all workings where applicable', 25, yPos);
    yPos += 15;
    
    // Questions with A4 page management (270mm bottom margin)
    questions.forEach((question, index) => {
      if (yPos > 270) { // A4 bottom margin
        pdf.addPage();
        yPos = 25; // Reset to top margin
      }
      
      pdf.setFontSize(11);
      pdf.text(`${index + 1}.`, 20, yPos);
      
      // Strip HTML tags from question text and split into lines
      const cleanText = stripHtmlTags(question.question_text);
      const lines = pdf.splitTextToSize(cleanText, 170);
      pdf.text(lines, 30, yPos);
      yPos += lines.length * 6;
      
      // Question details
      pdf.setFontSize(9);
      pdf.text(`[${question.marks} mark${question.marks > 1 ? 's' : ''} - ${question.question_type}]`, 30, yPos);
      yPos += 12;
      
      // Add spacing between questions
      yPos += 5;
    });
    
    return pdf.output('blob');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        setUploadedFile(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF or image file",
          variant: "destructive",
        });
      }
    }
  };

  const generatePreview = async () => {
    if (submissionMode === 'manual' && questions.length > 0) {
      try {
        const pdfBlob = await generatePDF(questions, title || 'Question Paper');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPreviewPdf(pdfUrl);
      } catch (error) {
        toast({
          title: "Preview Error",
          description: "Failed to generate preview",
          variant: "destructive",
        });
      }
    }
  };

  // Load draft data
  const loadDraft = (draft: QuestionPaper) => {
    if (draft.content) {
      try {
        const data = typeof draft.content === 'string' ? JSON.parse(draft.content) : draft.content;
        setTitle(data.title || draft.title || '');
        setSelectedSubject(data.selectedSubject || draft.subject_id || '');
        setSelectedClass(data.selectedClass || draft.class_id || '');
        setSelectedTerm(data.selectedTerm || draft.term_id || '');
        setQuestions(data.questions || []);
        setSubmissionMode(data.submissionMode || draft.submission_mode || 'manual');
        setCurrentDraftId(draft.id);
        setHasUnsavedChanges(false);
        
        toast({
          title: "Draft Loaded",
          description: "Your previous work has been restored",
        });
      } catch (error) {
        console.error('Error loading draft:', error);
        toast({
          title: "Error",
          description: "Failed to load draft data",
          variant: "destructive",
        });
      }
    }
  };

  const submitQuestionPaper = async () => {
    if (!title || !selectedSubject || !selectedClass || !selectedTerm) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (submissionMode === 'manual' && questions.length === 0) {
      toast({
        title: "No Questions",
        description: "Please add at least one question",
        variant: "destructive",
      });
      return;
    }

    if (submissionMode === 'scan' && !uploadedFile) {
      toast({
        title: "No File",
        description: "Please upload a question paper file",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let fileUrl = null;
      let pdfUrl = null;

      // Generate PDF for manual mode
      if (submissionMode === 'manual') {
        const pdfBlob = await generatePDF(questions, title);
        const pdfFileName = `question-papers/pdf/${Date.now()}-${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        
        const { error: pdfUploadError } = await supabase.storage
          .from('documents')
          .upload(pdfFileName, pdfBlob);

        if (pdfUploadError) throw pdfUploadError;
        pdfUrl = pdfFileName;
      }

      // Upload file if in scan mode
      if (submissionMode === 'scan' && uploadedFile) {
        const fileName = `question-papers/original/${Date.now()}-${uploadedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, uploadedFile);

        if (uploadError) throw uploadError;
        fileUrl = fileName;
        
        // For scanned files, also set as PDF if it's already a PDF
        if (uploadedFile.type === 'application/pdf') {
          pdfUrl = fileName;
        }
      }

      let result;
      if (currentDraftId) {
        // Update existing draft to submitted status
        const { data, error } = await supabase
          .from("question_papers")
          .update({
            title,
            subject_id: selectedSubject,
            class_id: selectedClass,
            term_id: selectedTerm,
            submission_mode: submissionMode,
            content: submissionMode === 'manual' ? JSON.stringify({ questions }) : null,
            file_url: fileUrl,
            pdf_url: pdfUrl,
            status: 'Submitted',
            submitted_at: new Date().toISOString()
          })
          .eq('id', currentDraftId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new question paper record
        const { data, error } = await supabase
          .from("question_papers")
          .insert({
        teacher_id: user?.id,
            school_id: schoolId,
        title,
        subject_id: selectedSubject,
        class_id: selectedClass,
        term_id: selectedTerm,
        submission_mode: submissionMode,
        content: submissionMode === 'manual' ? JSON.stringify({ questions }) : null,
        file_url: fileUrl,
        pdf_url: pdfUrl,
        status: 'Submitted',
        submitted_at: new Date().toISOString()
          })
          .select()
          .single();

      if (error) throw error;
        result = data;
      }

      toast({
        title: "Success",
        description: "Question paper submitted successfully",
      });

      // Reset form
      setTitle('');
      setSelectedSubject('');
      setSelectedClass('');
      setSelectedTerm('');
      setQuestions([]);
      setUploadedFile(null);
      setPreviewPdf(null);
      setCurrentDraftId(null);
      setHasUnsavedChanges(false);
      
      // Refresh data
      await fetchData();
    } catch (error: any) {
      console.error("Error submitting question paper:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit question paper",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission("Result Upload")) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-900">Question Paper Submission</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 gap-4">
            <FileText className="h-16 w-16 text-orange-500" />
            <h2 className="text-xl font-semibold">Access Restricted</h2>
            <p className="text-center text-muted-foreground">
              Only teachers can submit question papers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Permission check
  if (!hasPermission("Result Upload")) {
  return (
    <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-900">Question Paper Submission</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 gap-4">
            <AlertCircle className="h-16 w-16 text-orange-500" />
            <h2 className="text-xl font-semibold">Access Restricted</h2>
            <p className="text-center text-muted-foreground">
              Only teachers with Result Upload permission can submit question papers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (schoolIdLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-900">Question Paper Submission</h1>
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
        <h1 className="text-3xl font-bold text-gray-900">Question Paper Submission</h1>
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

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Question Paper Management</h1>
          {isAutoSaving && (
            <p className="text-sm sm:text-base text-blue-600 flex items-center gap-1 mt-1 font-medium">
              <Clock className="h-3 w-3 animate-spin" />
              Auto-saving...
            </p>
          )}
          {lastSaved && !isAutoSaving && (
            <p className="text-sm sm:text-base text-green-600 flex items-center gap-1 mt-1 font-medium">
              <Save className="h-3 w-3" />
              Last saved: {lastSaved.toLocaleTimeString()}
            </p>
          )}
          {hasUnsavedChanges && !isAutoSaving && (
            <p className="text-sm sm:text-base text-orange-600 flex items-center gap-1 mt-1 font-medium">
              <AlertTriangle className="h-3 w-3" />
              Unsaved changes
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="flex items-center gap-2 text-sm sm:text-base font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="create" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1 text-xs sm:text-sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Paper</span>
            <span className="sm:hidden">Create</span>
          </TabsTrigger>
          <TabsTrigger value="edit" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1 text-xs sm:text-sm">
            <Edit3 className="h-4 w-4" />
            <span className="hidden sm:inline">Edit Questions</span>
            <span className="sm:hidden">Edit</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1 text-xs sm:text-sm">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Preview & Print</span>
            <span className="sm:hidden">Preview</span>
          </TabsTrigger>
          <TabsTrigger value="my-papers" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1 text-xs sm:text-sm">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">My Papers</span>
            <span className="sm:hidden">Papers</span>
          </TabsTrigger>
        </TabsList>

        {/* Create Paper Tab */}
        <TabsContent value="create" className="space-y-6">
          <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Question Paper
              </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                  <Label htmlFor="subject" className="text-sm sm:text-base font-semibold text-gray-900">Subject *</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="h-11 sm:h-12 text-base">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id} className="text-base">
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                  <Label htmlFor="class" className="text-sm sm:text-base font-semibold text-gray-900">Class *</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="h-11 sm:h-12 text-base">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id} className="text-base">
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>

              <div>
                  <Label htmlFor="term" className="text-sm sm:text-base font-semibold text-gray-900">Term *</Label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger className="h-11 sm:h-12 text-base">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={term.id} className="text-base">
                        {term.name} ({term.academic_year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                  <Label htmlFor="title" className="text-sm sm:text-base font-semibold text-gray-900">Paper Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Mid-term Exam"
                  className="h-11 sm:h-12 text-base"
                />
              </div>
            </div>

              <Separator />

              {/* Submission Mode */}
              <div className="space-y-4">
                <Label className="text-base sm:text-lg font-semibold text-gray-900">Submission Method</Label>
            <Tabs value={submissionMode} onValueChange={(value) => setSubmissionMode(value as 'scan' | 'manual')}>
              <TabsList className="grid w-full grid-cols-2 h-auto">
                <TabsTrigger value="manual" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1 text-xs sm:text-sm">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Manual Entry</span>
                  <span className="sm:hidden">Manual</span>
                </TabsTrigger>
                <TabsTrigger value="scan" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1 text-xs sm:text-sm">
                  <Scan className="h-4 w-4" />
                  <span className="hidden sm:inline">Scan/Upload</span>
                  <span className="sm:hidden">Upload</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                        <FileText className="h-4 w-4" />
                        Manual Entry Mode
                  </div>
                      <p className="text-blue-700 text-sm">
                        Create questions directly in the system. You can add multiple questions with different types (objective, theory, practical).
                        <br /><br />
                        <strong>Next:</strong> Go to the "Edit Questions" tab to add your questions.
                      </p>
                  </div>
                    {questions.length > 0 && (
                      <div className="text-sm text-green-600 font-medium bg-green-50 border border-green-200 rounded-lg p-3">
                        ✓ {questions.length} question{questions.length > 1 ? 's' : ''} added - Ready for submission!
                </div>
                    )}
              </TabsContent>

              <TabsContent value="scan" className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                        <Scan className="h-4 w-4" />
                        Scan/Upload Mode
                      </div>
                      <p className="text-green-700 text-sm">
                        Upload a scanned or digital copy of your question paper. Supports PDF and image files.
                      </p>
                    </div>
                <div>
                  <Label htmlFor="file-upload">Upload Question Paper</Label>
                      <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 hover:text-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept=".pdf,image/*"
                            onChange={handleFileUpload}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF or image files up to 10MB</p>
                    </div>
                  </div>
                  {uploadedFile && (
                        <div className="mt-2 flex items-center gap-2 text-green-600">
                          <FileImage className="h-4 w-4" />
                          <span className="text-sm font-medium">File selected: {uploadedFile.name}</span>
                        </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
              </div>

              <Separator />

              {/* Submit Button */}
              <div className="space-y-4">
                <Button 
                  onClick={submitQuestionPaper} 
                  disabled={
                    loading || 
                    !title || 
                    !selectedSubject || 
                    !selectedClass || 
                    !selectedTerm ||
                    (submissionMode === 'manual' && questions.length === 0) ||
                    (submissionMode === 'scan' && !uploadedFile)
                  }
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Submit Question Paper
                    </>
                  )}
                </Button>
                
                <div className="text-center text-sm text-muted-foreground">
                  💡 <strong>Tip:</strong> Use the "Edit Questions" tab to add questions and "Preview & Print" tab to review before submitting.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Questions Tab */}
        <TabsContent value="edit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Edit Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Questions Yet</h3>
                  <p className="text-gray-600 mb-4">Start by adding questions to your question paper.</p>
                  <Button onClick={addQuestion} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add First Question
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <RichQuestionEditor
                    questions={questions}
                    onQuestionsChange={setQuestions}
                    title={title}
                    subjectName={subjects.find(s => s.id === selectedSubject)?.name || ''}
                    className={classes.find(c => c.id === selectedClass)?.name || ''}
                    termName={terms.find(t => t.id === selectedTerm)?.name || ''}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview & Print Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview & Print
              </CardTitle>
            </CardHeader>
            <CardContent>
              {previewPdf ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <Label className="text-base font-semibold">A4 PDF Preview</Label>
                <div className="mt-2 border rounded bg-white shadow-sm" style={{ aspectRatio: '210/297' }}>
                  <iframe 
                    src={previewPdf} 
                        className="w-full border rounded h-[600px]"
                    title="Question Paper Preview"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  A4 Format: 210mm × 297mm with proper margins for printing
                </p>
              </div>

                  <div className="flex gap-4">
            <Button 
                      onClick={async () => {
                        if (previewPdf) {
                          try {
                            const response = await fetch(previewPdf);
                            const blob = await response.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${title || 'question-paper'}.pdf`;
                            a.click();
                            URL.revokeObjectURL(url);
                          } catch (error) {
                            toast({
                              title: "Download Error",
                              description: "Failed to download PDF",
                              variant: "destructive",
                            });
                          }
                        }
                      }}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
            </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.print()}
                      className="flex-1"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Preview Available</h3>
                  <p className="text-gray-600 mb-4">Generate a preview to see how your question paper will look.</p>
                  <Button onClick={generatePreview} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Generate Preview
                  </Button>
                </div>
              )}
          </CardContent>
        </Card>
        </TabsContent>

        {/* My Papers Tab */}
        <TabsContent value="my-papers" className="space-y-6">
          <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                My Question Papers ({questionPapers.length})
              </CardTitle>
          </CardHeader>
          <CardContent>
              {questionPapers.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Papers Yet</h3>
                  <p className="text-gray-600">You haven't created any question papers yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questionPapers.map((paper) => (
                    <Card key={paper.id} className={`p-4 hover:shadow-md transition-shadow ${
                      paper.status === 'Draft' ? 'border-l-4 border-l-blue-500' : 
                      paper.status === 'Approved' ? 'border-l-4 border-l-green-500' :
                      paper.status === 'Rejected' ? 'border-l-4 border-l-red-500' : 
                      'border-l-4 border-l-orange-500'
                    }`}>
                    <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <h3 className="font-semibold text-lg">{paper.title}</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div>
                              <strong>Subject:</strong> {paper.subjects?.name || 'Not set'}
                            </div>
                            <div>
                              <strong>Class:</strong> {paper.classes?.name || 'Not set'}
                            </div>
                            <div>
                              <strong>Term:</strong> {paper.terms?.name || 'Not set'}
                            </div>
                            <div>
                              <strong>{paper.status === 'Draft' ? 'Created:' : 'Submitted:'}</strong> {
                                paper.status === 'Draft' ? 
                                new Date(paper.created_at).toLocaleDateString() :
                                paper.submitted_at ? new Date(paper.submitted_at).toLocaleDateString() : 
                                new Date(paper.created_at).toLocaleDateString()
                              }
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={
                            paper.status === 'Approved' ? 'default' :
                              paper.status === 'Submitted' ? 'secondary' : 
                              paper.status === 'Rejected' ? 'destructive' : 
                              paper.status === 'Draft' ? 'outline' : 'outline'
                          }>
                            {paper.status}
                          </Badge>
                          <Badge variant="outline">
                            {paper.submission_mode === 'manual' ? 'Manual' : 'Scanned'}
                          </Badge>
                        </div>
                      </div>
                        <div className="flex gap-2 ml-4 flex-wrap">
                          {paper.status === 'Draft' && paper.content && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => loadDraft(paper)}
                            >
                              <Edit3 className="h-4 w-4 mr-1" />
                              Continue Editing
                            </Button>
                          )}
                          {paper.status === 'Submitted' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                // Load paper for editing
                                if (paper.content) {
                                  const content = typeof paper.content === 'string' ? JSON.parse(paper.content) : paper.content;
                                  setTitle(paper.title);
                                  setSelectedSubject(paper.subject_id);
                                  setSelectedClass(paper.class_id);
                                  setSelectedTerm(paper.term_id);
                                  setQuestions(content.questions || []);
                                  setSubmissionMode(paper.submission_mode);
                                  setCurrentDraftId(paper.id);
                                  setHasUnsavedChanges(false);
                                  
                                  toast({
                                    title: "Paper Loaded for Editing",
                                    description: "Paper loaded successfully",
                                  });
                                }
                              }}
                            >
                              <Edit3 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          )}
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
                            if (paper.pdf_url) {
                              try {
                                const { data } = await supabase.storage
                                  .from('documents')
                                  .download(paper.pdf_url);
                                
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
                            }
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                            </>
                          )}
                      </div>
                    </div>
                  </Card>
                  ))}
            </div>
              )}
          </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

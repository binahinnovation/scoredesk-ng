import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Search, Filter, CheckCheck } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { logEdit, getCurrentUserSchoolId } from '@/utils/auditLogger';
import { useSchoolId } from "@/hooks/use-school-id";

interface StudentResult {
  student_id: string;
  student_name: string;
  student_number: string;
  class_name: string;
  class_id: string;
  term_id: string;
  term_name: string;
  results: Array<{
    id: string;
    subject_name: string;
    subject_code: string;
    assessment_name: string;
    score: number;
    max_score: number;
    is_approved: boolean;
  }>;
  total_results: number;
  approved_results: number;
  pending_results: number;
}

export default function StudentResultApproval() {
  const { userRole, loading, hasPermission } = useUserRole();
  const { user } = useAuth();
  const { schoolId, loading: schoolIdLoading } = useSchoolId();
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<StudentResult[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [termFilter, setTermFilter] = useState<string>("current");
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [approving, setApproving] = useState<string[]>([]);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [approvalReason, setApprovalReason] = useState("");

  useEffect(() => {
    if (hasPermission("Result Approval") && schoolId && !schoolIdLoading) {
      fetchData();
    }
  }, [hasPermission, schoolId, schoolIdLoading]);

  useEffect(() => {
    filterResults();
  }, [studentResults, searchTerm, statusFilter, classFilter, termFilter]);

  const fetchData = async () => {
    if (!schoolId) {
      console.warn('No school_id available for student result approval');
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    try {
      // Fetch terms and classes - FILTERED BY SCHOOL
      const [termsRes, classesRes] = await Promise.all([
        supabase.from("terms").select("*").eq("school_id", schoolId).order("is_current", { ascending: false }),
        supabase.from("classes").select("*").eq("school_id", schoolId)
      ]);

      setTerms(termsRes.data || []);
      setClasses(classesRes.data || []);

      // Get current term or first term
      const currentTerm = termsRes.data?.find(t => t.is_current) || termsRes.data?.[0];
      if (currentTerm) {
        await fetchStudentResults(currentTerm.id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const fetchStudentResults = async (termId: string) => {
    if (!schoolId) return;

    try {
      // Fetch all results with student and subject details - FILTERED BY SCHOOL
      const { data: resultsData, error } = await supabase
        .from("results")
        .select(`
          id,
          student_id,
          score,
          max_score,
          is_approved,
          students:student_id (
            id,
            first_name,
            last_name,
            student_id,
            class_id,
            classes:class_id (name)
          ),
          subjects:subject_id (name, code),
          assessments:assessment_id (name),
          terms:term_id (name, academic_year)
        `)
        .eq("school_id", schoolId)
        .eq("term_id", termId);

      if (error) throw error;

      // Group results by student
      const studentMap = new Map<string, StudentResult>();

      resultsData?.forEach((result) => {
        const studentId = result.student_id;
        const student = result.students;
        
        if (!student) return;

        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            student_id: studentId,
            student_name: `${student.first_name} ${student.last_name}`,
            student_number: student.student_id,
            class_name: student.classes?.name || 'N/A',
            class_id: student.class_id,
            term_id: termId,
            term_name: result.terms?.name || 'N/A',
            results: [],
            total_results: 0,
            approved_results: 0,
            pending_results: 0
          });
        }

        const studentResult = studentMap.get(studentId)!;
        studentResult.results.push({
          id: result.id,
          subject_name: result.subjects?.name || 'N/A',
          subject_code: result.subjects?.code || '',
          assessment_name: result.assessments?.name || 'N/A',
          score: result.score,
          max_score: result.max_score,
          is_approved: result.is_approved
        });

        studentResult.total_results++;
        if (result.is_approved) {
          studentResult.approved_results++;
        } else {
          studentResult.pending_results++;
        }
      });

      setStudentResults(Array.from(studentMap.values()));
    } catch (error) {
      console.error("Error fetching student results:", error);
      toast({
        title: "Error",
        description: "Failed to load student results",
        variant: "destructive",
      });
    }
  };

  const filterResults = () => {
    let filtered = [...studentResults];

    // Status filter
    if (statusFilter === "pending") {
      filtered = filtered.filter(student => student.pending_results > 0);
    } else if (statusFilter === "approved") {
      filtered = filtered.filter(student => student.pending_results === 0 && student.total_results > 0);
    }

    // Class filter
    if (classFilter !== "all") {
      filtered = filtered.filter(student => student.class_id === classFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredResults(filtered);
  };

  const approveStudentResults = async (studentId: string) => {
    if (!user) return;

    setApproving(prev => [...prev, studentId]);
    try {
      // Get all pending results for this student
      const student = studentResults.find(s => s.student_id === studentId);
      if (!student) return;

      const pendingResultIds = student.results
        .filter(r => !r.is_approved)
        .map(r => r.id);

      if (pendingResultIds.length === 0) {
        toast({
          title: "No Pending Results",
          description: "All results for this student are already approved",
        });
        return;
      }

      // Fetch old records for audit logging
      const { data: oldRecords } = await supabase
        .from('results')
        .select('*')
        .in('id', pendingResultIds);

      const { error } = await supabase
        .from("results")
        .update({
          is_approved: true,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .in("id", pendingResultIds);

      if (error) throw error;

      // Fetch updated records for audit logging
      const { data: newRecords } = await supabase
        .from('results')
        .select('*')
        .in('id', pendingResultIds);

      // Log all approval operations
      if (user && schoolId && oldRecords && newRecords) {
        for (let i = 0; i < oldRecords.length; i++) {
          const oldRecord = oldRecords[i];
          const newRecord = newRecords.find(nr => nr.id === oldRecord.id);
          if (newRecord) {
            await logEdit({
              schoolId: schoolId,
              actorId: user.id,
              actionType: 'update',
              tableName: 'results',
              recordId: newRecord.id,
              oldValue: oldRecord,
              newValue: newRecord,
              reason: approvalReason || `Bulk approved results for ${student.student_name}`,
            });
          }
        }
      }

      toast({
        title: "Success",
        description: `Approved ${pendingResultIds.length} results for ${student.student_name}`,
      });

      // Update local state
      setStudentResults(prev => prev.map(s => 
        s.student_id === studentId 
          ? {
              ...s,
              results: s.results.map(r => ({ ...r, is_approved: true })),
              approved_results: s.total_results,
              pending_results: 0
            }
          : s
      ));
    } catch (error: any) {
      console.error("Error approving student results:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve results",
        variant: "destructive",
      });
    } finally {
      setApproving(prev => prev.filter(id => id !== studentId));
    }
  };

  const bulkApproveAll = async () => {
    if (!user) return;

    setBulkApproving(true);
    try {
      // Get all pending result IDs
      const allPendingIds: string[] = [];
      filteredResults.forEach(student => {
        student.results.forEach(result => {
          if (!result.is_approved) {
            allPendingIds.push(result.id);
          }
        });
      });

      if (allPendingIds.length === 0) {
        toast({
          title: "No Pending Results",
          description: "All visible results are already approved",
        });
        return;
      }

      // Fetch old records for audit logging
      const { data: oldRecords } = await supabase
        .from('results')
        .select('*')
        .in('id', allPendingIds);

      const { error } = await supabase
        .from("results")
        .update({
          is_approved: true,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .in("id", allPendingIds);

      if (error) throw error;

      // Fetch updated records for audit logging
      const { data: newRecords } = await supabase
        .from('results')
        .select('*')
        .in('id', allPendingIds);

      // Log all bulk approval operations
      if (user && schoolId && oldRecords && newRecords) {
        for (let i = 0; i < oldRecords.length; i++) {
          const oldRecord = oldRecords[i];
          const newRecord = newRecords.find(nr => nr.id === oldRecord.id);
          if (newRecord) {
            await logEdit({
              schoolId: schoolId,
              actorId: user.id,
              actionType: 'update',
              tableName: 'results',
              recordId: newRecord.id,
              oldValue: oldRecord,
              newValue: newRecord,
              reason: approvalReason || 'Bulk approval of results',
            });
          }
        }
      }

      toast({
        title: "Success",
        description: `Bulk approved ${allPendingIds.length} results`,
      });

      // Refresh data
      const currentTerm = terms.find(t => t.is_current) || terms[0];
      if (currentTerm) {
        await fetchStudentResults(currentTerm.id);
      }
      setApprovalReason(""); // Reset reason after bulk approval
    } catch (error: any) {
      console.error("Error bulk approving results:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to bulk approve results",
        variant: "destructive",
      });
    } finally {
      setBulkApproving(false);
    }
  };

  const handleTermChange = (termId: string) => {
    setTermFilter(termId);
    if (termId !== "current") {
      fetchStudentResults(termId);
    } else {
      const currentTerm = terms.find(t => t.is_current);
      if (currentTerm) {
        fetchStudentResults(currentTerm.id);
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!hasPermission("Result Approval")) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-900">Student Result Approval</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 gap-4">
            <AlertCircle className="h-16 w-16 text-orange-500" />
            <h2 className="text-xl font-semibold">Access Restricted</h2>
            <p className="text-center text-muted-foreground">
              Only Principals and Exam Officers can approve results.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Student Result Approval</h1>
        <Button 
          onClick={bulkApproveAll} 
          disabled={bulkApproving || filteredResults.length === 0}
          className="flex items-center gap-2"
        >
          <CheckCheck className="h-4 w-4" />
          {bulkApproving ? "Approving..." : "Bulk Approve All"}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Review and Approve Results by Student</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Approval Reason */}
          <div>
            <Label htmlFor="approvalReason">Reason for approval/changes (Optional)</Label>
            <Textarea
              id="approvalReason"
              value={approvalReason}
              onChange={(e) => setApprovalReason(e.target.value)}
              placeholder="e.g., Results verified, corrections made, quality check completed"
              rows={2}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Has Pending</SelectItem>
                  <SelectItem value="approved">Fully Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Class</Label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger>
                  <SelectValue />
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
              <Label>Term</Label>
              <Select value={termFilter} onValueChange={handleTermChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Term</SelectItem>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name} ({term.academic_year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={fetchData} className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {filteredResults.filter(s => s.pending_results > 0).length}
                </div>
                <p className="text-sm text-muted-foreground">Students with Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {filteredResults.filter(s => s.pending_results === 0 && s.total_results > 0).length}
                </div>
                <p className="text-sm text-muted-foreground">Fully Approved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredResults.length}
                </div>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </CardContent>
            </Card>
          </div>

          {/* Results Table */}
          {loadingData ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading results...</div>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Total Results</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No students found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResults.map((student) => (
                      <TableRow key={student.student_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.student_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {student.student_number}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{student.class_name}</TableCell>
                        <TableCell>{student.total_results}</TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">
                            {student.approved_results}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-orange-600 font-medium">
                            {student.pending_results}
                          </span>
                        </TableCell>
                        <TableCell>
                          {student.pending_results === 0 ? (
                            <Badge variant="default">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Pending ({student.pending_results})
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {student.pending_results > 0 && (
                            <Button
                              size="sm"
                              onClick={() => approveStudentResults(student.student_id)}
                              disabled={approving.includes(student.student_id)}
                            >
                              {approving.includes(student.student_id) ? (
                                "Approving..."
                              ) : (
                                `Approve All (${student.pending_results})`
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PrinterIcon, DownloadIcon, GraduationCapIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import { useReactToPrint } from 'react-to-print';

interface StudentResult {
  subject_name: string;
  subject_code: string;
  ca1_score: number;
  ca2_score: number;
  exam_score: number;
  total_score: number;
  percentage: number;
  grade: string;
  position: number;
}

interface StudentInfo {
  name: string;
  student_id: string;
  class_name: string;
  term_name: string;
  academic_year: string;
  attendance_percentage: number;
  photo_url?: string;
}

interface SchoolInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo_url?: string;
}

export default function StudentAcademicReport() {
  const [studentId, setStudentId] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalSubjects: 0,
    totalMarks: 0,
    totalObtained: 0,
    overallPercentage: 0,
    overallGrade: '',
    overallPosition: 0
  });
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Academic Report - ${studentInfo?.student_id || 'Student'}`,
  });

  const fetchResults = async () => {
    if (!studentId.trim() || !pin.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both Student ID and PIN",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Verify PIN (similar to existing portal logic)
      const { data: scratchCard, error: cardError } = await supabase
        .from('scratch_cards')
        .select('*')
        .eq('pin', pin)
        .eq('status', 'Active')
        .eq('used_for_result_check', false)
        .single();

      if (cardError || !scratchCard) {
        toast({
          title: "Invalid PIN",
          description: "The PIN is invalid or has been used",
          variant: "destructive",
        });
        return;
      }

      // Find student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          id, first_name, last_name, student_id,
          classes (name),
          school_id
        `)
        .eq('student_id', studentId.trim())
        .eq('status', 'Active')
        .single();

      if (studentError || !student) {
        toast({
          title: "Student Not Found",
          description: "No active student found with this ID",
          variant: "destructive",
        });
        return;
      }

      // Get current term
      const { data: term } = await supabase
        .from('terms')
        .select('*')
        .eq('is_current', true)
        .single();

      if (!term) {
        toast({
          title: "Error",
          description: "No current term found",
          variant: "destructive",
        });
        return;
      }

      // Get school information
      const { data: school } = await supabase
        .from('schools')
        .select('*')
        .eq('id', student.school_id)
        .single();

      // Mark scratch card as used
      const { data: markUsedResult, error: markUsedError } = await supabase.rpc('mark_scratch_card_used', { 
        card_pin: pin,
        p_user_id: null,
        p_student_id: student.student_id
      });

      if (markUsedError) {
        console.error('Error marking scratch card as used:', markUsedError);
      } else if (markUsedResult && !markUsedResult.success) {
        console.error('Scratch card usage failed:', markUsedResult.message);
      }

      // Mock academic results (in real implementation, fetch from database)
      const mockResults: StudentResult[] = [
        { subject_name: 'Mathematics', subject_code: 'MTH', ca1_score: 18, ca2_score: 17, exam_score: 65, total_score: 100, percentage: 88, grade: 'A+', position: 2, teacher_comment: 'Excellent problem-solving skills. Keep up the good work!' },
        { subject_name: 'English Language', subject_code: 'ENG', ca1_score: 16, ca2_score: 18, exam_score: 58, total_score: 100, percentage: 82, grade: 'A', position: 5, teacher_comment: 'Good comprehension. Work on essay writing structure.' },
        { subject_name: 'Physics', subject_code: 'PHY', ca1_score: 17, ca2_score: 16, exam_score: 62, total_score: 100, percentage: 85, grade: 'A', position: 3, teacher_comment: 'Strong understanding of concepts. Practice more calculations.' },
        { subject_name: 'Chemistry', subject_code: 'CHE', ca1_score: 15, ca2_score: 17, exam_score: 59, total_score: 100, percentage: 81, grade: 'A', position: 4, teacher_comment: 'Good laboratory skills. Focus on chemical equations.' },
        { subject_name: 'Biology', subject_code: 'BIO', ca1_score: 19, ca2_score: 18, exam_score: 67, total_score: 100, percentage: 92, grade: 'A+', position: 1, teacher_comment: 'Outstanding performance! Excellent grasp of biological processes.' },
        { subject_name: 'Computer Science', subject_code: 'CSC', ca1_score: 18, ca2_score: 19, exam_score: 68, total_score: 100, percentage: 93, grade: 'A+', position: 1, teacher_comment: 'Exceptional programming skills. Great logical thinking.' },
        { subject_name: 'Civic Education', subject_code: 'CVE', ca1_score: 16, ca2_score: 17, exam_score: 60, total_score: 100, percentage: 83, grade: 'A', position: 6, teacher_comment: 'Good civic awareness. Participate more in discussions.' },
        { subject_name: 'Economics', subject_code: 'ECO', ca1_score: 17, ca2_score: 16, exam_score: 63, total_score: 100, percentage: 86, grade: 'A', position: 2, teacher_comment: 'Strong analytical skills. Excellent understanding of economic principles.' }
      ];

      // Calculate overall statistics
      const totalSubjects = mockResults.length;
      const totalMarks = mockResults.reduce((sum, r) => sum + r.total_score, 0);
      const totalObtained = mockResults.reduce((sum, r) => sum + (r.ca1_score + r.ca2_score + r.exam_score), 0);
      const overallPercentage = Math.round((totalObtained / totalMarks) * 100);
      
      let overallGrade = 'F';
      if (overallPercentage >= 90) overallGrade = 'A+';
      else if (overallPercentage >= 80) overallGrade = 'A';
      else if (overallPercentage >= 70) overallGrade = 'B+';
      else if (overallPercentage >= 60) overallGrade = 'B';
      else if (overallPercentage >= 50) overallGrade = 'C';

      setStudentInfo({
        name: `${student.first_name} ${student.last_name}`,
        student_id: student.student_id,
        class_name: student.classes?.name || '',
        term_name: term.name,
        academic_year: term.academic_year,
        attendance_percentage: 95 // Mock data
      });

      setSchoolInfo({
        name: school?.name || 'Global Science Academy',
        address: school?.address || 'Plot 123, Education Street, Academic City',
        phone: school?.phone || '+234 800 123 4567',
        email: school?.email || 'info@globalscience.edu.ng',
        logo_url: school?.logo_url
      });

      setResults(mockResults);
      setOverallStats({
        totalSubjects,
        totalMarks,
        totalObtained,
        overallPercentage,
        overallGrade,
        overallPosition: 3 // Mock data
      });

      toast({
        title: "Success",
        description: "Academic report loaded successfully",
      });

    } catch (error: any) {
      console.error('Error fetching results:', error);
      toast({
        title: "Error",
        description: "Failed to load academic report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade === 'A+') return 'text-green-700';
    if (grade === 'A') return 'text-green-600';
    if (grade === 'B+' || grade === 'B') return 'text-blue-600';
    if (grade === 'C') return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <GraduationCapIcon className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Academic Report Portal</h1>
          </div>
          <p className="text-gray-600 text-lg">Generate comprehensive academic reports</p>
        </div>

        {!studentInfo && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Access Academic Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter Student ID"
                  />
                </div>
                <div>
                  <Label htmlFor="pin">Scratch Card PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter PIN"
                  />
                </div>
              </div>
              <Button onClick={fetchResults} disabled={loading} className="w-full" size="lg">
                {loading ? "Loading..." : "Generate Report"}
              </Button>
            </CardContent>
          </Card>
        )}

        {studentInfo && schoolInfo && results.length > 0 && (
          <div className="space-y-6">
            <div className="flex gap-4 justify-end print:hidden">
              <Button onClick={handlePrint} variant="outline">
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print Report
              </Button>
              <Button onClick={() => {
                setStudentInfo(null);
                setResults([]);
                setStudentId('');
                setPin('');
              }}>
                New Search
              </Button>
            </div>

            {/* Academic Report */}
            <div ref={reportRef} className="bg-white">
              <div className="p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Times, serif' }}>
                {/* Header */}
                <div className="text-center border-b-2 border-black pb-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                      {schoolInfo.logo_url ? (
                        <img src={schoolInfo.logo_url} alt="School Logo" className="w-16 h-16 object-contain" />
                      ) : (
                        <GraduationCapIcon className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 mx-4">
                      <h1 className="text-2xl font-bold uppercase">{schoolInfo.name}</h1>
                      <p className="text-sm">{schoolInfo.address}</p>
                      <p className="text-sm">Tel: {schoolInfo.phone} | Email: {schoolInfo.email}</p>
                      <h2 className="text-lg font-semibold mt-2 underline">STUDENT'S ACADEMIC REPORT SHEET</h2>
                    </div>
                    <div className="w-20 h-24 bg-gray-200 border-2 border-black flex items-center justify-center text-xs">
                      STUDENT PHOTO
                    </div>
                  </div>
                </div>

                {/* Student Information */}
                <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                  <div className="space-y-1">
                    <p><strong>STUDENT'S NAME:</strong> {studentInfo.name.toUpperCase()}</p>
                    <p><strong>ADMISSION NO:</strong> {studentInfo.student_id}</p>
                    <p><strong>CLASS:</strong> {studentInfo.class_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p><strong>TERM:</strong> {studentInfo.term_name}</p>
                    <p><strong>SESSION:</strong> {studentInfo.academic_year}</p>
                    <p><strong>NO. OF SUBJECTS:</strong> {overallStats.totalSubjects}</p>
                  </div>
                  <div className="space-y-1">
                    <p><strong>TOTAL MARKS OBTAINABLE:</strong> {overallStats.totalMarks}</p>
                    <p><strong>TOTAL MARKS OBTAINED:</strong> {overallStats.totalObtained}</p>
                    <p><strong>PERCENTAGE:</strong> {overallStats.overallPercentage}%</p>
                  </div>
                </div>

                {/* Results Table */}
                <div className="mb-6">
                  <table className="w-full border-collapse border-2 border-black text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-2 text-left">SUBJECTS</th>
                        <th className="border border-black p-2 text-center">CA1<br/>(20)</th>
                        <th className="border border-black p-2 text-center">CA2<br/>(20)</th>
                        <th className="border border-black p-2 text-center">EXAM<br/>(60)</th>
                        <th className="border border-black p-2 text-center">TOTAL<br/>(100)</th>
                        <th className="border border-black p-2 text-center">%</th>
                        <th className="border border-black p-2 text-center">GRADE</th>
                        <th className="border border-black p-2 text-center">POSITION</th>
                        <th className="border border-black p-2 text-center">TEACHER'S SIGNATURE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr key={index}>
                          <td className="border border-black p-2 font-medium">
                            {result.subject_name.toUpperCase()}
                          </td>
                          <td className="border border-black p-2 text-center">{result.ca1_score}</td>
                          <td className="border border-black p-2 text-center">{result.ca2_score}</td>
                          <td className="border border-black p-2 text-center">{result.exam_score}</td>
                          <td className="border border-black p-2 text-center font-semibold">
                            {result.ca1_score + result.ca2_score + result.exam_score}
                          </td>
                          <td className="border border-black p-2 text-center">{result.percentage}</td>
                          <td className={`border border-black p-2 text-center font-bold ${getGradeColor(result.grade)}`}>
                            {result.grade}
                          </td>
                          <td className="border border-black p-2 text-center">{result.position}</td>
                          <td className="border border-black p-2"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Section */}
                <div className="grid grid-cols-3 gap-6 mb-6 text-sm">
                  <div className="border border-black p-3">
                    <h3 className="font-bold text-center mb-2 underline">GRADING SYSTEM</h3>
                    <div className="space-y-1 text-xs">
                      <p>90-100% = A+ (Excellent)</p>
                      <p>80-89% = A (Very Good)</p>
                      <p>70-79% = B+ (Good)</p>
                      <p>60-69% = B (Average)</p>
                      <p>50-59% = C (Fair)</p>
                      <p>40-49% = D (Poor)</p>
                      <p>0-39% = F (Fail)</p>
                    </div>
                  </div>

                  <div className="border border-black p-3">
                    <h3 className="font-bold text-center mb-2 underline">PERFORMANCE SUMMARY</h3>
                    <div className="space-y-1 text-xs">
                      <p><strong>Overall Grade:</strong> <span className={`font-bold ${getGradeColor(overallStats.overallGrade)}`}>{overallStats.overallGrade}</span></p>
                      <p><strong>Overall Position:</strong> {overallStats.overallPosition}</p>
                      <p><strong>Class Average:</strong> 78%</p>
                      <p><strong>Attendance:</strong> {studentInfo.attendance_percentage}%</p>
                      <p><strong>Times Absent:</strong> 2</p>
                      <p><strong>Times Late:</strong> 1</p>
                    </div>
                  </div>

                  <div className="border border-black p-3">
                    <h3 className="font-bold text-center mb-2 underline">REMARKS</h3>
                    <div className="space-y-2 text-xs">
                      <div>
                        <p><strong>Class Teacher:</strong></p>
                        <p className="italic">Excellent performance. Keep it up!</p>
                        <p className="text-right mt-2">Sign: _______________</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Principal's Section */}
                <div className="border-t-2 border-black pt-4">
                  <div className="grid grid-cols-2 gap-8 text-sm">
                    <div>
                      <p><strong>PRINCIPAL'S REMARKS:</strong></p>
                      <div className="h-16 border-b border-gray-400 mb-2"></div>
                      <p className="text-right">PRINCIPAL'S SIGNATURE & STAMP</p>
                    </div>
                    <div>
                      <p><strong>NEXT TERM BEGINS:</strong> _______________</p>
                      <p className="mt-4"><strong>SCHOOL FEES:</strong> ₦_______________</p>
                      <p className="mt-8 text-center font-bold">
                        STUDENT SHOULD REPORT WITH THIS REPORT CARD
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

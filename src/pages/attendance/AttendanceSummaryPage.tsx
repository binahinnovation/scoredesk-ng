import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, FileText, BarChart3, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useUserRole } from '@/hooks/use-user-role';
import { useSchoolId } from '@/hooks/use-school-id';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface AttendanceSummary {
  student_id: string;
  student_name: string;
  student_number: string;
  class_name: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  attendance_percentage: number;
}

interface ClassAttendanceSummary {
  class_name: string;
  total_students: number;
  average_attendance: number;
  present_count: number;
  absent_count: number;
  late_count: number;
}

interface Class {
  id: string;
  name: string;
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

export default function AttendanceSummaryPage() {
  const { user } = useAuth();
  const { hasPermission } = useUserRole();
  const { schoolId, loading: schoolIdLoading } = useSchoolId();
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([]);
  const [classAttendanceSummary, setClassAttendanceSummary] = useState<ClassAttendanceSummary[]>([]);
  const [loading, setLoading] = useState(false);

  // Set default date range (current month)
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);


  // Fetch classes - FILTERED BY SCHOOL
  const { data: classes = [] } = useQuery({
    queryKey: ['classes', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', schoolId)
        .order('name');
      
      if (error) throw error;
      return data as Class[];
    },
    enabled: !!schoolId
  });

  // Fetch students for selected class - FILTERED BY SCHOOL
  const { data: students = [] } = useQuery({
    queryKey: ['students', selectedClass, schoolId],
    queryFn: async () => {
      if (selectedClass === 'all' || !schoolId) return [];
      
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, student_id')
        .eq('class_id', selectedClass)
        .eq('school_id', schoolId)
        .eq('status', 'Active')
        .order('first_name');
      
      if (error) throw error;
      return data;
    },
    enabled: selectedClass !== 'all' && !!schoolId
  });

  const fetchAttendanceSummary = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please select start and end dates",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('attendance')
        .select(`
          student_id,
          status,
          date,
          students:student_id (
            id,
            first_name,
            last_name,
            student_id,
            class_id,
            classes:class_id (name)
          )
        `)
        .eq('school_id', schoolId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (selectedClass !== 'all') {
        query = query.eq('class_id', selectedClass);
      }

      if (selectedStudent !== 'all') {
        query = query.eq('student_id', selectedStudent);
      }

      const { data: attendanceData, error } = await query;
      if (error) throw error;

      // Process data for student summary
      const studentMap = new Map<string, {
        student_id: string;
        student_name: string;
        student_number: string;
        class_name: string;
        records: { status: string; date: string }[];
      }>();

      attendanceData?.forEach(record => {
        const student = record.students;
        if (!student) return;

        const key = student.id;
        if (!studentMap.has(key)) {
          studentMap.set(key, {
            student_id: student.id,
            student_name: `${student.first_name} ${student.last_name}`,
            student_number: student.student_id,
            class_name: student.classes?.name || 'Unknown',
            records: []
          });
        }

        studentMap.get(key)!.records.push({
          status: record.status,
          date: record.date
        });
      });

      // Calculate summaries
      const summaries: AttendanceSummary[] = Array.from(studentMap.values()).map(student => {
        const totalDays = student.records.length;
        const presentDays = student.records.filter(r => r.status === 'present').length;
        const absentDays = student.records.filter(r => r.status === 'absent').length;
        const lateDays = student.records.filter(r => r.status === 'late').length;
        const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        return {
          student_id: student.student_id,
          student_name: student.student_name,
          student_number: student.student_number,
          class_name: student.class_name,
          total_days: totalDays,
          present_days: presentDays,
          absent_days: absentDays,
          late_days: lateDays,
          attendance_percentage: attendancePercentage
        };
      });

      setAttendanceSummary(summaries);

      // Process data for class summary
      const classMap = new Map<string, {
        class_name: string;
        students: Set<string>;
        records: { status: string }[];
      }>();

      attendanceData?.forEach(record => {
        const student = record.students;
        if (!student) return;

        const className = student.classes?.name || 'Unknown';
        if (!classMap.has(className)) {
          classMap.set(className, {
            class_name: className,
            students: new Set(),
            records: []
          });
        }

        const classData = classMap.get(className)!;
        classData.students.add(student.id);
        classData.records.push({ status: record.status });
      });

      const classSummaries: ClassAttendanceSummary[] = Array.from(classMap.values()).map(classData => {
        const totalRecords = classData.records.length;
        const presentCount = classData.records.filter(r => r.status === 'present').length;
        const absentCount = classData.records.filter(r => r.status === 'absent').length;
        const lateCount = classData.records.filter(r => r.status === 'late').length;
        const averageAttendance = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

        return {
          class_name: classData.class_name,
          total_students: classData.students.size,
          average_attendance: averageAttendance,
          present_count: presentCount,
          absent_count: absentCount,
          late_count: lateCount
        };
      });

      setClassAttendanceSummary(classSummaries);

    } catch (error: any) {
      console.error('Error fetching attendance summary:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch attendance summary",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Student ID', 'Student Name', 'Class', 'Total Days', 'Present', 'Absent', 'Late', 'Attendance %'];
    const csvData = [
      headers.join(','),
      ...attendanceSummary.map(summary => [
        summary.student_number,
        `"${summary.student_name}"`,
        `"${summary.class_name}"`,
        summary.total_days,
        summary.present_days,
        summary.absent_days,
        summary.late_days,
        `${summary.attendance_percentage}%`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_summary_${startDate}_to_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "CSV exported successfully" });
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Attendance Summary Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .summary { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h1>Attendance Summary Report</h1>
            <div class="summary">
              <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
              <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Total Students:</strong> ${attendanceSummary.length}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Total Days</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                ${attendanceSummary.map((summary, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${summary.student_number}</td>
                    <td>${summary.student_name}</td>
                    <td>${summary.class_name}</td>
                    <td>${summary.total_days}</td>
                    <td>${summary.present_days}</td>
                    <td>${summary.absent_days}</td>
                    <td>${summary.late_days}</td>
                    <td>${summary.attendance_percentage}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    
    toast({ title: "PDF export initiated" });
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceBadge = (percentage: number) => {
    if (percentage >= 90) return 'default';
    if (percentage >= 75) return 'secondary';
    return 'destructive';
  };

  // Permission check
  if (!hasPermission("Attendance Management")) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-900">Attendance Summary</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 gap-4">
            <AlertCircle className="h-16 w-16 text-orange-500" />
            <h2 className="text-xl font-semibold">Access Restricted</h2>
            <p className="text-center text-muted-foreground">
              Only Form Teachers, Principals, and Exam Officers can access attendance management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (schoolIdLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-900">Attendance Summary</h1>
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
        <h1 className="text-3xl font-bold text-gray-900">Attendance Summary</h1>
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Attendance Summary</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
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
              <Label htmlFor="student">Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={fetchAttendanceSummary} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Loading..." : "Generate Report"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {attendanceSummary.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{attendanceSummary.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Average Attendance</p>
                  <p className="text-2xl font-bold text-green-600">
                    {attendanceSummary.length > 0 
                      ? Math.round(attendanceSummary.reduce((sum, s) => sum + s.attendance_percentage, 0) / attendanceSummary.length)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total School Days</p>
                  <p className="text-2xl font-bold">
                    {attendanceSummary.length > 0 
                      ? Math.max(...attendanceSummary.map(s => s.total_days))
                      : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Perfect Attendance</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {attendanceSummary.filter(s => s.attendance_percentage === 100).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {classAttendanceSummary.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Class Attendance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classAttendanceSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="class_name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, "Average Attendance"]} />
                  <Bar dataKey="average_attendance" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overall Attendance Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Present', value: attendanceSummary.reduce((sum, s) => sum + s.present_days, 0) },
                      { name: 'Absent', value: attendanceSummary.reduce((sum, s) => sum + s.absent_days, 0) },
                      { name: 'Late', value: attendanceSummary.reduce((sum, s) => sum + s.late_days, 0) }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => {
                      // Only show labels for segments with > 5% to avoid overlap
                      if (percent < 0.05) return '';
                      return `${name}: ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2].map((index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} days`, name]}
                    labelFormatter={(label) => `Total: ${label}`}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => (
                      <span style={{ color: '#333', fontSize: '14px' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student Summary Table */}
      {attendanceSummary.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Student Attendance Summary</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportToPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Total Days</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Late</TableHead>
                  <TableHead>Attendance %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceSummary.map((summary) => (
                  <TableRow key={summary.student_id}>
                    <TableCell className="font-medium">{summary.student_number}</TableCell>
                    <TableCell>{summary.student_name}</TableCell>
                    <TableCell>{summary.class_name}</TableCell>
                    <TableCell>{summary.total_days}</TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">{summary.present_days}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600 font-medium">{summary.absent_days}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-yellow-600 font-medium">{summary.late_days}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getAttendanceBadge(summary.attendance_percentage)}>
                        <span className={getAttendanceColor(summary.attendance_percentage)}>
                          {summary.attendance_percentage}%
                        </span>
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {attendanceSummary.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Attendance Data</h3>
            <p className="text-gray-600">
              No attendance records found for the selected criteria. Try adjusting your filters or date range.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

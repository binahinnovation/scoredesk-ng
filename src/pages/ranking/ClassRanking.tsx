import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Trophy, Medal, Award, Download, RefreshCw, Users, TrendingUp } from "lucide-react";
import { useSchoolId } from "@/hooks/use-school-id";
import { useUserRole } from "@/hooks/use-user-role";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface StudentRanking {
  student_id: string;
  first_name: string;
  last_name: string;
  student_id_number: string;
  class_name: string;
  total_score: number;
  average_score: number;
  total_subjects: number;
  position: number;
  grade: string;
  term_name: string;
  academic_year: string;
}

interface ClassRankingData {
  class_id: string;
  class_name: string;
  student_count: number;
  class_average: number;
  top_student: string;
  students: StudentRanking[];
}

export default function ClassRanking() {
  const { schoolId, schoolIdLoading } = useSchoolId();
  const { hasPermission } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [rankings, setRankings] = useState<ClassRankingData[]>([]);
  const [allStudentsRanking, setAllStudentsRanking] = useState<StudentRanking[]>([]);

  useEffect(() => {
    if (!hasPermission("Position & Ranking") || !schoolId || schoolIdLoading) {
      return;
    }
    fetchData();
  }, [hasPermission, schoolId, schoolIdLoading]);

  const fetchData = async () => {
    if (!schoolId) return;
    
    setLoading(true);
    try {
      const [classesRes, termsRes] = await Promise.all([
        supabase.from("classes").select("*").eq("school_id", schoolId).order("name"),
        supabase.from("terms").select("*").eq("school_id", schoolId).order("is_current", { ascending: false })
      ]);

      setClasses(classesRes.data || []);
      setTerms(termsRes.data || []);

      // Set default selections
      const currentTerm = termsRes.data?.find(term => term.is_current);
      if (currentTerm) {
        setSelectedTerm(currentTerm.id);
      }
      setSelectedClass("all");
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRankings = async () => {
    if (!schoolId || !selectedTerm) return;

    setLoading(true);
    try {
      // Fetch all results for the selected term
      const { data: results, error } = await supabase
        .from("results")
        .select(`
          student_id,
          score,
          max_score,
          students:student_id (
            id,
            first_name,
            last_name,
            student_id,
            class_id,
            classes:class_id (name)
          ),
          subjects:subject_id (name),
          terms:term_id (name, academic_year)
        `)
        .eq("school_id", schoolId)
        .eq("term_id", selectedTerm)
        .eq("is_approved", true); // Only approved results

      if (error) throw error;

      // Calculate rankings
      const studentMap = new Map<string, StudentRanking>();
      const classMap = new Map<string, ClassRankingData>();

      results?.forEach((result) => {
        const studentId = result.student_id;
        const student = result.students;
        const subject = result.subjects;
        const term = result.terms;
        const classData = student?.classes;

        if (!student || !classData || !subject || !term) return;

        // Initialize student data if not exists
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            student_id: studentId,
            first_name: student.first_name,
            last_name: student.last_name,
            student_id_number: student.student_id,
            class_name: classData.name,
            total_score: 0,
            average_score: 0,
            total_subjects: 0,
            position: 0,
            grade: "",
            term_name: term.name,
            academic_year: term.academic_year
          });
        }

        // Initialize class data if not exists
        if (!classMap.has(classData.name)) {
          classMap.set(classData.name, {
            class_id: student.class_id,
            class_name: classData.name,
            student_count: 0,
            class_average: 0,
            top_student: "",
            students: []
          });
        }

        // Update student scores
        const studentData = studentMap.get(studentId)!;
        const percentage = (result.score / result.max_score) * 100;
        studentData.total_score += percentage;
        studentData.total_subjects += 1;
        studentData.average_score = studentData.total_score / studentData.total_subjects;

        // Determine grade
        if (percentage >= 80) studentData.grade = "A";
        else if (percentage >= 70) studentData.grade = "B";
        else if (percentage >= 60) studentData.grade = "C";
        else if (percentage >= 50) studentData.grade = "D";
        else studentData.grade = "F";
      });

      // Calculate positions and class data
      const allStudents = Array.from(studentMap.values());
      
      // Sort students by average score (descending)
      allStudents.sort((a, b) => b.average_score - a.average_score);
      
      // Assign positions
      allStudents.forEach((student, index) => {
        student.position = index + 1;
      });

      // Group by class and calculate class statistics
      allStudents.forEach(student => {
        const classData = classMap.get(student.class_name)!;
        classData.students.push(student);
        classData.student_count += 1;
      });

      // Calculate class averages and find top students
      Array.from(classMap.values()).forEach(classData => {
        if (classData.students.length > 0) {
          classData.class_average = classData.students.reduce((sum, student) => sum + student.average_score, 0) / classData.students.length;
          classData.top_student = classData.students[0].first_name + " " + classData.students[0].last_name;
        }
      });

      setRankings(Array.from(classMap.values()));
      setAllStudentsRanking(allStudents);
    } catch (error) {
      console.error("Error fetching rankings:", error);
      toast({
        title: "Error",
        description: "Failed to load rankings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTerm) {
      fetchRankings();
    }
  }, [selectedTerm, schoolId]);

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (position === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-medium">#{position}</span>;
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "bg-green-100 text-green-800";
      case "B": return "bg-blue-100 text-blue-800";
      case "C": return "bg-yellow-100 text-yellow-800";
      case "D": return "bg-orange-100 text-orange-800";
      case "F": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const exportToCSV = () => {
    const csvData = allStudentsRanking.map(student => ({
      Position: student.position,
      "Student ID": student.student_id_number,
      "First Name": student.first_name,
      "Last Name": student.last_name,
      Class: student.class_name,
      "Average Score": student.average_score.toFixed(2),
      Grade: student.grade,
      "Total Subjects": student.total_subjects
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map(row => Object.values(row).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `class_ranking_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (schoolIdLoading || loading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-900">Class Ranking</h1>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
              <div>
                <p className="text-blue-800 font-medium">
                  {schoolIdLoading ? "Loading School Information" : "Loading Data"}
                </p>
                <p className="text-blue-700 text-sm">
                  {schoolIdLoading 
                    ? "Please wait while we load your school details..."
                    : "Please wait while we load classes, terms, and rankings..."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (schoolIdLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-900">Class Ranking</h1>
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

  if (!hasPermission("Position & Ranking")) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-900">Class Ranking</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 gap-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-center text-muted-foreground">
              You don't have permission to view class rankings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-900">Class Ranking</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 gap-4">
            <AlertCircle className="h-16 w-16 text-orange-500" />
            <h2 className="text-xl font-semibold">No School Assigned</h2>
            <p className="text-center text-muted-foreground">
              Please contact your administrator to assign you to a school.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Ranking</h1>
          <p className="text-muted-foreground">View student performance rankings by class</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchRankings}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {allStudentsRanking.length > 0 && (
            <Button onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name} - {term.academic_year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Class (Optional)</label>
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
          </div>
        </CardContent>
      </Card>

      {/* Rankings */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Class Overview</TabsTrigger>
          <TabsTrigger value="students">All Students</TabsTrigger>
          {selectedClass && selectedClass !== "all" && (
            <TabsTrigger value="class">Class Details</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rankings.map((classData) => (
              <Card key={classData.class_id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {classData.class_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Students:</span>
                      <span className="font-medium">{classData.student_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Class Average:</span>
                      <span className="font-medium">{classData.class_average.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Top Student:</span>
                      <span className="font-medium text-sm">{classData.top_student}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">
                          {classData.students.filter(s => s.grade === 'A').length} A grades
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Students Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allStudentsRanking.slice(0, 50).map((student) => (
                  <div key={student.student_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8">
                        {getPositionIcon(student.position)}
                      </div>
                      <div>
                        <div className="font-medium">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {student.student_id_number} • {student.class_name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium">{student.average_score.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">
                          {student.total_subjects} subjects
                        </div>
                      </div>
                      <Badge className={getGradeColor(student.grade)}>
                        {student.grade}
                      </Badge>
                    </div>
                  </div>
                ))}
                {allStudentsRanking.length > 50 && (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    Showing top 50 students. Export CSV to see all rankings.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {selectedClass && selectedClass !== "all" && (
          <TabsContent value="class" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {classes.find(c => c.id === selectedClass)?.name} Class Ranking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rankings
                    .find(r => r.class_id === selectedClass)
                    ?.students.map((student) => (
                      <div key={student.student_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8">
                            {getPositionIcon(student.position)}
                          </div>
                          <div>
                            <div className="font-medium">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {student.student_id_number}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-medium">{student.average_score.toFixed(1)}%</div>
                            <div className="text-sm text-muted-foreground">
                              {student.total_subjects} subjects
                            </div>
                          </div>
                          <Badge className={getGradeColor(student.grade)}>
                            {student.grade}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

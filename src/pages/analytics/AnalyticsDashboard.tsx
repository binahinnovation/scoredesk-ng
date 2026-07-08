import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Users, BookOpen, GraduationCap, TrendingUp, TrendingDown } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useSchoolId } from "@/hooks/use-school-id";

interface AnalyticsData {
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  totalClasses: number;
  resultsAnalytics: any[];
  classPerformance: any[];
  subjectPerformance: any[];
  termComparison: any[];
}

export default function AnalyticsDashboard() {
  const { userRole, loading: userRoleLoading, hasPermission } = useUserRole(); // Renamed loading to avoid conflict
  const { schoolId, loading: schoolIdLoading } = useSchoolId();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    totalClasses: 0,
    resultsAnalytics: [],
    classPerformance: [],
    subjectPerformance: [],
    termComparison: []
  });
  const [selectedTerm, setSelectedTerm] = useState<string>("all");
  const [terms, setTerms] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  useEffect(() => {
    const canViewAnalytics = hasPermission("Analytics Dashboard");
    if (userRoleLoading || schoolIdLoading) {
      // Still waiting for user role or school_id to be determined
      return;
    }
    
    if (canViewAnalytics && schoolId) {
      fetchAnalytics();
    } else {
      setLoadingData(false);
    }
  }, [hasPermission, selectedTerm, userRoleLoading, schoolId, schoolIdLoading]);

  const fetchAnalytics = async () => {
    if (!schoolId) {
      console.warn('No school_id available for analytics');
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    try {
      // Fetch basic counts - FILTERED BY SCHOOL
      const [studentsResult, teachersResult, subjectsResult, classesResult, termsResult] = await Promise.all([
        supabase.from("students").select("id", { count: "exact" }).eq("school_id", schoolId),
        supabase.from("user_roles").select("id", { count: "exact" }).eq("school_id", schoolId).neq("role", "Principal"),
        supabase.from("subjects").select("id", { count: "exact" }).eq("school_id", schoolId),
        supabase.from("classes").select("id", { count: "exact" }).eq("school_id", schoolId),
        supabase.from("terms").select("*").eq("school_id", schoolId).order("created_at", { ascending: false })
      ]);

      if (teachersResult.error) {
        console.error("Error fetching teachers count:", teachersResult.error);
      }

      // Fetch results for analytics - FILTERED BY SCHOOL
      let resultsQuery = supabase
        .from("results")
        .select(`
          score,
          is_approved,
          students:student_id (class_id, classes:class_id (name)),
          subjects:subject_id (name),
          assessments:assessment_id (max_score),
          terms:term_id (name)
        `)
        .eq("school_id", schoolId);

      if (selectedTerm !== "all") {
        resultsQuery = resultsQuery.eq("term_id", selectedTerm);
      }

      const resultsResult = await resultsQuery;

      if (resultsResult.error) {
          console.error("Error fetching results for analytics:", resultsResult.error);
      }

      // Process data for charts
      const classPerformanceData = processClassPerformance(resultsResult.data || []);
      const subjectPerformanceData = processSubjectPerformance(resultsResult.data || []);
      const processedResultsAnalytics = processResultsAnalytics(resultsResult.data || []);

      setAnalytics({
        totalStudents: studentsResult.count || 0,
        totalTeachers: teachersResult.count || 0,
        totalSubjects: subjectsResult.count || 0,
        totalClasses: classesResult.count || 0,
        resultsAnalytics: processedResultsAnalytics,
        classPerformance: classPerformanceData,
        subjectPerformance: subjectPerformanceData,
        termComparison: [] 
      });

      setTerms(termsResult.data || []);

    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const processClassPerformance = (results: any[]) => {
    const classStats = new Map();
    
    results.forEach(result => {
      if (!result.students?.classes?.name || !result.assessments?.max_score || result.assessments.max_score === 0 || result.score === null || result.score === undefined) {
        // console.log("Skipping result in processClassPerformance due to missing data:", result);
        return;
      }
      // Ensure is_approved is true if it exists, otherwise assume true if not present
      if (result.is_approved === false) {
        // console.log("Skipping non-approved result in processClassPerformance:", result);
        return;
      }
      
      const className = result.students.classes.name;
      const score = Number(result.score);
      const maxScore = Number(result.assessments.max_score);
      
      if (isNaN(score) || isNaN(maxScore) || maxScore === 0) {
        // console.log("Skipping result with invalid score/maxScore in processClassPerformance:", result);
        return;
      }
      const percentage = (score / maxScore) * 100;
      
      if (!classStats.has(className)) {
        classStats.set(className, { scores: [], count: 0 });
      }
      
      const stats = classStats.get(className);
      stats.scores.push(percentage);
      stats.count++;
    });

    const performanceData = Array.from(classStats.entries()).map(([className, stats]) => ({
      name: className,
      average: stats.scores.length > 0 ? stats.scores.reduce((sum: number, score: number) => sum + score, 0) / stats.scores.length : 0,
      count: stats.count
    })).sort((a, b) => b.average - a.average);
    return performanceData;
  };

  const processSubjectPerformance = (results: any[]) => {
    const subjectStats = new Map();
    
    results.forEach(result => {
      if (!result.subjects?.name || !result.assessments?.max_score || result.assessments.max_score === 0 || result.score === null || result.score === undefined) {
        // console.log("Skipping result in processSubjectPerformance due to missing data:", result);
        return;
      }
      // Ensure is_approved is true if it exists, otherwise assume true if not present
      if (result.is_approved === false) {
        // console.log("Skipping non-approved result in processSubjectPerformance:", result);
        return;
      }
      
      const subjectName = result.subjects.name;
      const score = Number(result.score);
      const maxScore = Number(result.assessments.max_score);

      if (isNaN(score) || isNaN(maxScore) || maxScore === 0) {
        // console.log("Skipping result with invalid score/maxScore in processSubjectPerformance:", result);
        return;
      }
      const percentage = (score / maxScore) * 100;
      
      if (!subjectStats.has(subjectName)) {
        subjectStats.set(subjectName, { scores: [], count: 0 });
      }
      
      const stats = subjectStats.get(subjectName);
      stats.scores.push(percentage);
      stats.count++;
    });
    
    const performanceData = Array.from(subjectStats.entries()).map(([subjectName, stats]) => ({
      name: subjectName,
      average: stats.scores.length > 0 ? stats.scores.reduce((sum: number, score: number) => sum + score, 0) / stats.scores.length : 0,
      count: stats.count
    })).sort((a, b) => b.average - a.average);
    return performanceData;
  };

  const processResultsAnalytics = (results: any[]) => {
    const gradeRanges = [
      { name: "A (90-100%)", min: 90, max: 100, count: 0 },
      { name: "B (80-89%)", min: 80, max: 89, count: 0 },
      { name: "C (70-79%)", min: 70, max: 79, count: 0 },
      { name: "D (60-69%)", min: 60, max: 69, count: 0 },
      { name: "E (50-59%)", min: 50, max: 59, count: 0 },
      { name: "F (0-49%)", min: 0, max: 49, count: 0 }
    ];

    results.forEach(result => {
      if (!result.assessments?.max_score || result.assessments.max_score === 0 || result.score === null || result.score === undefined) {
        // console.log("Skipping result in processResultsAnalytics due to missing data:", result);
        return;
      }
      // Ensure is_approved is true if it exists, otherwise assume true if not present
      if (result.is_approved === false) {
        // console.log("Skipping non-approved result in processResultsAnalytics:", result);
        return;
      }

      const score = Number(result.score);
      const maxScore = Number(result.assessments.max_score);

      if (isNaN(score) || isNaN(maxScore) || maxScore === 0) {
        // console.log("Skipping result with invalid score/maxScore in processResultsAnalytics:", result);
        return;
      }
      const percentage = (score / maxScore) * 100;
      
      for (const range of gradeRanges) {
        if (percentage >= range.min && percentage <= range.max) {
          range.count++;
          break;
        }
      }
    });
    const analyticsData = gradeRanges.filter(range => range.count > 0);
    return analyticsData;
  };

  if (userRoleLoading) {
    return <div className="flex items-center justify-center h-64">Loading user data...</div>;
  }

  if (!hasPermission("Analytics Dashboard")) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 gap-4">
            <AlertCircle className="h-16 w-16 text-orange-500" />
            <h2 className="text-xl font-semibold">Access Restricted</h2>
            <p className="text-center text-muted-foreground">
              You do not have permission to view analytics.
              Please contact your administrator if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
        <Select value={selectedTerm} onValueChange={setSelectedTerm}>
          <SelectTrigger className="w-full md:w-60">
            <SelectValue placeholder="Select Term" />
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalStudents.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Teachers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalTeachers.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Subjects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalSubjects.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900">
                <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalClasses.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" /> {/* Changed icon for variety */}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Performance */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Class Performance (Average %)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <span>Loading chart data...</span>
              </div>
            ) : analytics.classPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.classPerformance} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 100]}/>
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, "Average Score"]} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="average" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No class performance data available for selected term.</div>
            )}
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Subject Performance (Average %)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <span>Loading chart data...</span>
              </div>
            ) : analytics.subjectPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.subjectPerformance.slice(0, 10)}  margin={{ top: 5, right: 20, left: -20, bottom: 5 }}> {/* Show top 10 */}
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 100]}/>
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, "Average Score"]} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="average" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-[300px] flex items-center justify-center text-muted-foreground">No subject performance data available for selected term.</div>
            )}
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card className="shadow-lg lg:col-span-2"> {/* Make it span 2 cols on large screens */}
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <span>Loading chart data...</span>
              </div>
            ) : analytics.resultsAnalytics.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.resultsAnalytics}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, count }) => `${name}: ${count} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100} 
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.resultsAnalytics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${props.payload.count} results`, props.payload.name]} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No grade distribution data available for selected term.</div>
            )}
          </CardContent>
        </Card>

        {/* Performance Summary - This section might need more dynamic data later */}
        <Card className="shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
                 <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    <span>Loading summary...</span>
                 </div>
            ) : (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Highest Performing Class</p>
                  <p className="text-sm text-muted-foreground">
                    {analytics.classPerformance[0]?.name || "N/A"}
                  </p>
                </div>
                <div className="flex items-center text-green-600">
                  <TrendingUp className="h-5 w-5 mr-1" />
                  <span className="font-medium">
                    {analytics.classPerformance[0]?.average?.toFixed(1) || "0"}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Best Subject Performance</p>
                  <p className="text-sm text-muted-foreground">
                    {analytics.subjectPerformance[0]?.name || "N/A"}
                  </p>
                </div>
                <div className="flex items-center text-green-600">
                  <TrendingUp className="h-5 w-5 mr-1" />
                  <span className="font-medium">
                    {analytics.subjectPerformance[0]?.average?.toFixed(1) || "0"}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Total Results Analyzed</p>
                  <p className="text-sm text-muted-foreground">
                    For selected term
                  </p>
                </div>
                <div className="flex items-center text-blue-600">
                  <span className="font-medium">
                    {analytics.resultsAnalytics.reduce((sum, grade) => sum + grade.count, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

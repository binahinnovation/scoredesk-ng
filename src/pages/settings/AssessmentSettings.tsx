import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Save, AlertCircle } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface Assessment {
  id: string;
  name: string;
  type: string;
  weight: number;
  max_score: number;
}

interface GradeBoundaries {
  A: number;
  B: number;
  C: number;
  D: number;
  F: number;
}

export default function AssessmentSettings() {
  const { userRole, hasPermission, loading } = useUserRole();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [gradeBoundaries, setGradeBoundaries] = useState<GradeBoundaries>({
    A: 80, B: 70, C: 60, D: 50, F: 0
  });
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hasPermission("Assessment Management") && user?.id) {
      fetchData();
    }
  }, [hasPermission, user?.id]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      // Get current user's school_id from profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user?.id)
        .single();

      if (profileError) throw profileError;
      const schoolId = profileData?.school_id;

      // Fetch assessments
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from("assessments")
        .select("*")
        .eq("school_id", schoolId)
        .order("type", { ascending: true });

      if (assessmentsError) throw assessmentsError;
      setAssessments(assessmentsData || []);

      // Fetch grade boundaries from settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("settings")
        .select("setting_value")
        .eq("setting_key", "grade_boundaries")
        .eq("school_id", schoolId)
        .maybeSingle();

      if (!settingsError && settingsData?.setting_value) {
        const boundaries = settingsData.setting_value as { [key: string]: number };
        if (boundaries && typeof boundaries === 'object') {
          setGradeBoundaries({
            A: boundaries.A || 80,
            B: boundaries.B || 70,
            C: boundaries.C || 60,
            D: boundaries.D || 50,
            F: boundaries.F || 0
          });
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const updateAssessment = async (id: string, field: 'weight' | 'max_score', value: number) => {
    try {
      const { error } = await supabase
        .from("assessments")
        .update({ [field]: value })
        .eq("id", id);

      if (error) throw error;

      setAssessments(prev => prev.map(assessment => 
        assessment.id === id ? { ...assessment, [field]: value } : assessment
      ));

      toast({
        title: "Success",
        description: `Assessment ${field} updated successfully`,
      });
    } catch (error: any) {
      console.error("Error updating assessment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update assessment",
        variant: "destructive",
      });
    }
  };

  const saveGradeBoundaries = async () => {
    setSaving(true);
    try {
      // Validate boundaries
      const values = Object.values(gradeBoundaries).sort((a, b) => b - a);
      if (values.some((val, idx) => idx > 0 && val >= values[idx - 1])) {
        toast({
          title: "Invalid Grade Boundaries",
          description: "Grade boundaries must be in descending order (A > B > C > D > F)",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("settings")
        .upsert({ 
          setting_key: "grade_boundaries", 
          setting_value: gradeBoundaries as any,
          school_id: userRole?.school_id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Grade boundaries saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving grade boundaries:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save grade boundaries",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getTotalWeight = () => {
    return assessments.reduce((sum, assessment) => sum + assessment.weight, 0);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!hasPermission("Assessment Management")) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-900">Assessment Settings</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 gap-4">
            <AlertCircle className="h-16 w-16 text-orange-500" />
            <h2 className="text-xl font-semibold">Access Restricted</h2>
            <p className="text-center text-muted-foreground">
              Only Principals and Exam Officers can manage assessment settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Assessment Settings</h1>
      </div>

      {/* Assessment Weights */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Weights & Scores</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading assessments...</div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Weight (%)</TableHead>
                    <TableHead>Max Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell className="font-medium">{assessment.name}</TableCell>
                      <TableCell>{assessment.type}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={assessment.weight * 100}
                          onChange={(e) => {
                            const newWeight = parseFloat(e.target.value) / 100;
                            setAssessments(prev => prev.map(a => 
                              a.id === assessment.id ? { ...a, weight: newWeight } : a
                            ));
                          }}
                          onBlur={() => updateAssessment(assessment.id, 'weight', assessment.weight)}
                          className="w-20"
                          min="0"
                          max="100"
                          step="1"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={assessment.max_score}
                          onChange={(e) => {
                            const newMaxScore = parseFloat(e.target.value);
                            setAssessments(prev => prev.map(a => 
                              a.id === assessment.id ? { ...a, max_score: newMaxScore } : a
                            ));
                          }}
                          onBlur={() => updateAssessment(assessment.id, 'max_score', assessment.max_score)}
                          className="w-20"
                          min="1"
                          step="1"
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">Auto-saved</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Weight:</span>
                  <span className={`font-bold ${getTotalWeight() === 1 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.round(getTotalWeight() * 100)}%
                  </span>
                </div>
                {getTotalWeight() !== 1 && (
                  <p className="text-sm text-red-600 mt-2">
                    Warning: Total weight should equal 100% for accurate calculations
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Grade Boundaries */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Boundaries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 mb-6">
            {Object.entries(gradeBoundaries).map(([grade, boundary]) => (
              <div key={grade} className="space-y-2">
                <Label htmlFor={`grade-${grade}`}>Grade {grade}</Label>
                <Input
                  id={`grade-${grade}`}
                  type="number"
                  value={boundary}
                  onChange={(e) => setGradeBoundaries(prev => ({
                    ...prev,
                    [grade]: parseInt(e.target.value) || 0
                  }))}
                  min="0"
                  max="100"
                  className="text-center"
                />
              </div>
            ))}
          </div>
          
          <div className="flex gap-4 items-center">
            <Button onClick={saveGradeBoundaries} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Grade Boundaries"}
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Current: A≥{gradeBoundaries.A}%, B≥{gradeBoundaries.B}%, C≥{gradeBoundaries.C}%, D≥{gradeBoundaries.D}%, F&lt;{gradeBoundaries.D}%
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

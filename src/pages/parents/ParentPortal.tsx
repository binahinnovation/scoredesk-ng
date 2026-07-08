import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Users, Search, Loader2, GraduationCap, BookOpen, Award, TrendingUp } from 'lucide-react';

export default function ParentPortal() {
  const [studentId, setStudentId] = useState('');
  const [pin, setPin] = useState('');
  const [studentData, setStudentData] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!studentId || !pin) {
      toast({ title: "Error", description: "Please enter Student ID and Scratch Card PIN.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Verify scratch card PIN
      const { data: scratchCard, error: cardError } = await supabase
        .from('scratch_cards')
        .select('*')
        .eq('pin', pin)
        .eq('status', 'Active')
        .maybeSingle();

      if (cardError || !scratchCard) {
        toast({ title: "Invalid PIN", description: "The PIN you entered is invalid or not found.", variant: "destructive" });
        return;
      }

      // Check usage limit
      const currentUsage = scratchCard.usage_count || 0;
      const maxUsage = scratchCard.max_usage_count || 3;
      if (currentUsage >= maxUsage) {
        toast({ title: "Card Expired", description: "This scratch card has reached its maximum usage limit.", variant: "destructive" });
        return;
      }

      // Verify student
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .or(`admission_number.eq.${studentId},student_id.eq.${studentId}`)
        .single();

      if (error || !student) {
        toast({ title: "Not Found", description: "Student not found. Please check the ID.", variant: "destructive" });
        return;
      }

      // Increment scratch card usage
      await supabase
        .from('scratch_cards')
        .update({ usage_count: currentUsage + 1 })
        .eq('id', scratchCard.id);

      setStudentData(student);

      // Fetch results
      const { data: resultData } = await supabase
        .from('results')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      setResults(resultData || []);
      toast({ title: "Success", description: `Welcome to the Parent Portal.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch(grade?.toUpperCase()) {
      case 'A': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'B': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'F': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  if (!studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
        <Card className="w-full max-w-md shadow-2xl border-emerald-100 relative z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
          <CardHeader className="text-center pt-10 pb-4">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
              <Users className="h-10 w-10 text-emerald-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 tracking-tight">Parent Portal</CardTitle>
            <p className="text-gray-500 mt-2 px-4">Secure access to your child's academic records and performance.</p>
          </CardHeader>
          <CardContent className="space-y-5 pt-4 pb-8 px-8">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Student Admission No.</label>
              <Input 
                placeholder="e.g. ADM/2023/001" 
                value={studentId} 
                onChange={(e) => setStudentId(e.target.value)}
                className="h-12 focus-visible:ring-emerald-500 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Scratch Card PIN</label>
              <Input 
                type="password" 
                placeholder="Enter 12-digit PIN" 
                value={pin} 
                onChange={(e) => setPin(e.target.value)}
                className="h-12 focus-visible:ring-emerald-500 tracking-widest font-mono text-center text-lg bg-white"
              />
            </div>
            <Button 
              className="w-full h-12 mt-4 bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all text-base font-medium" 
              onClick={handleLogin} 
              disabled={loading}
            >
              {loading ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Authenticating...</> : <><Search className="h-5 w-5 mr-2" /> View Records</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate some basic stats
  const termsCount = new Set(results.map(r => r.term)).size;
  const subjectsCount = new Set(results.map(r => r.subject)).size;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Navigation / Action Bar */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-emerald-700" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 hidden md:block">Academic Records</h1>
          </div>
          <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50" onClick={() => { setStudentData(null); setResults([]); }}>
            Secure Logout
          </Button>
        </div>

        {/* Student Profile Card (Premium Banner) */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
            <Users className="h-64 w-64" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-32 h-32 bg-white/10 rounded-full border-4 border-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <span className="text-5xl font-bold text-white tracking-tighter">
                {studentData.first_name.charAt(0)}{studentData.last_name.charAt(0)}
              </span>
            </div>
            <div className="text-center md:text-left space-y-4 flex-grow">
              <div>
                <h2 className="text-3xl font-bold mb-1">{studentData.first_name} {studentData.last_name}</h2>
                <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium border border-white/10">
                  {studentData.admission_number}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-white/20">
                <div>
                  <p className="text-emerald-100 text-xs uppercase tracking-wider font-semibold">Current Class</p>
                  <p className="font-medium text-lg">{studentData.class_name}</p>
                </div>
                <div>
                  <p className="text-emerald-100 text-xs uppercase tracking-wider font-semibold">Guardian/Parent</p>
                  <p className="font-medium text-lg truncate">{studentData.parent_name || 'Not specified'}</p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <p className="text-emerald-100 text-xs uppercase tracking-wider font-semibold">Contact</p>
                  <p className="font-medium text-lg">{studentData.parent_phone || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><BookOpen className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Subjects</p>
                <p className="text-2xl font-bold text-gray-900">{subjectsCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Award className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-medium text-gray-500">Results Recorded</p>
                <p className="text-2xl font-bold text-gray-900">{results.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><TrendingUp className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-medium text-gray-500">Terms Tracked</p>
                <p className="text-2xl font-bold text-gray-900">{termsCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Results List */}
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
            <CardTitle className="text-lg text-gray-800">Academic Performance History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {results.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900">No results available yet.</p>
                <p className="text-sm text-gray-500 mt-1">Academic records will appear here once published by the school.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {results.map(r => (
                  <div key={r.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-grow">
                      <h3 className="text-lg font-bold text-gray-900">{r.subject}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{r.term} Term</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{r.session} Session</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 self-start md:self-auto bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <div className="text-center min-w-[60px]">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Score</p>
                        <p className="text-2xl font-bold text-gray-900">{r.total || '—'}</p>
                      </div>
                      <div className="w-px h-10 bg-gray-200"></div>
                      <div className="text-center min-w-[60px]">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Grade</p>
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded font-bold border ${getGradeColor(r.grade)}`}>
                          {r.grade || '?'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

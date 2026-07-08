import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateWithAI } from '@/utils/ai';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Calendar, Copy, Sparkles } from 'lucide-react';

export default function TimetableManagement() {
  const [schoolType, setSchoolType] = useState('');
  const [numClasses, setNumClasses] = useState('6');
  const [subjects, setSubjects] = useState('');
  const [generatedTimetable, setGeneratedTimetable] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!schoolType || !subjects) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const prompt = `Generate a weekly school timetable for a Nigerian ${schoolType} school with the following:
        Number of Classes: ${numClasses}
        Subjects: ${subjects}
        
        Create a Monday-Friday timetable with 8 periods per day (40 minutes each).
        Include break and lunch periods. Ensure no subject clashes for teachers.
        Format as a clear table.`;

      const result = await generateWithAI(prompt);
      setGeneratedTimetable(result);
      toast({ title: "Success", description: "Timetable generated successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedTimetable);
    toast({ title: "Copied", description: "Timetable copied to clipboard." });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-xl p-6 border border-blue-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-white rounded-lg shadow-sm border border-blue-100 relative overflow-hidden">
          <Calendar className="h-8 w-8 text-blue-600 relative z-10" />
          <div className="absolute top-0 right-0 -mt-2 -mr-2 text-blue-200 opacity-50">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">AI Timetable Generator</h1>
          <p className="text-gray-600 mt-1">Generate conflict-free weekly school timetables automatically.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-blue-100 shadow-md">
            <CardHeader className="bg-blue-50/50 border-b border-blue-50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                <Sparkles className="h-5 w-5 text-blue-600" /> Setup Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">School Type *</label>
                <Select value={schoolType} onValueChange={setSchoolType}>
                  <SelectTrigger className="focus-visible:ring-blue-500"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primary">Primary School</SelectItem>
                    <SelectItem value="Junior Secondary">Junior Secondary</SelectItem>
                    <SelectItem value="Senior Secondary">Senior Secondary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Number of Classes</label>
                <Input type="number" value={numClasses} onChange={(e) => setNumClasses(e.target.value)} className="focus-visible:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Subjects (comma-separated) *</label>
                <Input placeholder="e.g. Math, English, Physics" value={subjects} onChange={(e) => setSubjects(e.target.value)} className="focus-visible:ring-blue-500" />
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm transition-all text-white font-medium mt-2" onClick={handleGenerate} disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Timetable...</> : 'Generate Timetable'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card className="h-full border-gray-200 shadow-sm flex flex-col">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg text-gray-800">Generated Output</CardTitle>
              {generatedTimetable && (
                <Button variant="outline" size="sm" onClick={handleCopy} className="text-blue-700 border-blue-200 hover:bg-blue-50">
                  <Copy className="h-4 w-4 mr-1.5" /> Copy Text
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-grow p-0">
              {generatedTimetable ? (
                <div className="p-6 h-[600px] overflow-y-auto">
                  <div className="prose prose-sm max-w-none text-gray-800 bg-white">
                    <ReactMarkdown>{generatedTimetable}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 p-12">
                  <div className="p-4 bg-blue-50 rounded-full mb-4">
                    <Calendar className="h-10 w-10 text-blue-200" />
                  </div>
                  <p className="text-lg font-medium text-gray-600">Ready to Generate</p>
                  <p className="text-sm mt-1 max-w-sm text-center">Configure the school parameters on the left and click generate to create a timetable.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateWithAI } from '@/utils/ai';
import { toast } from '@/components/ui/use-toast';
import { Loader2, BookOpen, Copy, Sparkles } from 'lucide-react';

export default function LessonPlanGenerator() {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [duration, setDuration] = useState('40');
  const [generatedPlan, setGeneratedPlan] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!subject || !topic || !classLevel) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const prompt = `Generate a detailed lesson plan for a Nigerian secondary school with the following details:
        Subject: ${subject}
        Topic: ${topic}
        Class: ${classLevel}
        Duration: ${duration} minutes
        
        Include: Objectives, Materials needed, Introduction, Lesson body (step-by-step), Activities, Assessment, and Conclusion.
        Format the output clearly with headers and bullet points.`;

      const result = await generateWithAI(prompt);
      setGeneratedPlan(result);
      toast({ title: "Success", description: "Lesson plan generated successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPlan);
    toast({ title: "Copied", description: "Lesson plan copied to clipboard." });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50/50 rounded-xl p-6 border border-purple-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-white rounded-lg shadow-sm border border-purple-100 relative overflow-hidden">
          <BookOpen className="h-8 w-8 text-purple-600 relative z-10" />
          <div className="absolute top-0 right-0 -mt-2 -mr-2 text-purple-200 opacity-50">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">AI Lesson Plan Generator</h1>
          <p className="text-gray-600 mt-1">Generate comprehensive, structured lesson plans in seconds using AI.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-purple-100 shadow-md">
            <CardHeader className="bg-purple-50/50 border-b border-purple-50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
                <Sparkles className="h-5 w-5 text-purple-600" /> Lesson Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Subject *</label>
                <Input placeholder="e.g. Mathematics" value={subject} onChange={(e) => setSubject(e.target.value)} className="focus-visible:ring-purple-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Topic *</label>
                <Input placeholder="e.g. Quadratic Equations" value={topic} onChange={(e) => setTopic(e.target.value)} className="focus-visible:ring-purple-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Class Level *</label>
                <Select value={classLevel} onValueChange={setClassLevel}>
                  <SelectTrigger className="focus-visible:ring-purple-500"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Duration (minutes)</label>
                <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="focus-visible:ring-purple-500" />
              </div>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 shadow-sm transition-all text-white font-medium mt-2" onClick={handleGenerate} disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Plan...</> : 'Generate Lesson Plan'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card className="h-full border-gray-200 shadow-sm flex flex-col">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg text-gray-800">Generated Output</CardTitle>
              {generatedPlan && (
                <Button variant="outline" size="sm" onClick={handleCopy} className="text-purple-700 border-purple-200 hover:bg-purple-50">
                  <Copy className="h-4 w-4 mr-1.5" /> Copy Text
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-grow p-0">
              {generatedPlan ? (
                <div className="p-6 h-[600px] overflow-y-auto">
                  <div className="whitespace-pre-wrap prose prose-sm max-w-none text-gray-700 prose-headings:text-purple-900 prose-a:text-purple-600">
                    <ReactMarkdown>{generatedPlan}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 p-12">
                  <div className="p-4 bg-purple-50 rounded-full mb-4">
                    <BookOpen className="h-10 w-10 text-purple-200" />
                  </div>
                  <p className="text-lg font-medium text-gray-600">Ready to Generate</p>
                  <p className="text-sm mt-1 max-w-sm text-center">Fill in the lesson details on the left and click generate to create a detailed plan using AI.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

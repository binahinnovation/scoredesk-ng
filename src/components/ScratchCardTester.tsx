import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube, User, CreditCard } from 'lucide-react';

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
}

const ScratchCardTester = () => {
  const [cardPin, setCardPin] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [students] = useState<Student[]>([
    { id: '1', student_id: 'STU001', first_name: 'John', last_name: 'Doe' },
    { id: '2', student_id: 'STU002', first_name: 'Jane', last_name: 'Smith' },
    { id: '3', student_id: 'STU003', first_name: 'Bob', last_name: 'Johnson' },
  ]);

  const testCardUsage = async () => {
    if (!cardPin.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a card PIN to test.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Call the mark_scratch_card_used function with the new signature
      const { data, error } = await supabase.rpc('mark_scratch_card_used', {
        card_pin: cardPin.trim(),
        p_user_id: null, // Optional user ID
        p_student_id: selectedStudent || null
      });

      if (error) {
        console.error('Error testing card usage:', error);
        toast({
          title: "Test Failed",
          description: error.message,
          variant: "destructive",
        });
        setTestResult({ success: false, message: error.message });
      } else {
        console.log('Card usage test result:', data);
        setTestResult(data);
        toast({
          title: "Test Completed",
          description: data.success ? "Card usage test successful!" : "Card usage test failed",
          variant: data.success ? "default" : "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error testing card usage:', error);
      toast({
        title: "Test Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setTestResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.student_id === studentId);
    return student ? `${student.first_name} ${student.last_name} (${student.student_id})` : studentId;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <TestTube className="h-8 w-8 text-emerald-600 mr-3" />
        <div>
          <h1 className="text-3xl font-bold">Scratch Card Usage Tester</h1>
          <p className="text-gray-600">Test the scratch card usage functionality</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Test Card Usage
            </CardTitle>
            <CardDescription>
              Enter a card PIN and select a student to test usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cardPin">Card PIN</Label>
              <Input
                id="cardPin"
                value={cardPin}
                onChange={(e) => setCardPin(e.target.value)}
                placeholder="Enter card PIN"
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="student">Student (Optional)</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No student selected</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.student_id} value={student.student_id}>
                      {student.first_name} {student.last_name} ({student.student_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={testCardUsage} 
              className="w-full"
              disabled={loading || !cardPin.trim()}
            >
              {loading ? 'Testing...' : 'Test Card Usage'}
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Test Results
            </CardTitle>
            <CardDescription>
              View the results of the card usage test
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={testResult.success ? "default" : "destructive"}>
                    {testResult.success ? "Success" : "Failed"}
                  </Badge>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Message:</Label>
                  <p className="text-sm text-gray-600 mt-1">{testResult.message}</p>
                </div>

                {testResult.usage_count !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Usage Count:</span>
                    <span className="text-sm">{testResult.usage_count}</span>
                  </div>
                )}

                {testResult.max_usage !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Max Usage:</span>
                    <span className="text-sm">{testResult.max_usage}</span>
                  </div>
                )}

                {testResult.remaining_uses !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Remaining Uses:</span>
                    <span className="text-sm">{testResult.remaining_uses}</span>
                  </div>
                )}

                {testResult.is_expired !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Is Expired:</span>
                    <Badge variant={testResult.is_expired ? "destructive" : "default"}>
                      {testResult.is_expired ? "Yes" : "No"}
                    </Badge>
                  </div>
                )}

                {selectedStudent && (
                  <div>
                    <Label className="text-sm font-medium">Test Student:</Label>
                    <p className="text-sm text-gray-600 mt-1">{getStudentName(selectedStudent)}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No test results yet. Run a test to see results here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
          <CardDescription>
            Instructions for testing the scratch card usage functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. <strong>Generate Cards:</strong> First, go to the Scratch Cards page and generate some test cards</p>
            <p>2. <strong>Copy PIN:</strong> Copy the PIN from one of the generated cards</p>
            <p>3. <strong>Test Usage:</strong> Paste the PIN here and optionally select a student</p>
            <p>4. <strong>Check Results:</strong> The test will show usage count, remaining uses, and status</p>
            <p>5. <strong>Multiple Tests:</strong> You can test the same card multiple times to see usage tracking</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScratchCardTester;

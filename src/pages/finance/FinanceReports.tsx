import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSchoolId } from '@/hooks/use-school-id';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Users, Landmark, AlertCircle, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function FinanceReports() {
  const { schoolId } = useSchoolId();
  const [totalFees, setTotalFees] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    if (schoolId) fetchData();
  }, [schoolId]);

  const fetchData = async () => {
    // Fetch fees with class_id
    const { data: fees } = await supabase.from('fees').select('amount, class_id').eq('school_id', schoolId);
    // Fetch payments
    const { data: payments } = await supabase.from('fee_payments').select('amount_paid').eq('school_id', schoolId);
    // Fetch students with their class_id to accurately calculate expected revenue
    const { data: students } = await supabase.from('students').select('class_id').eq('school_id', schoolId);

    let expectedRevenue = 0;
    
    if (students && fees) {
      // Calculate expected revenue by checking applicable fees per student
      students.forEach(student => {
        // A fee applies if it's generic (no class_id) or matches the student's class
        const applicableFees = fees.filter(f => !f.class_id || f.class_id === student.class_id);
        const studentExpected = applicableFees.reduce((sum, f) => sum + parseFloat(f.amount), 0);
        expectedRevenue += studentExpected;
      });
    }

    const paidTotal = payments?.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0) || 0;

    setTotalFees(expectedRevenue);
    setTotalPaid(paidTotal);
    setTotalStudents(students?.length || 0);
  };

  const outstanding = Math.max(0, totalFees - totalPaid);
  const collectionRate = totalFees > 0 ? ((totalPaid / totalFees) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-xl p-6 border border-blue-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-white rounded-lg shadow-sm border border-blue-100">
          <BarChart3 className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Financial Reports</h1>
          <p className="text-gray-600 mt-1">Overview of school revenue, expected income, and fee collection rates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2 pt-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Total Students</CardTitle>
            <div className="p-2 bg-blue-50 rounded-full">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
          </CardContent>
        </Card>
        
        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2 pt-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Total Collected</CardTitle>
            <div className="p-2 bg-green-50 rounded-full">
              <Landmark className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">₦{totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2 pt-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Expected Revenue</CardTitle>
            <div className="p-2 bg-emerald-50 rounded-full">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">₦{totalFees.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2 pt-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Outstanding</CardTitle>
            <div className="p-2 bg-red-50 rounded-full">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">₦{outstanding.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Collection Progress Card */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-lg">Fee Collection Target</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-sm text-gray-500">Current Collection Rate</p>
              <p className="text-4xl font-bold text-amber-500 mt-1">{collectionRate}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Target: ₦{totalFees.toLocaleString()}</p>
            </div>
          </div>
          <Progress value={parseFloat(collectionRate)} className="h-4 bg-gray-100" indicatorClassName="bg-amber-500" />
        </CardContent>
      </Card>
    </div>
  );
}

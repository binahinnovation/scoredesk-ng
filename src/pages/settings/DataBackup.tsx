import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSchoolId } from '@/hooks/use-school-id';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { DatabaseBackup, Download, Loader2, HardDriveDownload, FileText, Users, DollarSign, GraduationCap } from 'lucide-react';

export default function DataBackup() {
  const { schoolId } = useSchoolId();
  const [exporting, setExporting] = useState<string | null>(null);

  const convertToCSV = (objArray: any[]) => {
    if (objArray.length === 0) return '';
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    const headers = Object.keys(array[0]);
    str += headers.join(',') + '\r\n';

    for (let i = 0; i < array.length; i++) {
      let line = '';
      for (let j = 0; j < headers.length; j++) {
        if (j > 0) line += ',';
        let value = array[i][headers[j]];
        if (value && typeof value === 'object') value = JSON.stringify(value);
        if (value !== null && value !== undefined) {
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            line += `"${stringValue.replace(/"/g, '""')}"`;
          } else {
            line += stringValue;
          }
        }
      }
      str += line + '\r\n';
    }
    return str;
  };

  const downloadCSV = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (table: string, name: string) => {
    if (!schoolId) return;
    setExporting(table);
    try {
      const { data, error } = await supabase.from(table).select('*').eq('school_id', schoolId);
      if (error) throw error;
      if (!data || data.length === 0) {
        toast({ title: "No Data", description: `No records found in ${name}.` });
        return;
      }
      const csv = convertToCSV(data);
      downloadCSV(csv, `Backup_${name}`);
      toast({ title: "Success", description: `${name} exported successfully.` });
    } catch (error: any) {
      toast({ title: "Export Failed", description: error.message, variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  const backupOptions = [
    { table: 'students', name: 'Students Register', icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-100', description: 'Export all student biodata, admission numbers, and class assignments.' },
    { table: 'profiles', name: 'Staff & Teachers', icon: FileText, color: 'text-emerald-500', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-100', description: 'Export all staff members, their roles, and contact information.' },
    { table: 'results', name: 'Academic Results', icon: GraduationCap, color: 'text-emerald-500', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-100', description: 'Export all uploaded academic results and scores.' },
    { table: 'fee_payments', name: 'Financial Records', icon: DollarSign, color: 'text-amber-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-100', description: 'Export all fee payments and financial transactions.' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50/50 rounded-xl p-6 border border-teal-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-lg shadow-sm border border-teal-100">
            <DatabaseBackup className="h-8 w-8 text-teal-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Data Backup & Export</h1>
            <p className="text-gray-600 mt-1">Download secure, offline CSV backups of your school's critical data.</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="bg-white border-teal-200 text-teal-700 hover:bg-teal-50 shadow-sm"
          onClick={() => {
            handleExport('students', 'Students Register');
            // In a real app we might want a 'download all' feature, but for now just hint at it
          }}
          disabled={exporting !== null}
        >
          <HardDriveDownload className="h-4 w-4 mr-2" /> Quick Backup
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {backupOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Card key={option.table} className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
              <div className="flex flex-col h-full">
                <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/30">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${option.bgColor} ${option.borderColor} border transition-colors group-hover:scale-105 duration-300`}>
                      <Icon className={`h-6 w-6 ${option.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900">{option.name}</CardTitle>
                      <CardDescription className="text-sm mt-1">{option.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 mt-auto">
                  <Button
                    className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm group-hover:border-teal-300 group-hover:text-teal-700 transition-all duration-300"
                    onClick={() => handleExport(option.table, option.name)}
                    disabled={exporting !== null}
                  >
                    {exporting === option.table ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin text-teal-600" />
                    ) : (
                      <Download className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    )}
                    {exporting === option.table ? "Exporting Data..." : `Download ${option.name}`}
                  </Button>
                </CardContent>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

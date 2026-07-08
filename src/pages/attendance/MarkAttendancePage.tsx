import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Users, CheckCircle, Clock, XCircle, Save, UserCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useUserRole } from '@/hooks/use-user-role';
import { useSchoolId } from '@/hooks/use-school-id';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logEdit, getCurrentUserSchoolId } from '@/utils/auditLogger';
import { AlertCircle } from 'lucide-react';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
  status: string;
}

interface AttendanceRecord {
  id?: string;
  student_id: string;
  date: string;
  period?: string;
  status: 'present' | 'absent' | 'late';
  note?: string;
}

interface Class {
  id: string;
  name: string;
}

export default function MarkAttendancePage() {
  const { user } = useAuth();
  const { hasPermission } = useUserRole();
  const { schoolId, loading: schoolIdLoading } = useSchoolId();
  const queryClient = useQueryClient();
  const [userSchoolId, setUserSchoolId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceRecord>>(new Map());
  const [saving, setSaving] = useState(false);
  const [attendanceReason, setAttendanceReason] = useState('');

  // Fetch user's school ID for audit logging
  useEffect(() => {
    const fetchSchoolId = async () => {
      if (user) {
        const schoolId = await getCurrentUserSchoolId();
        setUserSchoolId(schoolId);
      }
    };
    fetchSchoolId();
  }, [user]);

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
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['students', selectedClass, schoolId],
    queryFn: async () => {
      if (!selectedClass || !schoolId) return [];
      
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, student_id, status')
        .eq('class_id', selectedClass)
        .eq('school_id', schoolId)
        .eq('status', 'Active')
        .order('first_name');
      
      if (error) throw error;
      return data as Student[];
    },
    enabled: !!selectedClass && !!schoolId
  });

  // Fetch existing attendance records
  const { data: existingAttendance = [] } = useQuery({
    queryKey: ['attendance', selectedClass, selectedDate, selectedPeriod],
    queryFn: async () => {
      if (!selectedClass || !selectedDate) return [];
      
      let query = supabase
        .from('attendance')
        .select('*')
        .eq('class_id', selectedClass)
        .eq('date', selectedDate);
      
      if (selectedPeriod) {
        query = query.eq('period', selectedPeriod);
      } else {
        query = query.is('period', null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClass && !!selectedDate
  });

  // Initialize attendance records when data changes
  const initialAttendanceRecords = React.useMemo(() => {
    if (!students || students.length === 0) {
      return new Map<string, AttendanceRecord>();
    }

    const recordsMap = new Map<string, AttendanceRecord>();
    
    // Initialize with existing records
    existingAttendance.forEach(record => {
      recordsMap.set(record.student_id, {
        id: record.id,
        student_id: record.student_id,
        date: record.date,
        period: record.period,
        status: record.status,
        note: record.note
      });
    });
    
    // Add missing students with default 'present' status
    students.forEach(student => {
      if (!recordsMap.has(student.id)) {
        recordsMap.set(student.id, {
          student_id: student.id,
          date: selectedDate,
          period: selectedPeriod || undefined,
          status: 'present',
          note: ''
        });
      }
    });
    
    return recordsMap;
  }, [students, existingAttendance, selectedDate, selectedPeriod]);

  // Update attendance records when initial records change
  useEffect(() => {
    setAttendanceRecords(initialAttendanceRecords);
  }, [initialAttendanceRecords]);

  // Save attendance mutation
  const saveAttendanceMutation = useMutation({
    mutationFn: async (records: AttendanceRecord[]) => {
      if (!user) throw new Error('User not authenticated');
      
      // Get user's profile and school_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, school_id')
        .eq('id', user.id)
        .single();
      
      if (!profile) throw new Error('Profile not found');

      // Fetch existing attendance records for audit logging
      const existingRecordsMap = new Map();
      for (const record of records) {
        if (record.id) {
          const { data: oldRecord } = await supabase
            .from('attendance')
            .select('*')
            .eq('id', record.id)
            .single();
          if (oldRecord) {
            existingRecordsMap.set(record.id, oldRecord);
          }
        }
      }
      
      // Prepare records for upsert
      const recordsToSave = records.map(record => ({
        ...record,
        school_id: profile.school_id,
        class_id: selectedClass,
        recorded_by: profile.id,
        updated_at: new Date().toISOString()
      }));
      
      const { data: savedRecords, error } = await supabase
        .from('attendance')
        .upsert(recordsToSave, {
          onConflict: 'student_id,date,period',
          ignoreDuplicates: false
        })
        .select();
      
      if (error) throw error;
      return { savedRecords: savedRecords || [], existingRecordsMap };
    },
    onSuccess: ({ savedRecords, existingRecordsMap }) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });

      // Log attendance operations
      if (user && userSchoolId) {
        savedRecords.forEach(async (record) => {
          const oldRecord = existingRecordsMap.get(record.id);
          const actionType = oldRecord ? 'update' : 'insert';
          
          await logEdit({
            schoolId: userSchoolId,
            actorId: user.id,
            actionType,
            tableName: 'attendance',
            recordId: record.id,
            oldValue: oldRecord || null,
            newValue: record,
            reason: attendanceReason || `Attendance marked for ${selectedDate}`,
          });
        });
      }

      toast({
        title: "Success",
        description: "Attendance saved successfully",
      });
      setAttendanceReason(''); // Reset reason after save
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save attendance",
        variant: "destructive",
      });
    }
  });

  const updateAttendanceStatus = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceRecords(prev => {
      const newMap = new Map(prev);
      const record = newMap.get(studentId);
      if (record) {
        newMap.set(studentId, { ...record, status });
      }
      return newMap;
    });
  };

  const updateAttendanceNote = (studentId: string, note: string) => {
    setAttendanceRecords(prev => {
      const newMap = new Map(prev);
      const record = newMap.get(studentId);
      if (record) {
        newMap.set(studentId, { ...record, note });
      }
      return newMap;
    });
  };

  const markAllPresent = () => {
    setAttendanceRecords(prev => {
      const newMap = new Map(prev);
      students.forEach(student => {
        const record = newMap.get(student.id);
        if (record) {
          newMap.set(student.id, { ...record, status: 'present', note: '' });
        }
      });
      return newMap;
    });
  };

  const saveAttendance = () => {
    const records = Array.from(attendanceRecords.values());
    saveAttendanceMutation.mutate(records);
  };

  const getStatusBadge = (status: 'present' | 'absent' | 'late') => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>;
    }
  };

  const getStatusIcon = (status: 'present' | 'absent' | 'late') => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const attendanceStats = {
    present: Array.from(attendanceRecords.values()).filter(r => r.status === 'present').length,
    absent: Array.from(attendanceRecords.values()).filter(r => r.status === 'absent').length,
    late: Array.from(attendanceRecords.values()).filter(r => r.status === 'late').length,
    total: students.length
  };

  // Permission check
  if (!hasPermission("Attendance Management")) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
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
        <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
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
        <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
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
        <UserCheck className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
      </div>

      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="attendanceReason">Reason for attendance changes (Optional)</Label>
            <Textarea
              id="attendanceReason"
              value={attendanceReason}
              onChange={(e) => setAttendanceReason(e.target.value)}
              placeholder="e.g., Regular attendance, makeup session, field trip"
              rows={2}
              className="mb-4"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="period">Period (Optional)</Label>
              <Input
                id="period"
                placeholder="e.g., P1, Math, Morning"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={markAllPresent} 
                variant="outline" 
                className="w-full"
                disabled={!selectedClass || students.length === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All Present
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Statistics */}
      {selectedClass && students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Present</p>
                  <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Late</p>
                  <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{attendanceStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance Table */}
      {selectedClass && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Student Attendance - {classes.find(c => c.id === selectedClass)?.name}
              </CardTitle>
              <Button 
                onClick={saveAttendance} 
                disabled={saving || students.length === 0}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="text-center py-8">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active students found in this class
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quick Actions</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const record = attendanceRecords.get(student.id);
                    if (!record) return null;
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.student_id}</TableCell>
                        <TableCell>{student.first_name} {student.last_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.status)}
                            {getStatusBadge(record.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant={record.status === 'present' ? 'default' : 'outline'}
                              onClick={() => updateAttendanceStatus(student.id, 'present')}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant={record.status === 'late' ? 'default' : 'outline'}
                              onClick={() => updateAttendanceStatus(student.id, 'late')}
                            >
                              <Clock className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant={record.status === 'absent' ? 'default' : 'outline'}
                              onClick={() => updateAttendanceStatus(student.id, 'absent')}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Textarea
                            placeholder="Add note..."
                            value={record.note || ''}
                            onChange={(e) => updateAttendanceNote(student.id, e.target.value)}
                            className="min-h-[60px] text-sm"
                            rows={2}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

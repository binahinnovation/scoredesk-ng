import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/use-user-role';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/components/ui/use-toast';
import { 
  Shield, 
  Search, 
  Download, 
  FileText, 
  Eye, 
  ChevronDown, 
  ChevronRight,
  Calendar,
  User,
  Database,
  RefreshCw,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { format } from 'date-fns';

interface EditLog {
  id: string;
  school_id: string;
  actor_id: string;
  action_type: 'insert' | 'update' | 'delete';
  table_name: string;
  record_id: string;
  old_value: any;
  new_value: any;
  reason: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
  } | null;
}

interface LogFilters {
  startDate: string;
  endDate: string;
  actorId: string;
  tableName: string;
  actionType: string;
  searchTerm: string;
}

const TABLE_NAMES = [
  'results',
  'students', 
  'attendance',
  'profiles',
  'user_roles',
  'classes',
  'subjects',
  'question_papers',
  'scratch_cards'
];

const ACTION_TYPES = ['insert', 'update', 'delete'];

export default function AuditLogsPage() {
  const { user } = useAuth();
  const { hasPermission } = useUserRole();
  const [filters, setFilters] = useState<LogFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // Today
    actorId: 'all',
    tableName: 'all',
    actionType: 'all',
    searchTerm: ''
  });
  const [selectedLog, setSelectedLog] = useState<EditLog | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Fetch audit logs with pagination
  const { data: logsData = { logs: [], total: 0 }, isLoading, refetch, error } = useQuery({
    queryKey: ['audit-logs', filters, currentPage, pageSize],
    queryFn: async () => {
      const offset = (currentPage - 1) * pageSize;

      // Build base query for filtering
      const startDateTime = filters.startDate + 'T00:00:00';
      const endDateTime = filters.endDate + 'T23:59:59';
      
      
      let baseQuery = supabase
        .from('edit_logs')
        .select(`
          *,
          profiles!actor_id (full_name)
        `)
        .gte('created_at', startDateTime)
        .lte('created_at', endDateTime);

      // Apply filters
      if (filters.actorId !== 'all') {
        baseQuery = baseQuery.eq('actor_id', filters.actorId);
      }

      if (filters.tableName !== 'all') {
        baseQuery = baseQuery.eq('table_name', filters.tableName);
      }

      if (filters.actionType !== 'all') {
        baseQuery = baseQuery.eq('action_type', filters.actionType);
      }

      // Apply search filter at database level if provided
      if (filters.searchTerm) {
        // For search, we need to get all matching records first, then paginate
        const { data: allMatchingData, error: allDataError } = await baseQuery
          .order('created_at', { ascending: false });

        if (allDataError) throw allDataError;

        // Apply client-side search filter
        const searchLower = filters.searchTerm.toLowerCase();
        const filteredData = (allMatchingData || []).filter(log => 
          log.record_id.toLowerCase().includes(searchLower) ||
          log.reason?.toLowerCase().includes(searchLower) ||
          log.profiles?.full_name?.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.old_value || {}).toLowerCase().includes(searchLower) ||
          JSON.stringify(log.new_value || {}).toLowerCase().includes(searchLower)
        );

        // Calculate pagination on filtered data
        const totalCount = filteredData.length;
        const paginatedData = filteredData.slice(offset, offset + pageSize);


        return {
          logs: paginatedData as EditLog[],
          total: totalCount
        };
      } else {
        // No search filter - use efficient database pagination
        // Get total count first
        const { count: totalCount, error: countError } = await baseQuery
          .select('*', { count: 'exact', head: true });
        
        if (countError) throw countError;

        // Get paginated data
        const { data, error } = await baseQuery
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);


        if (error) throw error;

        return {
          logs: (data || []) as EditLog[],
          total: totalCount || 0
        };
      }
    },
    enabled: hasPermission('User Management') || hasPermission('Result Approval')
  });

  // Fetch statistics separately to show accurate counts for all filtered data
  const { data: statsData } = useQuery({
    queryKey: ['audit-logs-stats', filters],
    queryFn: async () => {
      // Build base query for statistics
      let baseQuery = supabase
        .from('edit_logs')
        .select(`
          action_type,
          profiles!actor_id (full_name)
        `)
        .gte('created_at', filters.startDate + 'T00:00:00')
        .lte('created_at', filters.endDate + 'T23:59:59');

      // Apply filters
      if (filters.actorId !== 'all') {
        baseQuery = baseQuery.eq('actor_id', filters.actorId);
      }

      if (filters.tableName !== 'all') {
        baseQuery = baseQuery.eq('table_name', filters.tableName);
      }

      if (filters.actionType !== 'all') {
        baseQuery = baseQuery.eq('action_type', filters.actionType);
      }

      const { data, error } = await baseQuery.order('created_at', { ascending: false });

      if (error) throw error;

      // Apply search filter if provided
      let filteredData = data || [];
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredData = filteredData.filter(log => 
          log.profiles?.full_name?.toLowerCase().includes(searchLower)
        );
      }

      // Calculate statistics
      const totalCount = filteredData.length;
      const insertCount = filteredData.filter(log => log.action_type === 'insert').length;
      const updateCount = filteredData.filter(log => log.action_type === 'update').length;
      const deleteCount = filteredData.filter(log => log.action_type === 'delete').length;

      return {
        total: totalCount,
        inserts: insertCount,
        updates: updateCount,
        deletes: deleteCount
      };
    },
    enabled: hasPermission('User Management') || hasPermission('Result Approval')
  });

  const logs = logsData.logs;
  const totalLogs = logsData.total || statsData?.total || 0;
  const totalPages = Math.ceil(totalLogs / pageSize);


  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Fetch users for actor filter
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      
      if (error) throw error;
      return data;
    },
    enabled: hasPermission('User Management') || hasPermission('Result Approval')
  });

  const updateFilter = (key: keyof LogFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportToCSV = () => {
    const headers = [
      'Timestamp',
      'Actor',
      'Action',
      'Table',
      'Record ID',
      'Reason',
      'Old Value',
      'New Value'
    ];
    
    const csvData = [
      headers.join(','),
      ...logs.map(log => [
        new Date(log.created_at).toLocaleString(),
        `"${log.profiles?.full_name || 'Unknown User'}"`,
        log.action_type,
        log.table_name,
        log.record_id,
        `"${log.reason || ''}"`,
        `"${JSON.stringify(log.old_value || {})}"`,
        `"${JSON.stringify(log.new_value || {})}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${filters.startDate}_to_${filters.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "CSV exported successfully" });
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'insert': return 'default';
      case 'update': return 'secondary';
      case 'delete': return 'destructive';
      default: return 'outline';
    }
  };

  const formatJsonValue = (value: any) => {
    if (!value) return 'N/A';
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const viewLogDetails = (log: EditLog) => {
    setSelectedLog(log);
    setShowLogDetails(true);
  };

  if (!hasPermission('User Management') && !hasPermission('Result Approval')) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 gap-4">
            <Shield className="h-16 w-16 text-orange-500" />
            <h2 className="text-xl font-semibold">Access Restricted</h2>
            <p className="text-center text-muted-foreground">
              Only Principals and Exam Officers can view audit logs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportToCSV} disabled={logs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => updateFilter('startDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => updateFilter('endDate', e.target.value)}
              />
            </div>

            <div>
              <Label>Actor</Label>
              <Select value={filters.actorId} onValueChange={(value) => updateFilter('actorId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || 'Unknown User'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Table</Label>
              <Select value={filters.tableName} onValueChange={(value) => updateFilter('tableName', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  {TABLE_NAMES.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Action</Label>
              <Select value={filters.actionType} onValueChange={(value) => updateFilter('actionType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {ACTION_TYPES.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

       {/* Statistics */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card>
           <CardContent className="p-4">
             <div className="flex items-center gap-2">
               <Database className="h-5 w-5 text-blue-600" />
               <div>
                 <p className="text-sm text-muted-foreground">Total Logs</p>
                 <p className="text-2xl font-bold">{statsData?.total || totalLogs}</p>
               </div>
             </div>
           </CardContent>
         </Card>
         
         <Card>
           <CardContent className="p-4">
             <div className="flex items-center gap-2">
               <div className="h-5 w-5 bg-green-500 rounded" />
               <div>
                 <p className="text-sm text-muted-foreground">Inserts</p>
                 <p className="text-2xl font-bold text-green-600">
                   {statsData?.inserts || 0}
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
         
         <Card>
           <CardContent className="p-4">
             <div className="flex items-center gap-2">
               <div className="h-5 w-5 bg-blue-500 rounded" />
               <div>
                 <p className="text-sm text-muted-foreground">Updates</p>
                 <p className="text-2xl font-bold text-blue-600">
                   {statsData?.updates || 0}
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
         
         <Card>
           <CardContent className="p-4">
             <div className="flex items-center gap-2">
               <div className="h-5 w-5 bg-red-500 rounded" />
               <div>
                 <p className="text-sm text-muted-foreground">Deletes</p>
                 <p className="text-2xl font-bold text-red-600">
                   {statsData?.deletes || 0}
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
           <CardTitle>
             Audit Trail ({totalLogs} entries)
             {totalLogs >= 15 && (
               <span className="text-sm font-normal text-muted-foreground ml-2">
                 - Page {currentPage} of {totalPages}
               </span>
             )}
           </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found for the selected criteria
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Record ID</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {format(new Date(log.created_at), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(log.created_at), 'HH:mm:ss')}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{log.profiles?.full_name || 'Unknown User'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action_type)}>
                          {log.action_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.table_name}</Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {log.record_id.substring(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {log.reason ? (
                            <p className="text-sm truncate" title={log.reason}>
                              {log.reason}
                            </p>
                          ) : (
                            <span className="text-gray-400 text-sm italic">No reason</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewLogDetails(log)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>


       {/* Pagination Controls */}
       {totalLogs >= 15 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalLogs)} of {totalLogs} entries</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="pageSize" className="text-sm">Rows per page:</Label>
                  <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="15">15</SelectItem>
                       <SelectItem value="20">20</SelectItem>
                       <SelectItem value="50">50</SelectItem>
                       <SelectItem value="100">100</SelectItem>
                     </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log Details Dialog */}
      <Dialog open={showLogDetails} onOpenChange={setShowLogDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Timestamp</Label>
                  <p className="text-sm">{format(new Date(selectedLog.created_at), 'PPpp')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Actor</Label>
                  <p className="text-sm">{selectedLog.profiles?.full_name || 'Unknown User'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Action</Label>
                  <Badge variant={getActionBadgeVariant(selectedLog.action_type)}>
                    {selectedLog.action_type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Table</Label>
                  <Badge variant="outline">{selectedLog.table_name}</Badge>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-500">Record ID</Label>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded block">
                    {selectedLog.record_id}
                  </code>
                </div>
                {selectedLog.reason && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-gray-500">Reason</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded">{selectedLog.reason}</p>
                  </div>
                )}
              </div>

              {/* Data Changes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {selectedLog.old_value && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Old Value</Label>
                    <pre className="text-xs bg-red-50 border border-red-200 p-3 rounded overflow-auto max-h-60">
                      {formatJsonValue(selectedLog.old_value)}
                    </pre>
                  </div>
                )}
                
                {selectedLog.new_value && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">New Value</Label>
                    <pre className="text-xs bg-green-50 border border-green-200 p-3 rounded overflow-auto max-h-60">
                      {formatJsonValue(selectedLog.new_value)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

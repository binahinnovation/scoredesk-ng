import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSchoolId } from '@/hooks/use-school-id';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Calendar, Plus, Loader2, Trash2, Clock, CalendarDays } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AcademicCalendar() {
  const { schoolId } = useSchoolId();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', event_type: 'holiday', start_date: '', end_date: '', description: '' });

  useEffect(() => {
    if (schoolId) fetchEvents();
  }, [schoolId]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('academic_events')
      .select('*')
      .eq('school_id', schoolId)
      .order('start_date', { ascending: true });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    setEvents(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.start_date) {
      toast({ title: "Error", description: "Title and start date are required.", variant: "destructive" });
      return;
    }
    if (formData.end_date && formData.end_date < formData.start_date) {
      toast({ title: "Error", description: "End date cannot be before start date.", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.from('academic_events').insert({
        school_id: schoolId,
        ...formData,
      });
      if (error) throw error;
      toast({ title: "Success", description: "Academic event created successfully." });
      setFormData({ title: '', event_type: 'holiday', start_date: '', end_date: '', description: '' });
      setDialogOpen(false);
      fetchEvents();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    const { error } = await supabase.from('academic_events').delete().eq('id', id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted", description: "Event removed." }); fetchEvents(); }
  };

  const typeColors: Record<string, string> = {
    holiday: 'bg-red-50 text-red-700 border border-red-100',
    exam: 'bg-blue-50 text-blue-700 border border-blue-100',
    event: 'bg-green-50 text-green-700 border border-green-100',
    term_start: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    term_end: 'bg-amber-50 text-amber-700 border border-amber-100',
  };

  const typeLabels: Record<string, string> = {
    holiday: 'Holiday',
    exam: 'Exam Period',
    event: 'School Event',
    term_start: 'Term Start',
    term_end: 'Term End',
  };

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50/50 rounded-xl p-6 border border-orange-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-lg shadow-sm border border-orange-100">
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Academic Calendar</h1>
            <p className="text-gray-600 mt-1">Schedule and manage school events, terms, and holidays.</p>
          </div>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700 shadow-sm transition-all"><Plus className="h-4 w-4 mr-2" /> Add Event</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle className="text-xl">Create Academic Event</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Event Title *</label>
                <Input placeholder="e.g. Mid-Term Break" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="focus-visible:ring-orange-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Event Type *</label>
                <Select value={formData.event_type} onValueChange={(v) => setFormData({ ...formData, event_type: v })}>
                  <SelectTrigger className="focus-visible:ring-orange-500"><SelectValue placeholder="Event Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="exam">Exam Period</SelectItem>
                    <SelectItem value="event">School Event</SelectItem>
                    <SelectItem value="term_start">Term Start</SelectItem>
                    <SelectItem value="term_end">Term End</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Start Date *</label>
                  <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="focus-visible:ring-orange-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">End Date (optional)</label>
                  <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="focus-visible:ring-orange-500" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <Input placeholder="Brief details about the event" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="focus-visible:ring-orange-500" />
              </div>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 mt-2" onClick={handleCreate}>Save Event</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50 border-b border-gray-100">
              <TableRow>
                <TableHead className="py-4 pl-6 font-semibold text-gray-700">Event</TableHead>
                <TableHead className="font-semibold text-gray-700">Type</TableHead>
                <TableHead className="font-semibold text-gray-700">Start Date</TableHead>
                <TableHead className="font-semibold text-gray-700">End Date</TableHead>
                <TableHead className="text-right pr-6 font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-600" /></TableCell></TableRow>
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900">No upcoming events</p>
                    <p className="text-sm text-gray-500 mt-1">Add events to populate the school academic calendar.</p>
                  </TableCell>
                </TableRow>
              ) : (
                events.map(e => {
                  const startDate = new Date(e.start_date);
                  const isPast = e.end_date ? new Date(e.end_date) < new Date() : startDate < new Date();
                  
                  return (
                    <TableRow key={e.id} className={`hover:bg-gray-50/50 transition-colors ${isPast ? 'opacity-60' : ''}`}>
                      <TableCell className="py-4 pl-6">
                        <p className={`font-semibold ${isPast ? 'text-gray-500' : 'text-gray-900'}`}>{e.title}</p>
                        {e.description && <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">{e.description}</p>}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${typeColors[e.event_type] || 'bg-gray-100 text-gray-700'}`}>
                          {typeLabels[e.event_type] || e.event_type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-gray-500">
                          {e.end_date ? new Date(e.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors" onClick={() => handleDelete(e.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

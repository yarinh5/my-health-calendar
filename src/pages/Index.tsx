import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Appointment, SortMode } from '@/types/appointment';
import { supabaseAppointmentService } from '@/lib/supabaseAppointmentService';
import { supabase } from '@/integrations/supabase/client';
import { AppointmentCard } from '@/components/AppointmentCard';
import { AppointmentForm } from '@/components/AppointmentForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus, ArrowUpDown, Shield, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('upcoming');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadAppointments = async () => {
    try {
      if (sortMode === 'upcoming') {
        const data = await supabaseAppointmentService.getUpcoming();
        setAppointments(data);
      } else {
        const data = await supabaseAppointmentService.getByRecent();
        setAppointments(data);
      }
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בטעינת תורים');
    }
  };

  useEffect(() => {
    checkAuthAndLoadData();
  }, [sortMode]);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Check if user is admin
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!roles);
      await loadAppointments();
    } catch (error: any) {
      toast.error(error.message || 'שגיאה');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: {
    location: string;
    examType: string;
    date: string;
    time: string;
    note?: string;
  }) => {
    try {
      if (editingAppointment) {
        await supabaseAppointmentService.update(editingAppointment.id, data);
        toast.success('התור עודכן בהצלחה');
      } else {
        await supabaseAppointmentService.create(data);
        toast.success('התור נוסף בהצלחה');
      }
      
      setIsFormOpen(false);
      setEditingAppointment(undefined);
      await loadAppointments();
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בשמירת התור');
    }
  };

  const handleDelete = async () => {
    if (!editingAppointment) return;
    
    if (window.confirm('האם את בטוחה שאת רוצה למחוק את התור?')) {
      try {
        await supabaseAppointmentService.delete(editingAppointment.id);
        toast.success('התור נמחק בהצלחה');
        setIsFormOpen(false);
        setEditingAppointment(undefined);
        await loadAppointments();
      } catch (error: any) {
        toast.error(error.message || 'שגיאה במחיקת התור');
      }
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingAppointment(undefined);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingAppointment(undefined);
  };

  const toggleSortMode = () => {
    setSortMode(prev => prev === 'upcoming' ? 'recent' : 'upcoming');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">טוען...</p>
      </div>
    );
  }

  const nextAppointmentId = sortMode === 'upcoming' && appointments.length > 0 
    ? appointments[0].id 
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">התורים שלי</h1>
            <div className="flex gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin')}
                >
                  <Shield className="w-5 h-5 ml-2" />
                  פאנל ניהול
                </Button>
              )}
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-5 h-5 ml-2" />
                התנתק
              </Button>
            </div>
          </div>
          
          {/* Sort Toggle */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={toggleSortMode}
              className="gap-2"
            >
              <ArrowUpDown className="w-5 h-5" />
              {sortMode === 'upcoming' ? 'הצג לפי תור אחרון שהוזן' : 'הצג לפי תור קרוב'}
            </Button>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4 mb-20">
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">אין תורים עדיין</p>
              <p className="text-muted-foreground mt-2">לחצי על הכפתור למטה כדי להוסיף תור</p>
            </div>
          ) : (
            appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                isNext={appointment.id === nextAppointmentId}
                onClick={() => handleEdit(appointment)}
              />
            ))
          )}
        </div>

        {/* Add Button */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10">
          <Button
            onClick={handleAddNew}
            size="lg"
            className="rounded-full w-16 h-16 shadow-lg"
          >
            <Plus className="w-8 h-8" />
          </Button>
        </div>

        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-2xl">
            <AppointmentForm
              appointment={editingAppointment}
              onSave={handleSave}
              onDelete={editingAppointment ? handleDelete : undefined}
              onCancel={handleCancel}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;

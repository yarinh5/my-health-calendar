import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Appointment } from '@/types/appointment';
import { supabaseAppointmentService } from '@/lib/supabaseAppointmentService';
import { supabase } from '@/integrations/supabase/client';
import { AppointmentCard } from '@/components/AppointmentCard';
import { AppointmentForm } from '@/components/AppointmentForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Shield, LogOut, CalendarClock, History } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadAppointments = async () => {
    try {
      const [upcoming, past] = await Promise.all([
        supabaseAppointmentService.getUpcoming(),
        supabaseAppointmentService.getPast(),
      ]);
      setUpcomingAppointments(upcoming);
      setPastAppointments(past);
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בטעינת תורים');
    }
  };

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

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

  const nextAppointmentId = upcomingAppointments.length > 0 
    ? upcomingAppointments[0].id 
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
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="upcoming" className="flex-1 gap-2">
              <CalendarClock className="w-4 h-4" />
              תורים קרובים
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-2">
              <History className="w-4 h-4" />
              היסטוריה
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <div className="space-y-4 mb-20">
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl text-muted-foreground">אין תורים קרובים</p>
                  <p className="text-muted-foreground mt-2">לחצי על הכפתור למטה כדי להוסיף תור</p>
                </div>
              ) : (
                upcomingAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    isNext={appointment.id === nextAppointmentId}
                    onClick={() => handleEdit(appointment)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4 mb-20">
              {pastAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl text-muted-foreground">אין היסטוריית תורים</p>
                </div>
              ) : (
                pastAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onClick={() => handleEdit(appointment)}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

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
import { useState, useEffect } from 'react';
import { Appointment, SortMode } from '@/types/appointment';
import { appointmentService } from '@/lib/appointmentService';
import { AppointmentCard } from '@/components/AppointmentCard';
import { AppointmentForm } from '@/components/AppointmentForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('upcoming');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>();

  const loadAppointments = () => {
    if (sortMode === 'upcoming') {
      setAppointments(appointmentService.getUpcoming());
    } else {
      setAppointments(appointmentService.getByRecent());
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [sortMode]);

  const handleSave = (data: {
    location: string;
    examType: string;
    date: string;
    time: string;
    note?: string;
  }) => {
    if (editingAppointment) {
      appointmentService.update(editingAppointment.id, data);
      toast.success('התור עודכן בהצלחה');
    } else {
      appointmentService.create(data);
      toast.success('התור נוסף בהצלחה');
    }
    
    setIsFormOpen(false);
    setEditingAppointment(undefined);
    loadAppointments();
  };

  const handleDelete = () => {
    if (!editingAppointment) return;
    
    if (window.confirm('האם את בטוחה שאת רוצה למחוק את התור?')) {
      appointmentService.delete(editingAppointment.id);
      toast.success('התור נמחק בהצלחה');
      setIsFormOpen(false);
      setEditingAppointment(undefined);
      loadAppointments();
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

  const nextAppointment = appointmentService.getNext();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-center mb-4">התורים שלי</h1>
          
          {/* Sort Toggle */}
          <div className="flex justify-center">
            <Button
              onClick={toggleSortMode}
              variant="outline"
              className="h-12 px-6 text-base"
            >
              <ArrowUpDown className="ml-2 h-5 w-5" />
              {sortMode === 'upcoming' ? 'לפי תור קרוב' : 'לפי תור אחרון שהוזן'}
            </Button>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4 pb-24">
          {appointments.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">
                עדיין אין תורים
              </p>
              <p className="text-base text-muted-foreground">
                לחצי על הכפתור למטה להוספת תור חדש
              </p>
            </div>
          ) : (
            appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                isNext={sortMode === 'upcoming' && appointment.id === nextAppointment?.id}
                onClick={() => handleEdit(appointment)}
              />
            ))
          )}
        </div>

        {/* Floating Add Button */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10">
          <Button
            onClick={handleAddNew}
            size="lg"
            className="h-16 px-8 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow rounded-full"
          >
            <Plus className="ml-2 h-6 w-6" />
            תור חדש
          </Button>
        </div>

        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          if (!open) handleCancel();
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
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

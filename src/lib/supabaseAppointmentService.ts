import { supabase } from '@/integrations/supabase/client';
import { Appointment, AppointmentStatus } from '@/types/appointment';

export const supabaseAppointmentService = {
  // Get all appointments for current user
  async getAll(): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(apt => ({
      id: apt.id,
      location: apt.location,
      examType: apt.exam_type,
      date: apt.date,
      time: apt.time,
      note: apt.note || undefined,
      createdAt: apt.created_at,
      updatedAt: apt.updated_at,
      status: apt.status as AppointmentStatus,
    }));
  },

  // Get upcoming appointments sorted by date/time
  async getUpcoming(): Promise<Appointment[]> {
    const appointments = await this.getAll();
    const now = new Date();
    
    return appointments
      .filter(apt => {
        const aptDateTime = new Date(`${apt.date}T${apt.time}`);
        return aptDateTime >= now && apt.status === 'upcoming';
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  },

  // Get all appointments sorted by creation date (most recent first)
  async getByRecent(): Promise<Appointment[]> {
    const appointments = await this.getAll();
    return appointments.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },

  // Get a single appointment by ID
  async getById(id: string): Promise<Appointment | undefined> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return undefined;

    return {
      id: data.id,
      location: data.location,
      examType: data.exam_type,
      date: data.date,
      time: data.time,
      note: data.note || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      status: data.status as AppointmentStatus,
    };
  },

  // Create a new appointment
  async create(
    data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<Appointment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const now = new Date();
    const aptDateTime = new Date(`${data.date}T${data.time}`);
    const status: AppointmentStatus = aptDateTime < now ? 'past' : 'upcoming';

    const { data: newAppointment, error } = await supabase
      .from('appointments')
      .insert({
        user_id: user.id,
        location: data.location,
        exam_type: data.examType,
        date: data.date,
        time: data.time,
        note: data.note || null,
        status,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: newAppointment.id,
      location: newAppointment.location,
      examType: newAppointment.exam_type,
      date: newAppointment.date,
      time: newAppointment.time,
      note: newAppointment.note || undefined,
      createdAt: newAppointment.created_at,
      updatedAt: newAppointment.updated_at,
      status: newAppointment.status as AppointmentStatus,
    };
  },

  // Update an existing appointment
  async update(
    id: string,
    data: Partial<Omit<Appointment, 'id' | 'createdAt'>>
  ): Promise<Appointment | null> {
    const updateData: any = {};

    if (data.location) updateData.location = data.location;
    if (data.examType) updateData.exam_type = data.examType;
    if (data.date) updateData.date = data.date;
    if (data.time) updateData.time = data.time;
    if (data.note !== undefined) updateData.note = data.note || null;
    if (data.status) updateData.status = data.status;

    // Update status if date/time changed
    if (data.date || data.time) {
      const appointment = await this.getById(id);
      if (!appointment) return null;

      const newDate = data.date || appointment.date;
      const newTime = data.time || appointment.time;
      const aptDateTime = new Date(`${newDate}T${newTime}`);
      const now = new Date();
      updateData.status = aptDateTime < now ? 'past' : 'upcoming';
    }

    const { data: updated, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: updated.id,
      location: updated.location,
      examType: updated.exam_type,
      date: updated.date,
      time: updated.time,
      note: updated.note || undefined,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      status: updated.status as AppointmentStatus,
    };
  },

  // Delete an appointment
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    return !error;
  },

  // Get the next upcoming appointment
  async getNext(): Promise<Appointment | null> {
    const upcoming = await this.getUpcoming();
    return upcoming.length > 0 ? upcoming[0] : null;
  },
};

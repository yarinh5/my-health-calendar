import { Appointment, AppointmentStatus } from '@/types/appointment';

const STORAGE_KEY = 'appointments';

export const appointmentService = {
  // Get all appointments
  getAll(): Appointment[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const appointments = JSON.parse(data) as Appointment[];
    
    // Update status for past appointments
    const now = new Date();
    let hasChanges = false;
    
    const updated = appointments.map(apt => {
      const aptDateTime = new Date(`${apt.date}T${apt.time}`);
      if (aptDateTime < now && apt.status === 'upcoming') {
        hasChanges = true;
        return { ...apt, status: 'past' as AppointmentStatus };
      }
      return apt;
    });
    
    if (hasChanges) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    
    return updated;
  },

  // Get upcoming appointments sorted by date/time
  getUpcoming(): Appointment[] {
    return this.getAll()
      .filter(apt => apt.status === 'upcoming')
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  },

  // Get all appointments sorted by creation date (most recent first)
  getByRecent(): Appointment[] {
    return this.getAll().sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },

  // Get a single appointment by ID
  getById(id: string): Appointment | undefined {
    return this.getAll().find(apt => apt.id === id);
  },

  // Create a new appointment
  create(data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Appointment {
    const appointments = this.getAll();
    const now = new Date();
    const aptDateTime = new Date(`${data.date}T${data.time}`);
    
    const newAppointment: Appointment = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      status: aptDateTime < now ? 'past' : 'upcoming',
    };
    
    appointments.push(newAppointment);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
    
    return newAppointment;
  },

  // Update an existing appointment
  update(id: string, data: Partial<Omit<Appointment, 'id' | 'createdAt'>>): Appointment | null {
    const appointments = this.getAll();
    const index = appointments.findIndex(apt => apt.id === id);
    
    if (index === -1) return null;
    
    const now = new Date();
    let status = appointments[index].status;
    
    // Update status if date/time changed
    if (data.date || data.time) {
      const newDate = data.date || appointments[index].date;
      const newTime = data.time || appointments[index].time;
      const aptDateTime = new Date(`${newDate}T${newTime}`);
      status = aptDateTime < now ? 'past' : 'upcoming';
    }
    
    appointments[index] = {
      ...appointments[index],
      ...data,
      status,
      updatedAt: now.toISOString(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
    
    return appointments[index];
  },

  // Delete an appointment
  delete(id: string): boolean {
    const appointments = this.getAll();
    const filtered = appointments.filter(apt => apt.id !== id);
    
    if (filtered.length === appointments.length) return false;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  // Get the next upcoming appointment
  getNext(): Appointment | null {
    const upcoming = this.getUpcoming();
    return upcoming.length > 0 ? upcoming[0] : null;
  },
};

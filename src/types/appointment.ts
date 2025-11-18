export type AppointmentStatus = 'upcoming' | 'past' | 'cancelled';

export interface Appointment {
  id: string;
  location: string;
  examType: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  note?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  status: AppointmentStatus;
}

export type SortMode = 'upcoming' | 'recent';

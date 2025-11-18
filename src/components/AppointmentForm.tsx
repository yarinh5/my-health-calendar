import { useState } from 'react';
import { Appointment } from '@/types/appointment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface AppointmentFormProps {
  appointment?: Appointment;
  onSave: (data: {
    location: string;
    examType: string;
    date: string;
    time: string;
    note?: string;
  }) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

export const AppointmentForm = ({ appointment, onSave, onDelete, onCancel }: AppointmentFormProps) => {
  const [location, setLocation] = useState(appointment?.location || '');
  const [examType, setExamType] = useState(appointment?.examType || '');
  const [date, setDate] = useState(appointment?.date || '');
  const [time, setTime] = useState(appointment?.time || '');
  const [note, setNote] = useState(appointment?.note || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!location.trim()) {
      toast.error('חסר מיקום לתור');
      return;
    }
    if (!examType.trim()) {
      toast.error('חסר סוג בדיקה');
      return;
    }
    if (!date) {
      toast.error('צריך לבחור תאריך לתור');
      return;
    }
    if (!time) {
      toast.error('צריך לבחור שעה לתור');
      return;
    }

    // Check if date/time is in the past (warning only)
    const appointmentDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    
    if (appointmentDateTime < now) {
      toast.warning('שים לב: התאריך והשעה שבחרת כבר עברו');
    }

    onSave({
      location: location.trim(),
      examType: examType.trim(),
      date,
      time,
      note: note.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {appointment ? 'עריכת תור' : 'תור חדש'}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-10 w-10"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="location" className="text-lg font-semibold">
            מיקום <span className="text-destructive">*</span>
          </Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="למשל: קופת חולים כללית, סניף מרכזי"
            className="text-lg h-12"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="examType" className="text-lg font-semibold">
            סוג הבדיקה <span className="text-destructive">*</span>
          </Label>
          <Input
            id="examType"
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            placeholder="למשל: קרדיולוג, בדיקת דם, אורתופד"
            className="text-lg h-12"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-lg font-semibold">
              תאריך <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-lg h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="text-lg font-semibold">
              שעה <span className="text-destructive">*</span>
            </Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="text-lg h-12"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note" className="text-lg font-semibold">
            הערה
          </Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="למשל: להביא בדיקות דם, להגיע בצום, לבוא עם מלווה"
            className="text-lg min-h-[100px] resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          className="flex-1 h-14 text-lg font-semibold"
          size="lg"
        >
          <Save className="ml-2 h-5 w-5" />
          שמור תור
        </Button>
        
        {appointment && onDelete && (
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            className="h-14 px-6"
            size="lg"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </div>
    </form>
  );
};

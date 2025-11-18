import { Appointment } from '@/types/appointment';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, MapPin, FileText, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppointmentCardProps {
  appointment: Appointment;
  isNext?: boolean;
  onClick?: () => void;
}

export const AppointmentCard = ({ appointment, isNext, onClick }: AppointmentCardProps) => {
  const isPast = appointment.status === 'past';
  
  // Format date to DD.MM.YYYY
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}`;
  };

  return (
    <Card
      className={cn(
        "p-5 cursor-pointer transition-all hover:shadow-md relative",
        isPast && "opacity-60",
        isNext && "border-accent border-2 shadow-lg"
      )}
      onClick={onClick}
    >
      {isNext && (
        <div className="absolute -top-3 right-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-md">
          <Star className="w-4 h-4 fill-current" />
          התור הבא
        </div>
      )}
      
      <div className="space-y-3">
        {/* Exam Type - Main Title */}
        <h3 className={cn(
          "text-xl font-bold",
          isNext ? "text-accent" : "text-foreground"
        )}>
          {appointment.examType}
        </h3>
        
        {/* Date and Time */}
        <div className="flex items-center gap-4 text-base text-muted-foreground flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span>{formatDate(appointment.date)}</span>
          </div>
          <span className="text-2xl">|</span>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span>{appointment.time}</span>
          </div>
        </div>
        
        {/* Location */}
        <div className="flex items-start gap-2 text-base">
          <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <span className="text-foreground">{appointment.location}</span>
        </div>
        
        {/* Note */}
        {appointment.note && (
          <div className="flex items-start gap-2 text-base bg-muted/50 p-3 rounded-md">
            <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-foreground">{appointment.note}</span>
          </div>
        )}
        
        {/* Past indicator */}
        {isPast && (
          <div className="text-sm text-past-appointment font-medium">
            תור שעבר
          </div>
        )}
      </div>
    </Card>
  );
};

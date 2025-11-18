import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Calendar, User, MapPin } from 'lucide-react';
import { Appointment } from '@/types/appointment';

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
}

interface UserWithAppointments extends UserProfile {
  appointments: Appointment[];
}

export default function Admin() {
  const [users, setUsers] = useState<UserWithAppointments[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user is admin
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (rolesError || !roles) {
        toast({
          title: 'אין הרשאה',
          description: 'אין לך הרשאות מנהל',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      await loadAllUsers();
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get all appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      // Combine users with their appointments
      const usersWithAppointments = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        display_name: profile.display_name || profile.email,
        appointments: (appointments || [])
          .filter(apt => apt.user_id === profile.id)
          .map(apt => ({
            id: apt.id,
            location: apt.location,
            examType: apt.exam_type,
            date: apt.date,
            time: apt.time,
            note: apt.note || undefined,
            createdAt: apt.created_at,
            updatedAt: apt.updated_at,
            status: apt.status as Appointment['status'],
          })),
      }));

      setUsers(usersWithAppointments);
    } catch (error: any) {
      toast({
        title: 'שגיאה בטעינת נתונים',
        description: error.message,
        variant: 'destructive',
      });
    }
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

  if (!isAdmin) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 to-medical-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => navigate('/')}
              >
                <ArrowRight className="w-5 h-5" />
                <span className="mr-2">חזור</span>
              </Button>
              <h1 className="text-3xl font-bold">פאנל ניהול</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              התנתק
            </Button>
          </div>
        </Card>

        {/* Users List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">משתמשים ({users.length})</h2>
          
          {users.map(user => (
            <Card key={user.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6 text-medical-600" />
                  <div>
                    <h3 className="text-xl font-semibold">{user.display_name}</h3>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                {user.appointments.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-lg">
                      תורים ({user.appointments.length})
                    </h4>
                    <div className="grid gap-2">
                      {user.appointments.map(apt => (
                        <div
                          key={apt.id}
                          className="flex items-center gap-4 p-3 bg-muted rounded-lg"
                        >
                          <Calendar className="w-5 h-5 text-medical-600 flex-shrink-0" />
                          <div className="flex-1 space-y-1">
                            <p className="font-medium">{apt.examType}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(apt.date)} • {apt.time}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span>{apt.location}</span>
                            </div>
                            {apt.note && (
                              <p className="text-sm text-muted-foreground">
                                הערה: {apt.note}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              apt.status === 'upcoming'
                                ? 'bg-medical-100 text-medical-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {apt.status === 'upcoming' ? 'עתידי' : 'עבר'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-2">אין תורים</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

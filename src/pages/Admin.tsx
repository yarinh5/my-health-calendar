import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  ArrowRight, 
  Calendar, 
  User, 
  MapPin, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldOff,
  LogOut,
  Users,
  CalendarDays,
  Search
} from 'lucide-react';
import { Appointment } from '@/types/appointment';

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  isAdmin: boolean;
}

interface UserWithAppointments extends UserProfile {
  appointments: Appointment[];
}

export default function Admin() {
  const [users, setUsers] = useState<UserWithAppointments[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({ displayName: '', email: '', password: '' });
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

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

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (rolesError || !roles) {
        toast.error('אין לך הרשאות מנהל');
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      await loadAllUsers();
    } catch (error: any) {
      toast.error(error.message);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const adminUserIds = new Set((adminRoles || []).map(r => r.user_id));

      const usersWithAppointments = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        display_name: profile.display_name || profile.email,
        created_at: profile.created_at,
        isAdmin: adminUserIds.has(profile.id),
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
      toast.error('שגיאה בטעינת נתונים');
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditForm({
      displayName: user.display_name,
      email: user.email,
      password: '',
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('admin-update-user', {
        body: {
          action: 'updateUser',
          userId: editingUser.id,
          email: editForm.email !== editingUser.email ? editForm.email : undefined,
          password: editForm.password || undefined,
          displayName: editForm.displayName !== editingUser.display_name ? editForm.displayName : undefined,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success('המשתמש עודכן בהצלחה');
      setEditingUser(null);
      await loadAllUsers();
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בעדכון המשתמש');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    
    setActionLoading(true);
    try {
      const response = await supabase.functions.invoke('admin-update-user', {
        body: {
          action: 'deleteUser',
          userId: deleteConfirmUser.id,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success('המשתמש נמחק בהצלחה');
      setDeleteConfirmUser(null);
      await loadAllUsers();
    } catch (error: any) {
      toast.error(error.message || 'שגיאה במחיקת המשתמש');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAdmin = async (user: UserProfile) => {
    setActionLoading(true);
    try {
      const response = await supabase.functions.invoke('admin-update-user', {
        body: {
          action: 'toggleAdmin',
          userId: user.id,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success(user.isAdmin ? 'הרשאות מנהל הוסרו' : 'הרשאות מנהל ניתנו');
      await loadAllUsers();
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בעדכון הרשאות');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!window.confirm('האם את בטוחה שאת רוצה למחוק את התור?')) return;
    
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success('התור נמחק בהצלחה');
      await loadAllUsers();
    } catch (error: any) {
      toast.error(error.message || 'שגיאה במחיקת התור');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const filteredUsers = users.filter(user => 
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAppointments = users.reduce((sum, user) => sum + user.appointments.length, 0);
  const upcomingAppointments = users.reduce((sum, user) => 
    sum + user.appointments.filter(apt => apt.status === 'upcoming').length, 0
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-xl text-foreground">טוען...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6 bg-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowRight className="w-5 h-5" />
                <span className="mr-2">חזור</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">פאנל ניהול</h1>
                <p className="text-muted-foreground">ניהול משתמשים ותורים</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 ml-2" />
              התנתק
            </Button>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-muted-foreground">משתמשים</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalAppointments}</p>
                <p className="text-muted-foreground">סה"כ תורים</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{upcomingAppointments}</p>
                <p className="text-muted-foreground">תורים עתידיים</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4 bg-card">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי שם או אימייל..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </Card>

        {/* Users List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">משתמשים ({filteredUsers.length})</h2>
          
          {filteredUsers.map(user => (
            <Card key={user.id} className="p-6 bg-card">
              <div className="space-y-4">
                {/* User Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-foreground">{user.display_name}</h3>
                        {user.isAdmin && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            מנהל
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground">{user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        נרשם ב-{formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="w-4 h-4 ml-1" />
                      ערוך
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAdmin(user)}
                      disabled={actionLoading}
                    >
                      {user.isAdmin ? (
                        <>
                          <ShieldOff className="w-4 h-4 ml-1" />
                          הסר מנהל
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 ml-1" />
                          הפוך למנהל
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteConfirmUser(user)}
                    >
                      <Trash2 className="w-4 h-4 ml-1" />
                      מחק
                    </Button>
                  </div>
                </div>

                {/* User Appointments */}
                {user.appointments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-lg text-foreground">
                      תורים ({user.appointments.length})
                    </h4>
                    <div className="grid gap-2">
                      {user.appointments.map(apt => (
                        <div
                          key={apt.id}
                          className="flex items-center gap-4 p-3 bg-muted rounded-lg"
                        >
                          <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="flex-1 space-y-1">
                            <p className="font-medium text-foreground">{apt.examType}</p>
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
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                apt.status === 'upcoming'
                                  ? 'bg-accent/10 text-accent'
                                  : 'bg-muted-foreground/10 text-muted-foreground'
                              }`}
                            >
                              {apt.status === 'upcoming' ? 'עתידי' : 'עבר'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAppointment(apt.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {user.appointments.length === 0 && (
                  <p className="text-muted-foreground mt-2">אין תורים</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>עריכת משתמש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">שם תצוגה</Label>
              <Input
                id="displayName"
                value={editForm.displayName}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה חדשה (השאר ריק לשמור על הקיימת)</Label>
              <Input
                id="password"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              ביטול
            </Button>
            <Button onClick={handleSaveUser} disabled={actionLoading}>
              {actionLoading ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmUser} onOpenChange={() => setDeleteConfirmUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>מחיקת משתמש</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-foreground">
              האם את בטוחה שאת רוצה למחוק את המשתמש{' '}
              <strong>{deleteConfirmUser?.display_name}</strong>?
            </p>
            <p className="text-muted-foreground mt-2">
              פעולה זו תמחק את כל התורים של המשתמש ואי אפשר לבטל אותה.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmUser(null)}>
              ביטול
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={actionLoading}>
              {actionLoading ? 'מוחק...' : 'מחק'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

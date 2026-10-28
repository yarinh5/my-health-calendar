import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { KeyRound } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const onRecovery = () => setReady(true);
    window.addEventListener('native-password-recovery', onRecovery);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
    const prepare = async () => {
      const query = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.slice(1));
      if (query.get('token_hash') && query.get('type') === 'recovery') {
        const tokenHash = query.get('token_hash');
        if (!tokenHash) return;
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
        if (error) setLinkError('קישור האיפוס פג תוקף או כבר נוצל. בקשי קישור חדש.');
        else { setReady(true); window.history.replaceState({}, '', '/reset-password'); }
      } else if (hash.get('type') === 'recovery') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) setReady(true);
      } else if (!Capacitor.isNativePlatform()) {
        setLinkError('פתחי את הקישור שקיבלת באימייל, או בקשי קישור איפוס חדש.');
      }
    };
    void prepare();
    return () => { subscription.unsubscribe(); window.removeEventListener('native-password-recovery', onRecovery); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'שגיאה', description: 'הסיסמאות לא תואמות', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: 'הסיסמה עודכנה', description: 'תועברי לדשבורד' });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-center text-foreground">סיסמה חדשה</h1>
          <p className="text-muted-foreground text-center">בחרי סיסמה חדשה לחשבון שלך</p>
        </div>

        {!ready ? (
          <div className="space-y-4 text-center"><p className="text-muted-foreground">{linkError || 'ממתינה לקישור איפוס מהאימייל...'}</p><Button variant="outline" className="w-full h-12" onClick={() => navigate('/auth')}>חזרה להתחברות</Button></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה חדשה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">אישור סיסמה</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="text-lg"
              />
            </div>
            <Button type="submit" className="w-full text-lg" size="lg" disabled={loading}>
              {loading ? 'רק רגע...' : 'עדכני סיסמה'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

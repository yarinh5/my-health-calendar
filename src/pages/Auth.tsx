import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from 'lucide-react';

type Mode = 'login' | 'signup' | 'forgot';

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isLogin = mode === 'login';
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard');
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({
          title: 'נשלח אימייל',
          description: 'בדקי את תיבת הדואר שלך לקישור לאיפוס הסיסמה',
        });
        setMode('login');
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: 'התחברת בהצלחה', description: 'ברוך הבא חזרה!' });
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { display_name: displayName || email },
          },
        });
        if (error) throw error;
        toast({ title: 'נרשמת בהצלחה!', description: 'כעת תוכלי להתחבר' });

        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'משהו השתבש',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-center text-foreground">ניהול תורים</h1>
          <p className="text-muted-foreground text-center">
            {isLogin ? 'התחברי למערכת' : isSignup ? 'הרשמי למערכת' : 'איפוס סיסמה'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="displayName">שם</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="השם שלך"
                className="text-lg"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@email.com"
              className="text-lg"
            />
          </div>

          {!isForgot && (
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="text-lg"
                minLength={6}
              />
            </div>
          )}

          <Button type="submit" className="w-full text-lg" size="lg" disabled={loading}>
            {loading ? 'רק רגע...' : isLogin ? 'התחברי' : isSignup ? 'הרשמי' : 'שלחי קישור לאיפוס'}
          </Button>
        </form>

        <div className="text-center space-y-2">
          {isLogin && (
            <button
              type="button"
              onClick={() => setMode('forgot')}
              className="block w-full text-primary hover:text-primary/80 font-medium"
            >
              שכחת סיסמה?
            </button>
          )}
          <button
            type="button"
            onClick={() => setMode(isLogin ? 'signup' : 'login')}
            className="block w-full text-primary hover:text-primary/80 font-medium"
          >
            {isLogin
              ? 'עדיין לא נרשמת? הירשמי כאן'
              : isSignup
              ? 'כבר יש לך חשבון? התחברי'
              : 'חזרה להתחברות'}
          </button>
        </div>
      </Card>
    </div>
  );
}

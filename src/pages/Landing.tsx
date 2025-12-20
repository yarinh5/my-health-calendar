import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Clock, 
  Bell, 
  Shield, 
  Smartphone, 
  Users,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-xl text-foreground">טוען...</div>
      </div>
    );
  }

  const features = [
    {
      icon: Calendar,
      title: 'ניהול תורים חכם',
      description: 'עקבי אחרי כל התורים שלך במקום אחד מרוכז ומסודר'
    },
    {
      icon: Clock,
      title: 'תזכורות אוטומטיות',
      description: 'לעולם לא תפספסי תור עם מערכת התזכורות המתקדמת'
    },
    {
      icon: Bell,
      title: 'התראות בזמן אמת',
      description: 'קבלי עדכונים מיידיים על כל שינוי בתורים שלך'
    },
    {
      icon: Smartphone,
      title: 'ממשק נוח ופשוט',
      description: 'עיצוב מותאם לכל מכשיר - נייד, טאבלט ומחשב'
    },
    {
      icon: Shield,
      title: 'אבטחה מתקדמת',
      description: 'המידע שלך מאובטח בסטנדרטים הגבוהים ביותר'
    },
    {
      icon: Users,
      title: 'פאנל ניהול',
      description: 'למנהלים - צפייה וניהול של כל המשתמשים והתורים'
    }
  ];

  const benefits = [
    'ניהול ומעקב אחר כל התורים במקום אחד',
    'הוספה, עריכה ומחיקה של תורים בקלות',
    'מיון לפי תאריך קרוב או תאריך הזנה',
    'סימון תור הבא בצורה בולטת',
    'תמיכה מלאה בעברית ובממשק RTL',
    'גישה מכל מכשיר ובכל זמן'
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              ניהול התורים שלך
              <span className="block text-primary">בקלות ובפשטות</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              המערכת המתקדמת לניהול ומעקב אחר כל התורים שלך - 
              בדיקות, פגישות וכל מה שחשוב לך לזכור
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="text-lg px-8 py-6 gap-2"
              >
                התחילי עכשיו
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/auth')}
                className="text-lg px-8 py-6"
              >
                יש לי כבר חשבון
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              הכל במקום אחד
            </h2>
            <p className="text-lg text-muted-foreground">
              כל הכלים שאת צריכה לניהול יעיל של התורים שלך
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-border/50 bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                למה לבחור במערכת שלנו?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                המערכת נבנתה מתוך הבנה עמוקה של הצרכים שלך - 
                ניהול פשוט, מהיר ויעיל של כל התורים במקום אחד.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-8 lg:p-12">
              <div className="bg-card rounded-xl shadow-xl p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">התור הבא שלך</p>
                    <p className="text-sm text-muted-foreground">בדיקת דם - מחר ב-09:00</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">מיקום</span>
                    <span className="text-foreground">קופת חולים - סניף מרכז</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">סוג בדיקה</span>
                    <span className="text-foreground">בדיקת דם</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">הערות</span>
                    <span className="text-foreground">צום מ-22:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            מוכנה להתחיל?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            הצטרפי עכשיו וקבלי שליטה מלאה על התורים שלך
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="text-lg px-12 py-6 gap-2"
          >
            צרי חשבון בחינם
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} מערכת ניהול תורים. כל הזכויות שמורות.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

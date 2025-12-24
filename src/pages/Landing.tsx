import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
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
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Landing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Refs for animations
  const heroRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const featureCardsRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const benefitsListRef = useRef<HTMLUListElement>(null);
  const benefitsCardRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const floatingElementsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (loading) return;

    const ctx = gsap.context(() => {
      // Hero section animations
      const heroTl = gsap.timeline();
      
      // Floating background elements
      if (floatingElementsRef.current) {
        gsap.to('.floating-orb', {
          y: 'random(-30, 30)',
          x: 'random(-20, 20)',
          rotation: 'random(-10, 10)',
          duration: 'random(3, 5)',
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          stagger: {
            each: 0.5,
            from: 'random'
          }
        });
      }

      // Hero title with split text effect
      heroTl.fromTo(heroTitleRef.current, 
        { opacity: 0, y: 80, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power4.out' }
      );

      heroTl.fromTo(heroSubtitleRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
        '-=0.6'
      );

      heroTl.fromTo(heroButtonsRef.current?.children || [],
        { opacity: 0, y: 30, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.15, ease: 'back.out(1.7)' },
        '-=0.4'
      );

      // Features section with scroll trigger
      if (featureCardsRef.current) {
        gsap.fromTo(featureCardsRef.current.children,
          { opacity: 0, y: 60, scale: 0.9, rotationX: -15 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationX: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: featuresRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }

      // Benefits section
      if (benefitsListRef.current) {
        gsap.fromTo(benefitsListRef.current.children,
          { opacity: 0, x: -50 },
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            stagger: 0.12,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: benefitsRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }

      // Benefits card with 3D effect
      if (benefitsCardRef.current) {
        gsap.fromTo(benefitsCardRef.current,
          { opacity: 0, scale: 0.8, rotationY: -20 },
          {
            opacity: 1,
            scale: 1,
            rotationY: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: benefitsRef.current,
              start: 'top 70%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }

      // CTA section
      if (ctaRef.current) {
        gsap.fromTo(ctaRef.current.children,
          { opacity: 0, y: 40, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: ctaRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }

      // Parallax effect on hero background
      gsap.to('.hero-gradient', {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

    });

    return () => ctx.revert();
  }, [loading]);

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
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated background */}
        <div className="hero-gradient absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        
        {/* Floating decorative elements */}
        <div ref={floatingElementsRef} className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="floating-orb absolute top-20 right-[10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="floating-orb absolute bottom-20 left-[5%] w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
          <div className="floating-orb absolute top-1/2 right-[30%] w-40 h-40 bg-primary/10 rounded-full blur-2xl" />
          <Sparkles className="floating-orb absolute top-32 left-[15%] w-8 h-8 text-primary/30" />
          <Sparkles className="floating-orb absolute bottom-40 right-[20%] w-6 h-6 text-accent/40" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32 w-full">
          <div className="text-center space-y-6">
            <h1 
              ref={heroTitleRef}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight"
            >
              ניהול התורים שלך
              <span className="block text-primary mt-2 bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                בקלות ובפשטות
              </span>
            </h1>
            <p 
              ref={heroSubtitleRef}
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto"
            >
              המערכת המתקדמת לניהול ומעקב אחר כל התורים שלך - 
              בדיקות, פגישות וכל מה שחשוב לך לזכור
            </p>
            <div ref={heroButtonsRef} className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="text-lg px-8 py-6 gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1"
              >
                התחילי עכשיו
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/auth')}
                className="text-lg px-8 py-6 hover:bg-secondary transition-all duration-300 hover:-translate-y-1"
              >
                יש לי כבר חשבון
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 bg-secondary/30 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.05),transparent_50%)]" />
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              הכל במקום אחד
            </h2>
            <p className="text-lg text-muted-foreground">
              כל הכלים שאת צריכה לניהול יעיל של התורים שלך
            </p>
          </div>
          
          <div ref={featureCardsRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2 group cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
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
      <section ref={benefitsRef} className="py-24 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                למה לבחור במערכת שלנו?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                המערכת נבנתה מתוך הבנה עמוקה של הצרכים שלך - 
                ניהול פשוט, מהיר ויעיל של כל התורים במקום אחד.
              </p>
              <ul ref={benefitsListRef} className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3 group cursor-default">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
                      <CheckCircle className="w-5 h-5 text-accent group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="text-foreground group-hover:text-primary transition-colors duration-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div 
              ref={benefitsCardRef}
              className="bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 rounded-3xl p-8 lg:p-12 relative"
              style={{ perspective: '1000px' }}
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="bg-card rounded-2xl shadow-2xl p-6 space-y-4 relative hover:shadow-primary/10 transition-shadow duration-500">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-lg shadow-accent/25">
                    <Calendar className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-lg">התור הבא שלך</p>
                    <p className="text-sm text-muted-foreground">בדיקת דם - מחר ב-09:00</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm p-2 rounded-lg hover:bg-secondary/50 transition-colors duration-200">
                    <span className="text-muted-foreground">מיקום</span>
                    <span className="text-foreground font-medium">קופת חולים - סניף מרכז</span>
                  </div>
                  <div className="flex justify-between text-sm p-2 rounded-lg hover:bg-secondary/50 transition-colors duration-200">
                    <span className="text-muted-foreground">סוג בדיקה</span>
                    <span className="text-foreground font-medium">בדיקת דם</span>
                  </div>
                  <div className="flex justify-between text-sm p-2 rounded-lg hover:bg-secondary/50 transition-colors duration-200">
                    <span className="text-muted-foreground">הערות</span>
                    <span className="text-foreground font-medium">צום מ-22:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-primary/5 via-primary/10 to-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div ref={ctaRef} className="max-w-4xl mx-auto px-4 text-center relative">
          <Sparkles className="w-12 h-12 text-primary/40 mx-auto mb-6" />
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            מוכנה להתחיל?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-10">
            הצטרפי עכשיו וקבלי שליטה מלאה על התורים שלך
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="text-lg px-12 py-7 gap-2 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-2 hover:scale-105"
          >
            צרי חשבון בחינם
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border bg-background/50 backdrop-blur-sm">
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
